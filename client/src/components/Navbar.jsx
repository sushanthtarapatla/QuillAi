import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Feather, History, Settings, PlusCircle, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) => `
    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
    ${isActive(path) 
      ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30 glow-text' 
      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'}
  `;

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="bg-gradient-to-tr from-brand-indigo to-brand-purple p-2 rounded-xl shadow-lg shadow-brand-purple/20 group-hover:scale-105 transition-transform duration-200">
          <Feather className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-brand-purple transition-colors duration-200">
            Quill <span className="bg-gradient-to-r from-brand-indigo to-brand-purple bg-clip-text text-transparent">AI</span>
          </span>
          <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
            v1.0
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-2 md:gap-4">
        <Link to="/" className={linkClass('/')}>
          <LayoutDashboard className="w-4 h-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
        
        <Link to="/upload" className={linkClass('/upload')}>
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline font-semibold">New Project</span>
        </Link>

        <Link to="/settings" className={linkClass('/settings')}>
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Settings</span>
        </Link>
      </div>
    </nav>
  );
}
