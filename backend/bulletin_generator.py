"""
CYCLONEX - IMD RSMC New Delhi Cyclone Warning Bulletin Generator
Smart India Hackathon 2026 (Problem Statement ID: SIH26070)

Generates official-format Tropical Cyclone Advisory Bulletins compliant with:
- India Meteorological Department (IMD)
- Regional Specialized Meteorological Centre (RSMC) New Delhi - Tropical Cyclones
- National Disaster Management Authority (NDMA) & NDRF Guidelines
"""

from datetime import datetime, timedelta
import re

def parse_or_get_datetime(time_str: str) -> datetime:
    """Tries to parse timestamp string or defaults to current real time."""
    now = datetime.now()
    # If time_str is 'Real-time Interactive Session' or not standard date
    if not time_str or "Real-time" in time_str or "Interactive" in time_str:
        return now
    try:
        # Try format like '12 May 2026, 10:00 IST'
        clean = time_str.replace(" IST", "").strip()
        return datetime.strptime(clean, "%d %b %Y, %H:%M")
    except Exception:
        try:
            return datetime.strptime(clean, "%d %b %Y")
        except Exception:
            return now

def generate_imd_bulletin(scenario_data: dict) -> str:
    meta = scenario_data["metadata"]
    atm = scenario_data["atmospherics"]
    cur = scenario_data["current_position"]
    landfall = scenario_data["landfall"]
    forecast = scenario_data["forecast_120h"]

    base_dt = parse_or_get_datetime(meta.get("timestamp", ""))
    time_display = base_dt.strftime("%d %b %Y, %H:%M IST")
    bulletin_seq = base_dt.strftime("%Y%m%d/%H")

    is_simulation = (meta.get("id") == "custom_simulation")
    header_type = "REAL-TIME AI WHAT-IF SIMULATION BULLETIN" if is_simulation else "OPERATIONAL CYCLONE ADVISORY BULLETIN"

    lines = []
    lines.append("=" * 78)
    lines.append("                 INDIA METEOROLOGICAL DEPARTMENT")
    lines.append("     REGIONAL SPECIALIZED METEOROLOGICAL CENTRE - TROPICAL CYCLONES")
    lines.append("                             NEW DELHI")
    lines.append("=" * 78)
    lines.append(f"ADVISORY BULLETIN TYPE: {header_type}")
    lines.append(f"BULLETIN IDENTIFIER   : CYCLONEX/{bulletin_seq}")
    lines.append(f"TIME OF ISSUE         : {time_display} (NORTH INDIAN OCEAN BASIN)")
    lines.append(f"SYSTEM IDENTIFIER     : {meta['title'].upper()}")
    lines.append(f"OPERATIONAL STATUS    : {meta['status']}")
    lines.append("-" * 78)
    lines.append("")
    lines.append("1. CURRENT LOCATION & THERMODYNAMIC SENSOR TELEMETRY:")
    lines.append(f"   * Center Coordinates  : {cur['lat']} deg N, {cur['lon']} deg E ({cur['location_name']})")
    lines.append(f"   * Central Pressure    : {atm['central_pressure']} hPa (Deficit: -{atm['mslp_deficit']} hPa)")
    lines.append(f"   * Max Sustained Wind  : {atm['current_wind_kt']} knots ({int(atm['current_wind_kt'] * 1.852)} km/h)")
    lines.append(f"   * IMD Classification  : {scenario_data['intensity_category']} [{scenario_data['intensity_code']}]")
    lines.append(f"   * Sea Surface Temp    : {atm['sst']} deg C (Threshold >26.5 deg C: {'SATISFIED' if atm['sst']>=26.5 else 'SUB-OPTIMAL'})")
    lines.append(f"   * Vertical Wind Shear : {atm['wind_shear']} kt ({'Favorable (<15 kt)' if atm['wind_shear']<=15 else 'Hostile (>20 kt)'})")
    lines.append(f"   * CAPE Energy         : {atm['cape']} J/kg | 850 hPa Vorticity: {atm['vorticity']} x 10^-5 s^-1")
    lines.append(f"   * 120-Hr Genesis Prob : {scenario_data['genesis_prob_120h']}% (AI Model Confidence: {scenario_data['ai_confidence']}%)")
    lines.append("")
    lines.append("2. MULTIMODAL AI & PHYSICS-INFORMED ASSESSMENT:")
    lines.append("   * PyTorch CycloneCNN extracted cloud curvature features from INSAT-3D thermal IR,")
    lines.append("     identifying deep convective banding and central dense overcast.")
    lines.append("   * Grad-CAM spatial heatmap isolates high-temperature-gradient eyewall convection.")
    lines.append("   * Environmental Gradient Boosting model with SHAP confirms primary drivers:")
    for sh in scenario_data.get("shap_attributions", [])[:3]:
        lines.append(f"     -> {sh['feature']}: {sh['value']:+0.2f} impact (Raw: {sh['raw']})")
    lines.append("")
    lines.append("3. 120-HOUR DYNAMIC FORECAST TRACK & INTENSITY CHRONOLOGY:")
    lines.append("   +" + "-"*23 + "+" + "-"*17 + "+" + "-"*18 + "+" + "-"*26 + "+")
    lines.append("   | Valid Date & Time     | Position Lat/Lon  | Max Wind (kt/kmh)| Stage Classification     |")
    lines.append("   +" + "-"*23 + "+" + "-"*17 + "+" + "-"*18 + "+" + "-"*26 + "+")
    for pt in forecast:
        target_dt = base_dt + timedelta(hours=pt["horizon_hours"])
        dt_label = target_dt.strftime("%d %b %H:%M IST") + f" (+{pt['horizon_hours']:02d}h)"
        lines.append(f"   | {dt_label:21s} | {pt['lat']:4.1f}N, {pt['lon']:5.1f}E | {pt['max_wind_kt']:3.0f} kt ({pt['max_wind_kmh']:3.0f} km/h)| {pt['category'][:24]:24s} |")
    lines.append("   +" + "-"*23 + "+" + "-"*17 + "+" + "-"*18 + "+" + "-"*26 + "+")
    lines.append("   [Note: Post-landfall points reflect Kaplan-DeMaria frictional dissipation & inland decay]")
    lines.append("")
    lines.append("4. LANDFALL ESTIMATION & THREAT PROFILE:")
    lines.append(f"   * Target Coastal Sector : {landfall['location']}")
    lines.append(f"   * Landfall Coordinates  : {landfall['lat']} deg N, {landfall['lon']} deg E")
    lines.append(f"   * Projected Landfall ETA: {landfall['estimated_time']}")
    lines.append(f"   * Landfall Peak Wind    : {landfall['expected_intensity']}")
    lines.append(f"   * Operational Alert     : {landfall['threat_level']}")
    lines.append("")
    lines.append("5. SECTOR-SPECIFIC HAZARDS & WARNINGS:")
    lines.append("   (a) HEAVY TO VERY HEAVY RAINFALL:")
    lines.append("       - Coastal belt alerted for 12-25 cm intense rainfall over next 48-72 hours.")
    lines.append("       - Flash floods and localized inundation expected in low-lying riparian tracts.")
    lines.append("   (b) GALE & SQUALLY WIND WARNING:")
    lines.append("       - Sustained gales of 65-80 km/h escalating to 110-130 km/h during landfall window.")
    lines.append("   (c) SEA CONDITIONS & TIDAL SURGE:")
    lines.append("       - Sea condition Phenomenal to Very Rough over deep oceanic waters.")
    lines.append("       - Astronomical storm surge of 1.0 - 2.0 meters above normal tide likely.")
    lines.append("   (d) FISHERMEN ADVISORY:")
    lines.append("       - TOTAL SUSPENSION of all marine and fishing activities in affected basin.")
    lines.append("       - Deep-sea vessels strictly instructed to berth at nearest safe harbor.")
    lines.append("")
    lines.append("6. DIRECTIVE FOR DISASTER MANAGEMENT AUTHORITIES (NDRF / SDMA):")
    lines.append("   - Mobilize National Disaster Response Force (NDRF) and State SDRF units.")
    lines.append("   - Activate Multi-Purpose Cyclone Shelters (MPCS) and stock backup generators.")
    lines.append("   - Enforce coastal evacuation protocols in designated vulnerable low-lying habitations.")
    lines.append("=" * 78)
    lines.append("                    END OF CYCLONEX ADVISORY BULLETIN")
    lines.append("=" * 78)

    return "\n".join(lines)
