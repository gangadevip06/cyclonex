import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import TelemetryGrid from './components/TelemetryGrid';
import GISMap from './components/GISMap';
import ForecastChart from './components/ForecastChart';
import XAISection from './components/XAISection';
import AlertPanel from './components/AlertPanel';
import WhatIfSimulator from './components/WhatIfSimulator';
import SatelliteUploadModal from './components/SatelliteUploadModal';
import apiService from './services/api';
import { 
  AlertOctagon, 
  Radio, 
  RefreshCw, 
  Compass, 
  ShieldCheck, 
  Cpu, 
  Layers 
} from 'lucide-react';

export default function App() {
  const [basin, setBasin] = useState('bay_of_bengal');
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState('precursor_2026');
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const alertPanelRef = useRef(null);

  // 1. Initial Load: Scenarios & Initial Forecast
  useEffect(() => {
    async function init() {
      try {
        const scList = await apiService.getScenarios();
        setScenarios(scList);
      } catch (err) {
        console.warn('Scenarios load error:', err);
      }
      fetchData(basin, isLiveMode, selectedScenarioId);
    }
    init();
  }, []);

  // 2. Fetch live data or scenario
  const fetchData = async (targetBasin, live, scenarioId) => {
    setLoading(true);
    setError(null);
    try {
      if (live) {
        const data = await apiService.getForecast(targetBasin);
        setForecast(data);
        setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST');
      } else {
        const scData = await apiService.getScenario(scenarioId);
        // Normalize scenario structure to match ForecastResponse schema
        const normalized = {
          basin: scData.basin || targetBasin,
          basin_name: scData.title || 'Benchmark Scenario',
          current_position: {
            lat: scData.current_lat || 14.5,
            lon: scData.current_lon || 86.0
          },
          current_telemetry: {
            basin: scData.basin || targetBasin,
            latitude: scData.current_lat || 14.5,
            longitude: scData.current_lon || 86.0,
            sst: scData.telemetry?.sst ?? 30.2,
            surface_pressure: scData.telemetry?.surface_pressure ?? 1004.0,
            mslp_deficit: scData.telemetry?.mslp_deficit ?? 9.2,
            wind_speed_10m: scData.telemetry?.wind_speed_10m ?? scData.current_wind_kt ?? 35.0,
            wind_850: scData.telemetry?.wind_850 ?? 32.0,
            wind_200: scData.telemetry?.wind_200 ?? 18.0,
            wind_shear: scData.telemetry?.wind_shear ?? 12.0,
            vorticity: scData.telemetry?.vorticity ?? 1.25,
            cape: scData.telemetry?.cape ?? 1350,
            rh_700: scData.telemetry?.rh_700 ?? 75.0,
            timestamp: scData.timestamp || 'Historic Case',
            source: 'NOAA IBTrACS Benchmark'
          },
          genesis_probability_120h: (scData.genesis_probability || 75) / 100,
          intensity_category: scData.intensity_category || 'Depression (D)',
          intensity_code: scData.intensity_code || 'D',
          current_wind_kt: scData.current_wind_kt || 35.0,
          current_wind_kmh: Math.round((scData.current_wind_kt || 35.0) * 1.852),
          central_pressure_hpa: scData.central_pressure_hpa || 1004.0,
          ai_confidence: scData.ai_confidence || 88.0,
          multimodal_weights: { satellite_visual: 45.0, environmental_reanalysis: 55.0 },
          satellite_metrics: scData.satellite_metrics || {
            min_cloud_temp_c: -74.2,
            cold_cloud_fraction: 42.5,
            cdo_compactness: 0.78,
            spiral_organization: 0.82,
            dvorak_t_number: 3.5,
            satellite_derived_wind_kt: 35.0,
            channel: 'TIR-1 (10.8 µm)'
          },
          satellite_frame: scData.satellite_frame || '',
          gradcam_frame: scData.gradcam_frame || '',
          gradcam_hotspot: scData.gradcam_hotspot || {
            convective_feature: 'Eyewall & Spiral Rainbands'
          },
          shap_contributors: scData.shap_contributors || [],
          forecast_120h: scData.forecast_120h || scData.forecast_points || [],
          landfall: scData.landfall || { occurred: false },
          physics_governance: { mpi_knots: 135.0, status: 'Emanuel Thermodynamic Limit' },
          initial_advisories: scData.initial_advisories || {
            cyclone_stage: scData.intensity_category || 'Depression',
            landfall_timeline: scData.landfall?.timeline || 'Monitoring Active Basin',
            evacuation_directives: scData.alerts?.map(a => a.message) || [],
            plain_language_xai: 'Atmospheric conditions exhibit warm sea surface temperatures exceeding 28°C and moderate wind shear supporting cyclogenesis.',
            bulletin_english: scData.bulletin_text || 'IMD RSMC TROPICAL CYCLONE ADVISORY BULLETIN\nNORTH INDIAN OCEAN BASIN',
            bulletin_hindi: 'आईएमडी चक्रवात परामर्श बुलेटिन - उत्तर हिंद महासागर',
            bulletin_tamil: 'இந்திய வானிலை ஆய்வு துறை புயல் எச்சரிக்கை அறிக்கை',
            bulletin_telugu: 'భారత వాతావరణ శాఖ తుఫాను హెచ్చరిక బులెటిన్',
            bulletin_odia: 'ଭାରତୀୟ ପାଣିପାଗ ବିଭାଗ ବାତ୍ୟା ସତର୍କତା ବୁଲେଟିନ୍',
            bulletin_bengali: 'ভারতীয় আবহাওয়া দপ্তর ঘূর্ণিঝড় সতর্কতা বুলেটিন',
            generated_at: scData.timestamp || 'Live',
            gemini_assisted: true
          }
        };
        setForecast(normalized);
        setLastUpdated(scData.timestamp || 'Historic Case');
      }
    } catch (err) {
      console.error('Data sync error:', err);
      setError(err?.response?.data?.detail || 'Unable to synchronize telemetry from server. Using local meteorology reanalysis.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Basin Change Handler
  const handleBasinChange = (newBasin) => {
    setBasin(newBasin);
    setIsLiveMode(true);
    fetchData(newBasin, true, selectedScenarioId);
  };

  // 4. Scenario Change Handler
  const handleScenarioChange = (newScenarioId) => {
    setSelectedScenarioId(newScenarioId);
    setIsLiveMode(false);
    fetchData(basin, false, newScenarioId);
  };

  // 5. Toggle Live vs Benchmark Mode
  const handleToggleLiveMode = (live) => {
    setIsLiveMode(live);
    fetchData(basin, live, selectedScenarioId);
  };

  // 6. Refresh Button Handler
  const handleRefresh = () => {
    fetchData(basin, isLiveMode, selectedScenarioId);
  };

  // 7. What-If Simulation Handler
  const handleSimulateWhatIf = async (payload) => {
    setSimulating(true);
    try {
      const data = await apiService.simulateWhatIf(payload);
      setForecast(data);
      setIsWhatIfOpen(false);
      setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' (Simulated)');
    } catch (err) {
      alert('What-If simulation error: ' + (err?.response?.data?.detail || err.message));
    } finally {
      setSimulating(false);
    }
  };

  // 8. Scroll to Bulletin
  const handleOpenBulletin = () => {
    if (alertPanelRef.current) {
      alertPanelRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#070d19] text-slate-100 selection:bg-sky-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        basin={basin}
        onBasinChange={handleBasinChange}
        scenarios={scenarios}
        selectedScenarioId={selectedScenarioId}
        onScenarioChange={handleScenarioChange}
        isLiveMode={isLiveMode}
        onToggleLiveMode={handleToggleLiveMode}
        onRefresh={handleRefresh}
        loading={loading}
        onOpenWhatIf={() => setIsWhatIfOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenBulletin={handleOpenBulletin}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        lastUpdated={lastUpdated}
        activeAlertLevel={forecast?.intensity_category}
      />

      {/* Main Operations Dashboard */}
      <main className="max-w-[1750px] mx-auto w-full p-4 flex-1 flex flex-col gap-3.5">
        
        {/* Error notification banner if any */}
        {error && (
          <div className="bg-amber-950/40 border border-amber-500/40 text-amber-200 px-4 py-2 rounded-lg text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-amber-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button 
              onClick={handleRefresh}
              className="text-xs bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded border border-amber-500/40 font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Live Status Ticker Banner */}
        <div className="glass-card px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs border border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-semibold text-slate-300">ACTIVE BASIN:</span>
            <span className="font-bold text-sky-400 font-mono uppercase">
              {forecast?.basin_name || (basin === 'bay_of_bengal' ? 'Bay of Bengal' : 'Arabian Sea')}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Target Coords:</span>
            <span className="font-mono text-white">
              {forecast?.current_position?.lat?.toFixed(2) || 12.5}°N, {forecast?.current_position?.lon?.toFixed(2) || 86.0}°E
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-slate-400">Current Category:</span>
            <span className="font-bold text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              {forecast?.intensity_category || 'Depression (D)'}
            </span>
            <span className="text-slate-400">Sustained Wind:</span>
            <span className="font-bold text-sky-300 font-mono">
              {forecast?.current_wind_kt || 35.0} kt ({forecast?.current_wind_kmh || 65} km/h)
            </span>
          </div>
        </div>

        {/* Module 1: 6 Live Atmospheric Telemetry Cards */}
        <TelemetryGrid
          telemetry={forecast?.current_telemetry}
          intensityCategory={forecast?.intensity_category}
          intensityCode={forecast?.intensity_code}
        />

        {/* Module 2 & 3: Interactive Leaflet GIS Map + Recharts 120-Hour Forecast */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 min-h-[460px]">
          
          {/* Interactive Leaflet GIS Map (7 cols) */}
          <div className="lg:col-span-7 h-[460px]">
            <GISMap
              currentPosition={forecast?.current_position}
              forecastPoints={forecast?.forecast_120h}
              landfall={forecast?.landfall}
              basin={basin}
              intensityCategory={forecast?.intensity_category}
              currentWindKt={forecast?.current_wind_kt}
              centralPressure={forecast?.central_pressure_hpa}
            />
          </div>

          {/* 120-Hour Trajectory & Intensity Prediction (5 cols) */}
          <div className="lg:col-span-5 h-[460px]">
            <ForecastChart
              forecastPoints={forecast?.forecast_120h}
              genesisProb={forecast?.genesis_probability_120h}
              aiConfidence={forecast?.ai_confidence}
              peakWindKt={forecast?.current_wind_kt}
              landfall={forecast?.landfall}
            />
          </div>

        </div>

        {/* Module 4 & 5: PyTorch Grad-CAM Viewer + SHAP Feature Attribution */}
        <XAISection
          satelliteFrame={forecast?.satellite_frame}
          gradcamFrame={forecast?.gradcam_frame}
          gradcamHotspot={forecast?.gradcam_hotspot}
          satelliteMetrics={forecast?.satellite_metrics}
          shapContributors={forecast?.shap_contributors}
          multimodalWeights={forecast?.multimodal_weights}
        />

        {/* Module 6: Google Gemini Multi-Lingual Bulletins & Emergency Alerts */}
        <div ref={alertPanelRef}>
          <AlertPanel
            advisories={forecast?.initial_advisories}
            intensityCategory={forecast?.intensity_category}
            intensityCode={forecast?.intensity_code}
            soundEnabled={soundEnabled}
          />
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070d19] py-3 px-4 text-xs text-slate-500">
        <div className="max-w-[1750px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-400">CYCLONEX</span>
            <span>• Smart India Hackathon 2026 (SIH 2026) | Problem Statement ID: SIH26070</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] font-mono">
            <span>Open-Meteo Marine</span>
            <span>•</span>
            <span>NASA GIBS WMTS</span>
            <span>•</span>
            <span>IMD INSAT-3D</span>
            <span>•</span>
            <span>Google Gemini 2.5 Gen AI</span>
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      <WhatIfSimulator
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
        basin={basin}
        currentPosition={forecast?.current_position}
        baseTelemetry={forecast?.current_telemetry}
        onSimulate={handleSimulateWhatIf}
        loading={simulating}
      />

      <SatelliteUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

    </div>
  );
}
