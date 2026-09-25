import React from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { TrendingUp, Wind, Gauge, ShieldAlert, Award } from 'lucide-react';

export default function ForecastChart({ 
  forecastPoints, 
  genesisProb, 
  aiConfidence, 
  peakWindKt, 
  landfall 
}) {
  if (!forecastPoints || forecastPoints.length === 0) {
    return (
      <div className="glass-panel p-4 flex items-center justify-center text-slate-400 text-xs">
        No forecast points available.
      </div>
    );
  }

  // Format chart data points
  const chartData = forecastPoints.map((pt) => ({
    name: `+${pt.hours_ahead}h`,
    validTime: pt.valid_time,
    windKt: pt.wind_kt,
    windKmh: Math.round(pt.wind_kmh || pt.wind_kt * 1.852),
    pressureHpa: pt.pressure_hpa,
    category: pt.category || pt.category_code,
  }));

  // Determine peak
  const maxWind = Math.max(...forecastPoints.map(p => p.wind_kt), 35);
  const minPressure = Math.min(...forecastPoints.map(p => p.pressure_hpa), 1000);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-sky-500/40 p-2.5 rounded-lg shadow-xl text-xs backdrop-blur-md">
          <div className="font-bold text-sky-300 border-b border-slate-700 pb-1 mb-1">
            {label} Forecast ({data.category})
          </div>
          <div className="text-slate-400 text-[11px] mb-1">Time: {data.validTime}</div>
          <div className="flex items-center justify-between gap-4 text-emerald-400">
            <span>Sustained Wind:</span>
            <span className="font-mono font-bold">{data.windKt} kt ({data.windKmh} km/h)</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-purple-400">
            <span>Central Pressure:</span>
            <span className="font-mono font-bold">{data.pressureHpa} hPa</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel p-3 flex flex-col h-full">
      
      {/* Header with Title and Key Stats */}
      <div className="flex flex-wrap items-center justify-between pb-2 mb-2 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            120-Hour AI Trajectory & Intensity Prediction
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
            LSTM Forecaster
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1">
            <span className="text-slate-400">Genesis Prob (120h):</span>
            <span className="font-bold font-mono text-amber-400">
              {Math.round((genesisProb || 0.75) * 100)}%
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-slate-400">AI Confidence:</span>
            <span className="font-bold font-mono text-cyan-300">
              {aiConfidence || 86}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative flex-1 min-h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="windGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis 
              dataKey="name" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
            />
            
            {/* Left Axis: Wind Speed (kt) */}
            <YAxis 
              yAxisId="left" 
              stroke="#38bdf8" 
              fontSize={10} 
              domain={[10, Math.max(90, Math.ceil((maxWind + 10) / 10) * 10)]}
              tickFormatter={(v) => `${v}kt`} 
              tickLine={false}
            />

            {/* Right Axis: Pressure (hPa) */}
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#a855f7" 
              fontSize={10} 
              domain={[Math.floor((minPressure - 10) / 5) * 5, 1015]}
              tickFormatter={(v) => `${v}`} 
              tickLine={false}
            />

            <Tooltip content={<CustomTooltip />} />
            
            {/* IMD Intensity Thresholds */}
            <ReferenceLine yAxisId="left" y={34} stroke="#facc15" strokeDasharray="3 3" label={{ value: 'CS (34kt)', fill: '#facc15', fontSize: 9, position: 'insideTopLeft' }} />
            <ReferenceLine yAxisId="left" y={48} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'SCS (48kt)', fill: '#f97316', fontSize: 9, position: 'insideTopLeft' }} />
            <ReferenceLine yAxisId="left" y={64} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'VSCS (64kt)', fill: '#ef4444', fontSize: 9, position: 'insideTopLeft' }} />

            {/* Area & Lines */}
            <Area 
              yAxisId="left" 
              type="monotone" 
              dataKey="windKt" 
              stroke="#38bdf8" 
              strokeWidth={2.5} 
              fillOpacity={1} 
              fill="url(#windGradient)" 
              name="Wind Speed (kt)" 
            />
            
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="pressureHpa" 
              stroke="#c084fc" 
              strokeWidth={2} 
              strokeDasharray="4 4" 
              dot={{ r: 3, fill: '#c084fc' }} 
              name="MSLP (hPa)" 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Trajectory Insights Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 mt-1 border-t border-slate-800 text-[11px]">
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Peak Intensity</span>
          <span className="font-bold font-mono text-rose-400">{maxWind.toFixed(1)} kt</span>
        </div>
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Lowest Central Pressure</span>
          <span className="font-bold font-mono text-purple-300">{minPressure.toFixed(1)} hPa</span>
        </div>
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Landfall Forecast</span>
          <span className="font-bold text-amber-300 truncate block">
            {landfall?.occurred ? `${landfall.landfall_district} (+${landfall.predicted_step_hours}h)` : 'No Landfall (<120h)'}
          </span>
        </div>
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Physics Constraints</span>
          <span className="font-bold text-emerald-400">Emanuel MPI & Kaplan</span>
        </div>
      </div>

    </div>
  );
}
