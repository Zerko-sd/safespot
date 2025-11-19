import { NextRequest, NextResponse } from "next/server";
import { getPlaceById, updatePlace, deletePlace } from "@/lib/db/places";
import { getPlaceSafetyAttributes } from "@/lib/db/attributes";
import { getPlaceReviews, getReviewStats } from "@/lib/db/reviews";

/**
 * GET /api/places/[id] - Get a single place with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const place = await getPlaceById(params.id);

    if (!place) {
      return NextResponse.json(
        { success: false, error: "Place not found" },
        { status: 404 }
      );
    }

    // Optionally fetch related data
    const includeDetails = request.nextUrl.searchParams.get("include");
    let safetyAttributes = null;
    let reviews = null;
    let reviewStats = null;

    if (includeDetails === "all" || includeDetails?.includes("safety")) {
      safetyAttributes = await getPlaceSafetyAttributes(params.id);
    }

    if (includeDetails === "all" || includeDetails?.includes("reviews")) {
      const reviewLimit = request.nextUrl.searchParams.get("reviewLimit");
      reviews = await getPlaceReviews(
        params.id,
        reviewLimit ? parseInt(reviewLimit) : 10
      );
      reviewStats = await getReviewStats(params.id);
    }

    return NextResponse.json({
      success: true,
      data: {
        place,
        safetyAttributes,
        reviews,
        reviewStats,
      },
    });
  } catch (error: any) {
    console.error("Error fetching place:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch place" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/places/[id] - Update a place
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updatedPlace = await updatePlace(params.id, body);

    return NextResponse.json({
      success: true,
      data: updatedPlace,
    });
  } catch (error: any) {
    console.error("Error updating place:", error);

    if (error.message === "Place not found") {
      return NextResponse.json(
        { success: false, error: "Place not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update place" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/places/[id] - Delete a place
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deletePlace(params.id);

    return NextResponse.json({
      success: true,
      message: "Place deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting place:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete place" },
      { status: 500 }
    );
  }
}
