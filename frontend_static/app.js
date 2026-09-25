/**
 * CYCLONEX - Client-Side Application Controller
 * Smart India Hackathon 2026 (Problem Statement ID: SIH26070)
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // 2. Global State
    let currentScenarioId = 'precursor_2026';
    let currentScenarioData = null;
    let leafletMap = null;
    let mapLayers = {
        pastTrack: null,
        forecastTrack: null,
        coneOfUncertainty: null,
        landfallMarker: null,
        markers: []
    };
    let forecastChart = null;
    let shapChart = null;

    // 3. Initialize Leaflet Map
    function initMap() {
        const mapContainer = document.getElementById('cyclone-gis-map');
        if (!mapContainer) return;

        // Centered over North Indian Ocean (Bay of Bengal & Arabian Sea)
        leafletMap = L.map('cyclone-gis-map', {
            center: [14.5, 85.0],
            zoom: 5,
            minZoom: 4,
            maxZoom: 9,
            zoomControl: true
        });

        // 1. High-contrast Dark Tactical Basemap (Esri Dark Canvas: Base + Reference, 100% Free, No API Key)
        const darkBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; Esri, DeLorme, NAVTEQ',
            maxZoom: 16
        });
        const darkRef = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
            attribution: '',
            maxZoom: 16
        });
        const darkTacticalGroup = L.layerGroup([darkBase, darkRef]).addTo(leafletMap);

        // 2. High-Resolution Satellite Earth Imagery (Esri World Imagery, 100% Free, No API Key)
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; Esri, Maxar, Earthstar Geographics',
            maxZoom: 18
        });

        // 3. OpenStreetMap Standard (100% Free, No API Key)
        const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 18
        });

        // Add Basemap Layer Switcher (Top-Right of Map)
        const baseMaps = {
            "Dark Tactical": darkTacticalGroup,
            "Satellite Earth": satelliteLayer,
            "OpenStreetMap": osmLayer
        };
        L.control.layers(baseMaps, null, { position: 'topright' }).addTo(leafletMap);

        // Add Coastal State Reference Markers (India East & West Coast)
        addCoastalRegions();
    }

    function addCoastalRegions() {
        const coastalDistricts = [
            { name: "Odisha Coast", lat: 19.8, lon: 85.8, alert: "HIGH RISK" },
            { name: "West Bengal / Sundarbans", lat: 21.8, lon: 88.5, alert: "HIGH RISK" },
            { name: "North Andhra Coast", lat: 17.7, lon: 83.3, alert: "WATCH" },
            { name: "Chennai / North TN", lat: 13.0, lon: 80.3, alert: "WATCH" },
            { name: "Gujarat / Kutch Coast", lat: 22.8, lon: 69.8, alert: "NORMAL" }
        ];

        coastalDistricts.forEach(c => {
            L.circleMarker([c.lat, c.lon], {
                radius: 4,
                fillColor: '#64748b',
                color: '#94a3b8',
                weight: 1,
                opacity: 0.6,
                fillOpacity: 0.5
            }).bindTooltip(`<strong>${c.name}</strong><br>Coastal Alert Zone`, { direction: 'top' }).addTo(leafletMap);
        });
    }

    // 4. Render Cyclone Track and Cone of Uncertainty on Map
    function updateMapLayers(data) {
        if (!leafletMap) return;

        // Clear previous layers
        if (mapLayers.pastTrack) leafletMap.removeLayer(mapLayers.pastTrack);
        if (mapLayers.forecastTrack) leafletMap.removeLayer(mapLayers.forecastTrack);
        if (mapLayers.coneOfUncertainty) leafletMap.removeLayer(mapLayers.coneOfUncertainty);
        if (mapLayers.landfallMarker) leafletMap.removeLayer(mapLayers.landfallMarker);
        mapLayers.markers.forEach(m => leafletMap.removeLayer(m));
        mapLayers.markers = [];

        const past = data.past_track || [];
        const forecast = data.forecast_120h || [];
        const cur = data.current_position;

        // A. Draw Observed Past Track (Solid Cyan Line)
        const pastLatLngs = past.map(p => [p.lat, p.lon]);
        mapLayers.pastTrack = L.polyline(pastLatLngs, {
            color: '#38bdf8',
            weight: 3,
            opacity: 0.85
        }).addTo(leafletMap);

        // Past track markers
        past.forEach((pt, idx) => {
            const marker = L.circleMarker([pt.lat, pt.lon], {
                radius: 5,
                fillColor: '#0284c7',
                color: '#ffffff',
                weight: 1.5,
                fillOpacity: 0.9
            }).bindPopup(`
                <div class="text-xs">
                    <strong class="text-sky-400">Observed Position (${pt.time})</strong><br>
                    <strong>Stage:</strong> ${pt.stage}<br>
                    <strong>Wind:</strong> ${pt.wind_kt} kt (${Math.round(pt.wind_kt * 1.852)} km/h)<br>
                    <strong>Pressure:</strong> ${pt.pressure} hPa<br>
                    <strong>Location:</strong> ${pt.lat}°N, ${pt.lon}°E
                </div>
            `);
            marker.addTo(leafletMap);
            mapLayers.markers.push(marker);
        });

        // B. Current Cyclone Center (Pulsing Red Marker)
        const curMarker = L.circleMarker([cur.lat, cur.lon], {
            radius: 8,
            fillColor: '#ef4444',
            color: '#f87171',
            weight: 3,
            fillOpacity: 1
        }).bindPopup(`
            <div class="text-xs">
                <strong class="text-red-400">CURRENT STORM CENTER</strong><br>
                <strong>System:</strong> ${data.metadata.title}<br>
                <strong>Coordinates:</strong> ${cur.lat}°N, ${cur.lon}°E<br>
                <strong>Max Wind:</strong> ${data.atmospherics.current_wind_kt} kt<br>
                <strong>Central Pressure:</strong> ${data.atmospherics.central_pressure} hPa
            </div>
        `).addTo(leafletMap);
        mapLayers.markers.push(curMarker);

        // C. Draw 120-hour Forecast Track (Dashed Amber/Red Line)
        const forecastLatLngs = [[cur.lat, cur.lon], ...forecast.map(f => [f.lat, f.lon])];
        mapLayers.forecastTrack = L.polyline(forecastLatLngs, {
            color: '#f97316',
            weight: 3,
            dashArray: '6, 8',
            opacity: 0.9
        }).addTo(leafletMap);

        // D. Calculate & Draw 70% Cone of Uncertainty (Expanding Probability Envelope)
        if (forecast.length > 0) {
            const conePolygon = buildConePolygon([cur.lat, cur.lon], forecast);
            mapLayers.coneOfUncertainty = L.polygon(conePolygon, {
                color: '#38bdf8',
                weight: 1.5,
                fillColor: '#0284c7',
                fillOpacity: 0.18,
                dashArray: '4, 4'
            }).bindTooltip("70% Probability Cone of Uncertainty (IMD Track Error Margin)", { sticky: true });
            mapLayers.coneOfUncertainty.addTo(leafletMap);
        }

        // Forecast Markers (+24h to +120h)
        forecast.forEach(f => {
            const fMarker = L.circleMarker([f.lat, f.lon], {
                radius: 6,
                fillColor: f.color || '#f97316',
                color: '#ffffff',
                weight: 2,
                fillOpacity: 0.95
            }).bindPopup(`
                <div class="text-xs">
                    <strong style="color: ${f.color}">+${f.horizon_hours}H AI Forecast</strong><br>
                    <strong>Category:</strong> ${f.category}<br>
                    <strong>Wind:</strong> ${f.max_wind_kt} kt (±${f.central_pressure_hpa ? '8' : '10'} kt)<br>
                    <strong>Pressure:</strong> ${f.central_pressure_hpa} hPa<br>
                    <strong>Uncertainty Radius:</strong> ±${f.cone_radius_km} km<br>
                    <strong>Genesis Prob:</strong> ${f.genesis_prob}%
                </div>
            `);
            fMarker.addTo(leafletMap);
            mapLayers.markers.push(fMarker);
        });

        // E. Landfall Point Marker
        const landfall = data.landfall;
        if (landfall && landfall.lat && landfall.lon) {
            const landfallIcon = L.divIcon({
                className: 'landfall-custom-icon',
                html: `<div style="background:#ef4444; width:16px; height:16px; border-radius:50%; border:3px solid #ffffff; box-shadow:0 0 12px #ef4444;"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });

            mapLayers.landfallMarker = L.marker([landfall.lat, landfall.lon], { icon: landfallIcon })
                .bindPopup(`
                    <div class="text-xs">
                        <strong class="text-rose-400">PROJECTED LANDFALL POINT</strong><br>
                        <strong>Location:</strong> ${landfall.location}<br>
                        <strong>ETA:</strong> ${landfall.estimated_time}<br>
                        <strong>Expected Intensity:</strong> ${landfall.expected_intensity}<br>
                        <strong>Warning Level:</strong> <span class="text-rose-400 font-bold">${landfall.threat_level}</span>
                    </div>
                `).addTo(leafletMap);
        }

        // Pan/fit map smoothly
        const allPoints = [...pastLatLngs, ...forecastLatLngs];
        if (allPoints.length > 0) {
            leafletMap.flyToBounds(L.latLngBounds(allPoints).pad(0.3), { duration: 1.2 });
        }
    }

    // Helper to calculate geometry for the expanding cone of uncertainty
    function buildConePolygon(startPt, forecastPoints) {
        const leftSide = [];
        const rightSide = [];
        let prevPt = startPt;

        forecastPoints.forEach(f => {
            const currentPt = [f.lat, f.lon];
            // Vector delta
            const dLat = currentPt[0] - prevPt[0];
            const dLon = currentPt[1] - prevPt[1];
            const angle = Math.atan2(dLon, dLat);

            // Perpendicular angle
            const normalAngle = angle + Math.PI / 2;

            // Radius in degrees approx (1 deg ~ 111 km)
            const radDeg = (f.cone_radius_km || 50) / 111.0;

            const offsetLat = radDeg * Math.cos(normalAngle);
            const offsetLon = radDeg * Math.sin(normalAngle) / Math.cos(f.lat * Math.PI / 180);

            leftSide.push([f.lat + offsetLat, f.lon + offsetLon]);
            rightSide.unshift([f.lat - offsetLat, f.lon - offsetLon]);

            prevPt = currentPt;
        });

        return [startPt, ...leftSide, ...rightSide, startPt];
    }

    // 5. Initialize Charts (Chart.js)
    function initCharts() {
        // A. Forecast Trajectory & Intensity Curve Chart
        const ctxForecast = document.getElementById('forecast-curve-chart').getContext('2d');
        forecastChart = new Chart(ctxForecast, {
            type: 'line',
            data: {
                labels: ['Now', '+24h', '+48h', '+72h', '+96h', '+120h'],
                datasets: [
                    {
                        label: 'Genesis Probability (%)',
                        data: [60, 68, 74, 82, 86, 90],
                        borderColor: '#38bdf8',
                        backgroundColor: 'rgba(56, 189, 248, 0.12)',
                        borderWidth: 2.5,
                        fill: false,
                        tension: 0.35,
                        yAxisID: 'yProb'
                    },
                    {
                        label: 'Max Wind Speed (kt)',
                        data: [25, 35, 50, 65, 78, 85],
                        borderColor: '#f97316',
                        backgroundColor: 'rgba(249, 115, 22, 0.15)',
                        borderWidth: 2.5,
                        fill: false,
                        tension: 0.35,
                        yAxisID: 'yWind'
                    },
                    {
                        label: 'Upper Confidence (+kt)',
                        data: [30, 42, 60, 76, 90, 98],
                        borderColor: 'transparent',
                        backgroundColor: 'rgba(249, 115, 22, 0.12)',
                        fill: '+1',
                        pointRadius: 0,
                        tension: 0.35,
                        yAxisID: 'yWind'
                    },
                    {
                        label: 'Lower Confidence (-kt)',
                        data: [20, 28, 40, 54, 66, 72],
                        borderColor: 'transparent',
                        backgroundColor: 'transparent',
                        pointRadius: 0,
                        tension: 0.35,
                        yAxisID: 'yWind'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#94a3b8', font: { size: 11 } }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(51, 65, 85, 0.3)' },
                        ticks: { color: '#94a3b8', font: { size: 10 } }
                    },
                    yProb: {
                        type: 'linear',
                        position: 'left',
                        min: 0,
                        max: 100,
                        title: { display: true, text: 'Genesis Probability (%)', color: '#38bdf8', font: { size: 10 } },
                        grid: { color: 'rgba(51, 65, 85, 0.25)' },
                        ticks: { color: '#38bdf8', font: { size: 10 } }
                    },
                    yWind: {
                        type: 'linear',
                        position: 'right',
                        min: 0,
                        max: 120,
                        title: { display: true, text: 'Wind Speed (kt)', color: '#f97316', font: { size: 10 } },
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#f97316', font: { size: 10 } }
                    }
                }
            }
        });

        // B. SHAP Feature Attribution Chart (Directly Matching Slide 2)
        const ctxShap = document.getElementById('shap-bar-chart').getContext('2d');
        shapChart = new Chart(ctxShap, {
            type: 'bar',
            data: {
                labels: ['CAPE', 'Low-Level Vorticity', 'Sea Surface Temp', 'Vertical Wind Shear'],
                datasets: [{
                    label: 'SHAP Feature Contribution',
                    data: [0.42, 0.28, 0.18, -0.14],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.85)',
                        'rgba(56, 189, 248, 0.85)',
                        'rgba(245, 158, 11, 0.85)',
                        'rgba(244, 63, 94, 0.85)'
                    ],
                    borderColor: [
                        '#10b981',
                        '#38bdf8',
                        '#f59e0b',
                        '#f43f5e'
                    ],
                    borderWidth: 1.2,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `Contribution: ${ctx.raw > 0 ? '+' : ''}${ctx.raw} (Genesis Impact)`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(51, 65, 85, 0.3)' },
                        ticks: { color: '#94a3b8', font: { size: 10 } },
                        title: { display: true, text: 'Attribution Impact (SHAP Value)', color: '#94a3b8', font: { size: 10 } }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: '#e2e8f0', font: { size: 11, weight: '500' } }
                    }
                }
            }
        });
    }

    // 6. Update Charts with Scenario Data
    function updateCharts(data) {
        if (!forecastChart || !shapChart) return;

        // Update Forecast Chart
        const forecast = data.forecast_120h || [];
        const curWind = data.atmospherics.current_wind_kt;
        const curProb = data.genesis_prob_120h * 0.7; // scaled for current

        const labels = ['Now', ...forecast.map(f => `+${f.horizon_hours}h`)];
        const probData = [curProb, ...forecast.map(f => f.genesis_prob)];
        const windData = [curWind, ...forecast.map(f => f.max_wind_kt)];
        const windUpper = [curWind + 5, ...forecast.map(f => f.wind_ci_upper)];
        const windLower = [curWind - 5, ...forecast.map(f => f.wind_ci_lower)];

        forecastChart.data.labels = labels;
        forecastChart.data.datasets[0].data = probData;
        forecastChart.data.datasets[1].data = windData;
        forecastChart.data.datasets[2].data = windUpper;
        forecastChart.data.datasets[3].data = windLower;
        forecastChart.update();

        // Update SHAP Chart
        const shaps = data.shap_attributions || [];
        shapChart.data.labels = shaps.map(s => s.feature);
        shapChart.data.datasets[0].data = shaps.map(s => s.value);
        shapChart.data.datasets[0].backgroundColor = shaps.map(s => s.value >= 0 ? 'rgba(56, 189, 248, 0.85)' : 'rgba(244, 63, 94, 0.85)');
        shapChart.data.datasets[0].borderColor = shaps.map(s => s.value >= 0 ? '#38bdf8' : '#f43f5e');
        shapChart.update();
    }

    // 7. Render Telemetry Cards and UI Elements
    function renderDashboard(data) {
        currentScenarioData = data;
        const atm = data.atmospherics;
        const meta = data.metadata;

        // Header ticker
        document.getElementById('header-status-text').textContent = meta.status;
        document.getElementById('header-updated-time').textContent = meta.timestamp;
        document.getElementById('basin-badge').textContent = meta.basin;

        // Telemetry cards
        document.getElementById('metric-sst').textContent = `${atm.sst.toFixed(1)}°C`;
        const sstBadge = document.getElementById('metric-sst-badge');
        if (atm.sst >= 28.0) {
            sstBadge.className = "text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
            sstBadge.textContent = ">26.5°C Favorable";
        } else {
            sstBadge.className = "text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30";
            sstBadge.textContent = "Marginal SST";
        }

        document.getElementById('metric-cape').textContent = `${Math.round(atm.cape)} J/kg`;
        document.getElementById('metric-vorticity').textContent = `${atm.vorticity.toFixed(1)} ×10⁻⁵ s⁻¹`;
        document.getElementById('metric-shear').textContent = `${Math.round(atm.wind_shear)} kt`;
        const shearBadge = document.getElementById('metric-shear-badge');
        if (atm.wind_shear <= 15) {
            shearBadge.className = "text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
            shearBadge.textContent = "Low (<15 kt)";
        } else {
            shearBadge.className = "text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30";
            shearBadge.textContent = "High Shear";
        }

        document.getElementById('metric-pressure').textContent = `${Math.round(atm.central_pressure)} hPa`;
        document.getElementById('metric-deficit').textContent = `-${Math.round(atm.mslp_deficit)} hPa Drop`;
        document.getElementById('metric-genesis-prob').textContent = `${Math.round(data.genesis_prob_120h)}%`;
        document.getElementById('metric-confidence').textContent = `${Math.round(data.ai_confidence)}% Conf.`;

        // Landfall text
        const lf = data.landfall;
        if (lf) {
            document.getElementById('landfall-text').textContent = `${lf.location.split('(')[0].trim()} (${lf.estimated_time.split('(')[1] || 'Watch'})`;
        }

        // Satellite & Grad-CAM images
        if (data.satellite_ir_b64) {
            document.getElementById('insat-img').src = data.satellite_ir_b64;
        }
        if (data.gradcam_b64) {
            document.getElementById('gradcam-img').src = data.gradcam_b64;
        }
        document.getElementById('sat-stage-label').textContent = `Stage: ${data.intensity_category} [${data.intensity_code}]`;

        // Update AI Convective Hotspot Reticle
        updateGradcamHotspot(data.gradcam_hotspot);

        // Populate Alerts Table
        renderAlerts(data.alerts || []);

        // Update Map & Charts
        updateMapLayers(data);
        updateCharts(data);
    }

    // 8. Render Alerts Table (Directly Matching Slide 2)
    function renderAlerts(alerts) {
        const tbody = document.getElementById('alerts-table-body');
        tbody.innerHTML = '';

        let highCount = 0;
        let modCount = 0;
        let lowCount = 0;

        alerts.forEach(al => {
            if (al.severity === 'High') highCount++;
            else if (al.severity === 'Moderate') modCount++;
            else lowCount++;

            const tr = document.createElement('tr');
            tr.className = "hover:bg-dark-700/40 transition";
            tr.innerHTML = `
                <td class="py-2.5 px-3 font-mono font-semibold text-sky-400">${al.id}</td>
                <td class="py-2.5 px-3 font-medium text-slate-200">${al.type}</td>
                <td class="py-2.5 px-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold border ${al.severity_badge || 'bg-slate-800 text-slate-300'}">
                        ${al.severity}
                    </span>
                </td>
                <td class="py-2.5 px-3 text-slate-300">${al.message}</td>
                <td class="py-2.5 px-3 text-slate-400 font-mono text-[11px]">${al.issued_on}</td>
                <td class="py-2.5 px-3">
                    <span class="inline-flex items-center space-x-1 text-emerald-400 text-[11px]">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>${al.status}</span>
                    </span>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('count-high-alerts').textContent = highCount;
        document.getElementById('count-mod-alerts').textContent = modCount;
        document.getElementById('count-low-alerts').textContent = lowCount;
        document.getElementById('count-all-alerts').textContent = alerts.length;
    }

    // 9. Load Scenario from API
    async function loadScenario(id) {
        try {
            const resp = await fetch(`/api/scenario/${id}`);
            if (!resp.ok) throw new Error("Failed to load scenario");
            const data = await resp.json();
            renderDashboard(data);
        } catch (err) {
            console.error("Error loading scenario:", err);
        }
    }

    // 10. Event Listeners & Interactive Controls
    // A. Scenario Selector
    const scenarioSelect = document.getElementById('scenario-select');
    scenarioSelect.addEventListener('change', (e) => {
        currentScenarioId = e.target.value;
        loadScenario(currentScenarioId);
    });

    // Dynamic AI Hotspot Reticle Updater
    function updateGradcamHotspot(hotspot) {
        const marker = document.getElementById('gradcam-hotspot-marker');
        const badgeText = document.getElementById('hotspot-badge-text');
        if (!marker) return;

        if (hotspot && typeof hotspot.x === 'number' && typeof hotspot.y === 'number') {
            marker.style.left = `${hotspot.x}%`;
            marker.style.top = `${hotspot.y}%`;
            if (badgeText) {
                const pct = hotspot.intensity_pct || Math.round((hotspot.intensity || 0.98) * 100);
                const feat = hotspot.feature || 'Eyewall Core';
                badgeText.textContent = `${pct}% ${feat}`;
            }
            marker.setAttribute('title', hotspot.description || 'AI Maximum Convective Gradient Focus');
        } else {
            marker.style.left = '50%';
            marker.style.top = '50%';
            if (badgeText) badgeText.textContent = '98% Eyewall Core';
        }
    }

    // B. Grad-CAM Opacity Slider & Dynamic Hotspot Reactor
    const opacitySlider = document.getElementById('gradcam-opacity-slider');
    const gradcamImg = document.getElementById('gradcam-img');
    const opacityLabel = document.getElementById('opacity-val-label');
    const hotspotMarker = document.getElementById('gradcam-hotspot-marker');

    opacitySlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        const ratio = val / 100.0;
        if (gradcamImg) {
            gradcamImg.style.opacity = ratio;
        }
        if (opacityLabel) {
            opacityLabel.textContent = `${val}%`;
        }

        // Visually dramatic reaction: dynamically scale reticle glow and core pulse
        if (hotspotMarker) {
            // Keep subtle radar reticle at low opacity; intensely glow as slider increases
            hotspotMarker.style.opacity = Math.max(0.18, ratio * 1.15);
            const coreDot = hotspotMarker.querySelector('.hotspot-core-dot');
            if (coreDot) {
                const scale = 0.8 + ratio * 0.45;
                coreDot.style.transform = `scale(${scale})`;
            }
        }
    });

    // B2. Blending Mode Switcher (Screen, Multiply, Normal)
    const blendScreenBtn = document.getElementById('blend-screen-btn');
    const blendMultiplyBtn = document.getElementById('blend-multiply-btn');
    const blendNormalBtn = document.getElementById('blend-normal-btn');
    const blendModes = [
        { btn: blendScreenBtn, mode: 'screen' },
        { btn: blendMultiplyBtn, mode: 'multiply' },
        { btn: blendNormalBtn, mode: 'normal' }
    ];

    blendModes.forEach(({ btn, mode }) => {
        if (!btn) return;
        btn.addEventListener('click', () => {
            if (gradcamImg) {
                gradcamImg.style.mixBlendMode = mode;
                if (mode === 'multiply') {
                    // Multiply mode contrast bump to accentuate dense cloud tops
                    gradcamImg.style.filter = 'contrast(140%) brightness(115%) saturate(130%)';
                } else {
                    gradcamImg.style.filter = 'contrast(115%) saturate(125%)';
                }
            }
            blendModes.forEach(b => {
                if (b.btn) {
                    b.btn.className = "blend-mode-btn px-2 py-0.5 rounded bg-dark-700 hover:bg-dark-600 text-slate-300 text-[11px] transition";
                }
            });
            btn.className = "blend-mode-btn px-2 py-0.5 rounded bg-sky-600 text-white font-semibold text-[11px] transition shadow";
        });
    });

    // B3. Toggle Hotspot Reticle Marker
    const toggleHotspotCheckbox = document.getElementById('toggle-hotspot-reticle');
    if (toggleHotspotCheckbox && hotspotMarker) {
        toggleHotspotCheckbox.addEventListener('change', (e) => {
            hotspotMarker.style.display = e.target.checked ? 'flex' : 'none';
        });
    }

    // C. "What-If" Simulator Toggle
    const simDrawer = document.getElementById('simulator-drawer');
    const toggleSimBtn = document.getElementById('toggle-sim-btn');
    const closeSimBtn = document.getElementById('close-sim-btn');

    toggleSimBtn.addEventListener('click', () => {
        simDrawer.classList.toggle('hidden');
    });
    closeSimBtn.addEventListener('click', () => {
        simDrawer.classList.add('hidden');
    });

    // Simulator input value synchronization
    const simSst = document.getElementById('sim-input-sst');
    const simShear = document.getElementById('sim-input-shear');
    const simVort = document.getElementById('sim-input-vort');
    const simCape = document.getElementById('sim-input-cape');

    simSst.addEventListener('input', (e) => document.getElementById('sim-val-sst').textContent = `${e.target.value} °C`);
    simShear.addEventListener('input', (e) => document.getElementById('sim-val-shear').textContent = `${e.target.value} kt`);
    simVort.addEventListener('input', (e) => document.getElementById('sim-val-vort').textContent = `${e.target.value} ×10⁻⁵ s⁻¹`);
    simCape.addEventListener('input', (e) => document.getElementById('sim-val-cape').textContent = `${e.target.value} J/kg`);

    // Real-Time Oceanic & Atmospheric Data Sync Handler
    async function syncRealtimeAtmosphere() {
        const fetchBtns = [
            document.getElementById('fetch-realtime-btn'),
            document.getElementById('nav-fetch-realtime-btn')
        ].filter(Boolean);

        const banner = document.getElementById('realtime-status-banner');
        const statusText = document.getElementById('realtime-status-text');
        const timeText = document.getElementById('realtime-time-text');

        fetchBtns.forEach(btn => {
            btn.disabled = true;
            btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Syncing Live Data...</span>`;
        });
        if (window.lucide) lucide.createIcons();

        // Make sure the simulator drawer is visible to show updated values
        simDrawer.classList.remove('hidden');

        try {
            const curPos = currentScenarioData ? currentScenarioData.current_position : { lat: 11.4, lon: 87.8 };
            const resp = await fetch(`/api/realtime-atmosphere?lat=${curPos.lat}&lon=${curPos.lon}`);
            if (!resp.ok) throw new Error("Real-time operational feed request failed");
            const liveData = await resp.json();

            // Animate / update input values
            simSst.value = liveData.sst;
            document.getElementById('sim-val-sst').textContent = `${liveData.sst} °C`;

            simShear.value = Math.round(liveData.wind_shear);
            document.getElementById('sim-val-shear').textContent = `${Math.round(liveData.wind_shear)} kt`;

            simCape.value = Math.min(2500, Math.round(liveData.cape));
            document.getElementById('sim-val-cape').textContent = `${Math.round(liveData.cape)} J/kg`;

            simVort.value = liveData.vorticity;
            document.getElementById('sim-val-vort').textContent = `${liveData.vorticity} ×10⁻⁵ s⁻¹`;

            if (banner) {
                banner.classList.remove('hidden');
                statusText.textContent = `LIVE SYNC: SST ${liveData.sst}°C | Shear ${liveData.wind_shear} kt | CAPE ${Math.round(liveData.cape)} J/kg (${liveData.source})`;
                timeText.textContent = liveData.timestamp || "Live Now";
            }

            // Automatically run AI inference on the live data!
            runSimBtn.click();

        } catch (err) {
            console.error("Realtime sync error:", err);
            alert("Could not sync live real-time data: " + err.message);
        } finally {
            fetchBtns.forEach(btn => {
                btn.disabled = false;
                if (btn.id === 'nav-fetch-realtime-btn') {
                    btn.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span><span>Live Real-Time Sync</span>`;
                } else {
                    btn.innerHTML = `<i data-lucide="radio" class="w-3.5 h-3.5 text-emerald-400"></i><span>Fetch Live Real-Time Atmosphere</span>`;
                }
            });
            if (window.lucide) lucide.createIcons();
        }
    }

    const fetchRealtimeBtn = document.getElementById('fetch-realtime-btn');
    const navFetchRealtimeBtn = document.getElementById('nav-fetch-realtime-btn');
    if (fetchRealtimeBtn) fetchRealtimeBtn.addEventListener('click', syncRealtimeAtmosphere);
    if (navFetchRealtimeBtn) navFetchRealtimeBtn.addEventListener('click', syncRealtimeAtmosphere);

    // D. Run AI Inference (What-If Simulation)
    const runSimBtn = document.getElementById('run-sim-btn');
    runSimBtn.addEventListener('click', async () => {
        runSimBtn.disabled = true;
        runSimBtn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Inferring...</span>`;
        if (window.lucide) lucide.createIcons();

        try {
            const payload = {
                sst: parseFloat(simSst.value),
                cape: parseFloat(simCape.value),
                vorticity: parseFloat(simVort.value),
                wind_shear: parseFloat(simShear.value),
                current_wind_kt: parseFloat(simSst.value) > 28 && parseFloat(simShear.value) < 15 ? 40.0 : 25.0,
                latitude: 12.5,
                longitude: 87.0
            };

            const resp = await fetch('/api/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) throw new Error("Simulation API call failed");
            const simResult = await resp.json();
            currentScenarioId = 'custom_simulation';
            renderDashboard(simResult);

        } catch (err) {
            console.error("Simulation error:", err);
            alert("Simulation error: " + err.message);
        } finally {
            runSimBtn.disabled = false;
            runSimBtn.innerHTML = `<i data-lucide="play" class="w-3.5 h-3.5"></i><span>Run AI Inference</span>`;
            if (window.lucide) lucide.createIcons();
        }
    });

    // E. IMD Bulletin Modal
    const bulletinModal = document.getElementById('bulletin-modal');
    const viewBulletinBtn = document.getElementById('view-bulletin-btn');
    const closeBulletinBtn = document.getElementById('close-bulletin-modal');
    const bulletinContent = document.getElementById('bulletin-content');
    const copyBulletinBtn = document.getElementById('copy-bulletin-btn');
    const downloadBulletinBtn = document.getElementById('download-bulletin-btn');

    viewBulletinBtn.addEventListener('click', async () => {
        try {
            bulletinContent.textContent = "Fetching official IMD RSMC bulletin...";
            bulletinModal.classList.remove('hidden');

            const resp = await fetch(`/api/bulletin/${currentScenarioId}`);
            if (!resp.ok) throw new Error("Failed to fetch bulletin");
            const text = await resp.text();
            bulletinContent.textContent = text;
        } catch (err) {
            bulletinContent.textContent = "Error generating bulletin: " + err.message;
        }
    });

    closeBulletinBtn.addEventListener('click', () => {
        bulletinModal.classList.add('hidden');
    });

    copyBulletinBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(bulletinContent.textContent).then(() => {
            copyBulletinBtn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i><span>Copied!</span>`;
            if (window.lucide) lucide.createIcons();
            setTimeout(() => {
                copyBulletinBtn.innerHTML = `<i data-lucide="copy" class="w-3.5 h-3.5"></i><span>Copy Text</span>`;
                if (window.lucide) lucide.createIcons();
            }, 2000);
        });
    });

    downloadBulletinBtn.addEventListener('click', () => {
        const blob = new Blob([bulletinContent.textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `IMD_RSMC_Cyclone_Bulletin_${currentScenarioId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Reset Map View
    document.getElementById('recenter-map-btn').addEventListener('click', () => {
        if (leafletMap && currentScenarioData) {
            updateMapLayers(currentScenarioData);
        }
    });

    // 11. Multi-Spectral Channel Switcher
    function setupChannelSwitcher() {
        const btnTir1 = document.getElementById('btn-chan-tir1');
        const btnWv = document.getElementById('btn-chan-wv');
        const btnVis = document.getElementById('btn-chan-vis');
        const insatImg = document.getElementById('insat-img');

        function setActiveChannel(btn, chanKey) {
            [btnTir1, btnWv, btnVis].forEach(b => {
                if (b) b.className = "sat-chan-btn px-2.5 py-0.5 rounded bg-dark-700 hover:bg-dark-600 text-slate-300 text-[11px] transition";
            });
            if (btn) btn.className = "sat-chan-btn px-2.5 py-0.5 rounded bg-sky-600 text-white font-medium text-[11px] transition";

            if (currentScenarioData && currentScenarioData.satellite_channels && currentScenarioData.satellite_channels[chanKey]) {
                insatImg.src = currentScenarioData.satellite_channels[chanKey];
            }
        }

        if (btnTir1) btnTir1.addEventListener('click', () => setActiveChannel(btnTir1, 'tir1'));
        if (btnWv) btnWv.addEventListener('click', () => setActiveChannel(btnWv, 'wv'));
        if (btnVis) btnVis.addEventListener('click', () => setActiveChannel(btnVis, 'vis'));
    }

    // 12. Track Animation Player
    let isAnimating = false;
    let animationInterval = null;
    let animMarker = null;

    function setupTrackAnimation() {
        const playBtn = document.getElementById('play-track-btn');
        const playText = document.getElementById('play-track-text');
        if (!playBtn) return;

        playBtn.addEventListener('click', () => {
            if (isAnimating) {
                stopAnimation();
            } else {
                startAnimation();
            }
        });

        function startAnimation() {
            if (!currentScenarioData) return;
            const past = currentScenarioData.past_track || [];
            const forecast = currentScenarioData.forecast_120h || [];
            const cur = currentScenarioData.current_position;

            const allSteps = [
                ...past.map(p => ({ lat: p.lat, lon: p.lon, label: `Observed: ${p.stage} (${p.wind_kt} kt)` })),
                { lat: cur.lat, lon: cur.lon, label: `Current Center (${currentScenarioData.atmospherics.current_wind_kt} kt)` },
                ...forecast.map(f => ({ lat: f.lat, lon: f.lon, label: `Forecast +${f.horizon_hours}h: ${f.category} (${f.max_wind_kt} kt)` }))
            ];

            isAnimating = true;
            playText.textContent = "Pause Animation";
            playBtn.classList.replace('bg-sky-950/80', 'bg-amber-950/80');
            playBtn.classList.replace('border-sky-600/60', 'border-amber-600/60');

            let stepIdx = 0;
            if (!animMarker) {
                animMarker = L.circleMarker([allSteps[0].lat, allSteps[0].lon], {
                    radius: 10,
                    fillColor: '#f59e0b',
                    color: '#ffffff',
                    weight: 3,
                    fillOpacity: 0.95
                }).addTo(leafletMap);
            }

            animationInterval = setInterval(() => {
                if (stepIdx >= allSteps.length) {
                    stepIdx = 0;
                }
                const pt = allSteps[stepIdx];
                animMarker.setLatLng([pt.lat, pt.lon]);
                animMarker.bindPopup(`<strong>${pt.label}</strong>`).openPopup();
                leafletMap.panTo([pt.lat, pt.lon], { animate: true, duration: 0.7 });
                stepIdx++;
            }, 1500);
        }

        function stopAnimation() {
            isAnimating = false;
            if (animationInterval) clearInterval(animationInterval);
            if (animMarker && leafletMap) {
                leafletMap.removeLayer(animMarker);
                animMarker = null;
            }
            playText.textContent = "Animate Track";
            playBtn.classList.replace('bg-amber-950/80', 'bg-sky-950/80');
            playBtn.classList.replace('border-amber-600/60', 'border-sky-600/60');
        }
    }

    // 13. Initial Application Boot
    initMap();
    initCharts();
    setupChannelSwitcher();
    setupTrackAnimation();
    loadScenario('precursor_2026');
});
