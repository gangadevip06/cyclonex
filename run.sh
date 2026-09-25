#!/usr/bin/env bash
# CYCLONEX Startup Script (FastAPI Backend + Vite Frontend)
# Smart India Hackathon 2026 (Problem Statement ID: SIH26070)

echo "=================================================================="
echo "  Starting CYCLONEX Multi-Agent Cyclone Operations Platform"
echo "  SIH26070 | Backend: Port 8000 | Frontend: Port 5173"
echo "=================================================================="

# Function to clean up background processes on exit
cleanup() {
  echo ""
  echo "Shutting down CYCLONEX services..."
  kill $(jobs -p) 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

# Start FastAPI Backend
echo "-> Launching FastAPI Backend on http://127.0.0.1:8000..."
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to initialize
sleep 2

# Start Vite React Frontend
echo "-> Launching Vite React Frontend on http://127.0.0.1:5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "------------------------------------------------------------------"
echo "  All CYCLONEX services active!"
echo "  Dashboard: http://localhost:5173"
echo "  Backend API Docs: http://127.0.0.1:8000/docs"
echo "------------------------------------------------------------------"

wait
