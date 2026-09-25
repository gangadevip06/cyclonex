import React, { useState } from 'react';
import { 
  Eye, 
  Layers, 
  Sliders, 
  BarChart3, 
  Sparkles, 
  Info, 
  Crosshair, 
  Cpu 
} from 'lucide-react';

export default function XAISection({
  satelliteFrame,
  gradcamFrame,
  gradcamHotspot,
  satelliteMetrics,
  shapContributors,
  multimodalWeights
}) {
  const [opacity, setOpacity] = useState(0.70);
  const [blendMode, setBlendMode] = useState('screen');
  const [viewMode, setViewMode] = useState('blended'); // 'blended' | 'gradcam' | 'satellite'

  // Satellite Metrics fallbacks
  const sm = satelliteMetrics || {
    min_cloud_temp_c: -74.2,
    cold_cloud_fraction: 42.5,
    cdo_compactness: 0.78,
    spiral_organization: 0.82,
    dvorak_t_number: 3.5,
    satellite_derived_wind_kt: 35.0,
    channel: 'TIR-1 (10.8 µm)'
  };

  // SHAP items fallbacks
  const contributors = shapContributors && shapContributors.length > 0 ? shapContributors : [
    { feature: 'sst', feature_name: 'Sea Surface Temperature', value: 30.2, impact: 28.5, direction: 'amplifying', unit: '°C', description: 'Thermal ocean reservoir fuel' },
    { feature: 'mslp_deficit', feature_name: 'MSLP Pressure Deficit', value: 8.5, impact: 22.0, direction: 'amplifying', unit: 'hPa', description: 'Surface converging low pressure' },
    { feature: 'vorticity', feature_name: '850hPa Relative Vorticity', value: 1.25, impact: 18.0, direction: 'amplifying', unit: '10⁻⁵ s⁻¹', description: 'Low-level cyclonic rotation spin' },
    { feature: 'cape', feature_name: 'Atmospheric CAPE', value: 1350, impact: 14.5, direction: 'amplifying', unit: 'J/kg', description: 'Convective buoyant updrafts' },
    { feature: 'wind_shear', feature_name: 'Deep Vertical Wind Shear', value: 12.0, impact: -9.5, direction: 'inhibiting', unit: 'kt', description: 'Moderate shear venting core' },
    { feature: 'rh_700', feature_name: '700hPa Mid-Level RH', value: 72, impact: 7.0, direction: 'amplifying', unit: '%', description: 'Mid-troposphere moist layer' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
      
      {/* LEFT: INSAT-3D Satellite & PyTorch Grad-CAM Viewer (7 Cols) */}
      <div className="lg:col-span-7 glass-panel p-3 flex flex-col justify-between">
        
        {/* Header with View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between pb-2 mb-2 border-b border-slate-800 gap-2">
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-rose-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              INSAT-3D Satellite & PyTorch Grad-CAM
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
              Magma Eyewall Attention
            </span>
          </div>

          {/* View Mode Buttons */}
          <div className="flex items-center bg-slate-900/90 p-0.5 rounded-lg border border-slate-700 text-[11px]">
            <button
              onClick={() => setViewMode('blended')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                viewMode === 'blended' ? 'bg-rose-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Blended
            </button>
            <button
              onClick={() => setViewMode('gradcam')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                viewMode === 'gradcam' ? 'bg-rose-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Grad-CAM Only
            </button>
            <button
              onClick={() => setViewMode('satellite')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                viewMode === 'satellite' ? 'bg-rose-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Raw IR
            </button>
          </div>
        </div>

        {/* Satellite + Grad-CAM Viewport */}
        <div className="relative aspect-video sm:aspect-square max-h-[380px] w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center group">
          
          {/* Base Layer: Raw Satellite Thermal IR */}
          {satelliteFrame ? (
            <img
              src={satelliteFrame}
              alt="INSAT-3D Thermal IR Satellite"
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                viewMode === 'gradcam' ? 'opacity-0' : 'opacity-100'
              }`}
            />
          ) : (
            <div className="text-slate-500 text-xs">Waiting for satellite telemetry frame...</div>
          )}

          {/* Overlay Layer: Grad-CAM Neural Attention Heatmap */}
          {gradcamFrame && viewMode !== 'satellite' && (
            <img
              src={gradcamFrame}
              alt="PyTorch Grad-CAM Attention Heatmap"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300"
              style={{
                opacity: viewMode === 'gradcam' ? 1.0 : opacity,
                mixBlendMode: viewMode === 'gradcam' ? 'normal' : blendMode,
              }}
            />
          )}

          {/* Attention Hotspot Target Overlay */}
          {gradcamHotspot && (
            <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded border border-rose-500/50 text-[10px] text-rose-300 flex items-center gap-1.5 shadow-lg">
              <Crosshair className="h-3.5 w-3.5 text-rose-400 animate-spin-slow" />
              <span>Convective Focus: <strong>{gradcamHotspot.convective_feature || 'Eyewall & Feeder Bands'}</strong></span>
            </div>
          )}

          {/* Channel Watermark */}
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur px-2 py-0.5 rounded text-[10px] text-slate-300 font-mono">
            {sm.channel} • INSAT-3D / NASA GIBS
          </div>

        </div>

        {/* Opacity & Blend Mode Interactive Controls */}
        {viewMode === 'blended' && (
          <div className="mt-3 pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
              <span className="text-slate-400 font-medium">Grad-CAM Opacity:</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="flex-1 accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <span className="font-mono text-rose-300 w-10 text-right">{Math.round(opacity * 100)}%</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Blend:</span>
              <select
                value={blendMode}
                onChange={(e) => setBlendMode(e.target.value)}
                className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none cursor-pointer"
              >
                <option value="screen">Screen (Bright)</option>
                <option value="multiply">Multiply (Darken)</option>
                <option value="normal">Normal Overlay</option>
                <option value="overlay">Vivid Contrast</option>
              </select>
            </div>
          </div>
        )}

        {/* Satellite Cloud Features Bar */}
        <div className="mt-2.5 grid grid-cols-3 sm:grid-cols-6 gap-2 text-[10px] border-t border-slate-800/80 pt-2">
          <div className="bg-slate-900/60 p-1.5 rounded">
            <span className="text-slate-400 block">Min Cloud Top</span>
            <span className="font-mono font-bold text-cyan-300">{sm.min_cloud_temp_c}°C</span>
          </div>
          <div className="bg-slate-900/60 p-1.5 rounded">
            <span className="text-slate-400 block">Cold Cloud Area</span>
            <span className="font-mono font-bold text-white">{sm.cold_cloud_fraction}%</span>
          </div>
          <div className="bg-slate-900/60 p-1.5 rounded">
            <span className="text-slate-400 block">CDO Compactness</span>
            <span className="font-mono font-bold text-amber-300">{(sm.cdo_compactness * 100).toFixed(0)}%</span>
          </div>
          <div className="bg-slate-900/60 p-1.5 rounded">
            <span className="text-slate-400 block">Spiral Curvature</span>
            <span className="font-mono font-bold text-emerald-300">{(sm.spiral_organization * 100).toFixed(0)}%</span>
          </div>
          <div className="bg-slate-900/60 p-1.5 rounded">
            <span className="text-slate-400 block">Dvorak T-Number</span>
            <span className="font-mono font-bold text-purple-300">T{sm.dvorak_t_number.toFixed(1)}</span>
          </div>
          <div className="bg-slate-900/60 p-1.5 rounded">
            <span className="text-slate-400 block">Sat-Derived Wind</span>
            <span className="font-mono font-bold text-sky-400">{sm.satellite_derived_wind_kt} kt</span>
          </div>
        </div>

      </div>

      {/* RIGHT: SHAP Feature Attribution (5 Cols) */}
      <div className="lg:col-span-5 glass-panel p-3 flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              SHAP Quantitative Feature Attribution
            </h2>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
            TreeExplainer
          </span>
        </div>

        {/* Explainability Intro */}
        <div className="text-[11px] text-slate-400 mb-2 flex items-start gap-1.5 bg-slate-900/50 p-2 rounded border border-slate-800">
          <Info className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
          <span>
            Exact SHAP value push against climatological baseline: <span className="text-rose-400 font-bold">Amplifying</span> vs <span className="text-emerald-400 font-bold">Inhibiting</span> tropical cyclogenesis.
          </span>
        </div>

        {/* SHAP Horizontal Bars */}
        <div className="space-y-2.5 flex-1 flex flex-col justify-around my-1">
          {contributors.map((item, idx) => {
            const isPositive = item.impact >= 0;
            const barWidth = Math.min(100, Math.abs(item.impact) * 2.8);

            return (
              <div key={idx} className="group">
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="font-semibold text-slate-200 group-hover:text-sky-300 transition">
                    {item.feature_name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-mono">
                      {item.value} {item.unit}
                    </span>
                    <span className={`font-mono font-bold text-[11px] ${
                      isPositive ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {isPositive ? `+${item.impact.toFixed(1)}%` : `${item.impact.toFixed(1)}%`}
                    </span>
                  </div>
                </div>

                {/* Split Center Bar */}
                <div className="relative h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  {/* Left half (inhibiting) */}
                  <div className="w-1/2 flex justify-end">
                    {!isPositive && (
                      <div
                        className="h-full bg-emerald-400 rounded-l-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    )}
                  </div>
                  {/* Center Divider */}
                  <div className="w-[2px] h-full bg-slate-600 z-10"></div>
                  {/* Right half (amplifying) */}
                  <div className="w-1/2 flex justify-start">
                    {isPositive && (
                      <div
                        className="h-full bg-rose-500 rounded-r-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  {item.description}
                </div>
              </div>
            );
          })}
        </div>

        {/* Multimodal Fusion Weights */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Multimodal Fusion:</span>
          <div className="flex items-center gap-2">
            <span className="text-rose-300 font-mono">
              Sat CNN: {multimodalWeights?.satellite_visual || 45}%
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-sky-300 font-mono">
              Env XGBoost: {multimodalWeights?.environmental_reanalysis || 55}%
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
