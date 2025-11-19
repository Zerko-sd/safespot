// Enhanced Database Types for SafeSpot
// Aligned with PostgreSQL schema

export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category?: string;
  locality?: string;
  district?: string;
  region?: string;
  country?: string;

  // Computed Scores
  safety_score: number;
  elo_score: number;
  popularity_score: number;
  experience_score: number;
  trend_score: number;

  // Metadata
  created_at: string;
  updated_at: string;
  last_score_update: string;

  // Relations (optional, loaded when needed)
  safety_attributes?: PlaceSafetyAttributes;
  reviews?: PlaceReview[];
  history?: PlaceSafetyHistory[];
  active_alerts?: SafetyAlert[];
}

export interface PlaceSafetyAttributes {
  id: string;
  place_id: string;

  // Crime Metrics (0-100, lower is better)
  violent_crime: number;
  property_crime: number;
  accident_rate: number;

  // Infrastructure Metrics (0-100, higher is better)
  safety_infra: number;
  police_density: number;
  cctv_coverage: number;
  lighting_score: number;

  // Context-Specific Scores
  night_safety_score: number;
  women_safety_score: number;
  tourist_safety_score: number;
  crowd_safety_score: number;
  pickpocket_risk: number;

  // Metadata
  data_timestamp: string;
  data_source?: string;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export interface PlaceReview {
  id: string;
  place_id: string;
  user_id?: string;

  // Ratings (1-5)
  safety_rating: number;
  cleanliness_rating?: number;
  police_response_rating?: number;
  overall_rating?: number;

  // Content
  review_text?: string;
  tags?: string[];

  // Context
  time_of_day?: "morning" | "afternoon" | "evening" | "night" | "late_night";
  day_of_week?: string;
  visit_date?: string;

  // Metadata
  is_verified: boolean;
  is_flagged: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;

  // Relations
  user?: User;
}

export interface PlaceSafetyHistory {
  id: string;
  place_id: string;

  // Temporal
  month: string;
  week?: string;

  // Scores
  safety_score: number;
  crime_index?: number;
  infra_index?: number;
  review_score?: number;

  // Trend
  trend_value?: number;
  trend_direction?: "improving" | "declining" | "stable";

  // Incidents
  violent_incidents: number;
  property_incidents: number;
  accident_incidents: number;

  created_at: string;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;

  // Preferences
  preferred_locality?: string;
  notification_enabled: boolean;

  created_at: string;
  updated_at: string;
}

export interface SavedPlace {
  id: string;
  user_id: string;
  place_id: string;
  alert_on_safety_change: boolean;
  alert_threshold: number;
  created_at: string;

  // Relations
  place?: Place;
}

export interface SafetyAlert {
  id: string;
  place_id: string;
  alert_type: "spike" | "decline" | "trend_change" | "incident" | "improvement";
  severity?: "low" | "medium" | "high" | "critical";

  title: string;
  message: string;

  // Data
  old_score?: number;
  new_score?: number;
  change_percentage?: number;

  // Metadata
  is_active: boolean;
  created_at: string;
  expires_at?: string;

  // Relations
  place?: Place;
}

export interface PlaceComparison {
  id: string;
  user_id?: string;
  place_a_id: string;
  place_b_id: string;
  created_at: string;

  // Relations
  place_a?: Place;
  place_b?: Place;
}

export interface BackgroundJob {
  id: string;
  job_type: string;
  status: "pending" | "running" | "completed" | "failed";
  payload?: any;
  result?: any;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

// ============================================
// Enhanced Score Types
// ============================================

export interface ComputedSafetyScore {
  // Core Scores
  attributeScore: number; // 0-1
  placeElo: number; // 1000-2400
  finalSafetyScore: number; // 0-100
  safetyTier: "Safe" | "Moderate" | "Unsafe";

  // Component Scores
  safetyScore: number;
  popularityScore: number;
  experienceScore: number;
  trendScore: number;

  // Context-Specific
  nightSafetyScore?: number;
  womenSafetyScore?: number;
  touristSafetyScore?: number;

  // Time-Adjusted
  timeAdjustedScore?: number;
  decayFactor?: number;

  // Confidence
  confidenceLevel: number; // 0-1
  lastUpdated: string;
}

export interface TrendAnalysis {
  currentScore: number;
  previousScore: number;
  change: number;
  changePercentage: number;
  direction: "improving" | "declining" | "stable";
  velocity: number; // rate of change
  prediction30Days?: number;
  confidence: number;
}

export interface RiskZone {
  center: { lat: number; lng: number };
  radius: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  placeIds: string[];
  avgRiskScore: number;
  incidentCount: number;
}

// ============================================
// API Request/Response Types
// ============================================

export interface PlaceQueryParams {
  lat?: number;
  lng?: number;
  radius?: number; // km
  minSafetyScore?: number;
  maxSafetyScore?: number;
  category?: string;
  locality?: string;
  trending?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: "safety_score" | "elo_score" | "popularity" | "distance";
  sortOrder?: "asc" | "desc";
}

export interface ReviewCreateInput {
  place_id: string;
  user_id?: string;
  safety_rating: number;
  cleanliness_rating?: number;
  police_response_rating?: number;
  overall_rating?: number;
  review_text?: string;
  tags?: string[];
  time_of_day?: string;
  visit_date?: string;
}

export interface PlaceComparisonResult {
  place_a: Place;
  place_b: Place;
  winner: "a" | "b" | "tie";
  comparison: {
    safety: { a: number; b: number; diff: number };
    crime: { a: number; b: number; diff: number };
    infrastructure: { a: number; b: number; diff: number };
    popularity: { a: number; b: number; diff: number };
    trend: { a: number; b: number; diff: number };
  };
  recommendation: string;
}

export interface NearbySearchResult {
  place: Place;
  distance: number; // km
  score: ComputedSafetyScore;
  alerts: SafetyAlert[];
}

// ============================================
// Utility Types
// ============================================

export type TimeOfDay =
  | "morning"
  | "afternoon"
  | "evening"
  | "night"
  | "late_night";
export type SafetyContext = "general" | "night" | "women" | "tourist" | "crowd";
export type TrendDirection = "improving" | "declining" | "stable";
export type AlertType =
  | "spike"
  | "decline"
  | "trend_change"
  | "incident"
  | "improvement";
export type Severity = "low" | "medium" | "high" | "critical";

// Legacy compatibility (for gradual migration)
export interface LegacyPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  crime: {
    violent: number;
    property: number;
    accident: number;
  };
  infra: {
    cctv: number;
    lighting: number;
    policeDensity: number;
  };
  popularity: number;
  experience: number;
  trend: number;
  reviews?: any[];
}

// Conversion helper type
export type PlaceWithLegacy = Place & {
  crime?: LegacyPlace["crime"];
  infra?: LegacyPlace["infra"];
};
