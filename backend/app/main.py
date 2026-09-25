"""
CYCLONEX - FastAPI Application & REST Endpoints
Smart India Hackathon 2026 (Problem Statement ID: SIH26070)
"""

import io
import sys
from pathlib import Path
import numpy as np
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

try:
    from scenarios import SCENARIOS, get_scenario_data
except ImportError:
    SCENARIOS = {}
    get_scenario_data = None

from .config import settings
from .schemas import (
    PhysicalVariables, ForecastResponse, AdvisoryRequest, 
    RegionalAdvisories, WhatIfRequest
)
from .services.data_sync import (
    fetch_live_environmental_telemetry, 
    fetch_satellite_imagery_layer, 
    BASIN_DEFAULTS
)
from .services.ml_pipeline import ml_inference_engine
from .services.gemini_advisor import generate_regional_advisories, _generate_fallback_bulletin

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Physics-Informed Multimodal AI for Early Tropical Cyclone Forecasting (SIH 2026)"
)

# Enable CORS for React Vite Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "CYCLONEX-AI-Core",
        "ps_id": settings.SIH_PS_ID,
        "version": settings.VERSION,
        "gemini_configured": bool(settings.GEMINI_API_KEY)
    }

@app.get("/api/scenarios")
def list_scenarios():
    """Returns available historical benchmark cyclone events."""
    if not SCENARIOS:
        return {"scenarios": []}
    summary = []
    for s_id, data in SCENARIOS.items():
        summary.append({
            "id": s_id,
            "title": data.get("title", s_id),
            "basin": data.get("basin", ""),
            "timestamp": data.get("timestamp", ""),
            "intensity_code": data.get("intensity_code", ""),
            "intensity_category": data.get("intensity_category", ""),
            "threat_level": data.get("landfall", {}).get("threat_level", "Moderate")
        })
    return {"scenarios": summary}

@app.get("/api/scenario/{scenario_id}")
def get_scenario(scenario_id: str):
    """Returns detailed telemetry, imagery, forecast, and alerts for a scenario."""
    if scenario_id not in SCENARIOS or not get_scenario_data:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return get_scenario_data(scenario_id)

@app.get("/api/live-data", response_model=PhysicalVariables)
def get_live_data(
    basin: str = Query(default="bay_of_bengal", pattern="^(bay_of_bengal|arabian_sea)$"),
    lat: float = Query(default=None),
    lon: float = Query(default=None)
):
    """
    Synchronizes real-time environmental variables from Open-Meteo Marine & Atmospheric APIs.
    """
    coords = BASIN_DEFAULTS.get(basin, BASIN_DEFAULTS["bay_of_bengal"])
    target_lat = lat if isinstance(lat, (int, float)) else coords["lat"]
    target_lon = lon if isinstance(lon, (int, float)) else coords["lon"]

    telemetry = fetch_live_environmental_telemetry(lat=target_lat, lon=target_lon, basin=basin)
    return telemetry

@app.post("/api/forecast", response_model=ForecastResponse)
def compute_forecast(
    basin: str = Query(default="bay_of_bengal"),
    lat: float = Query(default=None),
    lon: float = Query(default=None)
):
    """
    Runs end-to-end Multimodal AI Inference:
    1. Synchronizes live telemetry
    2. Fetches & georeferences satellite layer
    3. CycloneCNN extracts cloud features
    4. XGBoost computes environmental score
    5. PhysicsEngine applies MPI, Coriolis, and shear rules
    6. LSTM generates 120-hour forecast points & cone
    7. SHAP and Grad-CAM compute explainability layers
    """
    coords = BASIN_DEFAULTS.get(basin, BASIN_DEFAULTS["bay_of_bengal"])
    target_lat = lat if isinstance(lat, (int, float)) else coords["lat"]
    target_lon = lon if isinstance(lon, (int, float)) else coords["lon"]

    # 1. Real telemetry sync
    telemetry = fetch_live_environmental_telemetry(lat=target_lat, lon=target_lon, basin=basin)

    # 2. Real satellite layer sync
    sat_b64, norm_field, sat_meta = fetch_satellite_imagery_layer(
        lat=target_lat, lon=target_lon, basin=basin, size=512
    )

    # 3. Multimodal inference execution
    forecast = ml_inference_engine.run_inference(
        telemetry=telemetry,
        satellite_norm=norm_field,
        satellite_b64=sat_b64
    )
    now_str = datetime.now().strftime("%d %b %Y, %H:%M IST")
    forecast.initial_advisories = _generate_fallback_bulletin(forecast, now_str)
    return forecast

@app.post("/api/generate-advisories", response_model=RegionalAdvisories)
def create_advisories(request: AdvisoryRequest):
    """
    Invokes Google Gemini API to synthesize an official IMD operational bulletin
    and translate it into coastal regional languages (Tamil, Telugu, Odia, Bengali, Hindi, English).
    """
    advisories = generate_regional_advisories(request.forecast)
    return advisories

@app.post("/api/what-if", response_model=ForecastResponse)
def simulate_what_if(req: WhatIfRequest):
    """
    Interactive Physics Simulator:
    Allows user to perturb physical variables (SST, Shear, CAPE, Vorticity)
    and re-evaluates the Multimodal AI forecast in real time.
    """
    base_tv = fetch_live_environmental_telemetry(lat=req.lat, lon=req.lon, basin=req.basin)

    # Apply user perturbations
    perturbed_tv = PhysicalVariables(
        basin=req.basin,
        latitude=req.lat,
        longitude=req.lon,
        sst=round(base_tv.sst + req.sst_delta, 1),
        surface_pressure=base_tv.surface_pressure,
        mslp_deficit=base_tv.mslp_deficit,
        wind_speed_10m=base_tv.wind_speed_10m,
        wind_850=base_tv.wind_850,
        wind_200=base_tv.wind_200,
        wind_shear=max(3.0, round(base_tv.wind_shear + req.shear_delta, 1)),
        vorticity=max(0.2, round(base_tv.vorticity + req.vorticity_delta, 2)),
        cape=max(200.0, round(base_tv.cape + req.cape_delta, 1)),
        rh_700=base_tv.rh_700,
        ocean_current_velocity=base_tv.ocean_current_velocity,
        timestamp=f"{base_tv.timestamp} (What-If Sim)",
        source="Interactive Physics Perturbation Simulator",
        status_flags=base_tv.status_flags
    )

    sat_b64, norm_field, _ = fetch_satellite_imagery_layer(
        lat=req.lat, lon=req.lon, basin=req.basin, size=512
    )

    forecast = ml_inference_engine.run_inference(
        telemetry=perturbed_tv,
        satellite_norm=norm_field,
        satellite_b64=sat_b64
    )
    now_str = datetime.now().strftime("%d %b %Y, %H:%M IST")
    forecast.initial_advisories = _generate_fallback_bulletin(forecast, now_str)
    return forecast

@app.post("/api/upload-satellite")
async def upload_satellite_image(file: UploadFile = File(...)):
    """
    Accepts user-provided satellite image (.jpg, .png) or patch,
    processes it through CycloneCNN, and returns visual features.
    """
    try:
        contents = await file.read()
        pil_img = Image.open(io.BytesIO(contents)).convert("L").resize((512, 512))
        norm_field = np.array(pil_img, dtype=np.float32) / 255.0
        
        # Extract features
        features = ml_inference_engine.cnn_model.extract_satellite_features(norm_field)
        return {
            "filename": file.filename,
            "status": "success",
            "features": features.model_dump()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image parsing error: {str(e)}")
