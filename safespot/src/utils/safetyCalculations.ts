import { Place, SafetyScore, CrimeData, InfrastructureData } from "@/types";

/**
 * Calculate the overall safety score from crime and infrastructure data
 */
export function calculateSafetyFromCrimeAndInfra(
  crime: CrimeData,
  infra: InfrastructureData
): number {
  // Lower crime is better, higher infra is better
  const crimeScore =
    100 - (crime.violent * 0.5 + crime.property * 0.3 + crime.accident * 0.2);
  const infraScore =
    infra.cctv * 0.4 + infra.lighting * 0.35 + infra.policeDensity * 0.25;

  // Weighted average: 60% crime safety, 40% infrastructure
  return crimeScore * 0.6 + infraScore * 0.4;
}

/**
 * Normalize trend from -1/+1 to 0-100 scale
 */
function normalizeTrend(trend: number): number {
  return ((trend + 1) / 2) * 100;
}

/**
 * Calculate comprehensive safety metrics using Elo-based formula
 */
export function calculateSafetyMetrics(place: Place): SafetyScore {
  // 1. Calculate component scores (0-100)
  const safetyScore = calculateSafetyFromCrimeAndInfra(
    place.crime,
    place.infra
  );
  const popularityScore = place.popularity;
  const experienceScore = place.experience;
  const trendScore = normalizeTrend(place.trend);

  // 2. Calculate AttributeScore (0-1)
  const attributeScore =
    0.4 * (safetyScore / 100) +
    0.3 * (popularityScore / 100) +
    0.2 * (experienceScore / 100) +
    0.1 * (trendScore / 100);

  // 3. Calculate PlaceElo (1000-2400 range)
  const placeElo = 1000 + 1400 * attributeScore;

  // 4. Calculate FinalSafetyScore (0-100)
  const finalSafetyScore = attributeScore * 100;

  // 5. Determine safety tier
  let safetyTier: "Safe" | "Moderate" | "Unsafe";
  if (finalSafetyScore >= 70) {
    safetyTier = "Safe";
  } else if (finalSafetyScore >= 40) {
    safetyTier = "Moderate";
  } else {
    safetyTier = "Unsafe";
  }

  return {
    attributeScore,
    placeElo: Math.round(placeElo),
    finalSafetyScore: Math.round(finalSafetyScore),
    safetyTier,
    safetyScore: Math.round(safetyScore),
    popularityScore: Math.round(popularityScore),
    experienceScore: Math.round(experienceScore),
    trendScore: Math.round(trendScore),
  };
}

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
