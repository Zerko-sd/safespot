// Database interface layer for places
// This provides an abstraction over your database (Supabase/PostgreSQL)

import { Place, PlaceQueryParams } from "@/types/database";

// For now, we'll use the JSON data as a fallback
// Replace this with actual database calls when you set up Supabase
import placesData from "@/data/places.json";

/**
 * Get places with filtering and pagination
 */
export async function getPlaces(params: PlaceQueryParams): Promise<Place[]> {
  // TODO: Replace with actual database query
  // Example Supabase query:
  // const { data, error } = await supabase
  //   .from('places')
  //   .select('*')
  //   .gte('safety_score', params.minSafetyScore || 0)
  //   .order(params.sortBy || 'safety_score', { ascending: params.sortOrder === 'asc' })
  //   .range(params.offset || 0, (params.offset || 0) + (params.limit || 50));

  // Temporary: Convert JSON data to database format
  let places = (placesData.places as any[]).map((p) => convertLegacyPlace(p));

  // Apply filters
  if (params.minSafetyScore) {
    places = places.filter((p) => p.safety_score >= params.minSafetyScore!);
  }

  if (params.maxSafetyScore) {
    places = places.filter((p) => p.safety_score <= params.maxSafetyScore!);
  }

  if (params.category) {
    places = places.filter((p) => p.category === params.category);
  }

  if (params.locality) {
    places = places.filter((p) =>
      p.locality?.toLowerCase().includes(params.locality!.toLowerCase())
    );
  }

  if (params.trending) {
    places = places.filter((p) => p.trend_score > 0.3);
  }

  // Sort
  const sortField = params.sortBy || "safety_score";
  places.sort((a, b) => {
    const aVal = (a as any)[sortField] || 0;
    const bVal = (b as any)[sortField] || 0;
    return params.sortOrder === "asc" ? aVal - bVal : bVal - aVal;
  });

  // Pagination
  const start = params.offset || 0;
  const end = start + (params.limit || 50);

  return places.slice(start, end);
}

/**
 * Get a single place by ID
 */
export async function getPlaceById(id: string): Promise<Place | null> {
  // TODO: Replace with actual database query
  const places = await getPlaces({});
  return places.find((p) => p.id === id) || null;
}

/**
 * Create a new place
 */
export async function createPlace(data: Partial<Place>): Promise<Place> {
  // TODO: Replace with actual database insert
  const newPlace: Place = {
    id: generateId(),
    name: data.name!,
    lat: data.lat!,
    lng: data.lng!,
    category: data.category,
    locality: data.locality,
    district: data.district,
    region: data.region,
    country: data.country || "India",
    safety_score: data.safety_score || 50,
    elo_score: data.elo_score || 1000,
    popularity_score: data.popularity_score || 50,
    experience_score: data.experience_score || 50,
    trend_score: data.trend_score || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_score_update: new Date().toISOString(),
  };

  return newPlace;
}

/**
 * Update an existing place
 */
export async function updatePlace(
  id: string,
  data: Partial<Place>
): Promise<Place> {
  // TODO: Replace with actual database update
  const existingPlace = await getPlaceById(id);
  if (!existingPlace) {
    throw new Error("Place not found");
  }

  const updatedPlace: Place = {
    ...existingPlace,
    ...data,
    updated_at: new Date().toISOString(),
  };

  return updatedPlace;
}

/**
 * Delete a place
 */
export async function deletePlace(id: string): Promise<void> {
  // TODO: Replace with actual database delete
  console.log(`Deleting place ${id}`);
}

/**
 * Search places by name
 */
export async function searchPlacesByName(query: string): Promise<Place[]> {
  const places = await getPlaces({});
  return places.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );
}

/**
 * Get nearby places within radius
 */
export async function getNearbyPlaces(
  lat: number,
  lng: number,
  radius: number = 5
): Promise<Place[]> {
  return getPlaces({ lat, lng, radius });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert legacy JSON place format to database format
 */
function convertLegacyPlace(legacyPlace: any): Place {
  return {
    id: legacyPlace.id,
    name: legacyPlace.name,
    lat: legacyPlace.lat,
    lng: legacyPlace.lng,
    category: undefined,
    locality: undefined,
    district: undefined,
    region: undefined,
    country: "India",
    safety_score: calculateSafetyScoreFromLegacy(legacyPlace),
    elo_score:
      1000 + (calculateSafetyScoreFromLegacy(legacyPlace) / 100) * 1400,
    popularity_score: legacyPlace.popularity || 50,
    experience_score: legacyPlace.experience || 50,
    trend_score: legacyPlace.trend || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_score_update: new Date().toISOString(),
  };
}

function calculateSafetyScoreFromLegacy(legacyPlace: any): number {
  if (!legacyPlace.crime || !legacyPlace.infra) return 50;

  const crimeScore =
    100 -
    (legacyPlace.crime.violent * 0.5 +
      legacyPlace.crime.property * 0.3 +
      legacyPlace.crime.accident * 0.2);

  const infraScore =
    legacyPlace.infra.cctv * 0.4 +
    legacyPlace.infra.lighting * 0.35 +
    legacyPlace.infra.policeDensity * 0.25;

  return crimeScore * 0.6 + infraScore * 0.4;
}

function generateId(): string {
  return `place_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
