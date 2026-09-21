import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShieldAlert,
  Calendar,
  CheckSquare,
  MessageSquare,
  ArrowLeft,
  RefreshCw,
  Send,
  AlertTriangle,
  Clock,
  BookOpen,
  Loader2,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { fetchDocumentById, askDocumentQuestion, reanalyzeDocument } from '../services/api';

export default function DocumentWorkspace({ documentId, onBack }) {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [reanalyzing, setReanalyzing] = useState(false);

  // Q&A Chat State & Client-Side Rate Limiting
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [asking, setAsking] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldownSeconds > 0) {
      timer = setTimeout(() => setCooldownSeconds((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    setLoading(true);
    try {
      const res = await fetchDocumentById(documentId);
      if (res.success && res.data) {
        setDoc(res.data);
      }
    } catch (err) {
      console.error('Failed to load document details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = async () => {
    if (reanalyzing) return;
    setReanalyzing(true);
    try {
      const res = await reanalyzeDocument(documentId);
      if (res.success && res.data) {
        setDoc(res.data);
      }
    } catch (err) {
      alert(err.message.includes('limit') ? '⚠️ Rate Limit: ' + err.message : 'Re-analysis failed: ' + err.message);
    } finally {
      setReanalyzing(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e?.preventDefault();
    if (!question.trim() || asking || cooldownSeconds > 0) return;

    const userQ = question.trim();
    setQuestion('');

    const userMsg = { sender: 'user', text: userQ, timestamp: new Date() };
    setChatHistory((prev) => [...prev, userMsg]);
    setAsking(true);

    try {
      const res = await askDocumentQuestion(documentId, userQ);
      if (res.success && res.data) {
        const aiMsg = {
          sender: 'ai',
          text: res.data.answer,
          citations: res.data.citations || [],
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, aiMsg]);
        // Client-side 2-second cooldown to prevent rapid spamming
        setCooldownSeconds(2);
      }
    } catch (err) {
      const isRateLimit = err.message.toLowerCase().includes('limit') || err.message.includes('429');
      const errorMsg = {
        sender: 'ai',
        text: isRateLimit
          ? `⚠️ Rate limit reached: ${err.message}. Please wait a moment before sending another inquiry.`
          : `Error: ${err.message || 'Could not retrieve answer from AI.'}`,
        citations: [],
        timestamp: new Date(),
        isError: true,
      };
      setChatHistory((prev) => [...prev, errorMsg]);
      if (isRateLimit) {
        setCooldownSeconds(10);
      }
    } finally {
      setAsking(false);
    }
  };

  if (loading) {
    return (
      <div className="workspace-loading-state">
        <Loader2 size={24} className="spin text-accent" />
        <p className="loading-text">Loading document data...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="workspace-not-found">
        <AlertTriangle size={32} className="text-warning" />
        <h3>Document Not Found</h3>
        <p className="text-muted">The requested document could not be retrieved.</p>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: '1rem' }}>
          <ArrowLeft size={14} />
          <span>Return to Documents</span>
        </button>
      </div>
    );
  }

  const hasAnalysis = doc.summary || (doc.keyClauses && doc.keyClauses.length > 0);

  return (
    <div className="workspace-layout">
      {/* Workspace Header Bar */}
      <div className="workspace-nav-bar">
        <div className="workspace-nav-left">
          <button className="nav-back-btn" onClick={onBack} title="Back to All Documents">
            <ArrowLeft size={15} />
            <span>All Documents</span>
          </button>
          <span className="nav-divider">/</span>
          <div className="workspace-doc-identity">
            <span className="doc-format-pill">{doc.fileType.toUpperCase()}</span>
            <h2 className="workspace-doc-name" title={doc.originalName}>
              {doc.originalName}
            </h2>
          </div>
        </div>

        <div className="workspace-nav-right">
          <div className="workspace-doc-specs">
            <span>{doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}</span>
            <span>•</span>
            <span>{(doc.fileSize / 1024).toFixed(0)} KB</span>
            <span>•</span>
            <span>{doc.chunkCount || 0} chunks</span>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleReanalyze}
            disabled={reanalyzing}
            title="Re-run AI analysis and generate fresh insights"
          >
            <RefreshCw size={13} className={reanalyzing ? 'spin' : ''} />
            <span>{reanalyzing ? 'Analyzing...' : 'Re-Analyze'}</span>
          </button>
        </div>
      </div>

      {/* Analysis Pending Notice if needed */}
      {!hasAnalysis && (
        <div className="workspace-notice-box">
          <Info size={16} className="text-accent flex-shrink-0" />
          <div className="notice-body">
            <strong>Analysis Pending:</strong> Click "Re-Analyze" to extract plain-English summaries, key clauses, obligations, and risks from this document.
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleReanalyze} disabled={reanalyzing}>
            {reanalyzing ? 'Processing...' : 'Run Analysis Now'}
          </button>
        </div>
      )}

      {/* Workspace Navigation Tabs */}
      <div className="workspace-tab-nav">
        <button
          className={`tab-item ${activeTab === 'summary' ? 'tab-item-active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          <FileText size={14} />
          <span>Overview</span>
        </button>

        <button
          className={`tab-item ${activeTab === 'clauses' ? 'tab-item-active' : ''}`}
          onClick={() => setActiveTab('clauses')}
        >
          <BookOpen size={14} />
          <span>Key Clauses</span>
          {doc.keyClauses?.length > 0 && <span className="tab-count">{doc.keyClauses.length}</span>}
        </button>

        <button
          className={`tab-item ${activeTab === 'obligations' ? 'tab-item-active' : ''}`}
          onClick={() => setActiveTab('obligations')}
        >
          <Calendar size={14} />
          <span>Obligations & Deadlines</span>
          {doc.obligationsAndDeadlines?.length > 0 && (
            <span className="tab-count">{doc.obligationsAndDeadlines.length}</span>
          )}
        </button>

        <button
          className={`tab-item ${activeTab === 'risks' ? 'tab-item-active' : ''}`}
          onClick={() => setActiveTab('risks')}
        >
          <ShieldAlert size={14} />
          <span>Risks & Flags</span>
          {doc.risksAndRedFlags?.length > 0 && (
            <span className="tab-count tab-count-warning">{doc.risksAndRedFlags.length}</span>
          )}
        </button>

        <button
          className={`tab-item ${activeTab === 'checklist' ? 'tab-item-active' : ''}`}
          onClick={() => setActiveTab('checklist')}
        >
          <CheckSquare size={14} />
          <span>Lawyer Checklist</span>
          {doc.lawyerChecklist?.length > 0 && <span className="tab-count">{doc.lawyerChecklist.length}</span>}
        </button>

        <button
          className={`tab-item ${activeTab === 'qa' ? 'tab-item-active' : ''}`}
          onClick={() => setActiveTab('qa')}
        >
          <MessageSquare size={14} />
          <span>Grounded Q&A</span>
        </button>
      </div>

      {/* TAB CONTENT PANES */}
      <div className="workspace-tab-content">
        {/* TAB 1: EXECUTIVE SUMMARY */}
        {activeTab === 'summary' && (
          <div className="tab-panel">
            <div className="panel-header">
              <h3 className="panel-title">Executive Summary</h3>
              <p className="panel-subtitle">
                Plain-English simplified explanation of the agreement's purpose, parties, and scope.
              </p>
            </div>

            <div className="summary-card">
              {doc.summary ? (
                <p className="summary-text">{doc.summary}</p>
              ) : (
                <p className="text-muted">
                  No summary generated yet. Click "Re-Analyze" at the top to generate one.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: KEY CLAUSES */}
        {activeTab === 'clauses' && (
          <div className="tab-panel">
            <div className="panel-header">
              <h3 className="panel-title">Key Provisions & Clauses</h3>
              <p className="panel-subtitle">
                Important terms identified in the agreement, paired with simplified explanations.
              </p>
            </div>

            {doc.keyClauses && doc.keyClauses.length > 0 ? (
              <div className="clause-list">
                {doc.keyClauses.map((clause, idx) => (
                  <div key={idx} className="clause-item">
                    <div className="clause-header">
                      <h4 className="clause-title">{clause.title}</h4>
                      <span className={`priority-tag priority-${clause.importance || 'medium'}`}>
                        {clause.importance || 'medium'} priority
                      </span>
                    </div>

                    <div className="clause-explanation">
                      <span className="field-label">Simplified Explanation:</span>
                      <p className="explanation-text">{clause.simplifiedExplanation}</p>
                    </div>

                    {clause.originalSnippet && (
                      <div className="clause-quote-box">
                        <span className="quote-label">Excerpt:</span>
                        <blockquote className="legal-quote">"{clause.originalSnippet}"</blockquote>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">No key clauses extracted yet.</p>
            )}
          </div>
        )}

        {/* TAB 3: OBLIGATIONS & DEADLINES */}
        {activeTab === 'obligations' && (
          <div className="tab-panel">
            <div className="panel-header">
              <h3 className="panel-title">Obligations & Deadlines</h3>
              <p className="panel-subtitle">
                Actions required by each party, compliance dates, and breach consequences.
              </p>
            </div>

            {doc.obligationsAndDeadlines && doc.obligationsAndDeadlines.length > 0 ? (
              <div className="obligations-list">
                {doc.obligationsAndDeadlines.map((item, idx) => (
                  <div key={idx} className="obligation-item">
                    <div className="obligation-header">
                      <span className="party-tag">Party: {item.party || 'Specified Party'}</span>
                      <span className="deadline-tag">
                        <Clock size={12} />
                        <span>{item.deadline || 'Ongoing / Unspecified'}</span>
                      </span>
                    </div>

                    <p className="obligation-desc">{item.description}</p>

                    {item.consequence && (
                      <div className="consequence-box">
                        <span className="consequence-label">Breach Consequence:</span>
                        <span>{item.consequence}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">No obligations or deadlines detected.</p>
            )}
          </div>
        )}

        {/* TAB 4: RISKS & RED FLAGS */}
        {activeTab === 'risks' && (
          <div className="tab-panel">
            <div className="panel-header">
              <h3 className="panel-title">Potential Risks & Red Flags</h3>
              <p className="panel-subtitle">
                Provisions that may present liabilities, non-standard penalties, or ambiguity.
              </p>
            </div>

            {doc.risksAndRedFlags && doc.risksAndRedFlags.length > 0 ? (
              <div className="risks-list">
                {doc.risksAndRedFlags.map((risk, idx) => (
                  <div key={idx} className="risk-item">
                    <div className="risk-header">
                      <h4 className="risk-title">{risk.title}</h4>
                      <span className={`risk-tag risk-tag-${risk.severity || 'medium'}`}>
                        {risk.severity || 'medium'} severity
                      </span>
                    </div>

                    <p className="risk-desc">{risk.description}</p>

                    {risk.recommendation && (
                      <div className="risk-action-box">
                        <span className="action-label">Recommendation:</span>
                        <p className="action-text">{risk.recommendation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">No significant risks or red flags detected.</p>
            )}
          </div>
        )}

        {/* TAB 5: LAWYER CHECKLIST */}
        {activeTab === 'checklist' && (
          <div className="tab-panel">
            <div className="panel-header">
              <h3 className="panel-title">Lawyer Discussion Checklist</h3>
              <p className="panel-subtitle">
                Practical questions to raise with legal counsel before signing or executing this agreement.
              </p>
            </div>

            {doc.lawyerChecklist && doc.lawyerChecklist.length > 0 ? (
              <div className="checklist-container">
                {doc.lawyerChecklist.map((item, idx) => (
                  <div key={idx} className="checklist-card">
                    <div className="checklist-order">{idx + 1}</div>
                    <div className="checklist-body">
                      <div className="checklist-meta">
                        <span className="category-pill">{item.category || 'General Provision'}</span>
                      </div>
                      <h5 className="checklist-question">{item.question}</h5>
                      {item.context && (
                        <p className="checklist-context">
                          <span className="context-label">Context:</span> {item.context}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">No checklist generated yet.</p>
            )}
          </div>
        )}

        {/* TAB 6: GROUNDED Q&A CHAT */}
        {activeTab === 'qa' && (
          <div className="tab-panel qa-layout-panel">
            <div className="panel-header">
              <h3 className="panel-title">Document Q&A</h3>
              <p className="panel-subtitle">
                Ask specific questions. Answers are grounded in the document text with page citations.
              </p>
            </div>

            <div className="qa-chat-area">
              <div className="chat-thread">
                {chatHistory.length === 0 ? (
                  <div className="chat-initial-state">
                    <p className="initial-title">Ask any question about this document</p>
                    <p className="initial-subtitle">Suggested inquiries:</p>
                    <div className="suggested-prompts-list">
                      {[
                        'What are the termination conditions and notice periods?',
                        'What are my key obligations under this agreement?',
                        'Are there any indemnification, liability, or penalty clauses?',
                        'Is there an automatic renewal or non-compete clause?',
                      ].map((promptText, pIdx) => (
                        <button
                          key={pIdx}
                          className="prompt-suggestion-btn"
                          onClick={() => setQuestion(promptText)}
                        >
                          <ChevronRight size={13} className="text-muted" />
                          <span>{promptText}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`message-row ${msg.sender === 'user' ? 'message-row-user' : 'message-row-ai'}`}
                    >
                      <div className="message-bubble">
                        <div className="message-sender-label">
                          {msg.sender === 'user' ? 'You' : 'LexiAssist'}
                        </div>
                        <div className="message-body-text">{msg.text}</div>

                        {msg.citations && msg.citations.length > 0 && (
                          <div className="message-citations-block">
                            <span className="citation-lead">Sources:</span>
                            <div className="citation-pill-row">
                              {msg.citations.map((cite, cIdx) => (
                                <span key={cIdx} className="source-citation-pill" title={cite.snippet}>
                                  Page {cite.pageNumber} • {cite.section}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {asking && (
                  <div className="message-row message-row-ai">
                    <div className="message-bubble message-loading-bubble">
                      <Loader2 size={14} className="spin text-accent" />
                      <span>Retrieving document context and formulating grounded answer...</span>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleAskQuestion} className="qa-input-form">
                <input
                  type="text"
                  placeholder="Ask a question about this document..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="qa-text-input"
                  disabled={asking}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!question.trim() || asking || cooldownSeconds > 0}
                >
                  <Send size={14} />
                  <span>{cooldownSeconds > 0 ? `Wait (${cooldownSeconds}s)` : 'Ask'}</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
