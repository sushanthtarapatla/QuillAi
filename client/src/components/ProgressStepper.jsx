import React from 'react';
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';

export default function ProgressStepper({ status, errorMessage }) {
  const steps = [
    {
      key: 'extracting',
      label: 'Repository Acquisition & Extraction',
      description: 'Acquiring files from ZIP upload or cloning from public GitHub repo.',
      statusKeys: ['extracting']
    },
    {
      key: 'analyzing',
      label: 'Technology Detection & Structure Scan',
      description: 'Traversing the directory structure and analyzing file dependency manifests.',
      statusKeys: ['analyzing']
    },
    {
      key: 'generating',
      label: 'AI Content Generation (Gemini)',
      description: 'Constructing prompts, extracting codebase files, and generating documentation sections.',
      statusKeys: ['generating']
    },
    {
      key: 'completed',
      label: 'Finalizing & Compiling Exporters',
      description: 'Document assembly completed, caching structures, and writing DOCX/PDF export packages.',
      statusKeys: ['completed']
    }
  ];

  // Helper to determine step status state
  const getStepState = (stepIndex) => {
    if (status === 'failed') {
      // Find where it failed
      const activeIndex = steps.findIndex(step => step.statusKeys.includes(status));
      const failedIndex = steps.findIndex(step => step.statusKeys.includes('extracting')); // default
      // Wait, let's map: if status is failed, the currently incomplete or last running step shows error
      // Let's check status transitions
    }
    
    const statusOrder = ['extracting', 'analyzing', 'generating', 'completed'];
    const currentStatusIndex = statusOrder.indexOf(status);

    if (currentStatusIndex === -1 && status === 'failed') {
      return 'failed';
    }

    if (stepIndex < currentStatusIndex) {
      return 'completed';
    } else if (stepIndex === currentStatusIndex) {
      return 'active';
    } else {
      return 'pending';
    }
  };

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto">
      {status === 'failed' && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-400">Analysis Process Failed</h4>
            <p className="mt-1 text-red-300/80">{errorMessage || 'An error occurred during project extraction or code analysis.'}</p>
          </div>
        </div>
      )}

      <div className="relative pl-8 space-y-8 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-[2px] before:bg-slate-800">
        {steps.map((step, index) => {
          const state = getStepState(index);
          const isActive = state === 'active';
          const isCompleted = state === 'completed';
          const isPending = state === 'pending';
          const isFailed = status === 'failed' && (
            // If failed, show the active step or the one that crashed as failed
            (status === 'failed' && index === 0 && ['extracting', 'pending'].includes(status)) || 
            (status === 'failed' && index === 1 && status === 'analyzing') ||
            (status === 'failed' && index === 2 && status === 'generating')
          );

          let icon = <Circle className="w-5 h-5 text-slate-600" />;
          let textClass = 'text-slate-500';
          let borderClass = 'border-slate-800 bg-slate-900';

          if (isCompleted) {
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
            textClass = 'text-slate-300';
            borderClass = 'border-emerald-500/30 bg-emerald-500/10';
          } else if (isActive) {
            icon = <Loader2 className="w-5 h-5 text-brand-purple animate-spin" />;
            textClass = 'text-white font-semibold';
            borderClass = 'border-brand-purple bg-brand-purple/10 shadow-lg shadow-brand-purple/20';
          } else if (status === 'failed' && (index === 0 || index === 1 || index === 2)) {
            // Highlight the failed step
            icon = <AlertCircle className="w-5 h-5 text-red-400" />;
            textClass = 'text-red-400 font-semibold';
            borderClass = 'border-red-500 bg-red-500/10';
          }

          return (
            <div key={step.key} className="relative group">
              {/* Stepper Dot Indicator */}
              <div className={`absolute -left-[30px] top-1.5 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 z-10 ${borderClass}`}>
                {icon}
              </div>

              {/* Step Info */}
              <div className="transition-all duration-200">
                <h3 className={`text-base tracking-tight ${textClass}`}>{step.label}</h3>
                <p className="text-slate-400 text-xs mt-1">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
