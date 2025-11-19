"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, TrendingUp, Users, Sparkles, Shield } from "lucide-react";
import { Place } from "@/types";
import {
  calculateSafetyMetrics,
  getTrendIndicator,
} from "@/utils/safetyCalculations";
import SafetyScoreBar from "./SafetyScoreBar";
import CrimeInfoSection from "./CrimeInfoSection";
import UserReviewSection from "./UserReviewSection";
import InfrastructureSection from "./InfrastructureSection";

interface PlaceDetailPanelProps {
  place: Place | null;
  onClose: () => void;
}

export default function PlaceDetailPanel({
  place,
  onClose,
}: PlaceDetailPanelProps) {
  if (!place) return null;

  const metrics = calculateSafetyMetrics(place);
  const trendInfo = getTrendIndicator(place.trend);

  const getSafetyTierStyles = () => {
    switch (metrics.safetyTier) {
      case "Safe":
        return "from-green-500 to-emerald-600 text-white";
      case "Moderate":
        return "from-yellow-500 to-orange-500 text-white";
      case "Unsafe":
        return "from-red-500 to-rose-600 text-white";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full sm:w-[90%] md:w-[480px] lg:w-[520px] bg-white shadow-2xl z-[2000] overflow-y-auto">
        {/* Header with gradient */}
        <div
          className={`relative bg-gradient-to-br ${getSafetyTierStyles()} p-6 pb-8`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm">
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start space-x-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{place.name}</h2>
              <p className="text-sm opacity-90">
                {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
              </p>
            </div>
          </div>

          {/* Safety Score Badge */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium opacity-90">
                Overall Safety Score
              </span>
              <span className="text-3xl font-bold">
                {metrics.finalSafetyScore}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-90">
                Safety Tier: {metrics.safetyTier}
              </span>
              <span className="flex items-center space-x-1 opacity-90">
                <span>Elo: {metrics.placeElo}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Trend Indicator */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Safety Trend</span>
            </div>
            <span className={`font-semibold ${trendInfo.color}`}>
              {trendInfo.icon} {trendInfo.text}
            </span>
          </div>

          {/* Score Breakdown */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Score Breakdown</span>
            </h3>
            <div className="space-y-3">
              <SafetyScoreBar
                score={metrics.safetyScore}
                label="Safety Score"
              />
              <SafetyScoreBar
                score={metrics.popularityScore}
                label="Popularity Score"
              />
              <SafetyScoreBar
                score={metrics.experienceScore}
                label="Experience Score"
              />
              <SafetyScoreBar score={metrics.trendScore} label="Trend Score" />
            </div>
          </section>

          {/* Crime Information */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Crime Statistics</span>
            </h3>
            <CrimeInfoSection crime={place.crime} />
          </section>

          {/* Infrastructure */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Sparkles className="w-5 h-5" />
              <span>Safety Infrastructure</span>
            </h3>
            <InfrastructureSection infra={place.infra} />
          </section>

          {/* User Reviews */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>User Reviews</span>
            </h3>
            <UserReviewSection reviews={place.reviews || []} />
          </section>

          {/* Elo Formula Info */}
          <section className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              How We Calculate Safety
            </h4>
            <div className="text-xs text-gray-600 space-y-1 font-mono">
              <p>AttributeScore = 0.40×Safety + 0.30×Popularity</p>
              <p className="ml-16">+ 0.20×Experience + 0.10×Trend</p>
              <p className="mt-2">PlaceElo = 1000 + 1400 × AttributeScore</p>
              <p>FinalScore = AttributeScore × 100</p>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-gray-700">
                <span className="font-semibold">Your Score:</span>{" "}
                {metrics.attributeScore.toFixed(3)}
              </p>
            </div>
          </section>
        </div>
      </motion.div>

      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[1900]"
      />
    </AnimatePresence>
  );
}
