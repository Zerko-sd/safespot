# PDF to Supabase Ingestion - PowerShell Script
# This automates the entire process of extracting data from PDF and uploading to Supabase

Write-Host "🚀 SafeSpot PDF Data Ingestion" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check for required environment variables
if (-not $env:SUPABASE_URL) {
    Write-Host "❌ SUPABASE_URL not set" -ForegroundColor Red
    Write-Host ""
    Write-Host "Set your Supabase credentials:" -ForegroundColor Yellow
    Write-Host '  $env:SUPABASE_URL = "https://your-project.supabase.co"' -ForegroundColor Gray
    Write-Host '  $env:SUPABASE_KEY = "your-service-role-key"' -ForegroundColor Gray
    Write-Host ""
    Write-Host "Get these from: Supabase Dashboard → Settings → API" -ForegroundColor Gray
    exit 1
}

if (-not $env:SUPABASE_KEY) {
    Write-Host "❌ SUPABASE_KEY not set" -ForegroundColor Red
    Write-Host '  $env:SUPABASE_KEY = "your-service-role-key"' -ForegroundColor Gray
    exit 1
}

if (-not $env:GENAI_API_KEY) {
    Write-Host "⚠️  GENAI_API_KEY not set - you'll need to provide it as an argument" -ForegroundColor Yellow
}

Write-Host "✅ Environment configured" -ForegroundColor Green
Write-Host ""

# Check if PDF path provided
if ($args.Count -eq 0) {
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\ingest_pdf.ps1 path\to\newspaper.pdf [API_KEY]" -ForegroundColor White
    Write-Host ""
    Write-Host "Example:" -ForegroundColor Gray
    Write-Host "  .\ingest_pdf.ps1 chennai_news_2024.pdf" -ForegroundColor White
    exit 1
}

$pdfPath = $args[0]
$apiKey = if ($args.Count -ge 2) { $args[1] } else { $env:GENAI_API_KEY }

if (-not (Test-Path $pdfPath)) {
    Write-Host "❌ PDF file not found: $pdfPath" -ForegroundColor Red
    exit 1
}

Write-Host "📄 PDF: $pdfPath" -ForegroundColor Cyan
Write-Host ""

# Install required Python packages
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
pip install --quiet google-genai pdfplumber pydantic supabase 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies ready" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some dependencies may be missing" -ForegroundColor Yellow
}
Write-Host ""

# Run the ingestion script
Write-Host "🔄 Processing PDF and uploading to Supabase..." -ForegroundColor Cyan
Write-Host ""

if ($apiKey) {
    python ingest_to_supabase.py $pdfPath $apiKey
} else {
    python ingest_to_supabase.py $pdfPath
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ SUCCESS! Data uploaded to Supabase" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. View data: $env:SUPABASE_URL/project/default/editor" -ForegroundColor White
    Write-Host "2. Restart SafeSpot app: cd safespot; npm run dev" -ForegroundColor White
    Write-Host "3. Check new places at: http://localhost:3000" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Ingestion failed. Check error messages above." -ForegroundColor Red
    Write-Host ""
}
