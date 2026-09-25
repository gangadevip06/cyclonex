@echo off
title CYCLONEX - AI Tropical Cyclone Warning System (SIH 2026)
cd /d "%~dp0"
echo ======================================================================
echo   CYCLONEX: Multimodal AI Cyclone Forecasting Platform
echo   Smart India Hackathon 2026 (Problem Statement ID: SIH26070)
echo ======================================================================
echo   * Starting AI Engine and GIS Operations Center...
echo   * Dashboard will open at: http://127.0.0.1:8000
echo ======================================================================
start "" "http://127.0.0.1:8000"
python backend\app.py
pause
