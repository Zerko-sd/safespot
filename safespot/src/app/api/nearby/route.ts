import { NextRequest, NextResponse } from "next/server";
import { getNearbyPlaces } from "@/lib/db/places";

/**
 * GET /api/nearby - Get nearby places within a radius
 * Query params:
 * - lat: Latitude (required)
 * - lng: Longitude (required)
 * - radius: Radius in kilometers (default: 5)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = searchParams.get("radius")
    ? parseFloat(searchParams.get("radius")!)
    : 5;

  if (!lat || !lng) {
    return NextResponse.json(
      { success: false, error: "Missing required parameters: lat, lng" },
      { status: 400 }
    );
  }

  try {
    const places = await getNearbyPlaces(
      parseFloat(lat),
      parseFloat(lng),
      radius
    );

    // Calculate distance for each place (Haversine formula)
    const placesWithDistance = places.map((place) => {
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        place.lat,
        place.lng
      );

      return {
        ...place,
        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
      };
    });

    // Sort by distance
    placesWithDistance.sort((a, b) => a.distance - b.distance);

    return NextResponse.json({
      success: true,
      data: placesWithDistance,
      meta: {
        count: placesWithDistance.length,
        center: { lat: parseFloat(lat), lng: parseFloat(lng) },
        radius,
      },
    });
  } catch (error: any) {
    console.error("Error fetching nearby places:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch nearby places" },
      { status: 500 }
    );
  }
}

/**
 * Haversine formula to calculate distance between two points
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
