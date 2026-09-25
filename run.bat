@echo off
echo ==================================================================
echo   Starting CYCLONEX Operations Platform (SIH26070)
echo   Backend: Port 8001 ^| Frontend: Port 5173
echo ==================================================================
cd /d "%~dp0"
start "CYCLONEX Backend" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8001"
start "CYCLONEX Frontend" cmd /k "cd frontend && npm run dev"
echo Services launched in separate windows.
echo Dashboard: http://localhost:5173
echo API Docs: http://127.0.0.1:8001/docs
