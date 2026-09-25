import React, { useState } from 'react';
import { 
  Database, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  GitMerge
} from 'lucide-react';

export default function DataStatusIndicator({ systemStatus }) {
  const [showPipeline, setShowPipeline] = useState(false);

  return (
    <div className="glass-panel p-2.5 flex flex-col gap-2 border border-slate-800 text-xs">
      
      {/* Top Row: Data Status & Model Status Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* DATA STATUS SECTION */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
            <Database className="h-3.5 w-3.5 text-sky-400" />
            DATA STATUS:
          </span>
          
          {/* INSAT Badge */}
          <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700/80 text-[11px]">
            <span className="text-slate-400">INSAT:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
              <CheckCircle2 className="h-3 w-3" /> Loaded (4 Channels)
            </span>
          </div>

          {/* ERA5 Badge */}
          <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700/80 text-[11px]">
            <span className="text-slate-400">ERA5:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
              <CheckCircle2 className="h-3 w-3" /> Loaded (Atmospheric Profile)
            </span>
          </div>

          {/* IBTrACS Badge */}
          <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700/80 text-[11px]">
            <span className="text-slate-400">IBTrACS:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
              <CheckCircle2 className="h-3 w-3" /> Loaded (4,013 Records)
            </span>
          </div>
        </div>

        {/* MODEL STATUS SECTION */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
            <Cpu className="h-3.5 w-3.5 text-indigo-400" />
            MODEL STATUS:
          </span>

          {/* CNN Badge */}
          <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700/80 text-[11px]">
            <span className="text-slate-400">CNN:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
              <CheckCircle2 className="h-3 w-3" /> Ready
            </span>
          </div>

          {/* XGBoost Badge */}
          <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700/80 text-[11px]">
            <span className="text-slate-400">XGBoost:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
              <CheckCircle2 className="h-3 w-3" /> Ready
            </span>
          </div>

          {/* LSTM Badge */}
          <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700/80 text-[11px]">
            <span className="text-slate-400">LSTM:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
              <CheckCircle2 className="h-3 w-3" /> Ready
            </span>
          </div>

          {/* Pipeline Details Toggle Button */}
          <button
            onClick={() => setShowPipeline(!showPipeline)}
            className="flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 bg-sky-950/40 hover:bg-sky-900/50 px-2 py-0.5 rounded border border-sky-800/50 transition-all ml-1"
          >
            <GitMerge className="h-3 w-3" />
            <span>Technical Pipeline Flow</span>
            {showPipeline ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

      </div>

      {/* Expandable Model Technical Pipeline Flow Diagram */}
      {showPipeline && (
        <div className="mt-2 pt-2 border-t border-slate-800/80 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60 text-[11px]">
            <span className="font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Technical AI Model & Atmospheric Data Pipeline Flow
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Scientific Pipeline Architecture
            </span>
          </div>

          {/* 3 Parallel Streams merging into Feature Fusion */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center text-xs">
            
            {/* Stream 1: INSAT */}
            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-sky-900/40 flex flex-col items-center">
              <div className="font-mono font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/60">
                INSAT-3D Imagery
              </div>
              <div className="text-slate-500 my-1 font-mono">↓</div>
              <div className="font-bold text-white bg-slate-800 px-2 py-1 rounded border border-emerald-500/50 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                PyTorch CNN (Ready)
              </div>
              <div className="text-slate-500 my-1 font-mono">↓</div>
              <div className="text-[11px] text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Spatial Cloud Features (CDO, Spirals)
              </div>
            </div>

            {/* Stream 2: ERA5 */}
            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-emerald-900/40 flex flex-col items-center">
              <div className="font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                ERA5 Atmospheric
              </div>
              <div className="text-slate-500 my-1 font-mono">↓</div>
              <div className="font-bold text-white bg-slate-800 px-2 py-1 rounded border border-emerald-500/50 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                XGBoost (Ready)
              </div>
              <div className="text-slate-500 my-1 font-mono">↓</div>
              <div className="text-[11px] text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Environmental Features (SST, Shear)
              </div>
            </div>

            {/* Stream 3: Temporal Sequence */}
            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-purple-900/40 flex flex-col items-center">
              <div className="font-mono font-bold text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/60">
                Temporal Sequence
              </div>
              <div className="text-slate-500 my-1 font-mono">↓</div>
              <div className="font-bold text-white bg-slate-800 px-2 py-1 rounded border border-emerald-500/50 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                LSTM Forecaster (Ready)
              </div>
              <div className="text-slate-500 my-1 font-mono">↓</div>
              <div className="text-[11px] text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Cloud Evolution / Movement
              </div>
            </div>

          </div>

          {/* Fusion and Cyclone Assessment */}
          <div className="mt-3 flex flex-col items-center">
            <div className="text-slate-500 font-mono text-sm">↓</div>
            <div className="bg-indigo-950/60 border border-indigo-500/50 px-4 py-1.5 rounded-md font-bold text-indigo-200 text-xs tracking-wider uppercase">
              FEATURE FUSION (Physics Constraints + Emanuel MPI)
            </div>
            <div className="text-slate-500 font-mono text-sm my-0.5">↓</div>
            <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-sky-500/60 px-5 py-1.5 rounded-md font-extrabold text-white text-xs tracking-widest uppercase shadow-md shadow-sky-950/60">
              CYCLONE ASSESSMENT & 120-HOUR TRAJECTORY
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
