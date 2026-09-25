"""
Verification Test Script for CYCLONEX Backend & AI Engine
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def run_tests():
    print("=== CYCLONEX SYSTEM VERIFICATION ===")

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    print("[PASS] 1. Health check: OK")

    # 2. Scenarios list
    res = client.get("/api/scenarios")
    assert res.status_code == 200, f"Scenarios endpoint failed: {res.status_code}"
    scenarios = res.json()["scenarios"]
    assert len(scenarios) == 4, f"Expected 4 scenarios, got {len(scenarios)}"
    print(f"[PASS] 2. Scenario registry: {len(scenarios)} scenarios loaded")

    # 3. Individual scenarios & AI inference
    for s in scenarios:
        s_id = s["id"]
        res = client.get(f"/api/scenario/{s_id}")
        assert res.status_code == 200, f"Scenario {s_id} failed: {res.status_code}"
        data = res.json()
        assert "genesis_prob_120h" in data
        assert "shap_attributions" in data
        assert "forecast_120h" in data
        assert len(data["forecast_120h"]) == 5
        assert "satellite_ir_b64" in data
        assert "gradcam_b64" in data
        print(f"  - Verified {s_id}: Genesis Prob {data['genesis_prob_120h']}%, 120h Points: {len(data['forecast_120h'])}, Grad-CAM: OK")
    print("[PASS] 3. All historical & precursor scenarios verified with AI outputs")

    # 4. What-If Simulation API
    sim_payload = {
        "sst": 30.5,
        "cape": 1400.0,
        "vorticity": 3.0,
        "wind_shear": 9.0,
        "current_wind_kt": 35.0,
        "latitude": 13.0,
        "longitude": 88.0
    }
    res = client.post("/api/simulate", json=sim_payload)
    assert res.status_code == 200, f"Simulation failed: {res.status_code}"
    sim_data = res.json()
    assert sim_data["genesis_prob_120h"] > 70
    assert len(sim_data["shap_attributions"]) > 0
    assert len(sim_data["forecast_120h"]) == 5
    print(f"[PASS] 4. Interactive 'What-If' Simulation: Genesis Prob {sim_data['genesis_prob_120h']}%, Category {sim_data['intensity_category']}")

    # 5. IMD RSMC Bulletin Generation
    res = client.get("/api/bulletin/precursor_2026")
    assert res.status_code == 200, f"Bulletin failed: {res.status_code}"
    assert "INDIA METEOROLOGICAL DEPARTMENT" in res.text
    assert "TROPICAL CYCLONE ADVISORY BULLETIN" in res.text
    print("[PASS] 5. IMD RSMC Advisory Bulletin generated successfully")

    # 6. Static frontend files
    res = client.get("/")
    assert res.status_code == 200, "Frontend index.html serving failed"
    assert "CYCLONEX" in res.text
    print("[PASS] 6. Frontend index.html served correctly")

    res = client.get("/static/styles.css")
    assert res.status_code == 200, "styles.css serving failed"
    print("[PASS] 7. styles.css served correctly")

    res = client.get("/static/app.js")
    assert res.status_code == 200, "app.js serving failed"
    print("[PASS] 8. app.js served correctly")

    print("\nALL 8/8 CYCLONEX VERIFICATION CHECKS PASSED!")

if __name__ == "__main__":
    run_tests()
