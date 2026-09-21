import React from 'react';
import { Scale, Activity } from 'lucide-react';

export default function Header({ backendStatus }) {
  return (
    <header className="header-wrapper glass-panel">
      <div className="brand">
        <div className="brand-icon">
          <Scale size={22} />
        </div>
        <div>
          <h1 className="brand-title">LexiAssist</h1>
          <p className="brand-subtitle">GenAI Legal Information Assistant</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className={`status-pill ${backendStatus.online ? 'status-online' : 'status-offline'}`}>
          <Activity size={12} />
          <span>API: {backendStatus.online ? 'Online' : 'Offline'}</span>
        </div>
      </div>
    </header>
  );
}
