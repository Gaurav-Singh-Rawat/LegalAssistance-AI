import React from 'react';
import { 
  Scale, 
  Plus, 
  FileText, 
  Trash2, 
  Clock, 
  CheckCircle, 
  ChevronRight,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';

export default function Sidebar({ 
  documents, 
  selectedDocId, 
  onSelectDocument, 
  onOpenUpload, 
  onDocumentDeleted,
  currentUser,
  onOpenAuth,
  onLogout,
}) {
  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand" onClick={() => onSelectDocument(null)}>
        <div className="sidebar-logo">
          <Scale size={18} />
        </div>
        <div className="sidebar-brand-text">
          <span className="brand-name">LexiAssist</span>
          <span className="brand-tagline">Legal Intelligence</span>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="sidebar-action-wrap">
        <button className="btn btn-primary btn-block" onClick={onOpenUpload}>
          <Plus size={16} />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Documents Navigation Section */}
      <div className="sidebar-section-header">
        <span className="sidebar-section-title">
          <FolderOpen size={13} />
          <span>Documents ({documents.length})</span>
        </span>
      </div>

      <div className="sidebar-docs-list">
        {documents.length === 0 ? (
          <div className="sidebar-empty-state">
            <p>No documents uploaded yet.</p>
            <span className="sidebar-empty-hint">PDF and DOCX files supported</span>
          </div>
        ) : (
          documents.map((doc) => {
            const isSelected = selectedDocId === doc._id;
            return (
              <div
                key={doc._id}
                className={`sidebar-doc-item ${isSelected ? 'sidebar-doc-item-active' : ''}`}
                onClick={() => onSelectDocument(doc)}
              >
                <div className="sidebar-doc-icon">
                  <FileText size={15} />
                </div>

                <div className="sidebar-doc-info">
                  <div className="sidebar-doc-name" title={doc.originalName}>
                    {doc.originalName}
                  </div>
                  <div className="sidebar-doc-meta">
                    <span>{doc.pageCount || 1}p</span>
                    <span>•</span>
                    <span>{(doc.fileSize / 1024).toFixed(0)}KB</span>
                  </div>
                </div>

                <button
                  className="sidebar-doc-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete "${doc.originalName}"?`)) {
                      onDocumentDeleted(doc._id);
                    }
                  }}
                  title="Delete file"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer Security Note */}
      <div className="sidebar-footer">
        {currentUser ? (
          <div className="sidebar-user-profile">
            <div className="sidebar-user-avatar">{currentUser.name?.charAt(0).toUpperCase()}</div>
            <div className="sidebar-user-details">
              <strong>{currentUser.name}</strong>
              <span>{currentUser.email}</span>
            </div>
            <button className="sidebar-logout-btn" onClick={onLogout} title="Sign out">
              Sign out
            </button>
          </div>
        ) : (
          <button className="sidebar-auth-btn" onClick={onOpenAuth}>
            Sign In / Register
          </button>
        )}
        <div className="security-badge">
          <ShieldCheck size={14} />
          <span>Strict Document Grounding</span>
        </div>
      </div>
    </aside>
  );
}
