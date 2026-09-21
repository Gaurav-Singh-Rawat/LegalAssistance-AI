import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
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
      setError('File size exceeds the 10 MB limit.');
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
      setError('Please select a document to upload.');
      return;
    }

    setUploading(true);
    setError('');
    setStatusMessage('Uploading and parsing document...');
    setUploadProgress(40);

    try {
      const response = await uploadDocument(file);
      setUploadProgress(100);
      setStatusMessage('Document parsed successfully.');
      setSuccessData(response.data);
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to upload document.');
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
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Upload Legal Document</h3>
            <p className="modal-description">
              Upload a contract, lease, NDA, or agreement for analysis (PDF or DOCX, max 10MB)
            </p>
          </div>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="alert-banner alert-error">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successData ? (
          <div className="upload-result-box">
            <div className="success-icon-wrap">
              <Check size={20} />
            </div>
            <h4 className="result-title">Document Ready for Analysis</h4>
            <p className="result-filename">{successData.originalName}</p>

            <div className="result-meta-row">
              <div className="result-meta-item">
                <span className="result-meta-label">Pages</span>
                <span className="result-meta-value">{successData.pageCount}</span>
              </div>
              <div className="result-meta-item">
                <span className="result-meta-label">Chunks</span>
                <span className="result-meta-value">{successData.chunkCount}</span>
              </div>
              <div className="result-meta-item">
                <span className="result-meta-label">Status</span>
                <span className="result-meta-value status-active">{successData.status}</span>
              </div>
            </div>

            <div className="modal-actions-row">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setFile(null);
                  setSuccessData(null);
                }}
              >
                Upload Another
              </button>
              <button className="btn btn-primary" onClick={handleClose}>
                Open Workspace
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Dropzone */}
            <div
              className={`dropzone-container ${dragActive ? 'dropzone-dragover' : ''} ${file ? 'dropzone-has-file' : ''}`}
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
                <Upload size={22} />
              </div>

              {file ? (
                <div className="file-preview-card">
                  <FileText size={18} className="file-preview-icon" />
                  <div className="file-preview-text">
                    <span className="file-preview-name">{file.name}</span>
                    <span className="file-preview-size">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
                    </span>
                  </div>
                </div>
              ) : (
                <div className="dropzone-text">
                  <p className="dropzone-primary-text">
                    Drag and drop your document here, or <span className="dropzone-link">browse files</span>
                  </p>
                  <p className="dropzone-secondary-text">PDF and DOCX formats supported</p>
                </div>
              )}
            </div>

            {uploading && (
              <div className="upload-progress-wrapper">
                <div className="upload-progress-header">
                  <span className="upload-status-label">
                    <Loader2 size={13} className="spin" />
                    {statusMessage}
                  </span>
                  <span className="upload-progress-percent">{uploadProgress}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
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
                    <Loader2 size={14} className="spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>Upload & Process</span>
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
