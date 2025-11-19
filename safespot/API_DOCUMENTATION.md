# SafeSpot API Documentation

## Overview

SafeSpot provides a RESTful API for accessing and managing place safety data, reviews, and analytics.

Base URL: `http://localhost:3000/api`

---

## Places API

### GET /api/places

Get all places with optional filtering.

**Query Parameters:**

- `lat` (number, optional): Latitude for proximity search
- `lng` (number, optional): Longitude for proximity search
- `radius` (number, optional): Search radius in kilometers (default: 5)
- `minSafetyScore` (number, optional): Minimum safety score (0-100)
- `maxSafetyScore` (number, optional): Maximum safety score (0-100)
- `category` (string, optional): Place category filter
- `locality` (string, optional): Locality/neighborhood filter
- `trending` (boolean, optional): Show only trending places
- `sortBy` (string, optional): Sort field (safety_score, elo_score, popularity_score, trend_score)
- `sortOrder` (string, optional): Sort order (asc, desc)
- `limit` (number, optional): Results per page (default: 50)
- `offset` (number, optional): Pagination offset (default: 0)

**Example Request:**

```bash
GET /api/places?lat=13.0827&lng=80.2707&radius=10&minSafetyScore=70&sortBy=safety_score&sortOrder=desc
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "place1",
      "name": "Marina Beach",
      "lat": 13.0499,
      "lng": 80.2824,
      "safety_score": 82.5,
      "elo_score": 1650,
      "popularity_score": 85,
      "experience_score": 78,
      "trend_score": 0.15,
      "distance": 2.3
    }
  ],
  "count": 1,
  "params": { ... }
}
```

---

### GET /api/places/:id

Get detailed information for a single place.

**Query Parameters:**

- `include` (string, optional): Include related data (all, safety, reviews)
- `reviewLimit` (number, optional): Number of reviews to include (default: 10)

**Example Request:**

```bash
GET /api/places/place1?include=all&reviewLimit=5
```

**Response:**

```json
{
  "success": true,
  "data": {
    "place": { ... },
    "safetyAttributes": {
      "violent_crime": 15,
      "property_crime": 25,
      "police_density": 75,
      "cctv_coverage": 85,
      "night_safety_score": 70,
      "women_safety_score": 68
    },
    "reviews": [ ... ],
    "reviewStats": {
      "total": 124,
      "avgSafetyRating": 4.2,
      "avgCleanlinessRating": 3.8,
      "recentCount": 15
    }
  }
}
```

---

### POST /api/places

Create a new place.

**Request Body:**

```json
{
  "name": "New Location",
  "lat": 13.0827,
  "lng": 80.2707,
  "category": "residential",
  "locality": "T. Nagar",
  "district": "Chennai",
  "safety_score": 75
}
```

**Response:**

```json
{
  "success": true,
  "data": { ... }
}
```

---

### PATCH /api/places/:id

Update an existing place.

**Request Body:**

```json
{
  "safety_score": 80,
  "trend_score": 0.25
}
```

---

### DELETE /api/places/:id

Delete a place.

**Response:**

```json
{
  "success": true,
  "message": "Place deleted successfully"
}
```

---

## Reviews API

### GET /api/reviews

Get reviews for a place.

**Query Parameters:**

- `place_id` (string, required): Place ID
- `limit` (number, optional): Number of reviews (default: 10)

**Example Request:**

```bash
GET /api/reviews?place_id=place1&limit=20
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "review1",
      "place_id": "place1",
      "user_id": "user123",
      "safety_rating": 4,
      "cleanliness_rating": 5,
      "review_text": "Very safe area with good lighting",
      "tags": ["safe", "well-lit"],
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "count": 1,
    "place_id": "place1"
  }
}
```

---

### POST /api/reviews

Create a new review.

**Request Body:**

```json
{
  "place_id": "place1",
  "safety_rating": 4,
  "cleanliness_rating": 5,
  "police_response_rating": 4,
  "review_text": "Very safe area with good lighting",
  "tags": ["safe", "well-lit"],
  "time_of_day": "night",
  "visit_date": "2024-01-15"
}
```

**Response:**

```json
{
  "success": true,
  "data": { ... }
}
```

---

## Nearby API

### GET /api/nearby

Get nearby places within a radius.

**Query Parameters:**

- `lat` (number, required): Latitude
- `lng` (number, required): Longitude
- `radius` (number, optional): Search radius in kilometers (default: 5)

**Example Request:**

```bash
GET /api/nearby?lat=13.0827&lng=80.2707&radius=3
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "place1",
      "name": "Marina Beach",
      "lat": 13.0499,
      "lng": 80.2824,
      "safety_score": 82.5,
      "distance": 2.34
    }
  ],
  "meta": {
    "count": 3,
    "center": { "lat": 13.0827, "lng": 80.2707 },
    "radius": 3
  }
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common Status Codes:**

- `200` - Success
- `201` - Created
- `400` - Bad Request (missing/invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error

---

## Advanced Scoring

SafeSpot uses advanced algorithms for calculating safety scores:

### Composite Safety Score

Weighted formula combining:

- 40% - Safety attributes (crime rates, infrastructure)
- 30% - Popularity score
- 20% - User experience score
- 10% - Trend score

### Time Decay

Data freshness is calculated using exponential decay:

```
decay = e^(-λ * months_old)
```

Where λ = 0.1 (10% decay per month)

### Context-Specific Scoring

- **Night Safety**: Weighted by lighting (50%), police density (30%), CCTV (20%)
- **Women Safety**: Considers harassment reports, crowd safety, lighting
- **Tourist Safety**: Factors in pickpocket risk, police density, tourist frequency

### Trend Analysis

- 30-day rolling average
- Exponential smoothing for predictions
- Automatic identification of trending places (>30% positive trend)

---

## Database Schema

### Places Table

```sql
- id (uuid, primary key)
- name (text)
- lat, lng (decimal)
- category (text)
- locality, district, region, country (text)
- safety_score, elo_score, popularity_score, experience_score, trend_score (decimal)
- created_at, updated_at, last_score_update (timestamp)
```

### Place Safety Attributes Table

```sql
- id (uuid, primary key)
- place_id (uuid, foreign key)
- violent_crime, property_crime, accident_rate (decimal)
- police_density, cctv_coverage, lighting_score (decimal)
- night_safety_score, women_safety_score, tourist_safety_score (decimal)
- data_timestamp, data_source, confidence_score (various)
- created_at, updated_at (timestamp)
```

### Place Reviews Table

```sql
- id (uuid, primary key)
- place_id (uuid, foreign key)
- user_id (uuid, foreign key, nullable)
- safety_rating, cleanliness_rating, police_response_rating (integer 1-5)
- review_text (text)
- tags (text[])
- time_of_day, day_of_week (enum)
- visit_date (date)
- is_verified, is_flagged (boolean)
- helpful_count (integer)
- created_at, updated_at (timestamp)
```

---

## Rate Limiting

**Current Status**: Not implemented (planned)

**Planned Limits**:

- 100 requests per minute per IP
- 1000 requests per day per API key

---

## Authentication

**Current Status**: Not implemented (anonymous access)

**Planned**: JWT-based authentication with user roles

---

## Next Steps for Production

1. **Database Setup**:

   - Install PostgreSQL or set up Supabase
   - Run `database/schema.sql` to create tables
   - Run `database/seed.sql` for sample data
   - Update connection strings in `.env.local`

2. **Environment Variables**:

   ```bash
   DATABASE_URL=postgresql://...
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

3. **Replace Mock Data**:

   - Update `/lib/db/*.ts` files to use real database queries
   - Remove JSON file fallbacks

4. **Add Authentication**:

   - Implement JWT or Supabase Auth
   - Add middleware for protected routes

5. **Background Workers**:

   - Set up BullMQ or Temporal
   - Implement daily score recalculation
   - Add automated trend analysis

6. **Caching**:
   - Set up Redis
   - Cache frequently accessed places
   - Implement cache invalidation

---

## Support

For issues or questions, please create an issue in the repository.
