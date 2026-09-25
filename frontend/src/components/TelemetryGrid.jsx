import React from 'react';
import { 
  Thermometer, 
  Gauge, 
  Wind, 
  ArrowDownUp, 
  RotateCw, 
  Zap, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';

export default function TelemetryGrid({ telemetry, intensityCategory, intensityCode }) {
  if (!telemetry) return null;

  // 1. SST Evaluation
  const sst = telemetry.sst ?? 30.0;
  const sstOptimal = sst >= 28.0;
  const sstWarning = sst >= 26.5;

  // 2. CAPE Evaluation
  const cape = telemetry.cape ?? 1200;
  const capeHigh = cape > 1500;
  const capeMod = cape >= 800;

  // 3. Vorticity Evaluation
  const vort = telemetry.vorticity ?? 1.2;
  const vortHigh = vort >= 1.5;
  const vortFavorable = vort >= 0.8;

  // 4. Wind Shear Evaluation (Lower is better for cyclogenesis!)
  const shear = telemetry.wind_shear ?? 12.0;
  const shearFavorable = shear < 15.0;
  const shearModerate = shear <= 22.0;

  // 5. MSLP Deficit Evaluation
  const deficit = telemetry.mslp_deficit ?? 8.5;
  const pressure = telemetry.surface_pressure ?? 1005.0;

  // 6. Surface Wind
  const windKt = telemetry.wind_speed_10m ?? 35.0;
  const windKmh = Math.round(windKt * 1.852);

  return (
    <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      
      {/* Metric 1: Sea Surface Temperature */}
      <div className="glass-panel p-3 relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] uppercase tracking-wider font-semibold">Sea Surface Temp</span>
          <Thermometer className="h-4 w-4 text-rose-400 group-hover:scale-110 transition" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold mono-font text-white">{sst.toFixed(1)}°C</span>
          <span className="text-[10px] text-slate-400 font-mono">SST</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
            sstOptimal 
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
              : sstWarning 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : 'bg-slate-700/40 text-slate-300 border-slate-600'
          }`}>
            {sstOptimal ? 'Extreme Thermal Fuel' : sstWarning ? 'Favorable (>26.5°C)' : 'Marginal'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">MPI Ref</span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-slate-800 h-1 mt-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full"
            style={{ width: `${Math.min(100, Math.max(10, ((sst - 24) / 8) * 100))}%` }}
          />
        </div>
      </div>

      {/* Metric 2: Atmospheric CAPE */}
      <div className="glass-panel p-3 relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] uppercase tracking-wider font-semibold">CAPE Convection</span>
          <Zap className="h-4 w-4 text-amber-400 group-hover:scale-110 transition" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold mono-font text-white">{Math.round(cape)}</span>
          <span className="text-[10px] text-slate-400 font-mono">J/kg</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
            capeHigh 
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
              : capeMod 
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' 
                : 'bg-slate-700/40 text-slate-300 border-slate-600'
          }`}>
            {capeHigh ? 'Vigorous Updrafts' : capeMod ? 'Moderate Unstable' : 'Weak Convection'}
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1 mt-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-sky-400 to-amber-400 h-full rounded-full"
            style={{ width: `${Math.min(100, Math.max(10, (cape / 3000) * 100))}%` }}
          />
        </div>
      </div>

      {/* Metric 3: Low-Level Vorticity (850 hPa) */}
      <div className="glass-panel p-3 relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] uppercase tracking-wider font-semibold">850hPa Vorticity</span>
          <RotateCw className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold mono-font text-white">{vort.toFixed(2)}</span>
          <span className="text-[10px] text-slate-400 font-mono">10⁻⁵ s⁻¹</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
            vortHigh 
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
              : vortFavorable 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-slate-700/40 text-slate-300 border-slate-600'
          }`}>
            {vortHigh ? 'Strong Cyclonic Spin' : vortFavorable ? 'Organized Vortex' : 'Weak Spin'}
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1 mt-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full rounded-full"
            style={{ width: `${Math.min(100, Math.max(10, (vort / 2.5) * 100))}%` }}
          />
        </div>
      </div>

      {/* Metric 4: Vertical Wind Shear */}
      <div className="glass-panel p-3 relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] uppercase tracking-wider font-semibold">200-850hPa Shear</span>
          <ArrowDownUp className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold mono-font text-white">{shear.toFixed(1)}</span>
          <span className="text-[10px] text-slate-400 font-mono">kt</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
            shearFavorable 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
              : shearModerate 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
          }`}>
            {shearFavorable ? 'Low Shear (<15 kt)' : shearModerate ? 'Moderate Shear' : 'Hostile (>22 kt)'}
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1 mt-2.5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${
              shearFavorable ? 'bg-emerald-400' : shearModerate ? 'bg-amber-400' : 'bg-rose-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(10, (shear / 35) * 100))}%` }}
          />
        </div>
      </div>

      {/* Metric 5: Surface Pressure & Deficit */}
      <div className="glass-panel p-3 relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] uppercase tracking-wider font-semibold">Central Pressure</span>
          <Gauge className="h-4 w-4 text-purple-400 group-hover:scale-110 transition" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold mono-font text-white">{pressure.toFixed(1)}</span>
          <span className="text-[10px] text-slate-400 font-mono">hPa</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-purple-500/20 text-purple-300 border border-purple-500/40">
            ΔP: -{deficit.toFixed(1)} hPa
          </span>
          <span className="text-[10px] text-slate-500 font-mono">MSLP</span>
        </div>
        <div className="w-full bg-slate-800 h-1 mt-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-purple-400 to-indigo-400 h-full rounded-full"
            style={{ width: `${Math.min(100, Math.max(15, (deficit / 40) * 100))}%` }}
          />
        </div>
      </div>

      {/* Metric 6: 10m Sustained Wind Speed & IMD Stage */}
      <div className="glass-panel p-3 relative overflow-hidden group border-sky-500/30">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-sky-300">Surface Wind</span>
          <Wind className="h-4 w-4 text-sky-400 group-hover:scale-110 transition" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold mono-font text-sky-300">{windKt.toFixed(1)}</span>
          <span className="text-[10px] text-slate-400 font-mono">kt ({windKmh} km/h)</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-sky-500/20 text-sky-200 border border-sky-400/40 truncate max-w-[130px]">
            {intensityCategory || 'Depression (D)'}
          </span>
          <span className="text-[10px] text-sky-400 font-mono font-bold">{intensityCode || 'D'}</span>
        </div>
        <div className="w-full bg-slate-800 h-1 mt-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-sky-400 to-rose-400 h-full rounded-full"
            style={{ width: `${Math.min(100, Math.max(15, (windKt / 120) * 100))}%` }}
          />
        </div>
      </div>

    </section>
  );
}
