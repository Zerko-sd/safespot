# Quick Database Setup Script

Write-Host "🚀 SafeSpot Database Setup Wizard" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "✅ Found .env.local file" -ForegroundColor Green
    Write-Host ""
    Write-Host "Current configuration:" -ForegroundColor Yellow
    Get-Content .env.local | Where-Object { $_ -match "SUPABASE" -or $_ -match "DATABASE" } | ForEach-Object {
        if ($_ -notmatch "^#") {
            Write-Host "  $_" -ForegroundColor Gray
        }
    }
    Write-Host ""
} else {
    Write-Host "⚠️  No .env.local file found" -ForegroundColor Yellow
    Write-Host ""
    $createEnv = Read-Host "Would you like to create one? (y/n)"
    
    if ($createEnv -eq "y") {
        Copy-Item ".env.local.example" ".env.local"
        Write-Host "✅ Created .env.local from template" -ForegroundColor Green
        Write-Host "📝 Please edit .env.local and add your database credentials" -ForegroundColor Yellow
        Write-Host ""
    }
}

Write-Host ""
Write-Host "Choose your database option:" -ForegroundColor Cyan
Write-Host "1. Supabase (Recommended - Free, Easy, Cloud)" -ForegroundColor Green
Write-Host "2. Local PostgreSQL" -ForegroundColor Yellow
Write-Host "3. Docker PostgreSQL" -ForegroundColor Yellow
Write-Host "4. Skip - Use mock data" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🎯 Supabase Setup" -ForegroundColor Cyan
        Write-Host "==================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Steps:" -ForegroundColor Yellow
        Write-Host "1. Go to https://supabase.com" -ForegroundColor White
        Write-Host "2. Create a new project" -ForegroundColor White
        Write-Host "3. Go to SQL Editor and run database/schema.sql" -ForegroundColor White
        Write-Host "4. Get your credentials from Project Settings > API" -ForegroundColor White
        Write-Host ""
        
        $openBrowser = Read-Host "Open Supabase in browser? (y/n)"
        if ($openBrowser -eq "y") {
            Start-Process "https://supabase.com/dashboard"
        }
        
        Write-Host ""
        Write-Host "After setting up Supabase, add these to .env.local:" -ForegroundColor Yellow
        Write-Host "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co" -ForegroundColor Gray
        Write-Host "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key" -ForegroundColor Gray
        Write-Host ""
        
        $editNow = Read-Host "Edit .env.local now? (y/n)"
        if ($editNow -eq "y") {
            notepad .env.local
        }
    }
    
    "2" {
        Write-Host ""
        Write-Host "🗄️  Local PostgreSQL Setup" -ForegroundColor Cyan
        Write-Host "===========================" -ForegroundColor Cyan
        Write-Host ""
        
        # Check if PostgreSQL is installed
        $psqlPath = Get-Command psql -ErrorAction SilentlyContinue
        if ($psqlPath) {
            Write-Host "✅ PostgreSQL found at: $($psqlPath.Source)" -ForegroundColor Green
            Write-Host ""
            
            $dbName = Read-Host "Database name (default: safespot)"
            if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "safespot" }
            
            $dbUser = Read-Host "Database user (default: postgres)"
            if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "postgres" }
            
            $dbPassword = Read-Host "Database password"
            
            Write-Host ""
            Write-Host "Creating database..." -ForegroundColor Yellow
            
            # Create database
            $createDbCmd = "CREATE DATABASE $dbName;"
            echo $createDbCmd | psql -U $dbUser -h localhost
            
            # Run schema
            Write-Host "Running schema..." -ForegroundColor Yellow
            psql -U $dbUser -d $dbName -f "database\schema.sql"
            
            Write-Host ""
            Write-Host "✅ Database setup complete!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Add this to .env.local:" -ForegroundColor Yellow
            Write-Host "DATABASE_URL=postgresql://$dbUser`:$dbPassword@localhost:5432/$dbName" -ForegroundColor Gray
            
        } else {
            Write-Host "❌ PostgreSQL not found" -ForegroundColor Red
            Write-Host ""
            Write-Host "Install PostgreSQL:" -ForegroundColor Yellow
            Write-Host "Option 1: Download from https://www.postgresql.org/download/" -ForegroundColor White
            Write-Host "Option 2: Use Chocolatey: choco install postgresql" -ForegroundColor White
        }
    }
    
    "3" {
        Write-Host ""
        Write-Host "🐳 Docker PostgreSQL Setup" -ForegroundColor Cyan
        Write-Host "===========================" -ForegroundColor Cyan
        Write-Host ""
        
        # Check if Docker is installed
        $dockerPath = Get-Command docker -ErrorAction SilentlyContinue
        if ($dockerPath) {
            Write-Host "✅ Docker found" -ForegroundColor Green
            Write-Host ""
            
            $containerName = "safespot-db"
            $dbPassword = Read-Host "Set database password"
            
            Write-Host ""
            Write-Host "Starting PostgreSQL container..." -ForegroundColor Yellow
            
            docker run --name $containerName `
                -e POSTGRES_PASSWORD=$dbPassword `
                -e POSTGRES_DB=safespot `
                -p 5432:5432 `
                -d postgres:15
            
            Start-Sleep -Seconds 3
            
            Write-Host "Running schema..." -ForegroundColor Yellow
            docker cp database/schema.sql $containerName":/schema.sql"
            docker exec -it $containerName psql -U postgres -d safespot -f /schema.sql
            
            Write-Host ""
            Write-Host "✅ Docker database setup complete!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Add this to .env.local:" -ForegroundColor Yellow
            Write-Host "DATABASE_URL=postgresql://postgres:$dbPassword@localhost:5432/safespot" -ForegroundColor Gray
            
        } else {
            Write-Host "❌ Docker not found" -ForegroundColor Red
            Write-Host ""
            Write-Host "Install Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
        }
    }
    
    "4" {
        Write-Host ""
        Write-Host "📦 Using mock data from JSON files" -ForegroundColor Gray
        Write-Host "The app will work with sample data from src/data/places.json" -ForegroundColor Gray
        Write-Host "You can set up a database later!" -ForegroundColor Gray
    }
    
    default {
        Write-Host ""
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Install Supabase client: npm install @supabase/supabase-js" -ForegroundColor White
Write-Host "2. Restart dev server: npm run dev" -ForegroundColor White
Write-Host "3. Test at http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "📚 Full documentation: DATABASE_CONNECTION_GUIDE.md" -ForegroundColor Gray
Write-Host ""
