import React from "react";
import { Star, Shield, Trash2, Radio } from "lucide-react";
import { Review } from "@/types";

interface UserReviewSectionProps {
  reviews: Review[];
}

export default function UserReviewSection({ reviews }: UserReviewSectionProps) {
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-semibold text-gray-900">{review.author}</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatDate(review.timestamp)}
              </p>
            </div>
            <div className="flex items-center space-x-1">
              {renderStars(review.rating)}
            </div>
          </div>

          {/* Rating Chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 rounded-full">
              <Shield className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">
                Safety {review.safetyRating}/5
              </span>
            </div>
            <div className="flex items-center space-x-1 px-2 py-1 bg-green-50 rounded-full">
              <Trash2 className="w-3 h-3 text-green-600" />
              <span className="text-xs font-medium text-green-700">
                Clean {review.cleanlinessRating}/5
              </span>
            </div>
            <div className="flex items-center space-x-1 px-2 py-1 bg-purple-50 rounded-full">
              <Radio className="w-3 h-3 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">
                Response {review.policeResponseRating}/5
              </span>
            </div>
          </div>

          {/* Comment */}
          <p className="text-sm text-gray-700 mb-3 leading-relaxed">
            {review.comment}
          </p>

          {/* Tags */}
          {review.tags && review.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {review.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
