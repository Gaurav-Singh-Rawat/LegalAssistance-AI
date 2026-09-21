import React from 'react';

export default function Header({ backendStatus }) {
  return (
    <header className="app-header">
      <div className="header-breadcrumbs">
        <span className="header-subtitle">Legal Information & Document Workspace</span>
      </div>

      <div className="header-meta">
        <div className="status-indicator">
          <span className={`status-dot ${backendStatus.online ? 'status-dot-online' : 'status-dot-offline'}`} />
          <span className="status-text">{backendStatus.online ? 'System Ready' : 'Backend Offline'}</span>
        </div>
      </div>
    </header>
  );
}
