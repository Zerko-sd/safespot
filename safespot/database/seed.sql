-- Migration: Seed Initial Data from places.json
-- Run this after schema.sql

-- Insert Places from JSON (example - adjust based on your data)
INSERT INTO places (name, lat, lng, category, locality, district, safety_score, popularity_score, experience_score, trend_score)
VALUES 
  ('Marina Beach', 13.0499, 80.2824, 'beach', 'Marina', 'Chennai', 80, 95, 75, 0.5),
  ('T Nagar Commercial Area', 13.0418, 80.2341, 'commercial', 'T Nagar', 'Chennai', 65, 90, 60, 0.1),
  ('Anna Nagar Park', 13.0878, 80.2088, 'park', 'Anna Nagar', 'Chennai', 92, 70, 90, 0.8),
  ('Velachery Railway Station', 12.9810, 80.2209, 'transport', 'Velachery', 'Chennai', 52, 80, 45, -0.4),
  ('Phoenix Mall', 13.0109, 80.2290, 'mall', 'Velachery', 'Chennai', 88, 88, 85, 0.6),
  ('Mylapore Temple Area', 13.0339, 80.2676, 'religious', 'Mylapore', 'Chennai', 75, 85, 70, 0.3),
  ('Old Mahabalipuram Road IT Park', 12.9141, 80.2270, 'commercial', 'OMR', 'Chennai', 78, 75, 80, 0.4),
  ('Tambaram East Residential', 12.9249, 80.1000, 'residential', 'Tambaram', 'Chennai', 45, 50, 40, -0.6);

-- Insert Safety Attributes
INSERT INTO place_safety_attributes (place_id, violent_crime, property_crime, accident_rate, cctv_coverage, lighting_score, police_density)
SELECT 
  id,
  CASE name
    WHEN 'Marina Beach' THEN 15
    WHEN 'T Nagar Commercial Area' THEN 10
    WHEN 'Anna Nagar Park' THEN 5
    WHEN 'Velachery Railway Station' THEN 20
    WHEN 'Phoenix Mall' THEN 5
    WHEN 'Mylapore Temple Area' THEN 8
    WHEN 'Old Mahabalipuram Road IT Park' THEN 12
    WHEN 'Tambaram East Residential' THEN 35
  END as violent_crime,
  CASE name
    WHEN 'Marina Beach' THEN 25
    WHEN 'T Nagar Commercial Area' THEN 45
    WHEN 'Anna Nagar Park' THEN 10
    WHEN 'Velachery Railway Station' THEN 50
    WHEN 'Phoenix Mall' THEN 15
    WHEN 'Mylapore Temple Area' THEN 30
    WHEN 'Old Mahabalipuram Road IT Park' THEN 20
    WHEN 'Tambaram East Residential' THEN 55
  END as property_crime,
  CASE name
    WHEN 'Marina Beach' THEN 20
    WHEN 'T Nagar Commercial Area' THEN 30
    WHEN 'Anna Nagar Park' THEN 5
    WHEN 'Velachery Railway Station' THEN 35
    WHEN 'Phoenix Mall' THEN 10
    WHEN 'Mylapore Temple Area' THEN 15
    WHEN 'Old Mahabalipuram Road IT Park' THEN 25
    WHEN 'Tambaram East Residential' THEN 40
  END as accident_rate,
  CASE name
    WHEN 'Marina Beach' THEN 85
    WHEN 'T Nagar Commercial Area' THEN 70
    WHEN 'Anna Nagar Park' THEN 90
    WHEN 'Velachery Railway Station' THEN 60
    WHEN 'Phoenix Mall' THEN 95
    WHEN 'Mylapore Temple Area' THEN 75
    WHEN 'Old Mahabalipuram Road IT Park' THEN 88
    WHEN 'Tambaram East Residential' THEN 40
  END as cctv_coverage,
  CASE name
    WHEN 'Marina Beach' THEN 80
    WHEN 'T Nagar Commercial Area' THEN 75
    WHEN 'Anna Nagar Park' THEN 95
    WHEN 'Velachery Railway Station' THEN 50
    WHEN 'Phoenix Mall' THEN 90
    WHEN 'Mylapore Temple Area' THEN 70
    WHEN 'Old Mahabalipuram Road IT Park' THEN 82
    WHEN 'Tambaram East Residential' THEN 45
  END as lighting_score,
  CASE name
    WHEN 'Marina Beach' THEN 90
    WHEN 'T Nagar Commercial Area' THEN 65
    WHEN 'Anna Nagar Park' THEN 80
    WHEN 'Velachery Railway Station' THEN 55
    WHEN 'Phoenix Mall' THEN 85
    WHEN 'Mylapore Temple Area' THEN 75
    WHEN 'Old Mahabalipuram Road IT Park' THEN 70
    WHEN 'Tambaram East Residential' THEN 50
  END as police_density
FROM places;

-- Insert Historical Data (last 6 months)
INSERT INTO place_safety_history (place_id, month, safety_score, crime_index, infra_index, trend_direction)
SELECT 
  p.id,
  date_trunc('month', NOW() - interval '1 month' * generate_series(0, 5)) as month,
  p.safety_score + (random() * 10 - 5) as safety_score,
  (a.violent_crime + a.property_crime) / 2 as crime_index,
  (a.cctv_coverage + a.lighting_score + a.police_density) / 3 as infra_index,
  CASE 
    WHEN p.trend_score > 0.3 THEN 'improving'
    WHEN p.trend_score < -0.3 THEN 'declining'
    ELSE 'stable'
  END as trend_direction
FROM places p
JOIN place_safety_attributes a ON p.id = a.place_id;

-- Create sample alerts
INSERT INTO safety_alerts (place_id, alert_type, severity, title, message, new_score, change_percentage)
SELECT 
  id,
  'improvement',
  'medium',
  name || ' safety improving',
  'Safety metrics have improved by ' || ROUND(ABS(trend_score * 100))::TEXT || '% in the last month.',
  safety_score,
  trend_score * 100
FROM places
WHERE trend_score > 0.5;

INSERT INTO safety_alerts (place_id, alert_type, severity, title, message, new_score, change_percentage)
SELECT 
  id,
  'decline',
  'high',
  'Safety concern: ' || name,
  'Safety metrics have declined. Exercise caution.',
  safety_score,
  trend_score * 100
FROM places
WHERE trend_score < -0.4;
