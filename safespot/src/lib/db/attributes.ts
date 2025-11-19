// Database interface for place safety attributes

import { PlaceSafetyAttributes } from "@/types/database";
import placesData from "@/data/places.json";

/**
 * Get safety attributes for a place
 */
export async function getPlaceSafetyAttributes(
  placeId: string
): Promise<PlaceSafetyAttributes | null> {
  // TODO: Replace with actual database query
  // const { data, error } = await supabase
  //   .from('place_safety_attributes')
  //   .select('*')
  //   .eq('place_id', placeId)
  //   .order('data_timestamp', { ascending: false })
  //   .limit(1)
  //   .single();

  // Temporary: Convert from JSON
  const place = (placesData.places as any[]).find((p) => p.id === placeId);
  if (!place) return null;

  return {
    id: `attr_${placeId}`,
    place_id: placeId,
    violent_crime: place.crime?.violent || 0,
    property_crime: place.crime?.property || 0,
    accident_rate: place.crime?.accident || 0,
    safety_infra:
      ((place.infra?.cctv || 0) +
        (place.infra?.lighting || 0) +
        (place.infra?.policeDensity || 0)) /
      3,
    police_density: place.infra?.policeDensity || 50,
    cctv_coverage: place.infra?.cctv || 50,
    lighting_score: place.infra?.lighting || 50,
    night_safety_score: calculateNightSafety(place),
    women_safety_score: 50,
    tourist_safety_score: 50,
    crowd_safety_score: 50,
    pickpocket_risk: place.crime?.property || 0,
    data_timestamp: new Date().toISOString(),
    data_source: "json",
    confidence_score: 0.7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Create or update safety attributes
 */
export async function upsertPlaceSafetyAttributes(
  placeId: string,
  data: Partial<PlaceSafetyAttributes>
): Promise<PlaceSafetyAttributes> {
  // TODO: Implement database upsert
  const attributes: PlaceSafetyAttributes = {
    id: data.id || `attr_${placeId}_${Date.now()}`,
    place_id: placeId,
    violent_crime: data.violent_crime || 0,
    property_crime: data.property_crime || 0,
    accident_rate: data.accident_rate || 0,
    safety_infra: data.safety_infra || 50,
    police_density: data.police_density || 50,
    cctv_coverage: data.cctv_coverage || 50,
    lighting_score: data.lighting_score || 50,
    night_safety_score: data.night_safety_score || 50,
    women_safety_score: data.women_safety_score || 50,
    tourist_safety_score: data.tourist_safety_score || 50,
    crowd_safety_score: data.crowd_safety_score || 50,
    pickpocket_risk: data.pickpocket_risk || 0,
    data_timestamp: new Date().toISOString(),
    data_source: data.data_source || "manual",
    confidence_score: data.confidence_score || 0.5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return attributes;
}

function calculateNightSafety(place: any): number {
  if (!place.infra) return 50;
  return (
    place.infra.lighting * 0.5 +
    place.infra.policeDensity * 0.3 +
    place.infra.cctv * 0.2
  );
}
