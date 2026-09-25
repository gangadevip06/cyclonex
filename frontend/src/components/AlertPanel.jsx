import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Globe, 
  Volume2, 
  Copy, 
  Check, 
  FileText, 
  AlertTriangle, 
  Waves, 
  Radio, 
  Printer 
} from 'lucide-react';

export default function AlertPanel({ advisories, intensityCategory, intensityCode, soundEnabled }) {
  const [selectedLang, setSelectedLang] = useState('english');
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!advisories) {
    return (
      <div className="glass-panel p-4 text-slate-400 text-xs flex items-center justify-center">
        No advisories generated yet.
      </div>
    );
  }

  // Map language keys
  const langMap = {
    english: { name: 'English', text: advisories.bulletin_english, voiceLang: 'en-IN' },
    hindi: { name: 'हिन्दी', text: advisories.bulletin_hindi, voiceLang: 'hi-IN' },
    tamil: { name: 'தமிழ்', text: advisories.bulletin_tamil, voiceLang: 'ta-IN' },
    telugu: { name: 'తెలుగు', text: advisories.bulletin_telugu, voiceLang: 'te-IN' },
    odia: { name: 'ଓଡ଼ିଆ', text: advisories.bulletin_odia, voiceLang: 'or-IN' },
    bengali: { name: 'বাংলা', text: advisories.bulletin_bengali, voiceLang: 'bn-IN' },
  };

  const activeBulletin = langMap[selectedLang]?.text || advisories.bulletin_english || 'No bulletin available.';

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(activeBulletin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Text-to-Speech voice broadcast using Web Speech API
  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-Speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(activeBulletin);
    utterance.lang = langMap[selectedLang]?.voiceLang || 'en-IN';
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className="glass-panel p-4 flex flex-col space-y-3">
      
      {/* Top Header: Title, Gemini Badge, Language Tabs */}
      <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="h-5 w-5 text-amber-400" />
          <div>
            <h2 className="text-sm font-bold tracking-wider text-slate-100 flex items-center gap-2">
              <span>IMD RSMC Tropical Cyclone Operational Bulletin</span>
              {advisories.gemini_assisted && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1 font-mono font-normal">
                  <Radio className="h-3 w-3 text-sky-400 animate-pulse" />
                  Google Gemini 2.5 Multi-Lingual AI
                </span>
              )}
            </h2>
            <div className="text-[11px] text-slate-400">
              Stage: <span className="font-semibold text-amber-400">{advisories.cyclone_stage || intensityCategory}</span> • Landfall: <span className="text-white font-medium">{advisories.landfall_timeline || 'Under continuous surveillance'}</span>
            </div>
          </div>
        </div>

        {/* 6 Regional Language Switcher */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-800 flex-wrap gap-1">
          {Object.entries(langMap).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setSelectedLang(key)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                selectedLang === key 
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/40' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Advisory Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* Left: Official IMD Bulletin Dispatches (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          <div className="relative bg-slate-950/80 rounded-lg border border-slate-800 p-3.5 flex-1 min-h-[220px]">
            
            {/* Header controls inside bulletin */}
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 mb-2 border-b border-slate-800/80">
              <span className="font-mono text-[10px] text-sky-400">
                DISPATCH TIME: {advisories.generated_at || 'LIVE'}
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={handleSpeak}
                  title="Broadcast Voice Alert"
                  className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium border transition ${
                    isSpeaking 
                      ? 'bg-rose-500 text-white border-rose-400 animate-pulse' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  <span>{isSpeaking ? 'Stop Audio' : 'Voice Broadcast'}</span>
                </button>

                <button
                  onClick={handleCopy}
                  title="Copy Bulletin to Clipboard"
                  className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[11px] font-medium transition"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Official Bulletin Text */}
            <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[240px] overflow-y-auto pr-2 selection:bg-sky-500 selection:text-white">
              {activeBulletin}
            </pre>
          </div>

          {/* Plain-Language Explainability for Non-Technical Emergency Responders */}
          {advisories.plain_language_xai && (
            <div className="mt-2.5 bg-gradient-to-r from-sky-950/40 to-indigo-950/40 border border-sky-500/30 rounded-lg p-2.5 text-xs">
              <div className="font-bold text-sky-300 mb-1 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-sky-400" />
                <span>Plain-Language Summary for District Emergency Response:</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {advisories.plain_language_xai}
              </p>
            </div>
          )}
        </div>

        {/* Right: District Evacuation Directives & Coastal Sea Condition (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-2.5">
          
          {/* Evacuation Directives */}
          <div className="bg-slate-900/70 rounded-lg border border-amber-500/40 p-3 flex-1">
            <div className="font-bold text-xs text-amber-300 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>District Evacuation Directives:</span>
            </div>
            
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              {advisories.evacuation_directives && advisories.evacuation_directives.length > 0 ? (
                advisories.evacuation_directives.map((dir, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold shrink-0">•</span>
                    <span>{dir}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>Activate cyclone shelters across low-lying coastal blocks.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>Deploy NDRF & SDRF pre-position teams along vulnerable sectors.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>Stock emergency medical supplies, water purification, and gensets.</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Sea Condition & Marine Warning */}
          <div className="bg-slate-900/70 rounded-lg border border-rose-500/40 p-3">
            <div className="font-bold text-xs text-rose-300 mb-1.5 flex items-center gap-1.5">
              <Waves className="h-4 w-4 text-rose-400" />
              <span>Fishermen & Port Marine Warning:</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-normal">
              Sea condition: <strong className="text-rose-400">VERY ROUGH TO PHENOMENAL</strong>. Total suspension of all deep-sea fishing operations. Ports advised to hoist Local Cautionary Signal LC-III.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
