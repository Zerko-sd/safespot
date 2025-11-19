# Environment Setup Guide

## Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- PostgreSQL 14+ (optional for development)
- Redis (optional for caching)

---

## Quick Start (Development Mode)

The application currently works with mock JSON data, so you can start immediately without a database:

```bash
cd safespot
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

Create a `.env.local` file in the safespot directory:

```bash
# App Configuration
NEXT_PUBLIC_APP_NAME=SafeSpot
NEXT_PUBLIC_API_URL=http://localhost:3000

# Database (PostgreSQL) - Optional for development
DATABASE_URL=postgresql://user:password@localhost:5432/safespot
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=safespot
DATABASE_USER=your_username
DATABASE_PASSWORD=your_password

# Supabase (Alternative to PostgreSQL) - Optional
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis Cache - Optional
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Authentication - Optional
JWT_SECRET=your_jwt_secret_key_here
NEXT_PUBLIC_AUTH_ENABLED=false

# External APIs - Future
GOOGLE_MAPS_API_KEY=
CRIME_DATA_API_KEY=

# Feature Flags
NEXT_PUBLIC_ENABLE_REVIEWS=true
NEXT_PUBLIC_ENABLE_USER_ACCOUNTS=false
NEXT_PUBLIC_ENABLE_ALERTS=false

# Analytics - Optional
NEXT_PUBLIC_GA_ID=
SENTRY_DSN=
```

---

## Database Setup (PostgreSQL)

### Option 1: Local PostgreSQL

1. **Install PostgreSQL**:

   ```bash
   # Windows (using Chocolatey)
   choco install postgresql

   # Or download from: https://www.postgresql.org/download/
   ```

2. **Create Database**:

   ```bash
   # Open PostgreSQL command line
   psql -U postgres

   # Create database and user
   CREATE DATABASE safespot;
   CREATE USER safespot_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE safespot TO safespot_user;
   ```

3. **Run Schema**:

   ```bash
   psql -U safespot_user -d safespot -f database/schema.sql
   ```

4. **Seed Data** (optional):
   ```bash
   psql -U safespot_user -d safespot -f database/seed.sql
   ```

### Option 2: Supabase (Recommended for Quick Setup)

1. **Create Account**: Go to [supabase.com](https://supabase.com)

2. **Create New Project**:

   - Organization: Your name
   - Project name: safespot
   - Database password: (save this)
   - Region: Choose closest to you

3. **Run Schema**:

   - Go to SQL Editor in Supabase dashboard
   - Copy contents of `database/schema.sql`
   - Run the query

4. **Get Connection Details**:

   - Go to Project Settings → Database
   - Copy connection string to `.env.local`
   - Go to Project Settings → API
   - Copy URL and anon key

5. **Update Code**:

   - Install Supabase client: `npm install @supabase/supabase-js`
   - Create `/lib/supabase.ts`:

   ```typescript
   import { createClient } from "@supabase/supabase-js";

   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
   const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

   export const supabase = createClient(supabaseUrl, supabaseKey);
   ```

---

## Redis Setup (Optional - For Caching)

### Windows

```bash
# Install using WSL or Docker
docker run -d -p 6379:6379 --name redis redis:latest

# Or download Windows port from: https://github.com/microsoftarchive/redis/releases
```

### Install Redis Client

```bash
npm install ioredis
```

Create `/lib/redis.ts`:

```typescript
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export default redis;
```

---

## Updating Database Layer

Once you have a real database, update the `/lib/db/*.ts` files:

### Example: Update places.ts

```typescript
import { supabase } from "@/lib/supabase";

export async function getPlaces(params: PlaceQueryParams): Promise<Place[]> {
  let query = supabase.from("places").select("*");

  if (params.minSafetyScore) {
    query = query.gte("safety_score", params.minSafetyScore);
  }

  if (params.maxSafetyScore) {
    query = query.lte("safety_score", params.maxSafetyScore);
  }

  if (params.category) {
    query = query.eq("category", params.category);
  }

  const { data, error } = await query
    .order(params.sortBy || "safety_score", {
      ascending: params.sortOrder === "asc",
    })
    .range(params.offset || 0, (params.offset || 0) + (params.limit || 50));

  if (error) throw error;
  return data || [];
}
```

---

## Background Workers Setup

### Install BullMQ

```bash
npm install bullmq
```

### Create Worker (lib/workers/scoreUpdater.ts)

```typescript
import { Worker } from "bullmq";
import { updatePlace } from "@/lib/db/places";
import { calculateCompositeSafetyScore } from "@/utils/advancedScoring";

const worker = new Worker(
  "score-update",
  async (job) => {
    const { placeId } = job.data;

    // Fetch latest data and recalculate score
    const newScore = await calculateCompositeSafetyScore(/* ... */);

    await updatePlace(placeId, {
      safety_score: newScore.finalScore,
      last_score_update: new Date().toISOString(),
    });
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || "6379"),
    },
  }
);

export default worker;
```

### Schedule Jobs

```typescript
import { Queue } from "bullmq";

const scoreQueue = new Queue("score-update");

// Schedule daily score updates
await scoreQueue.add(
  "update-all",
  {},
  {
    repeat: {
      pattern: "0 2 * * *", // 2 AM daily
    },
  }
);
```

---

## Testing the API

### Using curl

```bash
# Get all places
curl http://localhost:3000/api/places

# Get places near location
curl "http://localhost:3000/api/places?lat=13.0827&lng=80.2707&radius=5"

# Get place details
curl http://localhost:3000/api/places/place1?include=all

# Create review
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "place_id": "place1",
    "safety_rating": 4,
    "review_text": "Great area"
  }'
```

### Using Postman

1. Import the API collection (create one)
2. Set base URL: `http://localhost:3000/api`
3. Test each endpoint

---

## Production Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**:

   ```bash
   npm install -g vercel
   ```

2. **Deploy**:

   ```bash
   cd safespot
   vercel
   ```

3. **Add Environment Variables**:

   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all variables from `.env.local`

4. **Connect Database**:
   - Use Supabase or Railway for PostgreSQL
   - Use Upstash for Redis

### Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t safespot .
docker run -p 3000:3000 --env-file .env.local safespot
```

---

## Monitoring & Debugging

### Enable Logging

Add to `.env.local`:

```bash
NEXT_PUBLIC_DEBUG=true
LOG_LEVEL=debug
```

### View Logs

```bash
# Development
npm run dev

# Production (PM2)
pm2 logs safespot
```

### Database Queries

Enable query logging in PostgreSQL:

```sql
ALTER DATABASE safespot SET log_statement = 'all';
```

---

## Troubleshooting

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Then restart
npm run dev
```

### Database Connection Failed

- Check DATABASE_URL format
- Verify PostgreSQL is running
- Check firewall rules
- Test connection: `psql -U safespot_user -d safespot`

### Redis Connection Failed

- Check Redis is running: `redis-cli ping`
- Verify REDIS_URL
- Check port 6379 is open

### Module Not Found Errors

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Development Workflow

1. **Feature Development**:

   ```bash
   git checkout -b feature/new-feature
   # Make changes
   npm run dev
   # Test locally
   ```

2. **Database Changes**:

   - Update `database/schema.sql`
   - Create migration file
   - Test on development database
   - Document changes

3. **API Changes**:

   - Update route files
   - Update types in `/types/database.ts`
   - Update API_DOCUMENTATION.md
   - Test with Postman/curl

4. **Commit & Deploy**:
   ```bash
   git add .
   git commit -m "Add new feature"
   git push origin feature/new-feature
   # Create PR and merge
   # Vercel auto-deploys
   ```

---

## Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Leaflet Docs**: https://leafletjs.com/reference.html
- **Tailwind CSS**: https://tailwindcss.com/docs

For project-specific questions, refer to README.md and PROJECT_STRUCTURE.md.
