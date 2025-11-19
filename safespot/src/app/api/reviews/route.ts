import { NextRequest, NextResponse } from "next/server";
import { createReview, getPlaceReviews } from "@/lib/db/reviews";
import { ReviewCreateInput } from "@/types/database";

/**
 * POST /api/reviews - Create a new review
 */
export async function POST(request: NextRequest) {
  try {
    const body: ReviewCreateInput = await request.json();

    // Validate required fields
    if (!body.place_id || !body.safety_rating) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: place_id, safety_rating",
        },
        { status: 400 }
      );
    }

    // Validate ratings are in range 1-5
    if (body.safety_rating < 1 || body.safety_rating > 5) {
      return NextResponse.json(
        { success: false, error: "Ratings must be between 1 and 5" },
        { status: 400 }
      );
    }

    // For now, use a placeholder user_id
    // Replace with actual authentication later
    body.user_id = body.user_id || "anonymous";

    const newReview = await createReview(body);

    return NextResponse.json(
      {
        success: true,
        data: newReview,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create review" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reviews?place_id=xxx - Get reviews for a place
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get("place_id");

  if (!placeId) {
    return NextResponse.json(
      { success: false, error: "Missing required parameter: place_id" },
      { status: 400 }
    );
  }

  try {
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 10;
    const reviews = await getPlaceReviews(placeId, limit);

    return NextResponse.json({
      success: true,
      data: reviews,
      meta: {
        count: reviews.length,
        place_id: placeId,
      },
    });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
