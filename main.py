# pdf_safety_extract.py
# Requirements: google-genai, pdfplumber, pydantic
from google import genai
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import pdfplumber
import os
import math
import json
import textwrap
import time
import re

# --- Pydantic models matching the required final JSON structure ---
class Incident(BaseModel):
    type: str = Field(description="violent_crime / property_crime / public_disturbance / accident / etc.")
    description: str = Field(description="short extracted summary")
    original_text: str = Field(description="full paragraph from newspaper")

class PositiveEvent(BaseModel):
    type: str = Field(description="police_action / safety_measure")
    description: str = Field(description="summary")
    original_text: str = Field(description="full paragraph")

class LocationData(BaseModel):
    incidents: List[Incident] = Field(default_factory=list)
    positive_events: List[PositiveEvent] = Field(default_factory=list)
    score_before_clamp: float
    final_score_10_scale: float

class AlgorithmUsed(BaseModel):
    base_score: int
    crime_penalties: Dict[str, int]
    positive_additions: Dict[str, int]

class RootOutput(BaseModel):
    locations: Dict[str, LocationData]
    algorithm_used: AlgorithmUsed
    summary: str

# --- Local scoring function (applies the exact algorithm you specified) ---
BASE_SCORE = 10
CRIME_PENALTIES = {
    "violent_crime": -3,
    "property_crime": -2,
    "public_disturbance": -1,
    "accident": -1,
}
POSITIVE_ADDITIONS = {
    "police_action": 2,
    "safety_measure": 3,
}

# Small local lookup for common place names -> coordinates (lat, lng).
# Extend this mapping as needed for other cities/places.
COORDINATE_LOOKUP = {
    # Chennai neighborhoods (examples)
    "anna nagar": (13.0827, 80.2245),
    "t nagar": (13.0399, 80.2337),
    "t-nagar": (13.0399, 80.2337),
    "velachery": (12.9937, 80.2230),
    "mylapore": (13.0245, 80.2626),
    "tambaram": (12.9236, 80.1274),
    "chennai": (13.0827, 80.2707),
    "central station": (13.0820, 80.2758),
}

def get_coordinates_for_place(place_name: str):
    if not place_name:
        return {"lat": None, "lng": None}
    low = place_name.lower()
    for key, (lat, lng) in COORDINATE_LOOKUP.items():
        if key in low:
            return {"lat": lat, "lng": lng}
    # fallback: no known coordinates
    return {"lat": None, "lng": None}

def aggregate_city_scores(output_locations: dict):
    """
    Aggregate per-city scores based on the incidents in `output_locations`.
    Returns a dict: city -> {coordinates, score, incidents_count, locations}
    """
    cities = {}
    # heuristics: if a place name mentions a known city keyword, assign it; otherwise Unknown
    def detect_city(place_name: str):
        if not place_name:
            return "Unknown"
        low = place_name.lower()
        # basic detection for now
        if "chennai" in low or any(k in low for k in ["anna nagar","t nagar","velachery","mylapore","tambaram"]):
            return "Chennai"
        return "Unknown"

    for place, pdata in output_locations.items():
        city = detect_city(place)
        if city not in cities:
            cities[city] = {
                "locations": [],
                "incidents_count": 0,
                "score_before_clamp": 0,
                "final_score_10_scale": 0,
                "coordinates": {"lat": None, "lng": None}
            }
        cities[city]["locations"].append(place)
        # count incidents (both incidents list and those stored under incidents key)
        incs = pdata.get("incidents", [])
        cities[city]["incidents_count"] += len(incs)
        # compute city score incrementally using the same penalties/additions
        # Start from base if this is the first location
        # We'll accumulate a raw score across all incidents then normalize later
        raw = cities[city].get("score_before_clamp", 0)
        # For each incident item, apply penalty/addition according to category
        for inc in incs:
            cat = inc.get("category") or inc.get("type") or ""
            if cat in CRIME_PENALTIES:
                raw += CRIME_PENALTIES[cat]
            if cat in POSITIVE_ADDITIONS:
                raw += POSITIVE_ADDITIONS[cat]
        cities[city]["score_before_clamp"] = raw

    # Finalize city scores and compute coordinates as centroid of known location coords
    for city, info in cities.items():
        # if no incidents were counted, set to BASE_SCORE
        raw = info["score_before_clamp"] if info["incidents_count"] > 0 else BASE_SCORE
        final = max(0, min(10, raw))
        info["final_score_10_scale"] = final
        # compute centroid of locations with coordinates
        lats = []
        lngs = []
        for loc in info["locations"]:
            c = get_coordinates_for_place(loc)
            if c.get("lat") is not None and c.get("lng") is not None:
                lats.append(c["lat"]) if isinstance(c["lat"], (int, float)) else None
                lngs.append(c["lng"]) if isinstance(c["lng"], (int, float)) else None
        if lats and lngs:
            info["coordinates"] = {"lat": sum(lats) / len(lats), "lng": sum(lngs) / len(lngs)}
        else:
            info["coordinates"] = {"lat": None, "lng": None}

    return cities
def compute_scores(locations_dict):
    result = {}
    for loc, data in locations_dict.items():
        score = BASE_SCORE
        # subtract penalties
        for inc in data.get("incidents", []):
            cat = inc.get("type")
            if cat in CRIME_PENALTIES:
                score += CRIME_PENALTIES[cat]
        # add positive
        for pos in data.get("positive_events", []):
            cat = pos.get("type")
            if cat in POSITIVE_ADDITIONS:
                score += POSITIVE_ADDITIONS[cat]
        score_before = score
        score = max(0, min(10, score))
        result[loc] = {
            "incidents": data.get("incidents", []),
            "positive_events": data.get("positive_events", []),
            "score_before_clamp": score_before,
            "final_score_10_scale": score
        }
    return result

# --- PDF text extraction utility ---
def extract_paragraphs_from_pdf(pdf_path):
    paragraphs = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue
            # Normalize line breaks and split into paragraphs by two newlines or long breaks
            text = text.replace("\r", "\n")
            parts = [p.strip() for p in text.split("\n\n") if p.strip()]
            # further split long lines that look like multiple sentences glued together
            for p in parts:
                # split on sentence boundaries if necessary, but keep as paragraphs
                paragraphs.append(" ".join(p.splitlines()))
    return paragraphs

# --- Simple keyword filter for relevant paragraphs (adjust keywords as needed) ---
RELEVANT_KEYWORDS = [
    "robbery", "assault", "murder", "kill", "stabbing", "shooting", "pickpocket",
    "chain snatching", "snatch", "theft", "burglary", "accident", "road accident",
    "crash", "collision", "train", "derail", "fire", "flood", "collapse", "police",
    "protest", "riot", "disturbance", "safety", "emergency", "rescue", "evacuate",
    "arrest", "crackdown", "clash", "injured", "killed", "fatality", "serious"
]
def is_relevant(paragraph):
    low = paragraph.lower()
    for kw in RELEVANT_KEYWORDS:
        if kw in low:
            return True
    return False

# --- Merge multiple model outputs (they obey the same top-level schema) ---
def merge_model_locations(list_of_location_dicts):
    merged = {}
    for locs in list_of_location_dicts:
        for loc, data in locs.items():
            if loc not in merged:
                merged[loc] = {"incidents": [], "positive_events": []}
            merged[loc]["incidents"].extend(data.get("incidents", []))
            merged[loc]["positive_events"].extend(data.get("positive_events", []))
    return merged

# --- Build a prompt for Gemini ---
PROMPT_HEADER = """
You are given several paragraphs from a local newspaper.
Extract all content relevant to:

crime

safety

public hazards

accidents

emergencies

police actions

protests

public disturbances

safety improvements

For each extracted paragraph, produce:

The location(s) mentioned, using standardized place names

Coordinates of each place (lat, lng)

If you know the coordinates, include them.

If you don’t know, set "lat": null, "lng": null

Classification of the incident into exactly one category:

violent_crime

property_crime

public_disturbance

accident

safety_measure

police_action

A 1–2 sentence summary

The full original paragraph

If a paragraph involves multiple locations, you must:

Create an incident entry under each location

Copy the same classification, summary, and paragraph for both

Do not invent facts.
Do not add extra interpretation.
"""

# --- Main function: extract, filter, call Gemini, merge, and compute final JSON ---
def analyze_pdf_with_gemini(pdf_path, genai_model="gemini-2.5-flash", api_key: Optional[str] = None, api_key_envvar: str = "GENAI_API_KEY"):
    # 1. Extract paragraphs
    paragraphs = extract_paragraphs_from_pdf(pdf_path)
    relevant = [p for p in paragraphs if is_relevant(p)]
    if not relevant:
        print("No relevant crime/safety paragraphs found.")
        return None

    # 2. Chunk the relevant paragraphs to avoid token overflow
    max_chunk_chars = 12000  # conservative; tune based on model and tokens
    chunks = []
    cur = []
    cur_len = 0
    for p in relevant:
        plen = len(p)
        if cur_len + plen + 200 > max_chunk_chars and cur:
            chunks.append(cur)
            cur = [p]
            cur_len = plen
        else:
            cur.append(p)
            cur_len += plen
    if cur:
        chunks.append(cur)

    # 3. Initialize genai client (use provided api_key or fall back to environment variable)
    resolved_key = api_key or os.environ.get(api_key_envvar)
    if not resolved_key:
        raise RuntimeError(
            f"No API key provided. Pass the API key as the second argument or set the {api_key_envvar} environment variable.\n"
            "PowerShell example: $env:GENAI_API_KEY = \"YOUR_KEY\""
        )
    client = genai.Client(api_key=resolved_key)
    # If your environment uses GOOGLE_API_KEY or another var, set accordingly.

    model_responses_locations = []
    for i, chunk in enumerate(chunks):
        prompt_paras = "\n\n".join([f"===PARA===\n{p}" for p in chunk])
        prompt = PROMPT_HEADER + "\n" + prompt_paras

        # Use the Pydantic schema to instruct the model expected JSON shape
        schema = RootOutput.model_json_schema()

        # Use retry/backoff for transient server errors (e.g., model overloaded)
        max_attempts = 5
        attempt = 0
        success = False
        while attempt < max_attempts and not success:
            try:
                response = client.models.generate_content(
                    model=genai_model,
                    contents=prompt,
                    config={
                        "response_mime_type": "application/json",
                        "response_json_schema": schema,
                    },
                )
                text = response.text
                parsed = RootOutput.model_validate_json(text)
                locs = parsed.dict()["locations"]
                model_responses_locations.append(locs)
                success = True
            except Exception as e:
                # If it's likely a transient server error, retry with exponential backoff
                attempt += 1
                wait = 2 ** attempt
                print(f"Model request failed (attempt {attempt}/{max_attempts}): {e}")
                if attempt < max_attempts:
                    print(f"Retrying in {wait} seconds...")
                    time.sleep(wait)
                else:
                    print("Max attempts reached; falling back to local rule-based processing for this chunk.")
                    # Local fallback: deterministic extraction and classification
                    def local_fallback_process_chunk(paragraphs):
                        # Heuristic location detection and keyword classification
                        place_suffixes = ["Nagar", "Tambaram", "Mylapore", "Velachery", "T Nagar", "T-Nagar", "Anna Nagar", "Road", "Street", "Colony", "Chennai", "Station"]
                        violent_kw = ["murder", "kill", "stabbing", "shooting", "assault", "clash", "riot"]
                        property_kw = ["robbery", "theft", "pickpocket", "snatch", "chain snatch", "burglary", "steal"]
                        accident_kw = ["accident", "crash", "collision", "derail", "train", "fatality", "killed", "injured"]
                        disturbance_kw = ["protest", "riot", "disturbance", "clash"]
                        police_kw = ["arrest", "police", "raid", "crackdown", "seized"]
                        safety_kw = ["safety", "evacuate", "precaution", "announced", "caution", "rescue", "operation"]

                        out = {}
                        for para in paragraphs:
                            low = para.lower()
                            # find candidate locations by suffixes
                            found_locs = []
                            for suf in place_suffixes:
                                if suf.lower() in low:
                                    # find the full token(s) containing the suffix
                                    matches = re.findall(r"([A-Z][A-Za-z0-9\- ]+" + re.escape(suf) + r")", para)
                                    for m in matches:
                                        m = m.strip()
                                        if m not in found_locs:
                                            found_locs.append(m)
                            # fallback: look for proper nouns of 2 words (e.g., 'T Nagar', 'Anna Nagar')
                            if not found_locs:
                                pn = re.findall(r"\b([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2})\b", para)
                                # filter common non-place words
                                for cand in pn:
                                    if len(cand) > 2 and not cand.lower().startswith("police") and not cand.lower().startswith("the"):
                                        found_locs.append(cand)
                            if not found_locs:
                                found_locs = ["Unknown"]

                            # classify
                            cat = None
                            if any(k in low for k in violent_kw):
                                cat = "violent_crime"
                            elif any(k in low for k in property_kw):
                                cat = "property_crime"
                            elif any(k in low for k in accident_kw):
                                cat = "accident"
                            elif any(k in low for k in disturbance_kw):
                                cat = "public_disturbance"
                            elif any(k in low for k in police_kw):
                                # police keywords often indicate police_action, but could be in crime reports
                                cat = "police_action"
                            elif any(k in low for k in safety_kw):
                                cat = "safety_measure"
                            else:
                                # default to property_crime if theft words present, else public_disturbance
                                cat = "property_crime" if any(w in low for w in ["theft", "robbery", "snatch"]) else "public_disturbance"

                            summary = para.split('\n')[0]
                            for loc in found_locs:
                                key = loc
                                if key not in out:
                                    out[key] = {"incidents": [], "positive_events": []}
                                # decide whether this is positive event or incident
                                if cat in ["police_action", "safety_measure"]:
                                    out[key]["positive_events"].append({
                                        "type": cat,
                                        "description": summary[:200],
                                        "original_text": para
                                    })
                                else:
                                    out[key]["incidents"].append({
                                        "type": cat,
                                        "description": summary[:200],
                                        "original_text": para
                                    })
                        return out

                    locs = local_fallback_process_chunk(chunk)
                    model_responses_locations.append(locs)

    # 4. Merge chunk outputs
    merged = merge_model_locations(model_responses_locations)

    # 5. Compute scores exactly as specified
    scored = compute_scores(merged)

    # 6. Assemble final object
    algorithm_used = {
        "base_score": BASE_SCORE,
        "crime_penalties": CRIME_PENALTIES,
        "positive_additions": POSITIVE_ADDITIONS
    }

    # Build output in the user-requested structure:
    # {
    #   "locations": {
    #     "LocationName": {
    #       "coordinates": {"lat": 0, "lng": 0},
    #       "incidents": [ {"category":..., "summary":..., "original_text":...} ]
    #     }
    #   }
    # }
    output_locations = {}
    for loc, data in scored.items():
        incidents_out = []
        # include model-detected incidents
        for inc in data.get("incidents", []):
            incidents_out.append({
                "category": inc.get("type"),
                "summary": inc.get("description"),
                "original_text": inc.get("original_text")
            })
        # include positive events as incidents as well (user schema uses single incidents list)
        for pos in data.get("positive_events", []):
            incidents_out.append({
                "category": pos.get("type"),
                "summary": pos.get("description"),
                "original_text": pos.get("original_text")
            })

        coords = get_coordinates_for_place(loc)
        output_locations[loc] = {
            "coordinates": coords,
            "incidents": incidents_out,
            "score_before_clamp": data.get("score_before_clamp"),
            "final_score_10_scale": data.get("final_score_10_scale")
        }

    # Aggregate city-level points (scores) and coordinates
    cities = aggregate_city_scores(output_locations)

    root = {"locations": output_locations, "cities": cities, "algorithm_used": algorithm_used}

    # Validate final JSON against RootOutput model (optional)
    # (We convert nested dicts into the LocationData structure)
    # For safety, we won't strictly validate to avoid over-strictness, but you can:
    # RootOutput.model_validate(root)

    # 7. Print final JSON (the exact JSON you requested)
    print(json.dumps(root, indent=2, ensure_ascii=False))
    return root

# Example usage:
if __name__ == "__main__":
    # Usage:
    import sys
    if len(sys.argv) < 2:
        print("Usage: python main.py path/to/newspaper.pdf [API_KEY]")
        sys.exit(1)
    pdf_path = sys.argv[1]
    provided_key = sys.argv[2] if len(sys.argv) >= 3 else None
    analyze_pdf_with_gemini(pdf_path, api_key=provided_key)
