// Database interface for place reviews

import { PlaceReview, ReviewCreateInput } from "@/types/database";
import placesData from "@/data/places.json";

/**
 * Get reviews for a place
 */
export async function getPlaceReviews(
  placeId: string,
  limit: number = 10
): Promise<PlaceReview[]> {
  // TODO: Replace with actual database query
  // const { data, error } = await supabase
  //   .from('place_reviews')
  //   .select('*')
  //   .eq('place_id', placeId)
  //   .order('created_at', { ascending: false })
  //   .limit(limit);

  // Temporary: Get from JSON
  const place = (placesData.places as any[]).find((p) => p.id === placeId);
  if (!place || !place.reviews) return [];

  return place.reviews.map((r: any) => convertLegacyReview(r, placeId));
}

/**
 * Create a new review
 */
export async function createReview(
  input: ReviewCreateInput
): Promise<PlaceReview> {
  // TODO: Replace with actual database insert
  const review: PlaceReview = {
    id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    place_id: input.place_id,
    user_id: input.user_id,
    safety_rating: input.safety_rating,
    cleanliness_rating: input.cleanliness_rating,
    police_response_rating: input.police_response_rating,
    overall_rating: input.overall_rating || input.safety_rating,
    review_text: input.review_text,
    tags: input.tags,
    time_of_day: input.time_of_day as any,
    visit_date: input.visit_date,
    is_verified: false,
    is_flagged: false,
    helpful_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return review;
}

/**
 * Update a review
 */
export async function updateReview(
  reviewId: string,
  data: Partial<PlaceReview>
): Promise<PlaceReview> {
  // TODO: Implement database update
  throw new Error("Not implemented");
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string): Promise<void> {
  // TODO: Implement database delete
  console.log(`Deleting review ${reviewId}`);
}

/**
 * Get review statistics for a place
 */
export async function getReviewStats(placeId: string): Promise<{
  total: number;
  avgSafetyRating: number;
  avgCleanlinessRating: number;
  avgPoliceResponseRating: number;
  recentCount: number;
}> {
  const reviews = await getPlaceReviews(placeId, 100);

  const total = reviews.length;
  const avgSafetyRating =
    reviews.reduce((sum, r) => sum + r.safety_rating, 0) / total || 0;
  const cleanlinessReviews = reviews.filter((r) => r.cleanliness_rating);
  const avgCleanlinessRating =
    cleanlinessReviews.length > 0
      ? cleanlinessReviews.reduce((sum, r) => sum + r.cleanliness_rating!, 0) /
        cleanlinessReviews.length
      : 0;
  const policeReviews = reviews.filter((r) => r.police_response_rating);
  const avgPoliceResponseRating =
    policeReviews.length > 0
      ? policeReviews.reduce((sum, r) => sum + r.police_response_rating!, 0) /
        policeReviews.length
      : 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentCount = reviews.filter(
    (r) => new Date(r.created_at) > thirtyDaysAgo
  ).length;

  return {
    total,
    avgSafetyRating: Math.round(avgSafetyRating * 10) / 10,
    avgCleanlinessRating: Math.round(avgCleanlinessRating * 10) / 10,
    avgPoliceResponseRating: Math.round(avgPoliceResponseRating * 10) / 10,
    recentCount,
  };
}

function convertLegacyReview(legacyReview: any, placeId: string): PlaceReview {
  return {
    id: legacyReview.id,
    place_id: placeId,
    user_id: undefined,
    safety_rating: legacyReview.safetyRating || legacyReview.rating,
    cleanliness_rating: legacyReview.cleanlinessRating,
    police_response_rating: legacyReview.policeResponseRating,
    overall_rating: legacyReview.rating,
    review_text: legacyReview.comment,
    tags: legacyReview.tags,
    time_of_day: undefined,
    day_of_week: undefined,
    visit_date: undefined,
    is_verified: false,
    is_flagged: false,
    helpful_count: 0,
    created_at: legacyReview.timestamp,
    updated_at: legacyReview.timestamp,
  };
}
