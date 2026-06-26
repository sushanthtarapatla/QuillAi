import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  GitBranch, Terminal, Trash2, Eye, PlusCircle, Calendar, 
  BarChart3, Code2, AlertTriangle, ShieldCheck, Sparkles, Loader2 
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { api } from '../services/api';

export default function Home() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await api.getHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load project history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Are you sure you want to permanently delete this documentation?')) return;
    
    setDeletingId(id);
    try {
      await api.deleteProject(id);
      setHistory(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Failed to delete project: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
        <p className="text-slate-400 text-sm">Loading developer dashboard...</p>
      </div>
    );
  }

  // Calculate metrics
  const completedProjects = history.filter(item => item.status === 'completed');
  const totalCount = history.length;
  const avgScore = completedProjects.length > 0 
    ? Math.round(completedProjects.reduce((sum, item) => sum + (item.codeQualityScore || 0), 0) / completedProjects.length)
    : 0;
  const activeRuns = history.filter(item => ['extracting', 'analyzing', 'generating'].includes(item.status)).length;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    if (score >= 50) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-red-400 border-red-500/20 bg-red-500/5';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400">
            Failed
          </span>
        );
      case 'extracting':
      case 'analyzing':
      case 'generating':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-purple/10 border border-brand-purple/20 text-brand-purple animate-pulse">
            Processing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-400">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 flex-1">
      {/* Welcome Hero Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-8 rounded-3xl glass-panel glow-border-purple shadow-brand-purple/5">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-purple/10 border border-brand-purple/20 text-brand-purple">
            <Sparkles className="w-3.5 h-3.5" />
            AI Document Engine Active
          </div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight text-white">
            Welcome to Quill <span className="bg-gradient-to-r from-brand-indigo to-brand-purple bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Automatically scan node configurations, source classes, and repositories to compile beautiful developer guides, resumes, and interview kits.
          </p>
        </div>
        <Link 
          to="/upload"
          className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-brand-indigo to-brand-purple text-white text-sm font-semibold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-brand-purple/20"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          Document New Project
        </Link>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="flex items-center gap-4">
          <div className="bg-brand-indigo/10 border border-brand-indigo/20 p-3 rounded-2xl">
            <BarChart3 className="w-6 h-6 text-brand-indigo" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-semibold">Documented Projects</span>
            <h3 className="font-display font-bold text-2xl text-white mt-1">{totalCount}</h3>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="bg-brand-purple/10 border border-brand-purple/20 p-3 rounded-2xl">
            <Code2 className="w-6 h-6 text-brand-purple" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-semibold">Average Code Quality</span>
            <h3 className="font-display font-bold text-2xl text-white mt-1">
              {avgScore ? `${avgScore} / 100` : 'N/A'}
            </h3>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="bg-violet-500/10 border border-violet-500/20 p-3 rounded-2xl">
            <Terminal className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-semibold">Active Scans</span>
            <h3 className="font-display font-bold text-2xl text-white mt-1">{activeRuns}</h3>
          </div>
        </GlassCard>
      </div>

      {/* Project History List */}
      <div className="space-y-4">
        <h2 className="font-display font-bold text-xl text-white">Documentation Workspace Library</h2>
        
        {history.length === 0 ? (
          <GlassCard className="text-center py-16 space-y-4">
            <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto">
              <Code2 className="w-6 h-6 text-slate-500" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-slate-300">No projects found</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                You haven't generated documentation for any codebases yet. Get started by uploading your first project.
              </p>
            </div>
            <Link 
              to="/upload" 
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 rounded-xl transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5 text-brand-purple" />
              Upload Codebase
            </Link>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {history.map((project) => {
              const isCompleted = project.status === 'completed';
              const isInProgress = ['extracting', 'analyzing', 'generating'].includes(project.status);
              const isFailed = project.status === 'failed';
              
              const linkTarget = isCompleted 
                ? `/documentation/${project._id}` 
                : `/progress/${project._id}`;

              return (
                <Link 
                  key={project._id} 
                  to={linkTarget}
                  className="block group"
                >
                  <GlassCard hover className="h-full flex flex-col justify-between space-y-6 glow-border-purple shadow-brand-purple/5">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <h3 className="font-display font-bold text-lg text-slate-200 group-hover:text-brand-purple transition-colors duration-200">
                            {project.name}
                          </h3>
                          <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            {project.sourceType === 'github' ? (
                              <GitBranch className="w-3 h-3 text-slate-500" />
                            ) : (
                              <Calendar className="w-3 h-3 text-slate-500" />
                            )}
                            <span>{project.sourceType}</span>
                          </div>
                        </div>

                        {/* Status */}
                        {getStatusBadge(project.status)}
                      </div>

                      {/* Tech badges */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {project.technologies?.slice(0, 4).map((tech) => (
                          <span key={tech} className="px-2 py-0.5 bg-slate-900 border border-slate-800/80 rounded-md text-[10px] text-slate-400">
                            {tech}
                          </span>
                        ))}
                        {project.technologies?.length > 4 && (
                          <span className="px-2 py-0.5 bg-slate-900 border border-slate-800/80 rounded-md text-[10px] text-slate-500 font-semibold">
                            +{project.technologies.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      {/* Quality Score Indicator */}
                      {isCompleted ? (
                        <div className={`px-2.5 py-1 border rounded-xl text-xs font-semibold flex items-center gap-1 ${getScoreColor(project.codeQualityScore)}`}>
                          {project.codeQualityScore >= 80 ? (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          )}
                          <span>Score: {project.codeQualityScore}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">
                          {isFailed ? 'Compilation failed' : 'Analyzing codebase...'}
                        </span>
                      )}

                      <div className="flex items-center gap-2">
                        {deletingId === project._id ? (
                          <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                        ) : (
                          <button
                            onClick={(e) => handleDelete(project._id, e)}
                            className="p-2 bg-slate-900 border border-slate-800 hover:border-red-500/30 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-xl transition-all duration-200"
                            title="Delete project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        <button 
                          className="flex items-center gap-1 px-3 py-2 bg-slate-900 border border-slate-800 hover:border-brand-purple text-xs font-bold text-slate-300 rounded-xl transition-colors duration-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {isCompleted ? 'Open Wiki' : 'Track Scan'}
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
