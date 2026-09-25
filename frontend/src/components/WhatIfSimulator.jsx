import React, { useState } from 'react';
import { 
  Sliders, 
  X, 
  RotateCcw, 
  Play, 
  Flame, 
  Wind, 
  Zap, 
  Compass, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export default function WhatIfSimulator({
  isOpen,
  onClose,
  basin,
  currentPosition,
  baseTelemetry,
  onSimulate,
  loading
}) {
  const [sstDelta, setSstDelta] = useState(1.5);
  const [shearDelta, setShearDelta] = useState(-5.0);
  const [vorticityDelta, setVorticityDelta] = useState(0.4);
  const [capeDelta, setCapeDelta] = useState(400);

  if (!isOpen) return null;

  // Presets
  const applyPreset = (type) => {
    switch (type) {
      case 'warming':
        setSstDelta(2.0);
        setShearDelta(-4.0);
        setVorticityDelta(0.5);
        setCapeDelta(600);
        break;
      case 'shear':
        setSstDelta(-0.5);
        setShearDelta(15.0);
        setVorticityDelta(-0.4);
        setCapeDelta(-400);
        break;
      case 'explosive':
        setSstDelta(2.5);
        setShearDelta(-8.0);
        setVorticityDelta(0.8);
        setCapeDelta(1200);
        break;
      case 'reset':
      default:
        setSstDelta(0.0);
        setShearDelta(0.0);
        setVorticityDelta(0.0);
        setCapeDelta(0);
        break;
    }
  };

  const handleRun = () => {
    const payload = {
      basin: basin || 'bay_of_bengal',
      lat: currentPosition?.lat ?? 12.5,
      lon: currentPosition?.lon ?? 86.0,
      sst_delta: parseFloat(sstDelta),
      shear_delta: parseFloat(shearDelta),
      vorticity_delta: parseFloat(vorticityDelta),
      cape_delta: parseFloat(capeDelta),
    };
    onSimulate(payload);
  };

  // Preview recalculated parameters
  const curSst = baseTelemetry?.sst ?? 30.0;
  const newSst = (curSst + sstDelta).toFixed(1);

  const curShear = baseTelemetry?.wind_shear ?? 12.0;
  const newShear = Math.max(3.0, curShear + shearDelta).toFixed(1);

  const curVort = baseTelemetry?.vorticity ?? 1.2;
  const newVort = Math.max(0.1, curVort + vorticityDelta).toFixed(2);

  const curCape = baseTelemetry?.cape ?? 1200;
  const newCape = Math.max(200, Math.round(curCape + capeDelta));

  // Emanuel MPI preview estimate: V_max ~ 16 * sqrt(SST - 26) + ...
  const mpiEstimate = Math.round(Math.min(160, Math.max(45, 65.0 + (newSst - 26.5) * 16.0 - Math.max(0, newShear - 15) * 2.2)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-indigo-500/50 rounded-xl shadow-2xl max-w-2xl w-full p-5 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Interactive Physics Perturbation Simulator ("What-If" Analysis)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Perturb atmospheric & oceanic variables to observe real-time Multimodal AI response under thermodynamic constraints.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
            Scenario Quick Presets:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              onClick={() => applyPreset('warming')}
              className="bg-slate-800/80 hover:bg-slate-700/80 border border-rose-500/30 text-rose-300 p-2 rounded-lg text-left transition"
            >
              <div className="font-bold flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-rose-400" />
                <span>Ocean Warming</span>
              </div>
              <span className="text-[10px] text-slate-400">+2.0°C SST Warm</span>
            </button>

            <button
              onClick={() => applyPreset('shear')}
              className="bg-slate-800/80 hover:bg-slate-700/80 border border-indigo-500/30 text-indigo-300 p-2 rounded-lg text-left transition"
            >
              <div className="font-bold flex items-center gap-1">
                <Wind className="h-3.5 w-3.5 text-indigo-400" />
                <span>Shear Venting</span>
              </div>
              <span className="text-[10px] text-slate-400">+15 kt Hostile Shear</span>
            </button>

            <button
              onClick={() => applyPreset('explosive')}
              className="bg-slate-800/80 hover:bg-slate-700/80 border border-amber-500/30 text-amber-300 p-2 rounded-lg text-left transition"
            >
              <div className="font-bold flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Explosive RI</span>
              </div>
              <span className="text-[10px] text-slate-400">Extreme Convection</span>
            </button>

            <button
              onClick={() => applyPreset('reset')}
              className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 p-2 rounded-lg text-left transition"
            >
              <div className="font-bold flex items-center gap-1">
                <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                <span>Baseline</span>
              </div>
              <span className="text-[10px] text-slate-400">Reset to Live</span>
            </button>
          </div>
        </div>

        {/* 4 Interactive Sliders */}
        <div className="space-y-3.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          
          {/* Slider 1: Sea Surface Temperature (SST) */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-semibold text-slate-200 flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-rose-400" />
                <span>Sea Surface Temperature Perturbation (ΔSST):</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-[11px]">Base: {curSst.toFixed(1)}°C</span>
                <span className="font-mono font-bold text-rose-400 text-xs">
                  {sstDelta >= 0 ? `+${sstDelta.toFixed(1)}` : sstDelta.toFixed(1)}°C ➔ {newSst}°C
                </span>
              </div>
            </div>
            <input
              type="range"
              min="-3.0"
              max="3.0"
              step="0.1"
              value={sstDelta}
              onChange={(e) => setSstDelta(parseFloat(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Slider 2: Vertical Wind Shear */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-semibold text-slate-200 flex items-center gap-1">
                <Wind className="h-3.5 w-3.5 text-indigo-400" />
                <span>Deep Vertical Wind Shear Perturbation (ΔShear):</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-[11px]">Base: {curShear.toFixed(1)} kt</span>
                <span className="font-mono font-bold text-indigo-400 text-xs">
                  {shearDelta >= 0 ? `+${shearDelta.toFixed(1)}` : shearDelta.toFixed(1)} kt ➔ {newShear} kt
                </span>
              </div>
            </div>
            <input
              type="range"
              min="-15.0"
              max="20.0"
              step="0.5"
              value={shearDelta}
              onChange={(e) => setShearDelta(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Slider 3: 850 hPa Relative Vorticity */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-semibold text-slate-200 flex items-center gap-1">
                <Compass className="h-3.5 w-3.5 text-cyan-400" />
                <span>Low-Level Vorticity Perturbation (ΔVorticity):</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-[11px]">Base: {curVort.toFixed(2)}</span>
                <span className="font-mono font-bold text-cyan-400 text-xs">
                  {vorticityDelta >= 0 ? `+${vorticityDelta.toFixed(2)}` : vorticityDelta.toFixed(2)} ➔ {newVort}
                </span>
              </div>
            </div>
            <input
              type="range"
              min="-1.0"
              max="1.0"
              step="0.05"
              value={vorticityDelta}
              onChange={(e) => setVorticityDelta(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Slider 4: CAPE */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-semibold text-slate-200 flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Convective Potential Energy Perturbation (ΔCAPE):</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-[11px]">Base: {Math.round(curCape)} J/kg</span>
                <span className="font-mono font-bold text-amber-400 text-xs">
                  {capeDelta >= 0 ? `+${capeDelta}` : capeDelta} ➔ {newCape} J/kg
                </span>
              </div>
            </div>
            <input
              type="range"
              min="-1000"
              max="1500"
              step="50"
              value={capeDelta}
              onChange={(e) => setCapeDelta(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

        </div>

        {/* Physics Constraints Guidance Box */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Emanuel Maximum Potential Intensity (MPI) Limit:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">~{mpiEstimate} kt (Thermodynamic Ceiling)</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">Coriolis Gating Status:</span>
            <span className="font-mono font-bold text-sky-400">f &gt; 5.0°N Active</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleRun}
            disabled={loading}
            className="flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-600 hover:from-indigo-500 hover:to-sky-500 transition shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50"
          >
            <Play className={`h-4 w-4 fill-white ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Re-Running Multimodal AI...' : 'Execute What-If Inference'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
