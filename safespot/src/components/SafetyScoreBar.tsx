import React from "react";
import { getSafetyGradient } from "@/utils/safetyCalculations";

interface SafetyScoreBarProps {
  score: number;
  label: string;
  showValue?: boolean;
}

export default function SafetyScoreBar({
  score,
  label,
  showValue = true,
}: SafetyScoreBarProps) {
  const gradient = getSafetyGradient(score);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {showValue && (
          <span className="text-sm font-semibold text-gray-900">
            {score}/100
          </span>
        )}
      </div>
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
