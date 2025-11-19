export interface CrimeData {
  violent: number; // 0-100
  property: number; // 0-100
  accident: number; // 0-100
}

export interface InfrastructureData {
  cctv: number; // 0-100
  lighting: number; // 0-100
  policeDensity: number; // 0-100
}

export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  crime: CrimeData;
  infra: InfrastructureData;
  popularity: number; // 0-100
  experience: number; // 0-100 (cleanliness, walkability)
  trend: number; // -1 (declining) to +1 (improving)
  reviews?: Review[];
}

export interface Review {
  id: string;
  author: string;
  rating: number; // 1-5
  comment: string;
  tags: string[];
  safetyRating: number; // 1-5
  cleanlinessRating: number; // 1-5
  policeResponseRating: number; // 1-5
  timestamp: string;
}

export interface SafetyScore {
  attributeScore: number; // 0-1
  placeElo: number;
  finalSafetyScore: number; // 0-100
  safetyTier: "Safe" | "Moderate" | "Unsafe";
  safetyScore: number; // derived from crime + infra
  popularityScore: number;
  experienceScore: number;
  trendScore: number;
}

export type FilterType =
  | "all"
  | "safe"
  | "moderate"
  | "unsafe"
  | "trending"
  | "popular";
