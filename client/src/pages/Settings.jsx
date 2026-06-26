import React, { useState, useEffect } from 'react';
import { Save, ShieldAlert, CheckCircle2, Server, Key, Brain } from 'lucide-react';
import GlassCard from '../components/GlassCard';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('gemini-1.5-flash');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('quill_gemini_api_key') || '';
    const savedModel = localStorage.getItem('quill_gemini_model') || 'gemini-3.5-flash';
    setApiKey(savedKey);
    setModelName(savedModel);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('quill_gemini_api_key', apiKey.trim());
    localStorage.setItem('quill_gemini_model', modelName);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="font-display font-bold text-3xl tracking-tight text-white">Application Settings</h1>
        <p className="text-slate-400 text-sm mt-2">Configure your Gemini API settings and model parameters.</p>
      </div>

      <GlassCard className="glow-border-purple shadow-brand-purple/5">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-violet-500/5 border border-brand-purple/20">
            <ShieldAlert className="w-6 h-6 text-brand-purple shrink-0 mt-0.5" />
            <div className="text-sm text-slate-300">
              <span className="font-semibold text-white">API Key Security Notice:</span> Your API Key is stored only in your local browser storage (<code className="text-brand-purple">localStorage</code>) and is sent in request payloads to compile documentation. It is never logged or exposed.
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-brand-purple" />
              Google Gemini API Key
            </label>
            <input 
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..." 
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-brand-purple transition-colors duration-200"
            />
            <p className="text-xs text-slate-500">
              If left blank, the application will default to the server's backend <code className="text-slate-400">.env</code> API configuration.
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Brain className="w-4 h-4 text-brand-purple" />
              Gemini Model Version
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                onClick={() => setModelName('gemini-3.5-flash')}
                className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 ${modelName === 'gemini-3.5-flash' ? 'border-brand-purple bg-brand-purple/5' : 'border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">gemini-3.5-flash</span>
                  {modelName === 'gemini-3.5-flash' && <CheckCircle2 className="w-4 h-4 text-brand-purple" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Recommended. Standard preview, fast response rates, fully structured JSON.</p>
              </div>

              <div 
                onClick={() => setModelName('gemini-2.5-flash')}
                className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 ${modelName === 'gemini-2.5-flash' ? 'border-brand-purple bg-brand-purple/5' : 'border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">gemini-2.5-flash</span>
                  {modelName === 'gemini-2.5-flash' && <CheckCircle2 className="w-4 h-4 text-brand-purple" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Legacy Flash. Wide availability, stable responses, highly structured.</p>
              </div>

              <div 
                onClick={() => setModelName('gemini-pro-latest')}
                className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 ${modelName === 'gemini-pro-latest' ? 'border-brand-purple bg-brand-purple/5' : 'border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">gemini-pro-latest</span>
                  {modelName === 'gemini-pro-latest' && <CheckCircle2 className="w-4 h-4 text-brand-purple" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Pro Reasoner. Deep structure analysis and comprehensive writeups.</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Server className="w-4 h-4 text-slate-500" />
              <span>Backend Status: <strong>Online</strong> (Fallback Mode)</span>
            </div>
            
            <button 
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-indigo to-brand-purple text-white text-sm font-semibold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md shadow-brand-purple/10"
            >
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
          </div>
        </form>
      </GlassCard>

      {saved && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-emerald-500 text-white font-semibold px-4 py-3 rounded-xl shadow-lg shadow-emerald-500/20 text-sm animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          Settings saved successfully!
        </div>
      )}
    </div>
  );
}
