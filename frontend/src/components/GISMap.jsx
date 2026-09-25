import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Layers, 
  Eye, 
  MapPin, 
  Maximize2, 
  Compass, 
  Navigation, 
  AlertCircle 
} from 'lucide-react';

export default function GISMap({
  currentPosition,
  forecastPoints,
  landfall,
  basin,
  intensityCategory,
  currentWindKt,
  centralPressure
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({
    stormMarker: null,
    forecastPolyline: null,
    conePolygon: null,
    forecastMarkers: [],
    landfallMarker: null,
    windRadiiCircles: []
  });

  const [showCone, setShowCone] = useState(true);
  const [showForecastPts, setShowForecastPts] = useState(true);
  const [showWindRadii, setShowWindRadii] = useState(true);

  // Basin default centers
  const basinCenters = {
    bay_of_bengal: [14.5, 86.0],
    arabian_sea: [15.0, 67.0],
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter = basinCenters[basin] || [14.5, 86.0];
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 5,
        minZoom: 4,
        maxZoom: 10,
        zoomControl: false,
      });

      // Dark canvas tiles (Esri)
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri, DeLorme, NAVTEQ',
          maxZoom: 16,
        }
      ).addTo(map);

      // Boundaries and labels layer
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '',
          maxZoom: 16,
        }
      ).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Keep map instance alive across fast re-renders
    };
  }, []);

  // 2. Update Map Layers whenever forecast or position changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const layers = layersRef.current;

    // A. Clean previous dynamic layers
    if (layers.stormMarker) map.removeLayer(layers.stormMarker);
    if (layers.forecastPolyline) map.removeLayer(layers.forecastPolyline);
    if (layers.conePolygon) map.removeLayer(layers.conePolygon);
    if (layers.landfallMarker) map.removeLayer(layers.landfallMarker);
    layers.forecastMarkers.forEach(m => map.removeLayer(m));
    layers.forecastMarkers = [];
    layers.windRadiiCircles.forEach(c => map.removeLayer(c));
    layers.windRadiiCircles = [];

    const curLat = currentPosition?.lat ?? 12.5;
    const curLon = currentPosition?.lon ?? 86.0;

    // B. Add Pulsing Active Storm Marker
    const stormIcon = L.divIcon({
      className: 'custom-storm-marker',
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(56, 189, 248, 0.4); animation: pulse-ring 2s cubic-bezier(0.2, 0.6, 0.4, 1) infinite;"></div>
          <div style="width: 20px; height: 20px; border-radius: 50%; background: #0284c7; border: 2px solid #38bdf8; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px #38bdf8;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: white;"></div>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    layers.stormMarker = L.marker([curLat, curLon], { icon: stormIcon }).addTo(map);
    layers.stormMarker.bindPopup(`
      <div style="font-family: inherit; padding: 4px;">
        <div style="font-weight: 700; color: #38bdf8; font-size: 13px; margin-bottom: 4px;">CURRENT STORM POSITION</div>
        <div style="font-size: 11px; color: #94a3b8;">Coords: <span style="color: white; font-family: monospace;">${curLat.toFixed(2)}°N, ${curLon.toFixed(2)}°E</span></div>
        <div style="font-size: 11px; color: #94a3b8;">Stage: <span style="color: #facc15; font-weight: 600;">${intensityCategory || 'Depression'}</span></div>
        <div style="font-size: 11px; color: #94a3b8;">Winds: <span style="color: #38bdf8; font-weight: 700;">${currentWindKt || 35} kt</span> | MSLP: <span style="color: white;">${centralPressure || 1005} hPa</span></div>
      </div>
    `);

    // C. Wind Radii (Gale 34kt, Storm 50kt, Hurricane 64kt)
    if (showWindRadii && currentWindKt >= 25) {
      const r34 = L.circle([curLat, curLon], {
        radius: Math.min(180000, (currentWindKt / 35) * 120000),
        color: '#38bdf8',
        weight: 1,
        dashArray: '4, 4',
        fillColor: '#0284c7',
        fillOpacity: 0.08,
      }).addTo(map);

      const r50 = L.circle([curLat, curLon], {
        radius: Math.min(100000, (currentWindKt / 50) * 70000),
        color: '#f59e0b',
        weight: 1,
        dashArray: '3, 3',
        fillColor: '#f59e0b',
        fillOpacity: 0.1,
      }).addTo(map);

      layers.windRadiiCircles = [r34, r50];
    }

    // D. 120-Hour Track Points & Cone of Uncertainty
    if (forecastPoints && forecastPoints.length > 0) {
      const trackLatLngs = forecastPoints.map(pt => [pt.lat, pt.lon]);

      // Connect polyline
      layers.forecastPolyline = L.polyline(trackLatLngs, {
        color: '#38bdf8',
        weight: 3.5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Expanding Cone of Uncertainty Polygon
      if (showCone && forecastPoints.length >= 2) {
        const leftBoundary = [];
        const rightBoundary = [];

        forecastPoints.forEach((pt, i) => {
          const lat = pt.lat;
          const lon = pt.lon;
          // Radius in km: 45km at 24h to 240km at 120h
          const radiusKm = pt.cone_radius_km || (45 + i * 40);
          const degOffset = radiusKm / 111.0; // Approx 1 deg = 111 km

          // Simple normal angle calculation
          let angle = 0;
          if (i < forecastPoints.length - 1) {
            const next = forecastPoints[i + 1];
            angle = Math.atan2(next.lon - lon, next.lat - lat) + Math.PI / 2;
          } else {
            const prev = forecastPoints[i - 1];
            angle = Math.atan2(lon - prev.lon, lat - prev.lat) + Math.PI / 2;
          }

          const dLat = (degOffset * Math.cos(angle)) * 0.85;
          const dLon = (degOffset * Math.sin(angle)) / Math.cos((lat * Math.PI) / 180);

          leftBoundary.push([lat + dLat, lon + dLon]);
          rightBoundary.unshift([lat - dLat, lon - dLon]);
        });

        const conePolygonCoords = [...leftBoundary, ...rightBoundary];
        layers.conePolygon = L.polygon(conePolygonCoords, {
          color: '#0284c7',
          weight: 1.5,
          opacity: 0.6,
          fillColor: '#38bdf8',
          fillOpacity: 0.16,
          dashArray: '5, 5',
        }).addTo(map);
      }

      // Waypoint Markers
      if (showForecastPts) {
        forecastPoints.forEach((pt, idx) => {
          // Color code by intensity
          let markerColor = '#38bdf8'; // Depression
          if (pt.wind_kt >= 64) markerColor = '#ef4444'; // VSCS / ESCS
          else if (pt.wind_kt >= 48) markerColor = '#f97316'; // SCS
          else if (pt.wind_kt >= 34) markerColor = '#facc15'; // CS

          const htmlMarker = L.divIcon({
            className: 'custom-forecast-marker',
            html: `
              <div style="background: ${markerColor}; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px rgba(0,0,0,0.8); font-size: 9px; font-weight: 800;">
                ${pt.hours_ahead}h
              </div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          const m = L.marker([pt.lat, pt.lon], { icon: htmlMarker }).addTo(map);
          m.bindPopup(`
            <div style="font-family: inherit; padding: 4px;">
              <div style="font-weight: 700; color: ${markerColor}; font-size: 12px; margin-bottom: 3px;">+${pt.hours_ahead}h FORECAST (${pt.category_code || 'FC'})</div>
              <div style="font-size: 11px; color: #cbd5e1;">Time: <span style="font-weight: 600;">${pt.valid_time || ''}</span></div>
              <div style="font-size: 11px; color: #cbd5e1;">Coords: <span style="font-family: monospace;">${pt.lat.toFixed(2)}°N, ${pt.lon.toFixed(2)}°E</span></div>
              <div style="font-size: 11px; color: #cbd5e1;">Wind: <span style="color: ${markerColor}; font-weight: 700;">${pt.wind_kt} kt (${Math.round(pt.wind_kmh || pt.wind_kt * 1.852)} km/h)</span></div>
              <div style="font-size: 11px; color: #cbd5e1;">Pressure: <span style="color: white;">${pt.pressure_hpa} hPa</span></div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Cone Radius: ±${Math.round(pt.cone_radius_km || 45)} km</div>
            </div>
          `);

          layers.forecastMarkers.push(m);
        });
      }
    }

    // E. Landfall Point Indicator
    if (landfall && landfall.occurred && landfall.landfall_district) {
      const landLat = landfall.landfall_lat || 21.6;
      const landLon = landfall.landfall_lon || 88.5;

      const landfallIcon = L.divIcon({
        className: 'landfall-marker',
        html: `
          <div style="background: rgba(239, 68, 68, 0.9); border: 2px solid white; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800; white-space: nowrap; box-shadow: 0 0 10px #ef4444; display: flex; align-items: center; gap: 4px;">
            <span>⚠️ LANDFALL: ${landfall.landfall_district}</span>
          </div>
        `,
        iconSize: [120, 24],
        iconAnchor: [60, 12],
      });

      layers.landfallMarker = L.marker([landLat, landLon], { icon: landfallIcon }).addTo(map);
      layers.landfallMarker.bindPopup(`
        <div style="font-family: inherit; padding: 4px;">
          <div style="font-weight: 800; color: #ef4444; font-size: 13px;">CRITICAL LANDFALL PROJECTION</div>
          <div style="font-size: 11px; color: white; margin-top: 3px;">District: <strong>${landfall.landfall_district}</strong></div>
          <div style="font-size: 11px; color: #fca5a5;">ETA: Step +${landfall.predicted_step_hours || 48} Hours</div>
          <div style="font-size: 11px; color: #cbd5e1;">Kaplan Inland Decay: <strong>${(landfall.decay_rate || 0.08).toFixed(2)} hr⁻¹</strong></div>
        </div>
      `);
    }

    // Center map smoothly
    map.panTo([curLat, curLon]);
  }, [currentPosition, forecastPoints, landfall, showCone, showForecastPts, showWindRadii, intensityCategory]);

  // Recenter button
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const curLat = currentPosition?.lat ?? 14.5;
    const curLon = currentPosition?.lon ?? 86.0;
    mapInstanceRef.current.flyTo([curLat, curLon], 5.5, { duration: 1.2 });
  };

  return (
    <div className="glass-panel p-3 flex flex-col h-full relative">
      
      {/* Map Header with GIS Controls */}
      <div className="flex flex-wrap items-center justify-between pb-2 mb-2 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-2">
          <Navigation className="h-4 w-4 text-sky-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            North Indian Ocean GIS Operations Center
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
            120-Hour Track & Cone
          </span>
        </div>

        {/* Map Layers Toggles */}
        <div className="flex items-center space-x-2 text-[11px]">
          <label className="flex items-center space-x-1 cursor-pointer text-slate-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={showCone}
              onChange={(e) => setShowCone(e.target.checked)}
              className="accent-sky-500 rounded"
            />
            <span>Cone of Uncertainty</span>
          </label>

          <label className="flex items-center space-x-1 cursor-pointer text-slate-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={showForecastPts}
              onChange={(e) => setShowForecastPts(e.target.checked)}
              className="accent-sky-500 rounded"
            />
            <span>Waypoints</span>
          </label>

          <label className="flex items-center space-x-1 cursor-pointer text-slate-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={showWindRadii}
              onChange={(e) => setShowWindRadii(e.target.checked)}
              className="accent-sky-500 rounded"
            />
            <span>Wind Radii</span>
          </label>

          <button
            onClick={handleRecenter}
            title="Recenter on Cyclone Eye"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 ml-1"
          >
            <Maximize2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative flex-1 min-h-[360px] w-full rounded-lg overflow-hidden border border-slate-800">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
        
        {/* Floating Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md p-2 rounded-lg border border-slate-700/80 text-[10px] shadow-lg pointer-events-auto">
          <div className="font-bold text-slate-300 mb-1 flex items-center gap-1">
            <Layers className="h-3 w-3 text-sky-400" />
            <span>IMD Track Legend</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-400">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span>
              <span>Depression (&lt;34 kt)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"></span>
              <span>Cyclonic Storm (34-47 kt)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
              <span>Severe CS (48-63 kt)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
              <span>Very Severe (&gt;64 kt)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
