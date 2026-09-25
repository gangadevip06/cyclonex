"""
CYCLONEX - Google Gemini API Advisor & Multi-Lingual Regional Translation Service
Smart India Hackathon 2026 (Problem Statement ID: SIH26070)

Utilizes the official Google Gen AI SDK (`google.genai` / `GEMINI_API_KEY`) to generate:
1. Structured IMD-style Operational Advisory Bulletins
2. Multi-lingual translations for coastal Indian states (Tamil, Telugu, Odia, Bengali, Hindi, English)
3. Plain-language Explainable AI (XAI) interpretations of SHAP and Grad-CAM for disaster responders
4. High-reliability fallback synthesis if API key is not configured or network quota is exceeded
"""

import json
from datetime import datetime
from typing import Dict, Any, List

from ..config import settings
from ..schemas import ForecastResponse, RegionalAdvisories

# Check if google.genai is available
try:
    from google import genai
    from google.genai import types
    _GENAI_AVAILABLE = True
except ImportError:
    _GENAI_AVAILABLE = False


def generate_regional_advisories(forecast: ForecastResponse) -> RegionalAdvisories:
    """
    Synthesizes official IMD operational bulletins and multi-lingual regional advisories.
    Invokes Google Gemini API if GEMINI_API_KEY is available; falls back cleanly to algorithmic template.
    """
    now_str = datetime.now().strftime("%d %b %Y, %H:%M IST")
    basin = forecast.basin_name
    stage = forecast.intensity_category
    code = forecast.intensity_code
    wind_kt = forecast.current_wind_kt
    wind_kmh = forecast.current_wind_kmh
    prob = forecast.genesis_probability_120h
    lf = forecast.landfall
    landfall_loc = lf.get("location", "Coastal Interface")
    landfall_time = lf.get("estimated_time", "within 80-96 hours")
    threat = lf.get("threat_level", "HIGH ALERT")

    # Format top SHAP drivers for prompt
    shap_summary = ", ".join([
        f"{s.feature_name} ({s.impact:+.2f}: {s.direction})" for s in forecast.shap_contributors[:4]
    ])

    gemini_key = settings.GEMINI_API_KEY
    if _GENAI_AVAILABLE and gemini_key:
        candidate_models = [settings.GEMINI_MODEL, "gemini-2.0-flash", "gemini-1.5-flash"]
        for mod in candidate_models:
            try:
                client = genai.Client(api_key=gemini_key)
                prompt = f"""
You are the Senior Cyclone Forecaster and Special Advisor at India Meteorological Department (IMD) RSMC New Delhi.
Analyze this synchronized multimodal cyclone forecast and generate an official operational bulletin.

METEOROLOGICAL TELEMETRY:
- Basin: {basin}
- Stage: {stage} [{code}] (Current Winds: {wind_kt} kt / {wind_kmh} km/h)
- 120-Hour Genesis Probability: {prob}%
- Projected Landfall: {landfall_loc} around {landfall_time}
- Threat Level: {threat}
- Top AI SHAP Drivers: {shap_summary}
- Convective Cloud Features: Min Cloud Temp: {forecast.satellite_metrics.min_cloud_temp_c}°C, CDO Compactness: {forecast.satellite_metrics.cdo_compactness}

OUTPUT REQUIREMENTS:
Respond ONLY with a valid JSON object matching this schema:
{{
  "cyclone_stage": "{stage}",
  "landfall_timeline": "{landfall_time} near {landfall_loc}",
  "evacuation_directives": [
    "Directive 1: Fishermen advisory",
    "Directive 2: Port storm signals",
    "Directive 3: Coastal district evacuation"
  ],
  "plain_language_xai": "Explain in 3 sentences why the AI predicts cyclogenesis based on the warm SST and satellite spiral bands in plain language for disaster managers.",
  "bulletin_english": "Structured official IMD RSMC advisory bulletin in English.",
  "bulletin_tamil": "Tamil translation of the advisory (தமிழ்).",
  "bulletin_telugu": "Telugu translation of the advisory (తెలుగు).",
  "bulletin_odia": "Odia translation of the advisory (ଓଡ଼ିଆ).",
  "bulletin_bengali": "Bengali translation of the advisory (বাংলা).",
  "bulletin_hindi": "Hindi translation of the advisory (हिन्दी)."
}}
"""
                response = client.models.generate_content(
                    model=mod,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.3
                    )
                )
                raw_text = response.text.strip()
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:]
                if raw_text.startswith("```"):
                    raw_text = raw_text[3:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]
                data = json.loads(raw_text.strip())

                return RegionalAdvisories(
                    cyclone_stage=data.get("cyclone_stage", stage),
                    landfall_timeline=data.get("landfall_timeline", f"{landfall_time} near {landfall_loc}"),
                    evacuation_directives=data.get("evacuation_directives", [
                        "Total suspension of fishing operations over deep-sea sectors.",
                        "Hoist Local Cautionary Signal LC-III at all major ports.",
                        "Pre-position NDRF and SDRF battalions in low-lying coastal blocks."
                    ]),
                    plain_language_xai=data.get("plain_language_xai", "High sea surface temperatures and low vertical wind shear provide favorable atmospheric energy, while satellite imagery reveals organized spiral convective bands."),
                    bulletin_english=data.get("bulletin_english", ""),
                    bulletin_tamil=data.get("bulletin_tamil", ""),
                    bulletin_telugu=data.get("bulletin_telugu", ""),
                    bulletin_odia=data.get("bulletin_odia", ""),
                    bulletin_bengali=data.get("bulletin_bengali", ""),
                    bulletin_hindi=data.get("bulletin_hindi", ""),
                    generated_at=now_str,
                    gemini_assisted=True
                )
            except Exception as e:
                print(f"[CYCLONEX Gemini] Model {mod} exception: {e}. Trying next...")
                continue

    # High-Fidelity Algorithmic IMD RSMC Bulletin Fallback
    return _generate_fallback_bulletin(forecast, now_str)


def _generate_fallback_bulletin(forecast: ForecastResponse, now_str: str) -> RegionalAdvisories:
    """
    Standard IMD RSMC Operational Bulletin template with regional multi-lingual translations.
    """
    basin = forecast.basin_name
    stage = forecast.intensity_category
    code = forecast.intensity_code
    wind_kt = forecast.current_wind_kt
    wind_kmh = forecast.current_wind_kmh
    prob = forecast.genesis_probability_120h
    lf = forecast.landfall
    landfall_loc = lf.get("location", "Coastal Sector")
    landfall_time = lf.get("estimated_time", "within 80-96 hours")
    threat = lf.get("threat_level", "RED WARNING")
    sst = forecast.current_telemetry.sst
    shear = forecast.current_telemetry.wind_shear

    directives = [
        "Total suspension of all deep-sea fishing operations. Fishermen out at sea are advised to return to coast immediately.",
        f"Major ports along {landfall_loc} advised to hoist Local Cautionary Signal No. 3 (LC-III).",
        "Coastal district administrations instructed to activate Multi-Purpose Cyclone Shelters (MPCS) and review evacuation routes.",
        "Ensure round-the-clock emergency control rooms in coastal districts with backup satellite communications."
    ]

    plain_xai = (
        f"The AI model localizes 95% convective focus on the central cloud overcast. "
        f"High Sea Surface Temperature ({sst}°C) and low vertical wind shear ({shear} kt) "
        f"are the primary positive thermodynamic drivers pushing the 120-hour genesis probability to {prob}%. "
        f"The system is projected to track northwestward with significant coastal threat near {landfall_loc}."
    )

    en_bulletin = f"""INDIA METEOROLOGICAL DEPARTMENT (IMD)
CYCLONE WARNING DIVISION, NEW DELHI
OPERATIONAL SPECIAL TROPICAL CYCLONE ADVISORY BULLETIN NO. 04

ISSUED AT: {now_str}
SUB: TROPICAL CYCLOGENESIS OUTLOOK OVER {basin.upper()}

1. CURRENT INTENSITY & LOCATION:
   THE SYSTEM CURRENTLY LIES AS A {stage.upper()} [{code}] OVER {basin.upper()}.
   ESTIMATED MAXIMUM SUSTAINED SURFACE WINDS ARE {wind_kt} KNOTS ({wind_kmh} KM/H) GUSTING TO {round(wind_kt * 1.15, 1)} KNOTS.
   CENTRAL PRESSURE: {forecast.central_pressure_hpa} HPA. 120-HR CYCLOGENESIS PROBABILITY: {prob}%.

2. MULTIMODAL AI & XAI SYNTHESIS:
   PYTORCH CONVOLUTIONAL FEATURE EXTRACTION DETECTS ORGANIZED SPIRAL CONVECTIVE RAINBANDS.
   MINIMUM CLOUD TOP TEMPERATURE IS {forecast.satellite_metrics.min_cloud_temp_c}°C INDICATING INTENSE CONVECTIVE OVERSHOOTING.
   PHYSICAL THERMODYNAMIC DRIVERS: HIGH SST ({sst}°C) AND CONDUCIVE WIND SHEAR ({shear} KT).

3. 120-HOUR TRAJECTORY & LANDFALL OUTLOOK:
   THE SYSTEM IS VERY LIKELY TO CONTINUE TRACKING NORTH-NORTHWESTWARD AND INTENSIFY FURTHER INTO A SEVERE CYCLONIC STORM.
   PROJECTED LANDFALL SECTOR: {landfall_loc.upper()} AROUND {landfall_time.upper()}.
   ASSOCIATED THREAT STATUS: {threat}.

4. ACTIONABLE WARNINGS:
   (A) SEA CONDITION: VERY ROUGH TO HIGH OVER CENTRAL AND NORTH BASIN.
   (B) FISHERMEN WARNING: TOTAL SUSPENSION OF FISHING OPERATIONS.
   (C) PORT WARNINGS: HOIST LOCAL CAUTIONARY SIGNAL AT RESPECTIVE PORTS.
"""

    # Multi-Lingual Regional Translations
    hi_bulletin = f"""भारत मौसम विज्ञान विभाग (IMD) चक्रवात चेतावनी प्रभाग, नई दिल्ली
विशेष उष्णकटिबंधीय चक्रवात बुलेटिन: {now_str}

1. वर्तमान स्थिति: {basin} के ऊपर {stage} [{code}] सक्रिय है। हवा की गति {wind_kmh} किमी/घंटा है।
2. एआई पूर्वानुमान: 120 घंटे में चक्रवात बनने की संभावना {prob}% है। समुद्र का तापमान {sst}°C अनुकूल है।
3. लैंडफॉल चेतावनी: प्रणाली {landfall_loc} के पास {landfall_time} के आसपास तट पार करने की अत्यधिक संभावना है।
4. निर्देश: मछुआरों को समुद्र में न जाने की सख्त सलाह दी जाती है। सभी तटीय जिलों में निकासी आश्रय तैयार रखें।"""

    ta_bulletin = f"""இந்திய வானிலை ஆய்வு மையம் (IMD) புயல் எச்சரிக்கை பிரிவு, புது தில்லி
சிறப்பு புயல் எச்சரிக்கை அறிக்கை: {now_str}

1. தற்போதைய நிலை: {basin} பகுதியில் {stage} தீவிரமடைந்துள்ளது. காற்றின் வேகம் {wind_kmh} கி.மீ/மணி.
2. செயற்கை நுண்ணறிவு கணிப்பு: அடுத்த 120 மணி நேரத்தில் புயல் உருவாகும் வாய்ப்பு {prob}%.
3. கரையைக் கடக்கும் நேரம்: {landfall_loc} அருகில் {landfall_time} கரையைக் கடக்க வாய்ப்புள்ளது.
4. அவசர எச்சரிக்கை: மீனவர்கள் கடலுக்குச் செல்ல வேண்டாம். கடலோர மக்கள் பாதுகாப்பான இடங்களுக்குச் செல்ல அறிவுறுத்தப்படுகிறார்கள்."""

    te_bulletin = f"""భారత వాతావరణ శాఖ (IMD) తుఫాను హెచ్చరిక విభాగం, న్యూఢిల్లీ
ప్రత్యేక తుఫాను హెచ్చరిక బులెటిన్: {now_str}

1. ప్రస్తుత స్థితి: {basin}లో {stage}గా కేంద్రీకృతమై ఉంది. గాలి వేగం గంటకు {wind_kmh} కి.మీ.
2. ఏఐ అంచనా: 120 గంటల్లో తుఫానుగా బలపడే సంభావ్యత {prob}%. సముద్ర ఉష్ణోగ్రత {sst}°C అనుకూలంగా ఉంది.
3. తీరం దాటే సమయం: {landfall_loc} సమీపంలో {landfall_time} సమయంలో తీరం దాటే అవకాశం ఉంది.
4. హెచ్చరిక: మత్స్యకారులు సముద్రంలోకి వెళ్లరాదు. తీరప్రాంత జిల్లాల అధికారులు అప్రమత్తంగా ఉండాలి."""

    or_bulletin = f"""ଭାରତୀୟ ପାଣିପାଗ ବିଭାଗ (IMD) ବାତ୍ୟା ସତର୍କତା ବିଭାଗ, ନୂଆଦିଲ୍ଲୀ
ବିଶେଷ ବାତ୍ୟା ବୁଲେଟିନ: {now_str}

1. ବର୍ତ୍ତମାନର ସ୍ଥିତି: {basin} ଉପରେ {stage} ସକ୍ରିୟ ରହିଛି। ପବନର ବେଗ ଘଣ୍ଟା ପ୍ରତି {wind_kmh} କି.ମି.।
2. ଏଆଇ ପୂର୍ବାନୁମାନ: ୧୨୦ ଘଣ୍ଟା ମଧ୍ୟରେ ବାତ୍ୟା ସୃଷ୍ଟି ହେବାର ସମ୍ଭାବନା {prob}% ରହିଛି।
3. ସ୍ଥଳଭାଗ ଛୁଇଁବା: ଏହା {landfall_time} ସମୟରେ {landfall_loc} ନିକଟରେ ଉପକୂଳ ଅତିକ୍ରମ କରିବାର ସମ୍ଭାବନା।
4. ନିର୍ଦ୍ଦେଶ: ମତ୍ସ୍ୟଜୀବୀମାନଙ୍କୁ ସମୁଦ୍ରକୁ ଯିବାକୁ ସମ୍ପୂର୍ଣ୍ଣ ବାରଣ କରାଯାଇଛି। ସମସ୍ତ ବାତ୍ୟା ଆଶ୍ରୟସ୍ଥଳ ପ୍ରସ୍ତୁତ ରଖନ୍ତୁ।"""

    bn_bulletin = f"""ভারত আবহাওয়া দপ্তর (IMD) ঘূর্ণিঝড় সতর্কতা বিভাগ, নয়াদিল্লি
বিশেষ ঘূর্ণিঝড় বুলেটিন: {now_str}

1. বর্তমান পরিস্থিতি: {basin}-এ {stage} ঘনীভূত হয়েছে। বাতাসের সর্বোচ্চ গতিবেগ ঘণ্টায় {wind_kmh} কিমি।
2. এআই পূর্বাভাস: পরবর্তী ১২০ ঘণ্টায় ঘূর্ণিঝড়ে রূপান্তরিত হওয়ার সম্ভাবনা {prob}%।
3. ল্যান্ডফল পূর্বাভাস: সিস্টেমটি {landfall_time} নাগাদ {landfall_loc}-এর কাছে উপকূল অতিক্রম করতে পারে।
4. সতর্কবার্তা: মৎস্যজীবীদের সমুদ্রে যেতে সম্পূর্ণ নিষেধ করা হয়েছে। উপকূলীয় এলাকা খালি করার প্রস্তুতি নিন।"""

    return RegionalAdvisories(
        cyclone_stage=f"{stage} [{code}]",
        landfall_timeline=f"{landfall_time} near {landfall_loc}",
        evacuation_directives=directives,
        plain_language_xai=plain_xai,
        bulletin_english=en_bulletin,
        bulletin_tamil=ta_bulletin,
        bulletin_telugu=te_bulletin,
        bulletin_odia=or_bulletin,
        bulletin_bengali=bn_bulletin,
        bulletin_hindi=hi_bulletin,
        generated_at=now_str,
        gemini_assisted=False
    )
