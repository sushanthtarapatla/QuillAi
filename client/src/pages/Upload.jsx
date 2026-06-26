import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Github, ArrowRight, FileCheck, HelpCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { api } from '../services/api';

export default function Upload() {
  const [activeTab, setActiveTab] = useState('zip');
  const [gitUrl, setGitUrl] = useState('');
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.zip')) {
        setFile(droppedFile);
        setError('');
      } else {
        setError('Only ZIP files are supported.');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.zip')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Only ZIP files are supported.');
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleGitSubmit = async (e) => {
    e.preventDefault();
    if (!gitUrl.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.cloneGit(gitUrl.trim());
      // Redirect to progress page
      navigate(`/progress/${res.projectId}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to initialize repository cloning.');
      setLoading(false);
    }
  };

  const handleZipSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.uploadZip(file, (progressEvent) => {
        // Track upload progress if needed
      });
      // Redirect to progress page
      navigate(`/progress/${res.projectId}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to upload ZIP file.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-3">
        <h1 className="font-display font-bold text-4xl tracking-tight text-white">Document Your Codebase</h1>
        <p className="text-slate-400 text-sm">Upload a ZIP file containing your project or provide a public GitHub URL to generate structured developer wikis.</p>
      </div>

      {/* Tabs Selector */}
      <div className="flex justify-center">
        <div className="bg-slate-900/60 p-1.5 rounded-2xl border border-white/5 flex gap-1">
          <button
            onClick={() => { setActiveTab('zip'); setError(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === 'zip' ? 'bg-brand-purple text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <UploadCloud className="w-4 h-4" />
            Upload ZIP File
          </button>
          
          <button
            onClick={() => { setActiveTab('github'); setError(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === 'github' ? 'bg-brand-purple text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Github className="w-4 h-4" />
            Public GitHub URL
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Upload Panels */}
      <GlassCard className="glow-border-purple shadow-brand-purple/5 max-w-2xl mx-auto">
        {activeTab === 'zip' ? (
          <form onSubmit={handleZipSubmit} className="space-y-6">
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`
                cursor-pointer border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all duration-200
                ${dragActive ? 'border-brand-purple bg-brand-purple/10' : 'border-slate-800 hover:border-slate-700 bg-slate-950/20'}
              `}
            >
              <input 
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {file ? (
                <div className="space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <FileCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200">{file.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <span className="inline-block text-xs text-brand-purple underline font-semibold mt-2">Click to replace file</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-brand-purple/10 border border-brand-purple/30 flex items-center justify-center">
                    <UploadCloud className="w-6 h-6 text-brand-purple" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200">Drag & Drop ZIP here</h3>
                    <p className="text-xs text-slate-500 mt-1">or click to browse your local filesystem</p>
                  </div>
                  <p className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Maximum zip size: 25 MB</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!file || loading}
              className={`
                w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200
                ${file && !loading
                  ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow-md shadow-brand-purple/15 hover:scale-[1.01] active:scale-[0.99] cursor-pointer' 
                  : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'}
              `}
            >
              {loading ? 'Processing Upload...' : 'Continue to Scan'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleGitSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-200">
                GitHub Repository Address
              </label>
              <div className="relative">
                <input 
                  type="text"
                  required
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-brand-purple transition-colors duration-200"
                />
                <Github className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Make sure the repository is public and is not empty.
              </p>
            </div>

            <button
              type="submit"
              disabled={!gitUrl.trim() || loading}
              className={`
                w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200
                ${gitUrl.trim() && !loading
                  ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow-md shadow-brand-purple/15 hover:scale-[1.01] active:scale-[0.99] cursor-pointer' 
                  : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'}
              `}
            >
              {loading ? 'Cloning Repository...' : 'Clone & Analyze'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </GlassCard>
    </div>
  );
}
