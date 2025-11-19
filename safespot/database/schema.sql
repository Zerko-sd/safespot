-- SafeSpot Database Schema
-- PostgreSQL / Supabase Compatible

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

-- ============================================
-- CORE TABLES
-- ============================================

-- 1. Places Table
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  category TEXT, -- restaurant, park, mall, station, etc.
  locality TEXT,
  district TEXT,
  region TEXT,
  country TEXT DEFAULT 'India',
  
  -- Computed Scores
  safety_score FLOAT DEFAULT 50.0 CHECK (safety_score >= 0 AND safety_score <= 100),
  elo_score FLOAT DEFAULT 1000.0,
  popularity_score FLOAT DEFAULT 50.0 CHECK (popularity_score >= 0 AND popularity_score <= 100),
  experience_score FLOAT DEFAULT 50.0 CHECK (experience_score >= 0 AND experience_score <= 100),
  trend_score FLOAT DEFAULT 0.0 CHECK (trend_score >= -1 AND trend_score <= 1),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_score_update TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT unique_name_location UNIQUE (name, lat, lng)
);

-- Spatial index for location-based queries
CREATE INDEX idx_places_lat ON places(lat);
CREATE INDEX idx_places_lng ON places(lng);
CREATE INDEX idx_places_lat_lng ON places(lat, lng);
CREATE INDEX idx_places_safety_score ON places(safety_score DESC);
CREATE INDEX idx_places_elo_score ON places(elo_score DESC);
CREATE INDEX idx_places_category ON places(category);
CREATE INDEX idx_places_locality ON places(locality);


-- 2. Place Safety Attributes Table
CREATE TABLE place_safety_attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  
  -- Crime Metrics (0-100, lower is better)
  violent_crime FLOAT DEFAULT 0 CHECK (violent_crime >= 0 AND violent_crime <= 100),
  property_crime FLOAT DEFAULT 0 CHECK (property_crime >= 0 AND property_crime <= 100),
  accident_rate FLOAT DEFAULT 0 CHECK (accident_rate >= 0 AND accident_rate <= 100),
  
  -- Infrastructure Metrics (0-100, higher is better)
  safety_infra FLOAT DEFAULT 50 CHECK (safety_infra >= 0 AND safety_infra <= 100),
  police_density FLOAT DEFAULT 50 CHECK (police_density >= 0 AND police_density <= 100),
  cctv_coverage FLOAT DEFAULT 50 CHECK (cctv_coverage >= 0 AND cctv_coverage <= 100),
  lighting_score FLOAT DEFAULT 50 CHECK (lighting_score >= 0 AND lighting_score <= 100),
  
  -- Context-Specific Scores
  night_safety_score FLOAT DEFAULT 50 CHECK (night_safety_score >= 0 AND night_safety_score <= 100),
  women_safety_score FLOAT DEFAULT 50 CHECK (women_safety_score >= 0 AND women_safety_score <= 100),
  tourist_safety_score FLOAT DEFAULT 50 CHECK (tourist_safety_score >= 0 AND tourist_safety_score <= 100),
  crowd_safety_score FLOAT DEFAULT 50 CHECK (crowd_safety_score >= 0 AND crowd_safety_score <= 100),
  pickpocket_risk FLOAT DEFAULT 0 CHECK (pickpocket_risk >= 0 AND pickpocket_risk <= 100),
  
  -- Metadata
  data_timestamp TIMESTAMP DEFAULT NOW(),
  data_source TEXT, -- 'manual', 'api', 'user_reports', etc.
  confidence_score FLOAT DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_place_attributes UNIQUE (place_id, data_timestamp)
);

CREATE INDEX idx_safety_attrs_place ON place_safety_attributes(place_id);
CREATE INDEX idx_safety_attrs_timestamp ON place_safety_attributes(data_timestamp DESC);


-- 3. Place Reviews Table
CREATE TABLE place_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_id UUID, -- NULL for anonymous reviews
  
  -- Ratings (1-5 scale)
  safety_rating INT NOT NULL CHECK (safety_rating >= 1 AND safety_rating <= 5),
  cleanliness_rating INT CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  police_response_rating INT CHECK (police_response_rating >= 1 AND police_response_rating <= 5),
  overall_rating INT CHECK (overall_rating >= 1 AND overall_rating <= 5),
  
  -- Review Content
  review_text TEXT,
  tags TEXT[], -- ['lit', 'unsafe at night', 'pickpockets', etc.]
  
  -- Context
  time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'night', 'late_night')),
  day_of_week TEXT,
  visit_date DATE,
  
  -- Metadata
  is_verified BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reviews_place ON place_reviews(place_id);
CREATE INDEX idx_reviews_user ON place_reviews(user_id);
CREATE INDEX idx_reviews_safety_rating ON place_reviews(safety_rating);
CREATE INDEX idx_reviews_created ON place_reviews(created_at DESC);
CREATE INDEX idx_reviews_tags ON place_reviews USING GIN(tags);


-- 4. Place Safety History (Time-Series)
CREATE TABLE place_safety_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  
  -- Temporal Data
  month DATE NOT NULL, -- First day of month
  week DATE, -- First day of week
  
  -- Score Snapshots
  safety_score FLOAT NOT NULL,
  crime_index FLOAT,
  infra_index FLOAT,
  review_score FLOAT,
  
  -- Trend Calculation
  trend_value FLOAT, -- rate of change
  trend_direction TEXT CHECK (trend_direction IN ('improving', 'declining', 'stable')),
  
  -- Incident Counts
  violent_incidents INT DEFAULT 0,
  property_incidents INT DEFAULT 0,
  accident_incidents INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_place_month UNIQUE (place_id, month)
);

CREATE INDEX idx_history_place ON place_safety_history(place_id);
CREATE INDEX idx_history_month ON place_safety_history(month DESC);
CREATE INDEX idx_history_trend ON place_safety_history(trend_direction);


-- ============================================
-- USER & INTERACTION TABLES
-- ============================================

-- 5. Users Table (for authentication)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Preferences
  preferred_locality TEXT,
  notification_enabled BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);


-- 6. Saved Places (User Watchlist)
CREATE TABLE saved_places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  
  -- Preferences
  alert_on_safety_change BOOLEAN DEFAULT TRUE,
  alert_threshold FLOAT DEFAULT 10.0, -- Alert if score changes by this much
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_user_saved_place UNIQUE (user_id, place_id)
);

CREATE INDEX idx_saved_places_user ON saved_places(user_id);
CREATE INDEX idx_saved_places_place ON saved_places(place_id);


-- 7. Safety Alerts Table
CREATE TABLE safety_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  
  alert_type TEXT NOT NULL CHECK (alert_type IN ('spike', 'decline', 'trend_change', 'incident', 'improvement')),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Alert Data
  old_score FLOAT,
  new_score FLOAT,
  change_percentage FLOAT,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_alerts_place ON safety_alerts(place_id);
CREATE INDEX idx_alerts_active ON safety_alerts(is_active, created_at DESC);
CREATE INDEX idx_alerts_severity ON safety_alerts(severity);


-- 8. Place Comparisons (User History)
CREATE TABLE place_comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  place_a_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  place_b_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comparisons_user ON place_comparisons(user_id);


-- 9. Background Jobs Table
CREATE TABLE background_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type TEXT NOT NULL, -- 'score_update', 'trend_computation', 'data_fetch', etc.
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  
  -- Job Data
  payload JSONB,
  result JSONB,
  error_message TEXT,
  
  -- Timing
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_status ON background_jobs(status, created_at DESC);
CREATE INDEX idx_jobs_type ON background_jobs(job_type);


-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_places_updated_at BEFORE UPDATE ON places
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safety_attrs_updated_at BEFORE UPDATE ON place_safety_attributes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON place_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION earth_distance(lat1 FLOAT, lng1 FLOAT, lat2 FLOAT, lng2 FLOAT)
RETURNS FLOAT AS $$
BEGIN
  RETURN 6371 * acos(
    cos(radians(lat1)) * cos(radians(lat2)) * 
    cos(radians(lng2) - radians(lng1)) + 
    sin(radians(lat1)) * sin(radians(lat2))
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- View: Top Safe Places
CREATE OR REPLACE VIEW top_safe_places AS
SELECT 
  p.id,
  p.name,
  p.locality,
  p.safety_score,
  p.elo_score,
  p.trend_score,
  COUNT(DISTINCT r.id) as review_count,
  AVG(r.safety_rating) as avg_safety_rating
FROM places p
LEFT JOIN place_reviews r ON p.id = r.place_id
GROUP BY p.id, p.name, p.locality, p.safety_score, p.elo_score, p.trend_score
ORDER BY p.safety_score DESC, p.elo_score DESC;


-- View: Trending Places
CREATE OR REPLACE VIEW trending_places AS
SELECT 
  p.id,
  p.name,
  p.locality,
  p.safety_score,
  p.trend_score,
  h.trend_direction
FROM places p
LEFT JOIN LATERAL (
  SELECT trend_direction, trend_value
  FROM place_safety_history
  WHERE place_id = p.id
  ORDER BY month DESC
  LIMIT 1
) h ON TRUE
WHERE p.trend_score > 0.3
ORDER BY p.trend_score DESC;


-- View: Recent Alerts
CREATE OR REPLACE VIEW active_safety_alerts AS
SELECT 
  a.*,
  p.name as place_name,
  p.locality,
  p.lat,
  p.lng
FROM safety_alerts a
JOIN places p ON a.place_id = p.id
WHERE a.is_active = TRUE
  AND (a.expires_at IS NULL OR a.expires_at > NOW())
ORDER BY a.created_at DESC;


-- ============================================
-- SEED DATA MIGRATION
-- ============================================

-- This will be populated from your existing places.json
-- See migration script in /migrations folder
