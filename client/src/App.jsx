import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Progress from './pages/Progress';
import Documentation from './pages/Documentation';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        {/* Navigation Bar */}
        <Navbar />

        {/* Page Content Container */}
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/progress/:id" element={<Progress />} />
            <Route path="/documentation/:id" element={<Documentation />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <footer className="py-6 border-t border-white/5 text-center text-xs text-slate-600">
          <div>Project Quill AI — Intelligent Project Documentation Generator</div>
          <div className="mt-1">Powered by Google Gemini API & Mongoose</div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
