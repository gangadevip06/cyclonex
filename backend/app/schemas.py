"""
CYCLONEX - Pydantic Data Models & REST Schemas
Smart India Hackathon 2026 (Problem Statement ID: SIH26070)
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class PhysicalVariables(BaseModel):
    basin: str = Field(default="bay_of_bengal", description="Ocean basin identifier")
    latitude: float
    longitude: float
    sst: float = Field(..., description="Sea Surface Temperature in deg C")
    surface_pressure: float = Field(..., description="Central / Surface Pressure in hPa")
    mslp_deficit: float = Field(..., description="Pressure deficit (1013.25 - P_sfc) in hPa")
    wind_speed_10m: float = Field(..., description="10-meter surface wind speed in knots")
    wind_850: float = Field(..., description="850 hPa low-level wind speed in knots")
    wind_200: float = Field(..., description="200 hPa upper-troposphere wind speed in knots")
    wind_shear: float = Field(..., description="200-850 hPa deep-layer vertical wind shear in knots")
    vorticity: float = Field(..., description="850 hPa relative vorticity in 10^-5 s^-1")
    cape: float = Field(..., description="Convective Available Potential Energy in J/kg")
    rh_700: float = Field(..., description="700 hPa mid-tropospheric relative humidity in %")
    ocean_current_velocity: Optional[float] = Field(default=0.45, description="Surface ocean current speed in m/s")
    timestamp: str
    source: str = Field(default="Open-Meteo Marine & ERA5 Operational Sync")
    status_flags: Dict[str, str] = Field(default_factory=dict)

class ForecastPoint(BaseModel):
    step: int
    hours_ahead: int
    valid_time: str
    lat: float
    lon: float
    wind_kt: float
    wind_kmh: float
    pressure_hpa: float
    category: str
    category_code: str
    cone_radius_km: float

class SHAPContributor(BaseModel):
    feature: str
    feature_name: str
    value: float
    impact: float
    direction: str  # "amplifying" or "inhibiting"
    unit: str
    description: str

class SatelliteMetrics(BaseModel):
    min_cloud_temp_c: float
    cold_cloud_fraction: float
    cdo_compactness: float
    spiral_organization: float
    dvorak_t_number: float
    satellite_derived_wind_kt: float
    channel: str = "TIR-1 (10.8 µm)"

class RegionalAdvisories(BaseModel):
    cyclone_stage: str
    landfall_timeline: str
    evacuation_directives: List[str]
    plain_language_xai: str
    bulletin_english: str
    bulletin_tamil: str
    bulletin_telugu: str
    bulletin_odia: str
    bulletin_bengali: str
    bulletin_hindi: str
    generated_at: str
    gemini_assisted: bool

class ForecastResponse(BaseModel):
    basin: str
    basin_name: str
    current_position: Dict[str, float]
    current_telemetry: PhysicalVariables
    genesis_probability_120h: float
    intensity_category: str
    intensity_code: str
    current_wind_kt: float
    current_wind_kmh: float
    central_pressure_hpa: float
    ai_confidence: float
    multimodal_weights: Dict[str, float]
    satellite_metrics: SatelliteMetrics
    satellite_frame: str  # Base64 data URL
    gradcam_frame: str    # Base64 data URL
    gradcam_hotspot: Dict[str, Any]
    shap_contributors: List[SHAPContributor]
    forecast_120h: List[ForecastPoint]
    landfall: Dict[str, Any]
    physics_governance: Dict[str, Any]
    initial_advisories: Optional[RegionalAdvisories] = None

class AdvisoryRequest(BaseModel):
    forecast: ForecastResponse
    languages: Optional[List[str]] = Field(default=["english", "tamil", "telugu", "odia", "bengali", "hindi"])

class WhatIfRequest(BaseModel):
    basin: str = "bay_of_bengal"
    lat: float = 12.5
    lon: float = 86.0
    sst_delta: float = Field(default=0.0, description="Perturbation in SST (deg C), e.g. +2.0 or -1.5")
    shear_delta: float = Field(default=0.0, description="Perturbation in Wind Shear (kt), e.g. -8.0 or +10.0")
    cape_delta: float = Field(default=0.0, description="Perturbation in CAPE (J/kg)")
    vorticity_delta: float = Field(default=0.0, description="Perturbation in Vorticity (10^-5 s^-1)")
