"""
CYCLONEX - Cross-Platform Application Runner (FastAPI + Vite)
Smart India Hackathon 2026 (Problem Statement ID: SIH26070)
"""

import os
import sys
import time
import subprocess
import signal
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"

def main():
    print("=" * 70)
    print("  CYCLONEX: Physics-Informed Multimodal AI Cyclone Forecaster")
    print("  Smart India Hackathon 2026 (Problem Statement ID: SIH26070)")
    print("=" * 70)
    print("  Starting FastAPI Backend: http://127.0.0.1:8001")
    print("  Starting Vite React Frontend: http://localhost:5173")
    print("=" * 70)

    # 1. Start Backend
    backend_cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8001"]
    backend_proc = subprocess.Popen(backend_cmd, cwd=str(BACKEND_DIR))

    # 2. Start Frontend
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_proc = subprocess.Popen([npm_cmd, "run", "dev"], cwd=str(FRONTEND_DIR))

    def handle_sigint(sig, frame):
        print("\nShutting down CYCLONEX services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_sigint)
    signal.signal(signal.SIGTERM, handle_sigint)

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        handle_sigint(None, None)

if __name__ == "__main__":
    main()
