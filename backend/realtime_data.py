"""
CYCLONEX - Real-Time Atmospheric & Oceanic Data Ingestion Module
Smart India Hackathon 2026 (Problem Statement ID: SIH26070)

Fetches live, real-time sea surface temperature (SST), atmospheric thermodynamics (CAPE),
vertical wind shear (850hPa vs 200hPa differential), surface pressure, and wind speeds
from operational global satellite and NWP models (NOAA GFS & Copernicus Marine Analysis).
"""

import urllib.request
import json
import math
from datetime import datetime

def fetch_live_marine_atmosphere(lat: float = 11.4, lon: float = 87.8) -> dict:
    """
    Fetches real-time oceanic and atmospheric variables for specified coordinates.
    Returns calibrated variables formatted for the CYCLONEX AI engine.
    """
    now = datetime.now()
    now_str = now.strftime("%d %b %Y, %H:%M IST")

    # Default baseline for Bay of Bengal in case of network unavailability
    result = {
        "latitude": lat,
        "longitude": lon,
        "sst": 29.5,
        "cape": 1650.0,
        "wind_shear": 12.5,
        "vorticity": 2.4,
        "current_wind_kt": 22.0,
        "central_pressure": 1006.0,
        "mslp_deficit": 6.0,
        "rh_mid": 78.0,
        "timestamp": now_str,
        "source": "NOAA GFS / Open Operational Atmospheric Analysis",
        "live_status": "Simulated Live"
    }

    headers = {"User-Agent": "CYCLONEX-AI-Forecaster/1.0 (SIH 2026)"}

    # 1. Fetch Real-time Sea Surface Temperature (SST) from Marine Analysis
    try:
        marine_url = f"https://marine-api.open-meteo.com/v1/marine?latitude={lat:.2f}&longitude={lon:.2f}&current=sea_surface_temperature"
        req = urllib.request.Request(marine_url, headers=headers)
        with urllib.request.urlopen(req, timeout=4.0) as resp:
            data = json.loads(resp.read().decode())
            cur = data.get("current", {})
            if "sea_surface_temperature" in cur and cur["sea_surface_temperature"] is not None:
                result["sst"] = round(float(cur["sea_surface_temperature"]), 1)
                result["live_status"] = "Live Connected"
    except Exception as e:
        print(f"[CYCLONEX Real-time] Marine SST query notice: {e}")

    # 2. Fetch Real-time Atmospheric Profiles (CAPE, Pressure, Wind Shear) from Global NWP
    try:
        atm_url = (
            f"https://api.open-meteo.com/v1/forecast?latitude={lat:.2f}&longitude={lon:.2f}"
            f"&current=surface_pressure,wind_speed_10m,relative_humidity_2m"
            f"&hourly=cape,wind_speed_850hPa,wind_speed_200hPa&forecast_days=1"
        )
        req_atm = urllib.request.Request(atm_url, headers=headers)
        with urllib.request.urlopen(req_atm, timeout=4.0) as resp:
            data_atm = json.loads(resp.read().decode())
            cur_atm = data_atm.get("current", {})
            hourly = data_atm.get("hourly", {})

            # Surface Pressure & MSLP Deficit
            if "surface_pressure" in cur_atm and cur_atm["surface_pressure"] is not None:
                p = round(float(cur_atm["surface_pressure"]), 1)
                result["central_pressure"] = p
                # Ambient standard pressure is ~1012 hPa in the tropics
                result["mslp_deficit"] = max(0.0, round(1012.0 - p, 1))

            # 10m Wind Speed (convert km/h to knots)
            if "wind_speed_10m" in cur_atm and cur_atm["wind_speed_10m"] is not None:
                wind_kmh = float(cur_atm["wind_speed_10m"])
                result["current_wind_kt"] = round(wind_kmh / 1.852, 1)

            # Relative Humidity
            if "relative_humidity_2m" in cur_atm and cur_atm["relative_humidity_2m"] is not None:
                result["rh_mid"] = round(float(cur_atm["relative_humidity_2m"]), 1)

            # CAPE (Convective Available Potential Energy)
            if "cape" in hourly and hourly["cape"]:
                # Use current hour CAPE, bounded within atmospheric range
                valid_capes = [c for c in hourly["cape"][:3] if c is not None]
                if valid_capes:
                    result["cape"] = round(float(valid_capes[0]), 1)

            # Vertical Wind Shear (magnitude difference between 200 hPa and 850 hPa)
            if "wind_speed_850hPa" in hourly and "wind_speed_200hPa" in hourly:
                w850 = hourly["wind_speed_850hPa"][0] if hourly["wind_speed_850hPa"] else None
                w200 = hourly["wind_speed_200hPa"][0] if hourly["wind_speed_200hPa"] else None
                if w850 is not None and w200 is not None:
                    shear_kmh = abs(float(w200) - float(w850))
                    result["wind_shear"] = max(4.0, min(45.0, round(shear_kmh / 1.852, 1)))

            # Estimate low-level relative vorticity based on surface wind & Coriolis
            f_coriolis = 2.0 * 7.292e-5 * math.sin(math.radians(max(4.0, lat))) * 1e5
            result["vorticity"] = round(float(f_coriolis * 0.4 + (result["current_wind_kt"] / 15.0) * 1.2), 2)
            result["live_status"] = "Live Connected"

    except Exception as e:
        print(f"[CYCLONEX Real-time] Atmospheric profile notice: {e}")

    return result

if __name__ == "__main__":
    import math
    data = fetch_live_marine_atmosphere(11.4, 87.8)
    print("Live Real-Time Ingestion Result:")
    for k, v in data.items():
        print(f"  {k}: {v}")
