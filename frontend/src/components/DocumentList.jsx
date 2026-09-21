import React from 'react';
import { FileText, Trash2, ArrowRight, Clock } from 'lucide-react';
import { deleteDocument } from '../services/api';

export default function DocumentList({ documents, onDocumentDeleted, onSelectDocument }) {
  if (!documents || documents.length === 0) {
    return null;
  }

  const handleDelete = (e, docId, docName) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${docName}"?`)) {
      if (onDocumentDeleted) {
        onDocumentDeleted(docId);
      }
    }
  };

  return (
    <section className="documents-section">
      <div className="section-header">
        <h3 className="section-title">Uploaded Documents</h3>
        <span className="section-count">{documents.length} files</span>
      </div>

      <div className="documents-table-wrap">
        <table className="documents-table">
          <thead>
            <tr>
              <th style={{ width: '45%' }}>Document Name</th>
              <th>Format</th>
              <th>Pages</th>
              <th>Size</th>
              <th>Date Added</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr
                key={doc._id}
                className="document-row"
                onClick={() => onSelectDocument && onSelectDocument(doc)}
              >
                <td>
                  <div className="document-name-cell">
                    <div className="doc-type-icon">
                      <FileText size={15} />
                    </div>
                    <span className="doc-main-name" title={doc.originalName}>
                      {doc.originalName}
                    </span>
                  </div>
                </td>
                <td>
                  <span className="doc-format-tag">{doc.fileType.toUpperCase()}</span>
                </td>
                <td className="text-muted">
                  {doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}
                </td>
                <td className="text-muted">
                  {(doc.fileSize / 1024).toFixed(0)} KB
                </td>
                <td className="text-muted">
                  {new Date(doc.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="doc-row-actions">
                    <button
                      className="btn-action btn-view"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDocument && onSelectDocument(doc);
                      }}
                      title="Open Workspace"
                    >
                      <span>Open</span>
                      <ArrowRight size={12} />
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={(e) => handleDelete(e, doc._id, doc.originalName)}
                      title="Delete document"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
