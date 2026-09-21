import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DisclaimerBanner from './components/DisclaimerBanner';
import UploadModal from './components/UploadModal';
import DocumentList from './components/DocumentList';
import DocumentWorkspace from './components/DocumentWorkspace';
import { checkHealth, fetchDocuments } from './services/api';
import { 
  FileText, 
  Sparkles, 
  Search, 
  AlertCircle, 
  CheckSquare, 
  ShieldCheck,
  UploadCloud,
  ChevronRight
} from 'lucide-react';

export default function App() {
  const [backendStatus, setBackendStatus] = useState({ online: false, data: null });
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);

  useEffect(() => {
    async function loadData() {
      const health = await checkHealth();
      setBackendStatus({
        online: health.status === 'online',
        data: health,
      });

      if (health.status === 'online') {
        loadUploadedDocuments();
      }
    }
    loadData();
  }, []);

  const loadUploadedDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetchDocuments();
      if (res.success && res.data) {
        setDocuments(res.data);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleUploadSuccess = (newDoc) => {
    loadUploadedDocuments();
    if (newDoc && newDoc.id) {
      setSelectedDocId(newDoc.id);
    }
  };

  const handleDocumentDeleted = (deletedId) => {
    setDocuments((prev) => prev.filter((d) => d._id !== deletedId));
    if (selectedDocId === deletedId) {
      setSelectedDocId(null);
    }
  };

  return (
    <div className="app-container">
      {/* Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Main App Header */}
      <Header backendStatus={backendStatus} />

      {/* If a document is selected, render the full Document Analysis Workspace */}
      {selectedDocId ? (
        <DocumentWorkspace
          documentId={selectedDocId}
          onBack={() => {
            setSelectedDocId(null);
            loadUploadedDocuments();
          }}
        />
      ) : (
        <>
          {/* Main Hero Card */}
          <section className="hero-card glass-panel">
            <div className="hero-tag">
              <Sparkles size={14} />
              <span>Intelligent Legal Document Analysis</span>
            </div>
            <h2 className="hero-title">
              Understand Legal Agreements with Plain-English AI Intelligence
            </h2>
            <p className="hero-desc">
              Upload any contract, NDA, lease, or service agreement (PDF / DOCX) to get instant summaries, clause extractions, risk alerts, and grounded Q&A with direct citations.
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button className="btn btn-primary" onClick={() => setIsUploadOpen(true)}>
                <UploadCloud size={18} />
                <span>Upload Document</span>
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  const el = document.getElementById('features-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>Learn More</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </section>

          {/* Uploaded Documents List */}
          <DocumentList
            documents={documents}
            onDocumentDeleted={handleDocumentDeleted}
            onSelectDocument={(doc) => {
              setSelectedDocId(doc._id);
            }}
          />

          {/* Core Feature Matrix */}
          <div id="features-section" className="features-grid">
            <div className="feature-box glass-panel">
              <div className="feature-icon-wrap">
                <FileText size={22} />
              </div>
              <h3 className="feature-title">Plain-English Summaries</h3>
              <p className="feature-desc">
                Transform dense, complex legalese into clear, structured, and easily digestible executive summaries.
              </p>
            </div>

            <div className="feature-box glass-panel">
              <div className="feature-icon-wrap">
                <ShieldCheck size={22} />
              </div>
              <h3 className="feature-title">Clause & Obligation Extraction</h3>
              <p className="feature-desc">
                Automatically detect critical clauses, recurring obligations, compliance dates, and milestones.
              </p>
            </div>

            <div className="feature-box glass-panel">
              <div className="feature-icon-wrap">
                <AlertCircle size={22} />
              </div>
              <h3 className="feature-title">Risk & Red Flag Alerts</h3>
              <p className="feature-desc">
                Surface potential liabilities, indemnification traps, non-standard penalty terms, and ambiguity risks.
              </p>
            </div>

            <div className="feature-box glass-panel">
              <div className="feature-icon-wrap">
                <Search size={22} />
              </div>
              <h3 className="feature-title">Grounded RAG Q&A</h3>
              <p className="feature-desc">
                Ask any question about your document. Every answer is strictly grounded in the text with clause citations.
              </p>
            </div>

            <div className="feature-box glass-panel">
              <div className="feature-icon-wrap">
                <CheckSquare size={22} />
              </div>
              <h3 className="feature-title">Actionable Lawyer Checklist</h3>
              <p className="feature-desc">
                Generate tailored question checklists and discussion points before meeting with your legal counsel.
              </p>
            </div>

            <div className="feature-box glass-panel">
              <div className="feature-icon-wrap">
                <Sparkles size={22} />
              </div>
              <h3 className="feature-title">Powered by Gemini AI</h3>
              <p className="feature-desc">
                Utilizes state-of-the-art Gemini LLM and embeddings with MongoDB Vector Search for high precision.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Interactive Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
