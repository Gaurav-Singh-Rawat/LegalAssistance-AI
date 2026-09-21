import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  ShieldAlert,
  Calendar,
  CheckSquare,
  MessageSquare,
  ArrowLeft,
  RefreshCw,
  Send,
  HelpCircle,
  AlertTriangle,
  Layers,
  Clock,
  BookOpen,
  Info,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { fetchDocumentById, askDocumentQuestion, reanalyzeDocument } from '../services/api';

export default function DocumentWorkspace({ documentId, onBack }) {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [reanalyzing, setReanalyzing] = useState(false);

  // Q&A Chat State
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [asking, setAsking] = useState(false);

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
    setReanalyzing(true);
    try {
      const res = await reanalyzeDocument(documentId);
      if (res.success && res.data) {
        setDoc(res.data);
      }
    } catch (err) {
      alert('Re-analysis failed: ' + err.message);
    } finally {
      setReanalyzing(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e?.preventDefault();
    if (!question.trim() || asking) return;

    const userQ = question.trim();
    setQuestion('');
    
    // Add user message to thread immediately
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
      }
    } catch (err) {
      const errorMsg = {
        sender: 'ai',
        text: `Error: ${err.message || 'Could not retrieve answer from AI.'}`,
        citations: [],
        timestamp: new Date(),
        isError: true,
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setAsking(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel workspace-loading">
        <Loader2 size={32} className="spin" style={{ color: 'var(--primary-light)' }} />
        <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>Loading document analysis...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
        <AlertTriangle size={36} style={{ color: '#ef4444', margin: '0 auto' }} />
        <h3 style={{ marginTop: '0.5rem' }}>Document Not Found</h3>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: '1rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    );
  }

  const hasAnalysis = doc.summary || (doc.keyClauses && doc.keyClauses.length > 0);

  return (
    <div className="workspace-container">
      {/* Top Breadcrumb & Controls */}
      <div className="workspace-topbar glass-panel">
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={15} /> Back to Dashboard
        </button>

        <div className="doc-meta-header">
          <div className="doc-meta-title-row">
            <div className="doc-badge-type">{doc.fileType.toUpperCase()}</div>
            <h2 className="workspace-doc-title" title={doc.originalName}>
              {doc.originalName}
            </h2>
          </div>
          <div className="doc-meta-subrow">
            <span>{doc.pageCount} {doc.pageCount === 1 ? 'Page' : 'Pages'}</span>
            <span>•</span>
            <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
            <span>•</span>
            <span>{doc.chunkCount || 0} Chunks</span>
          </div>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={handleReanalyze}
          disabled={reanalyzing}
          title="Re-run AI analysis and vector embeddings"
        >
          <RefreshCw size={14} className={reanalyzing ? 'spin' : ''} />
          <span>{reanalyzing ? 'Analyzing with AI...' : 'Re-Analyze'}</span>
        </button>
      </div>

      {!hasAnalysis && (
        <div className="alert-box glass-panel" style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
          <Sparkles size={18} style={{ color: 'var(--primary-light)' }} />
          <div style={{ flex: 1 }}>
            <strong>AI Analysis in Progress / Pending:</strong> Click the "Re-Analyze" button above to generate plain-English summaries, clause extractions, and risk alerts using Gemini AI.
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleReanalyze} disabled={reanalyzing}>
            Run Analysis Now
          </button>
        </div>
      )}

      {/* Workspace Tabs */}
      <div className="workspace-tabs-nav glass-panel">
        <button
          className={`tab-btn ${activeTab === 'summary' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          <FileText size={16} />
          <span>Executive Summary</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'clauses' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('clauses')}
        >
          <BookOpen size={16} />
          <span>Key Clauses ({doc.keyClauses?.length || 0})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'obligations' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('obligations')}
        >
          <Calendar size={16} />
          <span>Obligations & Deadlines ({doc.obligationsAndDeadlines?.length || 0})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'risks' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('risks')}
        >
          <ShieldAlert size={16} />
          <span>Risks & Red Flags ({doc.risksAndRedFlags?.length || 0})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'checklist' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('checklist')}
        >
          <CheckSquare size={16} />
          <span>Lawyer Checklist ({doc.lawyerChecklist?.length || 0})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'qa' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('qa')}
        >
          <MessageSquare size={16} />
          <span>Grounded Q&A</span>
        </button>
      </div>

      {/* TAB 1: EXECUTIVE SUMMARY */}
      {activeTab === 'summary' && (
        <div className="tab-pane glass-panel">
          <div className="pane-header">
            <h3 className="pane-title">
              <Sparkles size={20} style={{ color: 'var(--primary-light)' }} />
              Plain-English Executive Summary
            </h3>
            <p className="pane-desc">
              Simplified overview of this legal agreement, removing unnecessary legalese.
            </p>
          </div>

          <div className="summary-content-box">
            {doc.summary ? (
              <p style={{ fontSize: '1rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {doc.summary}
              </p>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>
                No summary generated yet. Click "Re-Analyze" at the top to generate one.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: KEY CLAUSES */}
      {activeTab === 'clauses' && (
        <div className="tab-pane glass-panel">
          <div className="pane-header">
            <h3 className="pane-title">
              <BookOpen size={20} style={{ color: 'var(--primary-light)' }} />
              Extracted Key Clauses & Simplified Explanations
            </h3>
            <p className="pane-desc">
              Key provisions identified in the text with plain-English translations.
            </p>
          </div>

          {doc.keyClauses && doc.keyClauses.length > 0 ? (
            <div className="cards-stack">
              {doc.keyClauses.map((clause, idx) => (
                <div key={idx} className="analysis-card">
                  <div className="analysis-card-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{clause.title}</h4>
                      <span className={`importance-tag tag-${clause.importance || 'medium'}`}>
                        {clause.importance || 'medium'} priority
                      </span>
                    </div>
                  </div>

                  <div className="simplified-box">
                    <span className="simplified-label">Simplified Meaning:</span>
                    <p style={{ marginTop: '0.2rem', color: '#e0e7ff', fontSize: '0.92rem' }}>
                      {clause.simplifiedExplanation}
                    </p>
                  </div>

                  {clause.originalSnippet && (
                    <div className="snippet-box">
                      <span className="snippet-label">Original Document Excerpt:</span>
                      <blockquote className="legal-quote">"{clause.originalSnippet}"</blockquote>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No key clauses extracted yet.</p>
          )}
        </div>
      )}

      {/* TAB 3: OBLIGATIONS & DEADLINES */}
      {activeTab === 'obligations' && (
        <div className="tab-pane glass-panel">
          <div className="pane-header">
            <h3 className="pane-title">
              <Calendar size={20} style={{ color: 'var(--primary-light)' }} />
              Obligations & Critical Deadlines
            </h3>
            <p className="pane-desc">
              Actions required by each party, timelines, and consequences of breach.
            </p>
          </div>

          {doc.obligationsAndDeadlines && doc.obligationsAndDeadlines.length > 0 ? (
            <div className="cards-stack">
              {doc.obligationsAndDeadlines.map((item, idx) => (
                <div key={idx} className="analysis-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="party-badge">Responsible: {item.party || 'Party'}</span>
                    <span className="deadline-badge">
                      <Clock size={13} /> {item.deadline || 'Ongoing'}
                    </span>
                  </div>
                  <p style={{ marginTop: '0.75rem', fontWeight: 500, fontSize: '0.95rem' }}>
                    {item.description}
                  </p>
                  {item.consequence && (
                    <div className="consequence-alert">
                      <strong>Consequence of breach:</strong> {item.consequence}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No obligations or deadlines detected.</p>
          )}
        </div>
      )}

      {/* TAB 4: RISKS & RED FLAGS */}
      {activeTab === 'risks' && (
        <div className="tab-pane glass-panel">
          <div className="pane-header">
            <h3 className="pane-title">
              <ShieldAlert size={20} style={{ color: '#f59e0b' }} />
              Potential Risks & Red Flags
            </h3>
            <p className="pane-desc">
              Clauses that may expose you to undue liability, penalties, or unfavorable terms.
            </p>
          </div>

          {doc.risksAndRedFlags && doc.risksAndRedFlags.length > 0 ? (
            <div className="cards-stack">
              {doc.risksAndRedFlags.map((risk, idx) => (
                <div key={idx} className="analysis-card risk-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fca5a5' }}>
                      {risk.title}
                    </h4>
                    <span className={`severity-tag severity-${risk.severity || 'medium'}`}>
                      {risk.severity || 'medium'} risk
                    </span>
                  </div>

                  <p style={{ marginTop: '0.5rem', fontSize: '0.92rem', color: '#f3f4f6' }}>
                    {risk.description}
                  </p>

                  {risk.recommendation && (
                    <div className="recommendation-box">
                      <strong>Recommended Action:</strong> {risk.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No significant risks or red flags detected.</p>
          )}
        </div>
      )}

      {/* TAB 5: LAWYER CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="tab-pane glass-panel">
          <div className="pane-header">
            <h3 className="pane-title">
              <CheckSquare size={20} style={{ color: '#34d399' }} />
              Actionable Lawyer Discussion Checklist
            </h3>
            <p className="pane-desc">
              Tailored questions and discussion points to raise with your attorney before signing.
            </p>
          </div>

          {doc.lawyerChecklist && doc.lawyerChecklist.length > 0 ? (
            <div className="checklist-stack">
              {doc.lawyerChecklist.map((item, idx) => (
                <div key={idx} className="checklist-item-card">
                  <div className="checklist-number">{idx + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span className="category-chip">{item.category || 'General'}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.98rem', color: '#ffffff' }}>
                      {item.question}
                    </div>
                    {item.context && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                        <strong>Context:</strong> {item.context}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No checklist generated yet.</p>
          )}
        </div>
      )}

      {/* TAB 6: GROUNDED Q&A CHAT */}
      {activeTab === 'qa' && (
        <div className="tab-pane glass-panel qa-pane">
          <div className="pane-header">
            <h3 className="pane-title">
              <MessageSquare size={20} style={{ color: 'var(--primary-light)' }} />
              Ask Questions About this Document
            </h3>
            <p className="pane-desc">
              Answers are strictly grounded in this document's text with clause and page citations.
            </p>
          </div>

          {/* Chat Messages Thread */}
          <div className="chat-messages-scroll">
            {chatHistory.length === 0 ? (
              <div className="chat-empty-state">
                <Sparkles size={32} style={{ color: 'var(--primary-light)', margin: '0 auto 0.75rem' }} />
                <p style={{ fontWeight: 600 }}>What would you like to know about this agreement?</p>
                <div className="suggested-questions-row">
                  {[
                    'What are the termination conditions?',
                    'Are there any penalty or indemnification clauses?',
                    'What are my main obligations?',
                    'Is there an automatic renewal clause?',
                  ].map((sampleQ, idx) => (
                    <button
                      key={idx}
                      className="suggested-q-chip"
                      onClick={() => {
                        setQuestion(sampleQ);
                      }}
                    >
                      {sampleQ}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`chat-bubble-wrap ${msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}
                >
                  <div className="chat-bubble">
                    <div className="chat-bubble-header">
                      {msg.sender === 'user' ? 'You' : 'LexiAssist AI'}
                    </div>
                    <div className="chat-bubble-body" style={{ whiteSpace: 'pre-wrap' }}>
                      {msg.text}
                    </div>

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="citations-tray">
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Sources Cited:
                        </span>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                          {msg.citations.map((cite, cIdx) => (
                            <span key={cIdx} className="cite-badge" title={cite.snippet}>
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
              <div className="chat-bubble-wrap chat-bubble-ai">
                <div className="chat-bubble" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Loader2 size={16} className="spin" style={{ color: 'var(--primary-light)' }} />
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    Searching document & formulating grounded answer...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleAskQuestion} className="chat-input-bar">
            <input
              type="text"
              placeholder="Ask a question about this document (e.g. 'Can I terminate early?')..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="chat-text-input"
              disabled={asking}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!question.trim() || asking}
              style={{ padding: '0.6rem 1.25rem' }}
            >
              <Send size={16} />
              <span>Ask</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
