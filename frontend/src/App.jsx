import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DisclaimerBanner from './components/DisclaimerBanner';
import Sidebar from './components/Sidebar';
import UploadModal from './components/UploadModal';
import DocumentList from './components/DocumentList';
import DocumentWorkspace from './components/DocumentWorkspace';
import { checkHealth, fetchDocuments, deleteDocument } from './services/api';
import { 
  FileText, 
  Search, 
  AlertTriangle, 
  CheckSquare, 
  Upload,
  ArrowRight,
  Shield,
  Layers
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

  const handleDocumentDeleted = async (deletedId) => {
    try {
      await deleteDocument(deletedId);
      setDocuments((prev) => prev.filter((d) => d._id !== deletedId));
      if (selectedDocId === deletedId) {
        setSelectedDocId(null);
      }
    } catch (err) {
      alert('Failed to delete document from database: ' + err.message);
    }
  };

  return (
    <div className="app-shell">
      {/* Left Sidebar for History & Document Navigation */}
      <Sidebar
        documents={documents}
        selectedDocId={selectedDocId}
        onSelectDocument={(doc) => {
          setSelectedDocId(doc ? doc._id : null);
        }}
        onOpenUpload={() => setIsUploadOpen(true)}
        onDocumentDeleted={handleDocumentDeleted}
      />

      {/* Main Content Area */}
      <div className="app-main-viewport">
        {/* Top Disclaimer Notice */}
        <DisclaimerBanner />

        {/* Minimal Header */}
        <Header backendStatus={backendStatus} />

        {/* Dynamic Body: Document Workspace or Dashboard */}
        <main className="app-content-body">
          {selectedDocId ? (
            <DocumentWorkspace
              documentId={selectedDocId}
              onBack={() => {
                setSelectedDocId(null);
                loadUploadedDocuments();
              }}
            />
          ) : (
            <div className="dashboard-container">
              {/* Clean, Serious Hero */}
              <section className="hero-section">
                <div className="hero-content">
                  <span className="hero-pretitle">Document Analysis & Assistance</span>
                  <h1 className="hero-headline">Understand your legal documents.</h1>
                  <p className="hero-description">
                    Extract plain-English summaries, key obligations, hidden risks, and actionable lawyer checklists from agreements, leases, NDAs, and contracts. Ask questions with source citations.
                  </p>

                  <div className="hero-cta-group">
                    <button className="btn btn-primary btn-lg" onClick={() => setIsUploadOpen(true)}>
                      <Upload size={16} />
                      <span>Upload Document</span>
                    </button>
                    <span className="hero-file-types">Supports PDF & DOCX (up to 10MB)</span>
                  </div>
                </div>
              </section>

              {/* Uploaded Documents Table */}
              <DocumentList
                documents={documents}
                onDocumentDeleted={handleDocumentDeleted}
                onSelectDocument={(doc) => {
                  setSelectedDocId(doc._id);
                }}
              />

              {/* Subtle Capabilities Section */}
              <section className="capabilities-section">
                <div className="section-header">
                  <h3 className="section-title">Core Capabilities</h3>
                </div>

                <div className="capabilities-grid">
                  <div className="capability-card">
                    <div className="capability-icon">
                      <FileText size={18} />
                    </div>
                    <div className="capability-text">
                      <h4 className="capability-heading">Plain-Language Summaries</h4>
                      <p className="capability-desc">
                        Translates dense legal terminology into concise executive overviews.
                      </p>
                    </div>
                  </div>

                  <div className="capability-card">
                    <div className="capability-icon">
                      <Layers size={18} />
                    </div>
                    <div className="capability-text">
                      <h4 className="capability-heading">Key Clauses & Obligations</h4>
                      <p className="capability-desc">
                        Identifies critical covenants, responsibilities, and compliance dates.
                      </p>
                    </div>
                  </div>

                  <div className="capability-card">
                    <div className="capability-icon">
                      <AlertTriangle size={18} />
                    </div>
                    <div className="capability-text">
                      <h4 className="capability-heading">Risk & Red Flag Alerts</h4>
                      <p className="capability-desc">
                        Highlights potential liabilities, non-standard terms, and ambiguities.
                      </p>
                    </div>
                  </div>

                  <div className="capability-card">
                    <div className="capability-icon">
                      <Search size={18} />
                    </div>
                    <div className="capability-text">
                      <h4 className="capability-heading">Grounded Q&A Engine</h4>
                      <p className="capability-desc">
                        Answers questions grounded strictly in document text with page citations.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
