import {
  Place,
  PlaceSafetyAttributes,
  PlaceReview,
  PlaceSafetyHistory,
  ComputedSafetyScore,
  TrendAnalysis,
  SafetyContext,
} from "@/types/database";

// ============================================
// CORE SCORING ENGINE
// ============================================

/**
 * Enhanced composite safety score calculation
 * Uses weighted formula with normalization and bounds checking
 */
export function calculateCompositeSafetyScore(
  place: Place,
  attributes: PlaceSafetyAttributes,
  reviews?: PlaceReview[]
): ComputedSafetyScore {
  // 1. Calculate component scores
  const safetyScore = calculateSafetyFromAttributes(attributes);
  const popularityScore = place.popularity_score;
  const experienceScore = place.experience_score;
  const trendScore = normalizeTrendScore(place.trend_score);

  // 2. Calculate weighted attribute score (0-1 scale)
  const attributeScore =
    0.4 * (safetyScore / 100) +
    0.3 * (popularityScore / 100) +
    0.2 * (experienceScore / 100) +
    0.1 * (trendScore / 100);

  // 3. Calculate Elo score (1000-2400 range)
  const placeElo = 1000 + 1400 * attributeScore;

  // 4. Calculate final safety score (0-100)
  const finalSafetyScore = attributeScore * 100;

  // 5. Determine safety tier
  const safetyTier = getSafetyTier(finalSafetyScore);

  // 6. Calculate confidence level
  const confidenceLevel = calculateConfidenceLevel(attributes, reviews);

  return {
    attributeScore,
    placeElo: Math.round(placeElo),
    finalSafetyScore: Math.round(finalSafetyScore * 10) / 10,
    safetyTier,
    safetyScore: Math.round(safetyScore),
    popularityScore: Math.round(popularityScore),
    experienceScore: Math.round(experienceScore),
    trendScore: Math.round(trendScore),
    confidenceLevel,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Calculate safety score from crime and infrastructure attributes
 * Lower crime + Higher infrastructure = Higher safety
 */
function calculateSafetyFromAttributes(
  attributes: PlaceSafetyAttributes
): number {
  // Crime score (inverse - lower is better)
  const crimeScore =
    100 -
    (attributes.violent_crime * 0.5 +
      attributes.property_crime * 0.3 +
      attributes.accident_rate * 0.2);

  // Infrastructure score (higher is better)
  const infraScore =
    attributes.cctv_coverage * 0.4 +
    attributes.lighting_score * 0.35 +
    attributes.police_density * 0.25;

  // Weighted average: 60% crime safety, 40% infrastructure
  const rawScore = crimeScore * 0.6 + infraScore * 0.4;

  // Apply bounds and return
  return Math.max(0, Math.min(100, rawScore));
}

/**
 * Normalize trend from -1/+1 to 0-100 scale
 */
function normalizeTrendScore(trend: number): number {
  return ((Math.max(-1, Math.min(1, trend)) + 1) / 2) * 100;
}

/**
 * Determine safety tier based on final score
 */
function getSafetyTier(score: number): "Safe" | "Moderate" | "Unsafe" {
  if (score >= 70) return "Safe";
  if (score >= 40) return "Moderate";
  return "Unsafe";
}

/**
 * Calculate confidence level based on data freshness and volume
 */
function calculateConfidenceLevel(
  attributes: PlaceSafetyAttributes,
  reviews?: PlaceReview[]
): number {
  let confidence = attributes.confidence_score || 0.5;

  // Boost confidence if we have recent reviews
  if (reviews && reviews.length > 0) {
    const recentReviews = reviews.filter((r) => {
      const daysSince =
        (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    });

    confidence += Math.min(0.3, recentReviews.length * 0.05);
  }

  // Check data freshness
  const dataAge =
    (Date.now() - new Date(attributes.data_timestamp).getTime()) /
    (1000 * 60 * 60 * 24);
  if (dataAge > 90) {
    confidence *= 0.7; // Reduce confidence for stale data
  }

  return Math.max(0, Math.min(1, confidence));
}

// ============================================
// TIME DECAY FORMULA
// ============================================

/**
 * Apply time decay to safety score
 * Recent data matters more than old data
 *
 * Formula: AdjustedScore = Score * e^(-λ * months)
 * where λ (lambda) is the decay constant
 */
export function applyTimeDecay(
  score: number,
  dataTimestamp: string,
  decayConstant: number = 0.15
): { adjustedScore: number; decayFactor: number } {
  const now = new Date();
  const dataDate = new Date(dataTimestamp);
  const monthsSince =
    (now.getTime() - dataDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

  // Calculate decay factor
  const decayFactor = Math.exp(-decayConstant * monthsSince);

  // Apply decay
  const adjustedScore = score * decayFactor;

  return {
    adjustedScore: Math.round(adjustedScore * 10) / 10,
    decayFactor: Math.round(decayFactor * 100) / 100,
  };
}

/**
 * Calculate time-adjusted score for a place
 */
export function calculateTimeAdjustedScore(
  place: Place,
  attributes: PlaceSafetyAttributes
): ComputedSafetyScore {
  const baseScore = calculateCompositeSafetyScore(place, attributes);
  const { adjustedScore, decayFactor } = applyTimeDecay(
    baseScore.finalSafetyScore,
    attributes.data_timestamp
  );

  return {
    ...baseScore,
    timeAdjustedScore: adjustedScore,
    decayFactor,
  };
}

// ============================================
// CONTEXT-SPECIFIC SAFETY SCORES
// ============================================

/**
 * Calculate night safety score
 * Emphasizes lighting and police presence
 */
export function calculateNightSafetyScore(
  attributes: PlaceSafetyAttributes,
  reviews?: PlaceReview[]
): number {
  // Base infrastructure score weighted for night conditions
  const infraScore =
    attributes.lighting_score * 0.45 +
    attributes.police_density * 0.35 +
    attributes.cctv_coverage * 0.2;

  // Adjust for night-specific crime
  const nightCrimeAdjustment =
    100 - (attributes.violent_crime * 0.7 + attributes.property_crime * 0.3);

  // Factor in night reviews if available
  let reviewAdjustment = 0;
  if (reviews && reviews.length > 0) {
    const nightReviews = reviews.filter(
      (r) => r.time_of_day === "night" || r.time_of_day === "late_night"
    );

    if (nightReviews.length > 0) {
      const avgNightRating =
        nightReviews.reduce((sum, r) => sum + r.safety_rating, 0) /
        nightReviews.length;
      reviewAdjustment = (avgNightRating / 5) * 100 * 0.2; // 20% weight
    }
  }

  const nightScore =
    infraScore * 0.5 + nightCrimeAdjustment * 0.3 + reviewAdjustment;

  return Math.max(0, Math.min(100, nightScore));
}

/**
 * Calculate women safety score
 * Considers specific risk factors
 */
export function calculateWomenSafetyScore(
  attributes: PlaceSafetyAttributes,
  reviews?: PlaceReview[]
): number {
  // Emphasize violent crime and lighting
  const baseScore =
    100 -
    (attributes.violent_crime * 0.6 +
      attributes.property_crime * 0.2 +
      (100 - attributes.lighting_score) * 0.2);

  // Police presence and infrastructure
  const supportScore =
    attributes.police_density * 0.5 + attributes.cctv_coverage * 0.5;

  // Check for women-specific review tags
  let reviewFactor = 1.0;
  if (reviews && reviews.length > 0) {
    const concerningTags = reviews.filter(
      (r) =>
        r.tags &&
        (r.tags.includes("unsafe for women") ||
          r.tags.includes("harassment") ||
          r.tags.includes("poorly lit"))
    ).length;

    if (concerningTags > 2) {
      reviewFactor = 0.7; // Reduce score if multiple concerns
    }
  }

  const womenSafetyScore =
    (baseScore * 0.6 + supportScore * 0.4) * reviewFactor;

  return Math.max(0, Math.min(100, womenSafetyScore));
}

/**
 * Calculate tourist safety score
 * Considers pickpocketing and scams
 */
export function calculateTouristSafetyScore(
  attributes: PlaceSafetyAttributes
): number {
  const baseScore =
    100 -
    (attributes.pickpocket_risk * 0.5 +
      attributes.property_crime * 0.3 +
      attributes.violent_crime * 0.2);

  // Tourist-friendly infrastructure
  const infraScore =
    attributes.police_density * 0.4 +
    attributes.cctv_coverage * 0.3 +
    attributes.lighting_score * 0.3;

  const touristScore = baseScore * 0.7 + infraScore * 0.3;

  return Math.max(0, Math.min(100, touristScore));
}

/**
 * Calculate context-specific score based on use case
 */
export function calculateContextSpecificScore(
  context: SafetyContext,
  attributes: PlaceSafetyAttributes,
  reviews?: PlaceReview[]
): number {
  switch (context) {
    case "night":
      return calculateNightSafetyScore(attributes, reviews);
    case "women":
      return calculateWomenSafetyScore(attributes, reviews);
    case "tourist":
      return calculateTouristSafetyScore(attributes);
    case "crowd":
      return attributes.crowd_safety_score;
    case "general":
    default:
      return calculateSafetyFromAttributes(attributes);
  }
}

// ============================================
// TREND ANALYSIS & PREDICTION
// ============================================

/**
 * Calculate trend using moving average
 */
export function calculateTrendAnalysis(
  history: PlaceSafetyHistory[]
): TrendAnalysis | null {
  if (history.length < 2) {
    return null;
  }

  // Sort by date (most recent first)
  const sorted = [...history].sort(
    (a, b) => new Date(b.month).getTime() - new Date(a.month).getTime()
  );

  const currentScore = sorted[0].safety_score;
  const previousScore = sorted[1].safety_score;
  const change = currentScore - previousScore;
  const changePercentage = (change / previousScore) * 100;

  // Determine direction
  let direction: "improving" | "declining" | "stable";
  if (Math.abs(changePercentage) < 5) {
    direction = "stable";
  } else if (change > 0) {
    direction = "improving";
  } else {
    direction = "declining";
  }

  // Calculate velocity (rate of change per month)
  const velocity =
    change /
    ((new Date(sorted[0].month).getTime() -
      new Date(sorted[1].month).getTime()) /
      (1000 * 60 * 60 * 24 * 30));

  // Simple linear prediction for 30 days
  const prediction30Days = currentScore + velocity * 1;

  // Calculate confidence based on data consistency
  const recentScores = sorted.slice(0, 3).map((h) => h.safety_score);
  const variance = calculateVariance(recentScores);
  const confidence = Math.max(0, Math.min(1, 1 - variance / 1000));

  return {
    currentScore,
    previousScore,
    change: Math.round(change * 10) / 10,
    changePercentage: Math.round(changePercentage * 10) / 10,
    direction,
    velocity: Math.round(velocity * 100) / 100,
    prediction30Days: Math.max(
      0,
      Math.min(100, Math.round(prediction30Days * 10) / 10)
    ),
    confidence: Math.round(confidence * 100) / 100,
  };
}

/**
 * Exponential smoothing for trend forecasting
 */
export function exponentialSmoothing(
  data: number[],
  alpha: number = 0.3
): number[] {
  if (data.length === 0) return [];

  const smoothed: number[] = [data[0]];

  for (let i = 1; i < data.length; i++) {
    smoothed[i] = alpha * data[i] + (1 - alpha) * smoothed[i - 1];
  }

  return smoothed;
}

/**
 * Calculate variance for confidence estimation
 */
function calculateVariance(data: number[]): number {
  if (data.length === 0) return 0;

  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const squaredDiffs = data.map((val) => Math.pow(val - mean, 2));
  const variance =
    squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;

  return variance;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get color for safety tier
 */
export function getSafetyColor(tier: "Safe" | "Moderate" | "Unsafe"): string {
  switch (tier) {
    case "Safe":
      return "#10b981"; // green
    case "Moderate":
      return "#f59e0b"; // yellow
    case "Unsafe":
      return "#ef4444"; // red
  }
}

/**
 * Get gradient for safety score
 */
export function getSafetyGradient(score: number): string {
  if (score >= 70) {
    return "from-green-400 to-emerald-600";
  } else if (score >= 40) {
    return "from-yellow-400 to-orange-500";
  } else {
    return "from-red-400 to-rose-600";
  }
}

/**
 * Format trend indicator
 */
export function getTrendIndicator(trend: number): {
  text: string;
  icon: string;
  color: string;
} {
  if (trend > 0.3) {
    return { text: "Improving", icon: "↗", color: "text-green-600" };
  } else if (trend < -0.3) {
    return { text: "Declining", icon: "↘", color: "text-red-600" };
  } else {
    return { text: "Neutral", icon: "→", color: "text-gray-600" };
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
