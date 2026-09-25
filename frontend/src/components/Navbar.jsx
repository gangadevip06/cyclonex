import React from 'react';
import { 
  Compass, 
  RefreshCw, 
  Sliders, 
  UploadCloud, 
  FileText, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  Radio, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export default function Navbar({
  basin,
  onBasinChange,
  scenarios,
  selectedScenarioId,
  onScenarioChange,
  isLiveMode,
  onToggleLiveMode,
  onRefresh,
  loading,
  onOpenWhatIf,
  onOpenUpload,
  onOpenBulletin,
  soundEnabled,
  onToggleSound,
  lastUpdated,
  activeAlertLevel
}) {
  return (
    <header className="border-b border-slate-800 bg-[#0f172a]/95 backdrop-blur sticky top-0 z-50 px-4 py-2.5">
      <div className="max-w-[1750px] mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand & SIH Hackathon Info */}
        <div className="flex items-center space-x-3.5">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Compass className="h-6 w-6 text-white animate-spin-slow" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                CYCLONEX
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                SIH26070
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                AI / ML Disaster Platform
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>North Indian Ocean Tropical Cyclone Early Warning System</span>
              <span className="text-slate-600">•</span>
              <span className="text-sky-400/90 font-mono">FastAPI + PyTorch CNN + XGBoost</span>
            </p>
          </div>
        </div>

        {/* Central Operations Ticker / Basin & Scenario Selectors */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Mode Switch: Live Real-Time vs Benchmark Scenarios */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => onToggleLiveMode(true)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded transition-all ${
                isLiveMode 
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className={`h-3.5 w-3.5 ${isLiveMode ? 'animate-pulse text-white' : 'text-slate-400'}`} />
              Live Telemetry
            </button>
            <button
              onClick={() => onToggleLiveMode(false)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded transition-all ${
                !isLiveMode 
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Benchmarks
            </button>
          </div>

          {/* Basin Selector (in Live Mode) */}
          {isLiveMode ? (
            <div className="flex items-center bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700/80 text-xs">
              <span className="text-slate-400 mr-2 font-medium">Basin:</span>
              <select
                value={basin}
                onChange={(e) => onBasinChange(e.target.value)}
                className="bg-transparent text-cyan-300 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="bay_of_bengal" className="bg-slate-900 text-slate-100">Bay of Bengal (BOB)</option>
                <option value="arabian_sea" className="bg-slate-900 text-slate-100">Arabian Sea (AS)</option>
              </select>
            </div>
          ) : (
            /* Historical Scenarios Dropdown */
            <div className="flex items-center bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700/80 text-xs">
              <span className="text-slate-400 mr-2 font-medium">Event:</span>
              <select
                value={selectedScenarioId}
                onChange={(e) => onScenarioChange(e.target.value)}
                className="bg-transparent text-purple-300 font-semibold focus:outline-none cursor-pointer max-w-[200px] truncate"
              >
                {scenarios.map((sc) => (
                  <option key={sc.id} value={sc.id} className="bg-slate-900 text-slate-100">
                    {sc.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sync Status Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Sync:</span>
            <span className="text-slate-200">{lastUpdated || 'Every 3 Hours'}</span>
          </div>

        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          
          {/* Refresh Live Data */}
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh Live Satellite & Meteorological Data"
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-sky-400' : 'text-slate-300'}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* What-If Simulator Toggle */}
          <button
            onClick={onOpenWhatIf}
            title="Interactive Physics Perturbation Simulator"
            className="flex items-center space-x-1.5 bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 shadow-sm shadow-indigo-500/10"
          >
            <Sliders className="h-3.5 w-3.5 text-indigo-400" />
            <span>What-If Lab</span>
          </button>

          {/* Upload Satellite Image */}
          <button
            onClick={onOpenUpload}
            title="Upload Custom Satellite Frame for CNN Inference"
            className="hidden sm:flex items-center space-x-1.5 bg-cyan-600/25 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 shadow-sm shadow-cyan-500/10"
          >
            <UploadCloud className="h-3.5 w-3.5 text-cyan-400" />
            <span>Upload Sat</span>
          </button>

          {/* IMD Bulletin Quick View */}
          <button
            onClick={onOpenBulletin}
            title="View Gemini Multi-Lingual IMD Operational Bulletin"
            className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition active:scale-95 shadow-md shadow-sky-600/20"
          >
            <FileText className="h-3.5 w-3.5 text-white" />
            <span>IMD Bulletin</span>
          </button>

          {/* Audio Voice Broadcast Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Emergency Voice Alerts Enabled' : 'Voice Alerts Muted'}
            className={`p-1.5 rounded-lg border text-xs transition ${
              soundEnabled 
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

        </div>

      </div>
    </header>
  );
}
