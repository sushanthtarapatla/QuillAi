import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid with custom dark theme configurations
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    background: '#12131a',
    primaryColor: '#7c3aed',
    primaryTextColor: '#f8fafc',
    lineColor: '#6366f1',
    secondaryColor: '#1e1b4b',
    tertiaryColor: '#0f172a'
  }
});

export default function MermaidRenderer({ chart }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!chart) return;

    // Clean chart content by removing markdown block syntax if present
    let cleanChart = chart.trim();
    if (cleanChart.startsWith('```mermaid')) {
      cleanChart = cleanChart.replace(/^```mermaid\n/, '').replace(/\n```$/, '');
    } else if (cleanChart.startsWith('```')) {
      cleanChart = cleanChart.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const uniqueId = `mermaid-svg-${Math.floor(Math.random() * 1000000)}`;

    if (containerRef.current) {
      containerRef.current.innerHTML = '<div class="text-slate-400 flex items-center gap-2 p-4 text-sm"><span class="animate-pulse">Rendering diagram...</span></div>';
      containerRef.current.removeAttribute('data-processed');

      try {
        mermaid.render(uniqueId, cleanChart).then(({ svg }) => {
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        }).catch(err => {
          console.error('Mermaid render promise failed:', err);
          if (containerRef.current) {
            containerRef.current.innerHTML = `
              <div class="text-left max-w-full text-xs p-4 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl space-y-2">
                <p className="font-semibold text-sm">Failed to render Mermaid chart syntax.</p>
                <pre class="overflow-auto bg-slate-950/50 p-2 rounded border border-red-500/10 font-mono">${err.message || err}</pre>
                <pre class="overflow-auto bg-slate-950/50 p-2 rounded border border-red-500/10 font-mono">${cleanChart}</pre>
              </div>
            `;
          }
        });
      } catch (err) {
        console.error('Mermaid synchronous execution error:', err);
        containerRef.current.innerHTML = `<div class="text-red-400 p-4">Mermaid error: ${err.message}</div>`;
      }
    }
  }, [chart]);

  return (
    <div className="w-full flex justify-center overflow-x-auto">
      <div 
        ref={containerRef} 
        className="mermaid w-full max-w-full flex justify-center p-4 bg-brand-card rounded-2xl border border-white/5" 
      />
    </div>
  );
}
