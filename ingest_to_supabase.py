"""
PDF to Supabase Data Ingestion Script
--------------------------------------
Extracts crime and safety data from PDF newspapers and ingests into Supabase.

Usage:
    python ingest_to_supabase.py path/to/newspaper.pdf
"""

import sys
import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
import subprocess
import re

# Install dependencies if needed
try:
    import pdfplumber
    from supabase import create_client, Client
except ImportError:
    print("📦 Installing required packages...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "supabase"])
    import pdfplumber
    from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️  Supabase credentials not found!")
    print("Set them in PowerShell:")
    print('  $env:SUPABASE_URL = "https://your-project.supabase.co"')
    print('  $env:SUPABASE_KEY = "your-service-role-key"')
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Location coordinates (Chennai area)
COORDINATES = {
    "anna nagar": (13.0827, 80.2245),
    "t nagar": (13.0399, 80.2337),
    "velachery": (12.9937, 80.2230),
    "mylapore": (13.0245, 80.2626),
    "tambaram": (12.9236, 80.1274),
    "chennai central": (13.0820, 80.2758),
    "adyar": (13.0067, 80.2572),
    "guindy": (13.0067, 80.2206),
    "nungambakkam": (13.0569, 80.2424),
    "egmore": (13.0732, 80.2609),
}

# Crime/safety keywords
CRIME_KEYWORDS = {
    "violent": ["murder", "kill", "stabbing", "shooting", "assault", "attack", "clash"],
    "property": ["robbery", "theft", "burglary", "pickpocket", "snatch", "chain snatching", "steal"],
    "accident": ["accident", "crash", "collision", "derail", "injured", "fatality"],
    "disturbance": ["protest", "riot", "disturbance", "vandalism"],
    "safety": ["police", "arrest", "raid", "security", "patrol", "safety measure", "cctv"]
}

def extract_text_from_pdf(pdf_path: str) -> List[str]:
    """Extract paragraphs from PDF."""
    paragraphs = []
    print(f"📄 Reading PDF: {pdf_path}")
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            text = page.extract_text()
            if text:
                # Split into paragraphs
                chunks = text.split('\n\n')
                for chunk in chunks:
                    clean = chunk.strip().replace('\n', ' ')
                    if len(clean) > 50:  # Minimum paragraph length
                        paragraphs.append(clean)
    
    print(f"✅ Extracted {len(paragraphs)} paragraphs")
    return paragraphs

def classify_incident(text: str) -> str:
    """Classify incident type based on keywords."""
    text_lower = text.lower()
    
    if any(kw in text_lower for kw in CRIME_KEYWORDS["violent"]):
        return "violent_crime"
    elif any(kw in text_lower for kw in CRIME_KEYWORDS["property"]):
        return "property_crime"
    elif any(kw in text_lower for kw in CRIME_KEYWORDS["accident"]):
        return "accident"
    elif any(kw in text_lower for kw in CRIME_KEYWORDS["disturbance"]):
        return "public_disturbance"
    elif any(kw in text_lower for kw in CRIME_KEYWORDS["safety"]):
        return "safety_measure"
    
    return "other"

def extract_location(text: str) -> Optional[tuple]:
    """Extract location name and coordinates from text."""
    text_lower = text.lower()
    
    for location, coords in COORDINATES.items():
        if location in text_lower:
            return location.title(), coords
    
    # Try to find location names with common suffixes
    location_patterns = [
        r'([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s+(?:area|road|street|nagar|colony)',
    ]
    
    for pattern in location_patterns:
        matches = re.findall(pattern, text)
        if matches:
            return matches[0], None
    
    return None, None

def calculate_safety_score(incidents: List[Dict]) -> float:
    """Calculate safety score based on incidents (0-100 scale)."""
    base_score = 100.0
    
    for incident in incidents:
        category = incident.get("category", "other")
        if category == "violent_crime":
            base_score -= 15
        elif category == "property_crime":
            base_score -= 10
        elif category == "accident":
            base_score -= 8
        elif category == "public_disturbance":
            base_score -= 5
        elif category == "safety_measure":
            base_score += 5
    
    return max(0, min(100, base_score))

def parse_pdf(pdf_path: str) -> Dict[str, Any]:
    """Parse PDF and extract structured data."""
    paragraphs = extract_text_from_pdf(pdf_path)
    
    locations_data = {}
    
    print(f"\n🔍 Analyzing content...")
    for para in paragraphs:
        # Check if paragraph is relevant
        if not any(kw in para.lower() for keywords in CRIME_KEYWORDS.values() for kw in keywords):
            continue
        
        location_name, coords = extract_location(para)
        if not location_name:
            continue
        
        category = classify_incident(para)
        if category == "other":
            continue
        
        # Initialize location if not exists
        if location_name not in locations_data:
            locations_data[location_name] = {
                "coordinates": coords,
                "incidents": []
            }
        
        # Add incident
        locations_data[location_name]["incidents"].append({
            "category": category,
            "summary": para[:200],  # First 200 chars
            "full_text": para,
            "extracted_at": datetime.utcnow().isoformat()
        })
    
    print(f"✅ Found {len(locations_data)} locations with incidents")
    return locations_data

def upsert_place(name: str, lat: Optional[float], lng: Optional[float], 
                 safety_score: float) -> Optional[str]:
    """Insert or update place in database."""
    if not lat or not lng:
        print(f"⚠️  Skipping {name} - no coordinates")
        return None
    
    # Check if exists
    existing = supabase.table("places").select("id").eq("name", name).execute()
    
    if existing.data:
        place_id = existing.data[0]["id"]
        supabase.table("places").update({
            "safety_score": safety_score,
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", place_id).execute()
        print(f"  ✅ Updated: {name} (score: {safety_score:.1f})")
    else:
        result = supabase.table("places").insert({
            "name": name,
            "lat": lat,
            "lng": lng,
            "safety_score": safety_score,
            "elo_score": 1000 + (safety_score * 5),
            "popularity_score": 50.0,
            "country": "India",
        }).execute()
        place_id = result.data[0]["id"]
        print(f"  ✅ Created: {name} (score: {safety_score:.1f})")
    
    return place_id

def insert_safety_attributes(place_id: str, incidents: List[Dict]):
    """Insert safety attributes for place."""
    violent = len([i for i in incidents if i["category"] == "violent_crime"])
    property_crime = len([i for i in incidents if i["category"] == "property_crime"])
    accidents = len([i for i in incidents if i["category"] == "accident"])
    
    supabase.table("place_safety_attributes").insert({
        "place_id": place_id,
        "violent_crime": min(100, violent * 20),
        "property_crime": min(100, property_crime * 15),
        "accident_rate": min(100, accidents * 15),
        "safety_infra": 50.0,
        "police_density": 50.0,
        "night_safety_score": max(0, 70 - violent * 10),
        "women_safety_score": max(0, 70 - violent * 8),
        "data_source": "pdf_extraction",
        "confidence_score": 0.6,
        "data_timestamp": datetime.utcnow().isoformat(),
    }).execute()

def insert_reviews(place_id: str, incidents: List[Dict]):
    """Insert incidents as reviews."""
    for incident in incidents[:3]:  # Top 3 incidents
        category = incident["category"]
        
        # Map category to rating
        rating_map = {
            "violent_crime": 1,
            "property_crime": 2,
            "accident": 2,
            "public_disturbance": 3,
            "safety_measure": 5
        }
        rating = rating_map.get(category, 3)
        
        supabase.table("place_reviews").insert({
            "place_id": place_id,
            "safety_rating": rating,
            "overall_rating": rating,
            "review_text": f"[PDF] {incident['summary']}",
            "tags": [category, "pdf_extract"],
            "is_verified": True,
        }).execute()

def ingest_to_supabase(locations_data: Dict[str, Any]):
    """Ingest parsed data into Supabase."""
    print(f"\n🚀 Ingesting data to Supabase...\n")
    
    for location_name, data in locations_data.items():
        coords = data.get("coordinates")
        incidents = data.get("incidents", [])
        
        if not coords:
            print(f"⏭️  Skipping {location_name} - no coordinates")
            continue
        
        # Calculate safety score
        safety_score = calculate_safety_score(incidents)
        
        # Insert place
        place_id = upsert_place(location_name, coords[0], coords[1], safety_score)
        if not place_id:
            continue
        
        # Insert attributes
        insert_safety_attributes(place_id, incidents)
        
        # Insert reviews
        insert_reviews(place_id, incidents)
    
    print(f"\n✅ Ingestion complete!")
    print(f"🔗 View at: {SUPABASE_URL}/project/default/editor")

def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python ingest_to_supabase.py path/to/file.pdf")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(f"❌ File not found: {pdf_path}")
        sys.exit(1)
    
    # Parse PDF
    locations_data = parse_pdf(pdf_path)
    
    if not locations_data:
        print("❌ No relevant data found in PDF")
        sys.exit(1)
    
    # Save JSON for reference
    output_json = pdf_path.replace(".pdf", "_parsed.json")
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(locations_data, f, indent=2, ensure_ascii=False)
    print(f"💾 Saved to: {output_json}")
    
    # Ingest to Supabase
    ingest_to_supabase(locations_data)

if __name__ == "__main__":
    main()
