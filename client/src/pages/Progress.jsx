import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import ProgressStepper from '../components/ProgressStepper';
import { api } from '../services/api';

export default function Progress() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Track triggered states to avoid repeating requests in polling loop
  const triggeredAnalyze = useRef(false);
  const triggeredGenerate = useRef(false);

  useEffect(() => {
    let pollInterval = null;

    const fetchStatus = async () => {
      try {
        const data = await api.getProjectStatus(id);
        setProject(data);
        setLoading(false);

        // State Machine Logic based on current project status:
        
        // 1. If status is "analyzing" and we haven't triggered analyze endpoint, do so
        if (data.status === 'analyzing' && !triggeredAnalyze.current) {
          triggeredAnalyze.current = true;
          console.log('Status is analyzing. Running tech stack/folder analysis...');
          await api.analyzeProject(id);
        }

        // 2. If status is "generating" and we haven't triggered generate endpoint, do so
        if (data.status === 'generating' && !triggeredGenerate.current) {
          triggeredGenerate.current = true;
          console.log('Status is generating. Starting AI document compilation...');
          
          // Grab custom settings if present
          const apiKey = localStorage.getItem('quill_gemini_api_key') || null;
          const modelName = localStorage.getItem('quill_gemini_model') || null;
          
          await api.generateDocs(id, apiKey, modelName);
        }

        // 3. Stop polling if completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(pollInterval);
          if (data.status === 'failed') {
            setErrorMessage(data.errorMessage || 'An error occurred during codebase compilation.');
          }
        }

      } catch (err) {
        console.error('Polling error:', err);
        setErrorMessage('Failed to fetch status from the server.');
        clearInterval(pollInterval);
      }
    };

    // Initial check
    fetchStatus();

    // Poll every 2 seconds
    pollInterval = setInterval(fetchStatus, 2000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [id]);

  const handleViewDoc = () => {
    navigate(`/documentation/${id}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
        <p className="text-slate-400 text-sm">Loading project workspace details...</p>
      </div>
    );
  }

  const isCompleted = project?.status === 'completed';
  const isFailed = project?.status === 'failed';

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-purple/10 border border-brand-purple/20 text-brand-purple">
          <Sparkles className="w-3.5 h-3.5" />
          Active Workspace
        </span>
        <h1 className="font-display font-bold text-3xl tracking-tight text-white mt-3">
          Analyzing: <span className="bg-gradient-to-r from-brand-indigo to-brand-purple bg-clip-text text-transparent">{project?.name}</span>
        </h1>
        <p className="text-slate-400 text-sm">
          {isCompleted 
            ? 'Documentation generated successfully!' 
            : isFailed 
              ? 'Process halted due to an error.' 
              : 'Our system is mapping your directories, reading dependencies, and generating summaries.'}
        </p>
      </div>

      <GlassCard className="glow-border-purple shadow-brand-purple/5 max-w-2xl mx-auto">
        <div className="py-6">
          <ProgressStepper status={project?.status} errorMessage={errorMessage} />
        </div>

        {isCompleted && (
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in">
            <div className="text-xs text-slate-400 text-center sm:text-left">
              Generated in under 2 minutes. Ready for review.
            </div>
            
            <button
              onClick={handleViewDoc}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-indigo to-brand-purple text-white text-sm font-semibold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md shadow-brand-purple/20"
            >
              View Generated Wiki
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {isFailed && (
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>Please review error logs. If it is an AI generation error, verify your Gemini API key in settings.</span>
            </div>
            
            <button
              onClick={() => navigate('/upload')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
