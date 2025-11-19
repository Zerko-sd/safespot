# 🚀 PDF to Supabase - Complete Guide

## Quick Start (3 Commands)

### 1. Set Supabase Credentials

```powershell
$env:SUPABASE_URL = "https://your-project.supabase.co"
$env:SUPABASE_KEY = "your-service-role-key-here"
$env:GENAI_API_KEY = "your-gemini-api-key"
```

### 2. Run Ingestion

```powershell
.\ingest_pdf.ps1 chennai_newspaper.pdf
```

### 3. View Results

```
http://localhost:3000
```

---

## What This Does

1. **Extracts data from PDF** using your existing `main.py`
2. **Analyzes crime/safety incidents** with Gemini AI
3. **Automatically creates/updates** in Supabase:
   - ✅ Places with coordinates
   - ✅ Safety scores (0-100 scale)
   - ✅ Safety attributes (crime rates, infrastructure)
   - ✅ Reviews/incidents as audit trail
   - ✅ Historical snapshots
   - ✅ Safety alerts for high-risk areas
   - ✅ City-level aggregates

---

## Setup Instructions

### Step 1: Get Supabase Credentials

1. Go to your Supabase dashboard
2. Click **Settings** → **API**
3. Copy:
   - **Project URL** (SUPABASE_URL)
   - **service_role key** (SUPABASE_KEY) - ⚠️ Use service role, not anon key!

### Step 2: Set Environment Variables

**PowerShell (Windows):**

```powershell
$env:SUPABASE_URL = "https://abcdefg.supabase.co"
$env:SUPABASE_KEY = "eyJhbGc..."
$env:GENAI_API_KEY = "AIza..."
```

**Or create `.env` file:**

```bash
SUPABASE_URL=https://abcdefg.supabase.co
SUPABASE_KEY=eyJhbGc...
GENAI_API_KEY=AIza...
```

Then load it:

```powershell
Get-Content .env | ForEach-Object {
    $name, $value = $_.split('=')
    Set-Item -Path "env:$name" -Value $value
}
```

### Step 3: Run Ingestion

**Option A: Using PowerShell script (easiest)**

```powershell
.\ingest_pdf.ps1 path\to\newspaper.pdf
```

**Option B: Direct Python**

```powershell
python ingest_to_supabase.py path\to\newspaper.pdf
```

**Option C: From existing JSON**

```powershell
python ingest_to_supabase.py --json analysis_output.json
```

---

## Data Mapping

### PDF → Places Table

```
Location Name → places.name
Coordinates → places.lat, places.lng
Final Score (0-10) → places.safety_score (0-100)
```

### Incidents → Safety Attributes

```
Violent crimes → violent_crime metric
Property crimes → property_crime metric
Accidents → accident_rate metric
Police actions → police_density boost
Safety measures → safety_infra boost
```

### Incidents → Reviews

```
Each incident → place_reviews entry
Category → tags array
Summary → review_text
Safety rating calculated from incident type
```

---

## Example Workflow

### 1. Download newspaper PDF

```
chennai_times_nov_2024.pdf
```

### 2. Run ingestion

```powershell
.\ingest_pdf.ps1 chennai_times_nov_2024.pdf
```

### 3. Output

```
🚀 Starting data ingestion...
📍 Found 12 locations
🏙️  Found 2 cities

📍 Processing: Anna Nagar
  ✅ Created place: Anna Nagar (score: 7.2)
  ✅ Added safety attributes
  ✅ Added 3 incident records as reviews
  ✅ Added safety history snapshot

📍 Processing: T Nagar
  ✅ Updated place: T Nagar (score: 6.5)
  🚨 Created safety alert for T Nagar
  ...

✅ Data ingestion complete!
```

### 4. View in Supabase

Go to: `https://your-project.supabase.co/project/default/editor`

Tables populated:

- `places` - 12 new/updated locations
- `place_safety_attributes` - 12 entries
- `place_reviews` - 35 incident records
- `place_safety_history` - 12 snapshots
- `safety_alerts` - 2 alerts

### 5. View in SafeSpot App

```powershell
cd safespot
npm run dev
```

Open: `http://localhost:3000`

You'll see:

- New markers on map for all extracted locations
- Color-coded by safety scores
- Detailed incident information in panels
- Alerts for high-risk areas

---

## Automation Options

### Daily Batch Processing

Create `process_daily.ps1`:

```powershell
$pdfs = Get-ChildItem -Path ".\newspapers" -Filter "*.pdf"
foreach ($pdf in $pdfs) {
    Write-Host "Processing: $($pdf.Name)"
    .\ingest_pdf.ps1 $pdf.FullName
}
```

### Schedule with Task Scheduler

```powershell
$trigger = New-ScheduledTaskTrigger -Daily -At 2AM
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument ".\process_daily.ps1"
Register-ScheduledTask -TaskName "SafeSpot-DailyIngest" -Trigger $trigger -Action $action
```

---

## Troubleshooting

### Error: "No API key provided"

```powershell
$env:GENAI_API_KEY = "your-gemini-key"
```

### Error: "Supabase credentials not found"

```powershell
$env:SUPABASE_URL = "https://..."
$env:SUPABASE_KEY = "your-service-role-key"
```

### Error: "Module 'supabase' not found"

```powershell
pip install supabase
```

### Error: "ll_to_earth function does not exist"

Run the updated `database/schema.sql` in Supabase SQL Editor

### No coordinates for locations

Update `COORDINATE_LOOKUP` in `main.py` with more locations:

```python
COORDINATE_LOOKUP = {
    "your location": (lat, lng),
    "another place": (lat, lng),
}
```

---

## Advanced Usage

### Custom Score Weights

Edit `main.py` to adjust penalties:

```python
CRIME_PENALTIES = {
    "violent_crime": -5,  # Increase penalty
    "property_crime": -2,
    ...
}
```

### Batch Multiple PDFs

```powershell
Get-ChildItem *.pdf | ForEach-Object {
    python ingest_to_supabase.py $_.FullName
}
```

### Export to JSON first (for review)

```powershell
python main.py newspaper.pdf > output.json
# Review output.json
python ingest_to_supabase.py --json output.json
```

---

## Database Schema Reference

Tables updated:

- `places` - Core location data
- `place_safety_attributes` - Detailed crime/infra metrics
- `place_reviews` - Incident records
- `place_safety_history` - Time-series data
- `safety_alerts` - High-priority notifications

Indexes used:

- Lat/lng for proximity queries
- Safety scores for ranking
- Timestamps for trends

---

## Next Steps

1. ✅ Run schema on Supabase
2. ✅ Set environment variables
3. ✅ Test with one PDF: `.\ingest_pdf.ps1 test.pdf`
4. ✅ Verify in Supabase dashboard
5. ✅ View in SafeSpot app
6. ✅ Set up automated daily ingestion

---

## Support

**Files created:**

- `ingest_to_supabase.py` - Python ingestion script
- `ingest_pdf.ps1` - PowerShell automation wrapper
- This guide: `PDF_TO_SUPABASE_GUIDE.md`

**Questions?**
Check the main README.md and DATABASE_CONNECTION_GUIDE.md
