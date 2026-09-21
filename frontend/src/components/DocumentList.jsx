import React from 'react';
import { FileText, Calendar, Layers, Trash2, CheckCircle, Clock } from 'lucide-react';
import { deleteDocument } from '../services/api';

export default function DocumentList({ documents, onDocumentDeleted, onSelectDocument }) {
  if (!documents || documents.length === 0) {
    return null;
  }

  const handleDelete = async (e, docId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document and its analysis?')) {
      return;
    }
    try {
      await deleteDocument(docId);
      if (onDocumentDeleted) {
        onDocumentDeleted(docId);
      }
    } catch (err) {
      alert('Failed to delete document: ' + err.message);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} style={{ color: 'var(--primary-light)' }} />
          Uploaded Documents ({documents.length})
        </h3>
      </div>

      <div className="documents-grid">
        {documents.map((doc) => (
          <div
            key={doc._id}
            className="document-card"
            onClick={() => onSelectDocument && onSelectDocument(doc)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="doc-icon-badge">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="doc-title" title={doc.originalName}>
                    {doc.originalName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
                    <span style={{ textTransform: 'uppercase' }}>{doc.fileType}</span>
                    <span>•</span>
                    <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                    <span>•</span>
                    <span>{doc.pageCount} {doc.pageCount === 1 ? 'Page' : 'Pages'}</span>
                  </div>
                </div>
              </div>

              <button
                className="delete-icon-btn"
                onClick={(e) => handleDelete(e, doc._id)}
                title="Delete document"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="doc-card-footer">
              <span className="doc-status-badge">
                <CheckCircle size={12} />
                {doc.status}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={12} />
                {new Date(doc.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
