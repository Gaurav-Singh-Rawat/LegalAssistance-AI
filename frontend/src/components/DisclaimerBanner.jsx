import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DisclaimerBanner() {
  return (
    <div className="disclaimer-banner">
      <AlertTriangle size={18} className="flex-shrink-0" />
      <div>
        <strong>Legal Information Notice:</strong> This application is powered by Artificial Intelligence and provides document analysis and information only. It does <strong>not</strong> constitute formal legal advice. Please consult a qualified attorney for legal counsel.
      </div>
    </div>
  );
}
