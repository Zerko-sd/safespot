# Database Connection Instructions

## Option 1: Supabase (Recommended - Easiest & Free)

### Step 1: Create Supabase Account

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub or email

### Step 2: Create New Project

1. Click "New Project"
2. Fill in:
   - **Name**: `safespot`
   - **Database Password**: (create a strong password - SAVE THIS!)
   - **Region**: Choose closest to you (e.g., Southeast Asia)
3. Click "Create new project" (takes ~2 minutes)

### Step 3: Run Database Schema

1. In your Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy the entire content from `database/schema.sql`
4. Paste into the query editor
5. Click "Run" (bottom right)
6. Wait for success message ✅

### Step 4: Get Connection Details

1. Go to **Project Settings** (gear icon, bottom left)
2. Click **Database** tab
3. Scroll to "Connection string" section
4. Copy the **URI** (looks like: `postgresql://postgres:[YOUR-PASSWORD]@...`)
5. Go to **API** tab
6. Copy:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### Step 5: Create Environment File

Create `.env.local` in your safespot folder:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database URL (optional, for direct connections)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project.supabase.co:5432/postgres
```

Replace with your actual values!

### Step 6: Install Supabase Client

```powershell
npm install @supabase/supabase-js
```

### Step 7: Test Connection

I'll create the connection file for you automatically after you provide the credentials.

---

## Option 2: Local PostgreSQL

### Step 1: Install PostgreSQL

Download from: https://www.postgresql.org/download/windows/

Or use Chocolatey:

```powershell
choco install postgresql
```

### Step 2: Create Database

Open pgAdmin or command line:

```sql
CREATE DATABASE safespot;
CREATE USER safespot_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE safespot TO safespot_user;
```

### Step 3: Run Schema

```powershell
# Navigate to project folder
cd "C:\Users\nitis\Desktop\visual studio workspace\Voyage\safespot"

# Run schema
psql -U safespot_user -d safespot -f database\schema.sql
```

### Step 4: Create Environment File

Create `.env.local`:

```bash
DATABASE_URL=postgresql://safespot_user:your_password@localhost:5432/safespot
```

---

## Option 3: Docker PostgreSQL

### Step 1: Install Docker Desktop

Download from: https://www.docker.com/products/docker-desktop/

### Step 2: Run PostgreSQL Container

```powershell
docker run --name safespot-db -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=safespot -p 5432:5432 -d postgres:15
```

### Step 3: Run Schema

```powershell
# Copy schema file into container
docker cp database/schema.sql safespot-db:/schema.sql

# Execute schema
docker exec -it safespot-db psql -U postgres -d safespot -f /schema.sql
```

### Step 4: Environment File

```bash
DATABASE_URL=postgresql://postgres:mysecretpassword@localhost:5432/safespot
```

---

## Next Steps After Database Setup

Once you've set up the database, I'll help you:

1. ✅ Update the database connection files
2. ✅ Replace mock data with real queries
3. ✅ Test the connection
4. ✅ Seed sample data

**Which option would you like to use?**

- Type "supabase" for Option 1 (Recommended)
- Type "local" for Option 2
- Type "docker" for Option 3

Then provide your connection details and I'll complete the setup automatically!
