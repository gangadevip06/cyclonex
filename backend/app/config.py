"""
CYCLONEX - Backend Configuration & Environment Settings
Smart India Hackathon 2026 (Problem Statement ID: SIH26070)
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_NAME: str = "CYCLONEX - Physics-Informed Multimodal AI Cyclone Forecaster"
    SIH_PS_ID: str = "SIH26070"
    VERSION: str = "2.0.0"
    
    # Gemini API Key
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    # Server network settings
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", 8000))
    
    # CORS Origins for Vite React frontend
    CORS_ORIGINS: list[str] = [
        origin.strip() for origin in os.getenv(
            "CORS_ORIGINS", 
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
        ).split(",") if origin.strip()
    ]

    # Targeted Basin Coordinates (North Indian Ocean)
    BASIN_COORDINATES = {
        "bay_of_bengal": {"lat": 12.5, "lon": 86.0, "name": "Bay of Bengal (Central-Southeast Basin)"},
        "arabian_sea": {"lat": 14.0, "lon": 66.5, "name": "Arabian Sea (East-Central Basin)"}
    }

settings = Settings()
