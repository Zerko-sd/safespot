# 🚀 Quick Database Connection (5 Minutes)

## Easiest Way: Supabase (Recommended)

### Step 1: Create Supabase Account (2 min)

```
https://supabase.com/dashboard
```

- Click "Start your project"
- Sign up with GitHub (fastest)

### Step 2: Create Project (2 min)

- Click "New Project"
- Name: `safespot`
- Password: (create and SAVE IT!)
- Region: Choose nearest
- Click "Create new project"
- ⏳ Wait ~2 minutes

### Step 3: Run Database Schema (1 min)

1. Click **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy entire content from `database/schema.sql`
4. Paste and click **Run**
5. Wait for ✅ Success

### Step 4: Get Credentials (30 sec)

1. Click **⚙️ Settings** (bottom left)
2. Click **API** tab
3. Copy these two values:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGc...
   ```

### Step 5: Configure App (30 sec)

Create `.env.local` file in your project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Step 6: Install & Restart

```powershell
npm install @supabase/supabase-js
npm run dev
```

## That's It! 🎉

Your app will now:

- ✅ Connect to real database
- ✅ Store places, reviews, safety data
- ✅ Support all CRUD operations
- ✅ Scale automatically (Supabase is free for 500MB)

---

## Alternative: Use Interactive Script

Run this for guided setup:

```powershell
.\setup-database.ps1
```

---

## Need Help?

**Full documentation:** `DATABASE_CONNECTION_GUIDE.md`

**Test connection:**

```powershell
npm run dev
```

Then check console for "✅ Database connected"

**View your data:**
Go to Supabase dashboard → Table Editor → `places`
