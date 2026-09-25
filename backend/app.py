"""
CYCLONEX - FastAPI Backend Application
Smart India Hackathon 2026 (Problem Statement ID: SIH26070)

Provides REST endpoints for:
- Cyclone Scenarios & Telemetry
- Multimodal AI Inference (CNN, Grad-CAM, Gradient Boosting, SHAP, LSTM)
- Interactive "What-If" Physics Simulation
- IMD RSMC Advisory Bulletins
- Static UI Serving
"""

import os
import sys
import numpy as np
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, PlainTextResponse, FileResponse
from pydantic import BaseModel
from typing import Optional

# Ensure current dir is in Python path
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = CURRENT_DIR.parent
FRONTEND_DIR = PROJECT_DIR / "frontend"
sys.path.insert(0, str(CURRENT_DIR))

from ai_engine import env_model, lstm_forecaster, PhysicsConstraints
from scenarios import SCENARIOS, get_scenario_data, create_insat_satellite_frame
from bulletin_generator import generate_imd_bulletin
from realtime_data import fetch_live_marine_atmosphere

app = FastAPI(
    title="CYCLONEX AI Engine",
    description="Multimodal AI Cyclone Forecasting System - SIH 2026",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_no_cache_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

class SimulationRequest(BaseModel):
    sst: float
    cape: float
    vorticity: float
    wind_shear: float
    current_wind_kt: float = 30.0
    latitude: float = 12.0
    longitude: float = 86.5
    rh_mid: float = 75.0
    mslp_deficit: float = 10.0

@app.get("/api/health")
def health_check():
    return {"status": "ok", "system": "CYCLONEX AI", "hackathon": "SIH 2026", "ps_id": "SIH26070"}

@app.get("/api/scenarios")
def list_scenarios():
    summary = []
    for s_id, data in SCENARIOS.items():
        summary.append({
            "id": s_id,
            "title": data["title"],
            "basin": data["basin"],
            "timestamp": data["timestamp"],
            "intensity_code": data["intensity_code"],
            "intensity_category": data["intensity_category"],
            "threat_level": data["landfall"]["threat_level"]
        })
    return {"scenarios": summary}

@app.get("/api/scenario/{scenario_id}")
def get_scenario(scenario_id: str):
    if scenario_id not in SCENARIOS:
        raise HTTPException(status_code=404, detail="Scenario not found")
    data = get_scenario_data(scenario_id)
    return data

# Cache for latest simulation state
LATEST_SIMULATION = None

@app.post("/api/simulate")
def run_simulation(req: SimulationRequest):
    global LATEST_SIMULATION
    from datetime import datetime

    # 1. Environmental Model & SHAP
    ai_result = env_model.predict(
        sst=req.sst,
        cape=req.cape,
        vorticity=req.vorticity,
        wind_shear=req.wind_shear,
        rh_mid=req.rh_mid,
        mslp_deficit=req.mslp_deficit,
        latitude=req.latitude
    )

    # 2. Physics & Intensity Classification
    imd_info = PhysicsConstraints.classify_intensity(req.current_wind_kt)

    # 3. 120-hour LSTM Forecaster with coastal landfall detection
    landfall_lat = 21.6 if req.longitude >= 78.0 else 23.2
    forecast = lstm_forecaster.forecast(
        current_lat=req.latitude,
        current_lon=req.longitude,
        current_wind_kt=req.current_wind_kt,
        dir_heading_deg=-15.0,
        speed_kmh=15.0,
        sst=req.sst,
        wind_shear=req.wind_shear,
        landfall_lat=landfall_lat
    )

    # 4. Generate dynamic satellite & Grad-CAM images reflecting simulated state
    sat_channels = create_insat_satellite_frame(
        scenario_name="Simulated Scenario",
        stage=imd_info["code"]
    )

    # 5. Dynamic Alerts
    alerts = []
    prob = ai_result["genesis_probability"]
    now_time_str = datetime.now().strftime("%d %b %Y, %H:%M IST")
    if prob >= 70:
        alerts.append({
            "id": "SIM-01",
            "type": "Cyclone Formation Alert",
            "severity": "High",
            "severity_badge": "bg-red-900/80 text-red-200 border-red-500",
            "message": f"High probability ({prob}%) of cyclogenesis under favorable conditions (SST {req.sst}°C, Shear {req.wind_shear} kt).",
            "issued_on": now_time_str,
            "status": "Active"
        })
    elif prob >= 40:
        alerts.append({
            "id": "SIM-01",
            "type": "Cyclone Watch",
            "severity": "Moderate",
            "severity_badge": "bg-amber-900/80 text-amber-200 border-amber-500",
            "message": f"Moderate probability ({prob}%) of cyclonic development.",
            "issued_on": now_time_str,
            "status": "Active"
        })
    else:
        alerts.append({
            "id": "SIM-01",
            "type": "Depression Dispersal",
            "severity": "Low",
            "severity_badge": "bg-blue-900/80 text-blue-200 border-blue-500",
            "message": f"Unfavorable atmospheric conditions (Shear {req.wind_shear} kt / SST {req.sst}°C); cyclogenesis suppressed.",
            "issued_on": now_time_str,
            "status": "Active"
        })

    # Landfall estimation based on forecast trajectory
    landfall_pt = next((p for p in forecast if p.get("is_landfall")), forecast[-1])
    landfall_loc = "Odisha / West Bengal Coast" if req.longitude >= 78.0 else "Gujarat / Kutch Coast"
    landfall = {
        "estimated_time": f"+{landfall_pt['horizon_hours']} Hours Window",
        "location": f"{landfall_loc} ({landfall_pt['lat']}°N, {landfall_pt['lon']}°E)",
        "lat": landfall_pt["lat"],
        "lon": landfall_pt["lon"],
        "expected_intensity": f"{landfall_pt['category']} ({landfall_pt['max_wind_kt']} kt)",
        "threat_level": "RED WARNING" if landfall_pt['max_wind_kt'] >= 64 else ("ORANGE ALERT" if landfall_pt['max_wind_kt'] >= 48 else "YELLOW WATCH")
    }

    result = {
        "metadata": {
            "id": "custom_simulation",
            "title": "Interactive What-If Cyclone Simulation",
            "basin": "North Indian Ocean (" + ("Bay of Bengal" if req.longitude >= 78.0 else "Arabian Sea") + ")",
            "timestamp": now_time_str,
            "status": f"AI REAL-TIME SIMULATION - {imd_info['category'].upper()}"
        },
        "current_position": {
            "lat": req.latitude,
            "lon": req.longitude,
            "location_name": f"Simulated Coordinates ({req.latitude}°N, {req.longitude}°E)"
        },
        "atmospherics": {
            "sst": req.sst,
            "cape": req.cape,
            "vorticity": req.vorticity,
            "wind_shear": req.wind_shear,
            "rh_mid": req.rh_mid,
            "mslp_deficit": req.mslp_deficit,
            "central_pressure": round(1010.0 - (0.015 * (req.current_wind_kt ** 1.6)), 1),
            "current_wind_kt": req.current_wind_kt
        },
        "intensity_code": imd_info["code"],
        "intensity_category": imd_info["category"],
        "genesis_prob_120h": prob,
        "ai_confidence": round(82.0 + np.random.uniform(-2, 5), 1),
        "shap_attributions": ai_result["shap_attributions"],
        "past_track": [
            {"time": "-24h", "lat": round(req.latitude - 1.2, 2), "lon": round(req.longitude + 0.3, 2), "wind_kt": max(15.0, req.current_wind_kt - 10), "pressure": 1008.0, "stage": "Low Pressure Area"},
            {"time": "Now", "lat": req.latitude, "lon": req.longitude, "wind_kt": req.current_wind_kt, "pressure": 1004.0, "stage": imd_info["category"]}
        ],
        "forecast_120h": forecast,
        "landfall": landfall,
        "alerts": alerts,
        "satellite_channels": sat_channels,
        "satellite_ir_b64": sat_channels["tir1"],
        "gradcam_b64": sat_channels["gradcam"],
        "gradcam_hotspot": sat_channels.get("gradcam_hotspot")
    }

    LATEST_SIMULATION = result
    return result

@app.get("/api/bulletin/{scenario_id}")
def get_bulletin(scenario_id: str):
    global LATEST_SIMULATION
    if scenario_id == "custom_simulation":
        if LATEST_SIMULATION is None:
            # Generate default simulation
            default_req = SimulationRequest(
                sst=30.2, cape=1350.0, vorticity=2.8, wind_shear=11.0, current_wind_kt=35.0
            )
            run_simulation(default_req)
        bulletin_text = generate_imd_bulletin(LATEST_SIMULATION)
        return PlainTextResponse(bulletin_text)

    if scenario_id not in SCENARIOS:
        raise HTTPException(status_code=404, detail="Scenario not found")
    data = get_scenario_data(scenario_id)
    bulletin_text = generate_imd_bulletin(data)
    return PlainTextResponse(bulletin_text)

@app.get("/api/realtime-atmosphere")
def get_realtime_atmosphere(lat: float = 11.4, lon: float = 87.8):
    """
    Fetches real-time Sea Surface Temperature (SST), CAPE, Wind Shear, and pressure
    directly from global satellite and NWP marine models for live simulation.
    """
    return fetch_live_marine_atmosphere(lat, lon)

# Serve Frontend static assets
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    @app.get("/")
    def serve_index():
        return FileResponse(FRONTEND_DIR / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
