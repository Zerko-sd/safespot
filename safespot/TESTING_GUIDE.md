# SafeSpot Testing Guide

## Quick Start Testing

The app is currently running on `http://localhost:3000`. Here's how to test all features:

---

## 1. Frontend Testing (Browser)

### Open the Application

```
http://localhost:3000
```

### Test Interactive Map

1. **View Map**: You should see a Leaflet map with Chennai locations
2. **Markers**: Look for color-coded markers:
   - 🟢 Green: Safe places (score > 70)
   - 🟡 Yellow: Moderate safety (score 40-70)
   - 🔴 Red: Unsafe areas (score < 40)
3. **Click Marker**: Opens a popup with basic info
4. **Zoom**: Use mouse wheel or +/- buttons
5. **Pan**: Click and drag the map

### Test Search & Filters

1. **Search Bar**: Type a location name (e.g., "Marina Beach")
2. **Category Filter**: Select "Residential", "Commercial", etc.
3. **Safety Filter**: Use the slider to filter by safety score
4. **Trending Toggle**: Enable to show only trending locations

### Test Place Details Panel

1. **Click any marker** on the map
2. **Detail Panel**: Should slide in from the right showing:
   - Safety score with color-coded bar
   - Crime statistics (violent, property, accident)
   - Infrastructure scores (CCTV, lighting, police density)
   - User reviews with ratings
3. **Close Button**: Click X to close the panel
4. **Scroll**: Panel should be scrollable on mobile

### Test Responsive Design

1. **Desktop**: All features visible
2. **Tablet** (768px): Legend moves to bottom
3. **Mobile** (<640px):
   - Header stacks vertically
   - Legend hidden
   - Panel takes full screen
   - Filters collapse

### Test Safety Legend

- Should show color codes: Safe, Moderate, Unsafe
- Position: Top-right on desktop, bottom on mobile

---

## 2. API Testing (Using Browser/Curl/Postman)

### Test Places API

#### Get All Places

```bash
# Browser
http://localhost:3000/api/places

# Curl
curl http://localhost:3000/api/places
```

**Expected Response:**

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
      ...
    }
  ],
  "count": 8
}
```

#### Get Places with Filters

```bash
# By minimum safety score
curl "http://localhost:3000/api/places?minSafetyScore=70"

# Near a location (5km radius)
curl "http://localhost:3000/api/places?lat=13.0827&lng=80.2707&radius=5"

# By locality
curl "http://localhost:3000/api/places?locality=T.%20Nagar"

# Trending only
curl "http://localhost:3000/api/places?trending=true"

# Sort by safety (descending)
curl "http://localhost:3000/api/places?sortBy=safety_score&sortOrder=desc"

# Pagination
curl "http://localhost:3000/api/places?limit=5&offset=0"

# Combined filters
curl "http://localhost:3000/api/places?lat=13.0827&lng=80.2707&radius=10&minSafetyScore=60&sortBy=distance"
```

#### Get Single Place Details

```bash
# Basic info
curl http://localhost:3000/api/places/place1

# With safety attributes
curl "http://localhost:3000/api/places/place1?include=safety"

# With reviews
curl "http://localhost:3000/api/places/place1?include=reviews&reviewLimit=5"

# All details
curl "http://localhost:3000/api/places/place1?include=all"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "place": { ... },
    "safetyAttributes": {
      "violent_crime": 15,
      "property_crime": 25,
      "night_safety_score": 70
    },
    "reviews": [ ... ],
    "reviewStats": {
      "total": 124,
      "avgSafetyRating": 4.2
    }
  }
}
```

#### Create a New Place (POST)

```bash
curl -X POST http://localhost:3000/api/places \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Location",
    "lat": 13.0500,
    "lng": 80.2800,
    "category": "residential",
    "locality": "Test Area"
  }'
```

#### Update a Place (PATCH)

```bash
curl -X PATCH http://localhost:3000/api/places/place1 \
  -H "Content-Type: application/json" \
  -d '{
    "safety_score": 85,
    "trend_score": 0.3
  }'
```

#### Delete a Place (DELETE)

```bash
curl -X DELETE http://localhost:3000/api/places/place1
```

### Test Reviews API

#### Get Reviews for a Place

```bash
# Default (10 reviews)
curl "http://localhost:3000/api/reviews?place_id=place1"

# Custom limit
curl "http://localhost:3000/api/reviews?place_id=place1&limit=20"
```

#### Create a Review (POST)

```bash
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "place_id": "place1",
    "safety_rating": 4,
    "cleanliness_rating": 5,
    "police_response_rating": 4,
    "review_text": "Very safe area with good lighting and police presence",
    "tags": ["safe", "well-lit", "friendly"],
    "time_of_day": "night",
    "visit_date": "2024-11-14"
  }'
```

**Test Validation:**

```bash
# Missing required field (should return 400 error)
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{"place_id": "place1"}'

# Invalid rating (should return 400 error)
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "place_id": "place1",
    "safety_rating": 10
  }'
```

### Test Nearby Places API

```bash
# 5km radius (default)
curl "http://localhost:3000/api/nearby?lat=13.0827&lng=80.2707"

# Custom radius (3km)
curl "http://localhost:3000/api/nearby?lat=13.0827&lng=80.2707&radius=3"

# Current location test (use your actual coordinates)
curl "http://localhost:3000/api/nearby?lat=13.0499&lng=80.2824&radius=2"
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "place2",
      "name": "Anna Nagar Park",
      "distance": 1.23,
      "safety_score": 78
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

## 3. Advanced Features Testing

### Test Time Decay Algorithm

The scoring system applies time decay to older data. Test by:

1. **Check Existing Scores**: Note current scores
2. **Simulate Old Data**: Review data in `/data/places.json`
3. **Compare**: Newer reviews should have higher weight

### Test Context-Specific Scoring

These algorithms calculate safety for different scenarios:

#### Night Safety Score

- Weighted by: Lighting (50%), Police Density (30%), CCTV (20%)
- Test places with high lighting scores

#### Women Safety Score

- Considers: Harassment reports, crowd safety, lighting
- Check places tagged as "women-friendly"

#### Tourist Safety Score

- Factors: Pickpocket risk, police density, tourist frequency
- Test popular tourist spots

### Test Trend Analysis

1. **View Trending Places**:

   ```bash
   curl "http://localhost:3000/api/places?trending=true"
   ```

2. **Check Trend Score**: Places with trend_score > 0.3 are trending

3. **Identify Patterns**: Look for increasing safety scores over time

---

## 4. Testing with Postman

### Import Collection

Create a new collection in Postman with these requests:

1. **GET Places** - `GET http://localhost:3000/api/places`
2. **GET Places Filtered** - `GET http://localhost:3000/api/places?minSafetyScore=70`
3. **GET Place Detail** - `GET http://localhost:3000/api/places/place1?include=all`
4. **POST Create Place** - `POST http://localhost:3000/api/places`
5. **PATCH Update Place** - `PATCH http://localhost:3000/api/places/place1`
6. **GET Reviews** - `GET http://localhost:3000/api/reviews?place_id=place1`
7. **POST Create Review** - `POST http://localhost:3000/api/reviews`
8. **GET Nearby** - `GET http://localhost:3000/api/nearby?lat=13.0827&lng=80.2707`

### Test Environment Variables

In Postman, create environment:

- `base_url`: `http://localhost:3000/api`
- `test_place_id`: `place1`
- `test_lat`: `13.0827`
- `test_lng`: `80.2707`

---

## 5. Browser Developer Tools Testing

### Open DevTools (F12)

#### Console Tab

1. Check for JavaScript errors
2. Should see: "SafeSpot App Loaded" or similar
3. No CORS errors
4. No 404 errors for assets

#### Network Tab

1. **Filter XHR/Fetch**
2. **Load Page**: Check API calls to `/api/places`
3. **Click Marker**: Should fetch place details
4. **Status Codes**: All should be 200 or 201
5. **Response Times**: Should be < 500ms

#### Application Tab

1. **Local Storage**: Check for any cached data
2. **Session Storage**: Verify map state

#### Performance Tab

1. **Record**: Start recording
2. **Interact**: Click markers, search, filter
3. **Stop**: Check for bottlenecks
4. **Target**: < 100ms for interactions

---

## 6. Mobile Testing

### Using Browser DevTools

1. **Open DevTools** (F12)
2. **Toggle Device Toolbar** (Ctrl+Shift+M)
3. **Select Device**: iPhone 12, Galaxy S20, iPad, etc.
4. **Test**:
   - Map should fill screen
   - Header should stack vertically
   - Panel should slide from bottom
   - Filters should collapse
   - Touch gestures work

### Using Real Device

1. **Find Your Local IP**: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. **Access**: `http://192.168.x.x:3000` from phone
3. **Test**: All touch interactions, GPS location

---

## 7. Performance Testing

### Lighthouse Audit

1. **Open DevTools** → **Lighthouse** tab
2. **Categories**: Performance, Accessibility, Best Practices, SEO
3. **Run Audit**
4. **Target Scores**:
   - Performance: > 80
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 85

### Load Testing (Optional)

```bash
# Install Apache Bench
# Windows: Download from Apache website
# Mac: Pre-installed
# Linux: sudo apt-get install apache2-utils

# Test API endpoint
ab -n 100 -c 10 http://localhost:3000/api/places

# Results: Check requests per second, response times
```

---

## 8. Data Validation Testing

### Check Sample Data

```bash
# View places data
cat src/data/places.json

# Count places
curl http://localhost:3000/api/places | grep -o "id" | wc -l
```

### Verify Calculations

1. **Safety Score**: Should be 0-100
2. **Elo Score**: Should be 1000-2400
3. **Distance**: Accurate Haversine calculation
4. **Review Stats**: Correct averages

---

## 9. Error Handling Testing

### Test Bad Requests

```bash
# Missing parameters
curl "http://localhost:3000/api/nearby"
# Expected: 400 Bad Request

# Invalid place ID
curl http://localhost:3000/api/places/invalid_id
# Expected: 404 Not Found

# Invalid JSON
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -d 'invalid json'
# Expected: 400 Bad Request

# Invalid rating range
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{"place_id":"place1","safety_rating":10}'
# Expected: 400 Bad Request
```

---

## 10. Integration Testing Checklist

- [ ] App loads without errors
- [ ] Map displays correctly with all markers
- [ ] Markers are color-coded by safety score
- [ ] Search filters places correctly
- [ ] Category filter works
- [ ] Safety score slider filters properly
- [ ] Trending toggle shows/hides places
- [ ] Clicking marker opens detail panel
- [ ] Detail panel shows all information
- [ ] Review section displays correctly
- [ ] Close button closes panel
- [ ] API returns valid JSON
- [ ] Places API filters work (all combinations)
- [ ] Single place API includes related data
- [ ] Reviews API creates and retrieves reviews
- [ ] Nearby API calculates distances correctly
- [ ] Error responses have proper status codes
- [ ] Responsive design works on all screen sizes
- [ ] No console errors
- [ ] Network requests complete successfully
- [ ] Performance is acceptable (< 1s load time)

---

## 11. Automated Testing (Future)

### Unit Tests (Jest)

```bash
# Install Jest
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Run tests
npm test
```

### E2E Tests (Playwright)

```bash
# Install Playwright
npm install --save-dev @playwright/test

# Run tests
npx playwright test
```

---

## Common Issues & Solutions

### Port 3000 Already in Use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Restart
npm run dev
```

### Map Not Displaying

- Check console for Leaflet errors
- Verify `leaflet.css` is loaded
- Check z-index issues

### API Returns Empty Data

- Verify `/data/places.json` exists
- Check file permissions
- Review server logs

### Markers Not Clickable

- Check z-index hierarchy
- Verify event handlers
- Test in different browsers

---

## Testing Reports

Document your test results:

```markdown
## Test Report - [Date]

### Frontend Tests

- ✅ Map loads correctly
- ✅ Markers display and clickable
- ✅ Search/filter functional
- ✅ Detail panel works

### API Tests

- ✅ GET /api/places - 200 OK
- ✅ GET /api/places/:id - 200 OK
- ✅ POST /api/reviews - 201 Created
- ✅ GET /api/nearby - 200 OK

### Issues Found

- None

### Performance

- Load time: 450ms
- API response: 120ms avg
- Lighthouse score: 92
```

---

## Support

If you encounter issues:

1. Check console for errors
2. Verify API responses in Network tab
3. Review documentation in README.md
4. Check API_DOCUMENTATION.md for endpoint details

Happy Testing! 🚀
