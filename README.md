# CYCLONEX: Physics-Informed Multimodal AI for Early Cyclone Forecasting

**Smart India Hackathon 2026 (SIH 2026)**  
**Problem Statement ID:** SIH26070  
**Title:** Artificial Intelligence (AI) / Machine Learning (ML) based system for identification, classification, and prediction of different tropical cyclone patterns using multi-source satellite data.  
**Theme:** Disaster Management | **Category:** Software  

---

## 🌪️ System Overview

**CYCLONEX** is an end-to-end, production-grade operational meteorology and disaster management intelligence platform engineered for the **North Indian Ocean (Bay of Bengal & Arabian Sea)**.

The platform eliminates synthetic/mock data by synchronizing **real-time meteorological telemetry and geostationary satellite imagery** directly from live global APIs (Open-Meteo Marine & Atmospheric Reanalysis, NASA GIBS WMTS, IMD INSAT-3D Asia Sector, and NOAA IBTrACS). It couples deep convolutional computer vision with thermodynamic gradient boosting under strict atmospheric physics constraints, generating 120-hour track forecasts, intensity projections, SHAP physical feature attributions, Grad-CAM neural attention heatmaps, and official IMD RSMC advisory bulletins translated into 6 regional languages via the **Google Gemini API**.

---

## 🏗️ Decoupled Production Architecture

CYCLONEX features a fully decoupled, cloud-ready architecture:

```
cyclonex/
├── backend/                             # High-Performance FastAPI Backend
│   ├── app/
│   │   ├── main.py                      # REST endpoints & CORS configuration
│   │   ├── config.py                    # Environment settings (Pydantic Settings)
│   │   ├── schemas.py                   # Strict Pydantic v2 data models
│   │   └── services/
│   │       ├── data_sync.py             # Live Open-Meteo Marine & Atmospheric synchronizer
│   │       ├── data_sync_sat.py         # NASA GIBS & IMD INSAT-3D image synchronizer
│   │       ├── ml_pipeline.py           # PyTorch CNN, XGBoost, PhysicsEngine, LSTM forecaster
│   │       ├── xai_service.py           # SHAP TreeExplainer & PyTorch Grad-CAM engine
│   │       └── gemini_advisor.py        # Google Gen AI SDK (Gemini 2.5) bulletin & translator
│   ├── requirements.txt                 # Backend Python dependencies
│   ├── .env.example                     # Environment configuration template
│   └── .env                             # Local environment configuration
├── frontend/                            # Modern Single Page Application (React 18 + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx               # Basin selector, sync badge, What-If toggle
│   │   │   ├── TelemetryGrid.jsx        # 6 live atmospheric/oceanic parameter cards
│   │   │   ├── GISMap.jsx               # Interactive Leaflet map with 120h cone & track
│   │   │   ├── ForecastChart.jsx        # Recharts 120h wind/pressure forecast with IMD scales
│   │   │   ├── XAISection.jsx           # Satellite IR viewer, Magma Grad-CAM, SHAP bar chart
│   │   │   ├── AlertPanel.jsx           # IMD RSMC bulletins, 6-language switcher, plain XAI
│   │   │   └── WhatIfSimulator.jsx      # Interactive physical perturbation modal
│   │   ├── services/
│   │   │   └── api.js                   # Axios client targeting backend API
│   │   ├── App.jsx                      # Main dashboard orchestrator
│   │   ├── index.css                    # Tailwind CSS + custom radar/pulsing animations
│   │   └── main.jsx                     # React entry point
│   ├── package.json                     # Frontend dependencies
│   ├── vite.config.js                   # Vite dev server & proxy settings
│   └── tailwind.config.js               # Meteorological color palette & Tailwind configuration
├── run.sh                               # Unified bash startup script (Linux/macOS)
├── run.bat                              # Unified batch startup script (Windows)
├── run.py                               # Cross-platform Python startup script
└── README.md                            # Comprehensive system documentation
```

---

## ⚡ Core Capabilities & Technologies

### 1. Live Meteorological & Satellite Synchronization (No Mock Data)
- **Open-Meteo Marine API**: Live Sea Surface Temperature (SST) at current coordinates.
- **Open-Meteo Weather API**: 10m wind speeds, MSLP, 850 hPa relative vorticity, 200–850 hPa vertical wind shear (vector differential between $u/v_{200}$ and $u/v_{850}$), Convective Available Potential Energy (CAPE), and 700 hPa Relative Humidity (RH700).
- **IMD INSAT-3D & NASA GIBS**: Live imagery from INSAT-3D Asia Sector (`3Dasiasec_ir1.jpg`, `3Dasiasec_ctbt.jpg`) or NASA GIBS MODIS/VIIRS near-real-time thermal infrared with Dvorak BD-curve palette rendering.

### 2. Physics-Informed Multimodal AI Pipeline
- **Visual Branch (PyTorch CNN)**: Convolutional neural network analyzing infrared imagery to extract eye compactness, central dense overcast (CDO) spiral curvature, and Dvorak T-number estimates.
- **Thermodynamic Branch (XGBoost)**: Gradient-boosted decision trees processing the 6 critical cyclogenesis parameters.
- **Physics Constraint Engine**:
  - **Emanuel Maximum Potential Intensity (MPI)** limit: Restricts maximum wind speeds based on SST and thermodynamic limits.
  - **Coriolis Cutoff**: Cyclogenesis suppression below $5^\circ\text{N}$ ($f = 2\Omega\sin\phi$).
  - **Shear Penalty**: Non-linear exponential decay when 200–850 hPa wind shear exceeds 20 kt.
  - **Kaplan Post-Landfall Decay**: Calibrated exponential decay ($V(t) = V_b + (V_0 - V_b)e^{-\alpha t}$) upon coastal crossing.
- **Multimodal Fusion**: Dynamically combines 45% visual satellite features with 55% environmental thermodynamic reanalysis.
- **120-Hour LSTM Forecaster**: Generates multi-step track coordinates and wind speeds with an expanding 70% Cone of Uncertainty (45 km at 24h to 240 km at 120h).

### 3. Explainable AI (XAI)
- **PyTorch Grad-CAM**: Computes gradient-weighted class activations mapped to the perceptually uniform **Magma** colormap, pinpointing the exact convective eyewall and feeder bands that drove the neural network's classification. Includes interactive opacity blending and blend modes (Screen, Multiply, Normal).
- **Tree SHAP (SHapley Additive exPlanations)**: Exact feature attributions quantifying each physical variable's positive or negative push against baseline climatology.

### 4. Google Gemini API Integration (`GEMINI_API_KEY`)
- Powered by the official Google Gen AI SDK (`google.genai`).
- Generates structured, standard **IMD RSMC Operational Bulletins** with technical meteorological synopses, sea condition warnings, and district-level evacuation advisories.
- **Multi-Lingual Regional Translation**: Simultaneously generates emergency alerts in **English, Hindi, Tamil, Telugu, Odia, and Bengali** for coastal state authorities and fishermen communities.
- **Plain-Language Explainability**: Translates complex neural attention and thermodynamic SHAP parameters into actionable advice for non-technical emergency responders.
- Seamless algorithmic fallback ensures high availability if API credentials are temporarily absent.

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+** (Python 3.12 recommended)
- **Node.js 18+** & **npm 9+**

### 1. Configure Environment Variables
In `cyclonex/backend/.env`:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
HOST=127.0.0.1
PORT=8000
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
DEFAULT_BOB_LAT=12.5
DEFAULT_BOB_LON=86.0
DEFAULT_AS_LAT=14.0
DEFAULT_AS_LON=66.5
```

### 2. One-Click Launch (Recommended)
From the repository root `cyclonex/`:

**On Windows (PowerShell or CMD):**
```powershell
python run.py
# or
.\run.bat
```

**On Linux or macOS:**
```bash
chmod +x run.sh
./run.sh
```

This concurrently launches:
- **FastAPI Backend**: `http://127.0.0.1:8000` (API Docs: `http://127.0.0.1:8000/docs`)
- **Vite React Frontend**: `http://localhost:5173`

---

## 📡 REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health check and model loading status |
| `GET` | `/api/live-data?basin={bob\|as}` | Live Open-Meteo & INSAT-3D data synchronization |
| `POST` | `/api/forecast?basin={bob\|as}` | Multimodal 120-hour forecast, SHAP values, and Grad-CAM |
| `POST` | `/api/generate-advisories` | Gemini-powered IMD bulletins & 6-language regional alerts |
| `POST` | `/api/what-if` | Interactive physical perturbation simulation |
| `POST` | `/api/upload-satellite` | Custom satellite image upload and inference |

---

## 👥 Smart India Hackathon Alignment
- **Problem Statement**: SIH26070
- **Organization**: Ministry of Earth Sciences / India Meteorological Department (IMD)
- **Impact**: Provides up to a 120-hour early warning window with explainable AI, physics-consistent intensity bounds, and localized regional advisories—significantly reducing coastal vulnerability, saving marine lives, and protecting critical port infrastructure.
