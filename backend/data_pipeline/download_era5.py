"""
CYCLONEX - ERA5 Atmospheric Reanalysis Ingestion Pipeline
Smart India Hackathon 2026 (Problem Statement ID: SIH26070)

Automates requesting and downloading ERA5 hourly reanalysis data
from ECMWF Copernicus Climate Data Store (CDS) for the North Indian Ocean.
"""

import os
import sys
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "era5"
DATA_DIR.mkdir(parents=True, exist_ok=True)

CDSAPIRC_PATH = Path.home() / ".cdsapirc"

def check_cds_setup():
    """Validates whether ECMWF CDS credentials are configured."""
    if not CDSAPIRC_PATH.exists():
        print("\n" + "!" * 70)
        print("  ECMWF CDS API KEY NOT DETECTED")
        print("!" * 70)
        print("  To download real ERA5 NetCDF files from ECMWF, complete these 3 steps:")
        print("  1. Create a free account at: https://cds.climate.copernicus.eu/")
        print("  2. Go to your user profile page to obtain your Personal Access Token (API Key).")
        print(f"  3. Create a file at '{CDSAPIRC_PATH}' containing:")
        print("     url: https://cds.climate.copernicus.eu/api")
        print("     key: <YOUR-PERSONAL-ACCESS-TOKEN>")
        print("!" * 70 + "\n")
        return False
    return True

def download_era5_cyclone_case(year: int, month: int, days: list, storm_name: str):
    """
    Downloads ERA5 single-level and pressure-level fields for a specific cyclone case.
    Covers the North Indian Ocean bounding box [32°N, 50°E, 0°N, 100°E].
    """
    if not check_cds_setup():
        print(f"[*] Simulating ERA5 reanalysis sample metadata for {storm_name} ({year})...")
        create_sample_era5_profile(storm_name, year)
        return

    try:
        import cdsapi
        c = cdsapi.Client()

        # 1. Surface Variables (SST, CAPE, MSLP)
        surface_output = DATA_DIR / f"era5_surface_{storm_name.lower()}_{year}.nc"
        print(f"[*] Requesting ERA5 Surface Variables for Cyclone {storm_name}...")
        c.retrieve(
            'reanalysis-era5-single-levels',
            {
                'product_type': 'reanalysis',
                'format': 'netcdf',
                'variable': [
                    'sea_surface_temperature',
                    'convective_available_potential_energy',
                    'mean_sea_level_pressure',
                    'total_precipitation'
                ],
                'year': str(year),
                'month': f"{month:02d}",
                'day': [f"{d:02d}" for d in days],
                'time': ['00:00', '06:00', '12:00', '18:00'],
                'area': [32, 50, 0, 100],  # North, West, South, East (North Indian Ocean)
            },
            str(surface_output)
        )
        print(f"[OK] Downloaded ERA5 surface NetCDF: {surface_output}")

        # 2. Pressure Levels (850 & 200 hPa winds for Vertical Wind Shear & Vorticity)
        pressure_output = DATA_DIR / f"era5_pressure_levels_{storm_name.lower()}_{year}.nc"
        print(f"[*] Requesting ERA5 Upper-Air Winds (200 & 850 hPa) for Wind Shear calculation...")
        c.retrieve(
            'reanalysis-era5-pressure-levels',
            {
                'product_type': 'reanalysis',
                'format': 'netcdf',
                'variable': [
                    'u_component_of_wind',
                    'v_component_of_wind',
                    'vorticity',
                    'relative_humidity'
                ],
                'pressure_level': ['200', '850'],
                'year': str(year),
                'month': f"{month:02d}",
                'day': [f"{d:02d}" for d in days],
                'time': ['00:00', '06:00', '12:00', '18:00'],
                'area': [32, 50, 0, 100],
            },
            str(pressure_output)
        )
        print(f"[OK] Downloaded ERA5 pressure levels NetCDF: {pressure_output}")

    except ImportError:
        print("[!] Package 'cdsapi' not installed. Install via: pip install cdsapi")
    except Exception as e:
        print(f"[!] Error during ERA5 CDS download: {e}")

def create_sample_era5_profile(storm_name: str, year: int):
    """Creates a sample atmospheric profile when offline."""
    import pandas as pd
    sample_path = DATA_DIR / f"era5_atmospheric_features_{storm_name.lower()}_{year}.csv"
    data = {
        "timestamp": [f"{year}-05-24 00:00", f"{year}-05-24 06:00", f"{year}-05-24 12:00", f"{year}-05-24 18:00"],
        "sst_celsius": [30.4, 30.6, 30.8, 30.5],
        "cape_j_kg": [1350, 1480, 1620, 1550],
        "vorticity_850_1e5": [2.2, 2.7, 3.1, 3.4],
        "wind_shear_200_850_kt": [14.0, 11.5, 9.8, 10.2],
        "mslp_hpa": [1002.0, 996.0, 988.0, 982.0]
    }
    df = pd.DataFrame(data)
    df.to_csv(sample_path, index=False)
    print(f"[OK] Created sample atmospheric reanalysis file at: {sample_path}")

if __name__ == "__main__":
    print("=" * 70)
    print("  CYCLONEX: ERA5 Atmospheric Reanalysis Pipeline")
    print("=" * 70)
    # Example: Cyclone Remal (May 24-26, 2024)
    download_era5_cyclone_case(year=2024, month=5, days=[24, 25, 26], storm_name="REMAL")
