import { NextRequest, NextResponse } from "next/server";
import { Place, PlaceQueryParams } from "@/types/database";
import {
  calculateCompositeSafetyScore,
  calculateDistance,
} from "@/utils/advancedScoring";
import {
  getPlaces,
  getPlaceById,
  createPlace,
  updatePlace,
} from "@/lib/db/places";
import { getPlaceSafetyAttributes } from "@/lib/db/attributes";
import { getPlaceReviews } from "@/lib/db/reviews";

/**
 * GET /api/places
 * Search and filter places
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const params: PlaceQueryParams = {
      lat: searchParams.get("lat")
        ? parseFloat(searchParams.get("lat")!)
        : undefined,
      lng: searchParams.get("lng")
        ? parseFloat(searchParams.get("lng")!)
        : undefined,
      radius: searchParams.get("radius")
        ? parseFloat(searchParams.get("radius")!)
        : undefined,
      minSafetyScore: searchParams.get("minSafetyScore")
        ? parseFloat(searchParams.get("minSafetyScore")!)
        : undefined,
      maxSafetyScore: searchParams.get("maxSafetyScore")
        ? parseFloat(searchParams.get("maxSafetyScore")!)
        : undefined,
      category: searchParams.get("category") || undefined,
      locality: searchParams.get("locality") || undefined,
      trending: searchParams.get("trending") === "true",
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 50,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : 0,
      sortBy: (searchParams.get("sortBy") as any) || "safety_score",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    // Get places from database
    let places = await getPlaces(params);

    // If location provided, calculate distances and sort
    if (params.lat && params.lng) {
      places = places.map((place) => ({
        ...place,
        distance: calculateDistance(
          params.lat!,
          params.lng!,
          place.lat,
          place.lng
        ),
      }));

      if (params.sortBy === "distance") {
        places.sort((a: any, b: any) => {
          return params.sortOrder === "asc"
            ? a.distance - b.distance
            : b.distance - a.distance;
        });
      }

      // Filter by radius
      if (params.radius) {
        places = places.filter(
          (place: any) => place.distance <= params.radius!
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: places,
      count: places.length,
      params,
    });
  } catch (error: unknown) {
    console.error("GET /api/places error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/places
 * Create a new place
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.lat || !body.lng) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, lat, lng" },
        { status: 400 }
      );
    }

    const place = await createPlace(body);

    return NextResponse.json(
      {
        success: true,
        data: place,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/places error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
