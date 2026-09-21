import React, { useState, useRef } from 'react';
import { UploadCloud, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadDocument } from '../services/api';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    setSuccessData(null);

    if (!selectedFile) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    const allowedExtensions = ['.pdf', '.docx', '.doc'];
    const fileExt = '.' + selectedFile.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(selectedFile.type) && !allowedExtensions.includes(fileExt)) {
      setError('Unsupported file type. Please upload a PDF (.pdf) or Word document (.docx).');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum allowed file size is 10 MB.');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a legal document first.');
      return;
    }

    setUploading(true);
    setError('');
    setStatusMessage('Uploading and extracting legal text...');
    setUploadProgress(40);

    try {
      const response = await uploadDocument(file);
      setUploadProgress(100);
      setStatusMessage('Document parsed and chunks created successfully!');
      setSuccessData(response.data);
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to upload and process document.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError('');
    setSuccessData(null);
    setUploadProgress(0);
    setStatusMessage('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="feature-icon-wrap" style={{ width: 36, height: 36 }}>
              <UploadCloud size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Upload Legal Document</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                PDF or DOCX contracts, NDAs, lease agreements (Max 10MB)
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert-box alert-error">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successData ? (
          <div className="upload-success-card">
            <CheckCircle2 size={44} style={{ color: '#10b981', margin: '0 auto' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.5rem' }}>
              Document Processed Successfully!
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {successData.originalName}
            </p>

            <div className="stats-badges-row">
              <div className="stat-chip">
                <span className="stat-label">Pages:</span>
                <span className="stat-val">{successData.pageCount}</span>
              </div>
              <div className="stat-chip">
                <span className="stat-label">Chunks Created:</span>
                <span className="stat-val">{successData.chunkCount}</span>
              </div>
              <div className="stat-chip">
                <span className="stat-label">Status:</span>
                <span className="stat-val" style={{ textTransform: 'capitalize', color: '#34d399' }}>
                  {successData.status}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setFile(null);
                  setSuccessData(null);
                }}
              >
                Upload Another
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Drag and Drop Zone */}
            <div
              className={`dropzone ${dragActive ? 'dropzone-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                style={{ display: 'none' }}
                onChange={handleChange}
              />

              <div className="dropzone-icon">
                <UploadCloud size={32} />
              </div>

              {file ? (
                <div className="selected-file-info">
                  <FileText size={20} style={{ color: 'var(--primary-light)' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{file.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    Drag & drop your legal document here, or <span style={{ color: 'var(--primary-light)' }}>browse</span>
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Supports PDF and DOCX up to 10MB
                  </p>
                </div>
              )}
            </div>

            {uploading && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Loader2 size={16} className="spin" />
                    {statusMessage}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleClose} disabled={uploading}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Processing Document...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={16} />
                    <span>Process Document</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
