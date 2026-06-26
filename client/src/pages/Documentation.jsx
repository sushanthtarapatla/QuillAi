import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { 
  FileText, Code, Network, Database, BookOpen, ListChecks, 
  Copy, Download, Printer, Check, Folder, File, ChevronRight, 
  ChevronDown, Brain, HelpCircle, FileCheck2, ArrowLeft, Loader2, Sparkles
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import MermaidRenderer from '../components/MermaidRenderer';
import { api } from '../services/api';

// Interactive Recursive Folder Tree Component
function FolderTreeItem({ node }) {
  const [isOpen, setIsOpen] = useState(true);
  const isDir = node.type === 'directory';

  if (!isDir) {
    return (
      <div className="flex items-center gap-2 pl-6 py-1 text-slate-400 text-xs">
        <File className="w-3.5 h-3.5 text-slate-500" />
        <span>{node.name}</span>
        {node.size && (
          <span className="text-[10px] text-slate-600 font-mono">
            ({(node.size / 1024).toFixed(1)} KB)
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="pl-3">
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center gap-1.5 py-1 text-slate-200 text-xs font-semibold cursor-pointer hover:text-brand-purple select-none"
      >
        {isOpen ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
        <Folder className="w-3.5 h-3.5 text-brand-purple fill-brand-purple/10" />
        <span>{node.name}/</span>
      </div>
      {isOpen && node.children && (
        <div className="border-l border-slate-800 ml-2.5">
          {node.children.map((child, i) => (
            <FolderTreeItem key={i} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}

// Collapsible Q&A Accordion Item
function AccordionItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left text-sm font-semibold text-slate-200 hover:bg-slate-800/20 transition-colors duration-200"
      >
        <span className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-brand-purple shrink-0" />
          {question}
        </span>
        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
      </button>
      {isOpen && (
        <div className="p-4 border-t border-slate-800/50 bg-slate-950/40 text-xs leading-relaxed text-slate-400 space-y-2">
          <ReactMarkdown className="markdown-body">{answer}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default function Documentation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projData = await api.getProjectStatus(id);
        const docData = await api.getDocumentation(id);
        setProject(projData);
        setDoc(docData);
      } catch (err) {
        console.error('Failed to fetch documentation:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format) => {
    window.open(api.getDownloadUrl(id, format), '_blank');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
        <p className="text-slate-400 text-sm">Assembling documentation panels...</p>
      </div>
    );
  }

  if (!project || !doc) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold text-white">Documentation Not Found</h2>
        <p className="text-slate-400 text-sm">The requested project documentation could not be loaded. It may have been deleted or the analysis failed.</p>
        <button 
          onClick={() => navigate('/')} 
          className="mt-4 px-4 py-2 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Parse Q&As out of the markdown string if possible
  const parseQuestions = (qMarkdown) => {
    if (!qMarkdown) return [];
    // Split by questions starting with Q: or numbers
    const blocks = qMarkdown.split(/Q\d+:|Q:|\d+\.\s+Q:/gi).filter(b => b.trim());
    return blocks.map((block, idx) => {
      const parts = block.split(/A:|Answer:/gi);
      const q = parts[0]?.trim() || `Technical Interview Question ${idx + 1}`;
      const a = parts[1]?.trim() || 'No answer provided.';
      return { question: q, answer: a };
    });
  };

  const qaList = parseQuestions(doc.interviewQuestions);

  // Tab configurations
  const tabs = [
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'readme', label: 'README.md', icon: Code },
    { id: 'tech', label: 'Tech & Files', icon: Database },
    { id: 'arch', label: 'Architecture', icon: Network },
    { id: 'prep', label: 'Interview & Resume', icon: Brain },
    { id: 'improvements', label: 'Improvements', icon: ListChecks }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 flex-1 flex flex-col">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div className="space-y-2">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs font-semibold transition-colors duration-200 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-3xl tracking-tight text-white">{project.name}</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FileCheck2 className="w-3.5 h-3.5" />
              Documented
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
            <span>Type: <strong className="text-slate-300 uppercase">{project.sourceType}</strong></span>
            {project.githubUrl && (
              <a 
                href={project.githubUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="text-brand-purple hover:underline"
              >
                GitHub Link
              </a>
            )}
            <span>Created: <strong>{new Date(doc.createdAt).toLocaleDateString()}</strong></span>
          </div>
        </div>

        {/* Toolbar Exporters */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleCopyToClipboard(doc.readme)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800/40 text-xs font-semibold rounded-xl transition-all duration-200"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied README' : 'Copy README'}
          </button>

          <button
            onClick={() => handleDownload('readme')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800/40 text-xs font-semibold rounded-xl transition-all duration-200"
          >
            <Download className="w-3.5 h-3.5" />
            Markdown
          </button>

          <button
            onClick={() => handleDownload('docx')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800/40 text-xs font-semibold rounded-xl transition-all duration-200"
          >
            <FileText className="w-3.5 h-3.5" />
            DOCX Word
          </button>

          <button
            onClick={() => handleDownload('pdf')}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-purple/20 border border-brand-purple/30 text-brand-purple hover:text-white hover:bg-brand-purple/30 text-xs font-semibold rounded-xl transition-all duration-200 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1">
        {/* Sidebar Nav Tabs */}
        <div className="lg:col-span-1 space-y-2">
          <div className="flex lg:flex-col gap-1 overflow-x-auto pb-4 lg:pb-0">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shrink-0 text-left w-full
                    ${isActive 
                      ? 'bg-brand-purple/10 border border-brand-purple/20 text-brand-purple glow-text' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'}
                  `}
                >
                  <TabIcon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab View Container */}
        <div className="lg:col-span-3">
          <GlassCard className="h-full glow-border-purple shadow-brand-purple/5">
            {/* SUMMARY TAB */}
            {activeTab === 'summary' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display font-bold text-2xl text-white">Executive Summary</h2>
                  <p className="text-slate-400 text-xs mt-1">Generated by Google Gemini AI codebase analyzer.</p>
                </div>
                <div className="text-sm leading-relaxed text-slate-300 space-y-4">
                  <ReactMarkdown className="markdown-body">{doc.summary}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* README TAB */}
            {activeTab === 'readme' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-display font-bold text-2xl text-white">README.md</h2>
                    <p className="text-slate-400 text-xs mt-1">A production-ready documentation file for developers.</p>
                  </div>
                  <button
                    onClick={() => handleCopyToClipboard(doc.readme)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-lg"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Raw
                  </button>
                </div>
                <div className="p-6 rounded-2xl bg-slate-950/30 border border-white/5 overflow-auto max-h-[70vh]">
                  <div className="markdown-body">
                    <ReactMarkdown>{doc.readme}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {/* TECH & FILES TAB */}
            {activeTab === 'tech' && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display font-bold text-2xl text-white">Codebase Architecture & Technologies</h2>
                  <p className="text-slate-400 text-xs mt-1">Detected technology stacks and repository file map.</p>
                </div>

                {/* Tech Pills */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-300">Detected Technologies</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies?.map((tech) => (
                      <span key={tech} className="px-3 py-1.5 bg-gradient-to-r from-brand-indigo/20 to-brand-purple/20 border border-brand-purple/30 rounded-xl text-xs font-semibold text-slate-200">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Grid layout for structure & tree */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* File tree */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-300">Directory Explorer</h3>
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 max-h-[400px] overflow-y-auto">
                      {project.folderStructure ? (
                        <FolderTreeItem node={project.folderStructure} />
                      ) : (
                        <span className="text-xs text-slate-500">No directory structure available.</span>
                      )}
                    </div>
                  </div>

                  {/* Folder Structure Explanation */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-300">Folder Tree Explanation</h3>
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 max-h-[400px] overflow-y-auto text-xs leading-relaxed text-slate-300">
                      <ReactMarkdown className="markdown-body">{doc.folderStructureExplanation}</ReactMarkdown>
                    </div>
                  </div>
                </div>

                {/* Installation Info */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <h3 className="text-sm font-semibold text-slate-300">Quick Installation & Dependencies</h3>
                  <div className="markdown-body text-xs">
                    <ReactMarkdown>{doc.installationGuide}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {/* ARCHITECTURE & DIAGRAM TAB */}
            {activeTab === 'arch' && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display font-bold text-2xl text-white">System Architecture</h2>
                  <p className="text-slate-400 text-xs mt-1">AI-inferred application flow, data layout, and sequencing.</p>
                </div>

                {/* Architecture Overview */}
                <div className="text-sm leading-relaxed text-slate-300 space-y-4">
                  <ReactMarkdown className="markdown-body">{doc.architectureOverview}</ReactMarkdown>
                </div>

                {/* Mermaid chart */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-slate-300">Flow Sequencing Diagram</h3>
                    <button
                      onClick={() => handleCopyToClipboard(doc.mermaidDiagram)}
                      className="text-[10px] text-brand-purple hover:underline"
                    >
                      Copy Diagram Code
                    </button>
                  </div>
                  <MermaidRenderer chart={doc.mermaidDiagram} />
                </div>

                {/* API & Database descriptions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-300">Database Schema Reference</h3>
                    <div className="p-4 rounded-xl bg-slate-950/20 border border-slate-800 text-xs text-slate-400 max-h-[250px] overflow-y-auto">
                      <ReactMarkdown className="markdown-body">{doc.databaseExplanation || 'No database details provided.'}</ReactMarkdown>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-300">API Documentation</h3>
                    <div className="p-4 rounded-xl bg-slate-950/20 border border-slate-800 text-xs text-slate-400 max-h-[250px] overflow-y-auto">
                      <ReactMarkdown className="markdown-body">{doc.apiDocumentation || 'No API details detected.'}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PREPARATION TAB */}
            {activeTab === 'prep' && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display font-bold text-2xl text-white">Developer Preparation Wiki</h2>
                  <p className="text-slate-400 text-xs mt-1">Tailored credentials, resume descriptions, and interview briefs.</p>
                </div>

                {/* Top Section: Quality & Resume */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Code Quality Gauge */}
                  <div className="md:col-span-1 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center bg-slate-950/20">
                    <span className="text-xs font-semibold text-slate-400 mb-4">Code Quality Rating</span>
                    
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="transparent" />
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="42" 
                          stroke="url(#purpleGradient)" 
                          strokeWidth="8" 
                          fill="transparent" 
                          strokeDasharray={2 * Math.PI * 42}
                          strokeDashoffset={2 * Math.PI * 42 * (1 - doc.codeQualityScore / 100)}
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      
                      <div className="absolute text-center">
                        <span className="font-display font-bold text-3xl text-white">{doc.codeQualityScore}</span>
                        <span className="text-[10px] text-slate-500 block">/ 100</span>
                      </div>
                    </div>

                    <span className="text-xs text-slate-500 mt-4 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-purple" />
                      Static Scan Rating
                    </span>
                  </div>

                  {/* Resume bullet points */}
                  <div className="md:col-span-2 border border-slate-800 rounded-xl p-5 bg-slate-950/20 space-y-3">
                    <span className="text-xs font-semibold text-slate-400 block">Resume bullet points (STAR Format)</span>
                    <div className="text-xs text-slate-300 leading-relaxed space-y-2">
                      <ReactMarkdown className="markdown-body">{doc.resumeProjectDescription}</ReactMarkdown>
                    </div>
                  </div>
                </div>

                {/* Expandable Interview accordion */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-brand-purple" />
                    Interview Preparation Q&As
                  </h3>

                  {qaList.length > 0 ? (
                    <div className="space-y-3">
                      {qaList.map((qa, index) => (
                        <AccordionItem 
                          key={index} 
                          question={qa.question} 
                          answer={qa.answer} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/10 text-xs text-slate-500">
                      <ReactMarkdown className="markdown-body">{doc.interviewQuestions}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* IMPROVEMENTS TAB */}
            {activeTab === 'improvements' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display font-bold text-2xl text-white">Suggested Technical Refactors</h2>
                  <p className="text-slate-400 text-xs mt-1">Security patches, codebase speedups, and layout suggestions.</p>
                </div>
                <div className="text-sm leading-relaxed text-slate-300 space-y-4">
                  <ReactMarkdown className="markdown-body">{doc.suggestedImprovements}</ReactMarkdown>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
