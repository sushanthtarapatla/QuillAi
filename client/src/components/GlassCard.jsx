import React from 'react';

export default function GlassCard({ children, className = '', glow = false, hover = false }) {
  return (
    <div className={`
      glass-panel rounded-2xl p-6 transition-all duration-300
      ${hover ? 'glass-panel-hover' : ''}
      ${glow ? 'glow-border-purple shadow-brand-purple/5' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}
