import React from 'react';
import { Info } from 'lucide-react';

export default function DisclaimerBanner() {
  return (
    <div className="disclaimer-banner">
      <Info size={14} className="disclaimer-icon" />
      <span className="disclaimer-text">
        <strong>Notice:</strong> LexiAssist provides AI-powered document analysis and legal information only. It does not constitute formal legal advice. Consult legal counsel.
      </span>
    </div>
  );
}
