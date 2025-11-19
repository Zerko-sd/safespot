"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Search, Filter, Shield, TrendingUp, Users, Moon } from "lucide-react";
import { Place, FilterType } from "@/types";
import { calculateSafetyMetrics } from "@/utils/safetyCalculations";
import PlaceDetailPanel from "@/components/PlaceDetailPanel";
import placesData from "@/data/places.json";

// Dynamically import map to avoid SSR issues with Leaflet
const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-2xl">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

export default function HomePage() {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const places = placesData.places as Place[];

  // Filter and search places
  const filteredPlaces = useMemo(() => {
    let filtered = places;

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((place) =>
        place.name.toLowerCase().includes(query)
      );
    }

    // Apply filter
    if (activeFilter !== "all") {
      filtered = filtered.filter((place) => {
        const metrics = calculateSafetyMetrics(place);

        switch (activeFilter) {
          case "safe":
            return metrics.safetyTier === "Safe";
          case "moderate":
            return metrics.safetyTier === "Moderate";
          case "unsafe":
            return metrics.safetyTier === "Unsafe";
          case "trending":
            return place.trend > 0.3;
          case "popular":
            return place.popularity > 70;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [places, searchQuery, activeFilter]);

  const filters: { id: FilterType; label: string; icon: any }[] = [
    { id: "all", label: "All Places", icon: Filter },
    { id: "safe", label: "Safe Only", icon: Shield },
    { id: "moderate", label: "Moderate", icon: Shield },
    { id: "trending", label: "Trending", icon: TrendingUp },
    { id: "popular", label: "Popular", icon: Users },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-[1000] bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SafeSpot
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">
                  Check safety before you go
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="hidden lg:flex items-center space-x-4 xl:space-x-6">
              <div className="text-center">
                <p className="text-xl xl:text-2xl font-bold text-gray-900">
                  {places.length}
                </p>
                <p className="text-xs text-gray-500">Places</p>
              </div>
              <div className="text-center">
                <p className="text-xl xl:text-2xl font-bold text-green-600">
                  {
                    places.filter(
                      (p) => calculateSafetyMetrics(p).safetyTier === "Safe"
                    ).length
                  }
                </p>
                <p className="text-xs text-gray-500">Safe Zones</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="absolute top-20 sm:top-24 left-4 right-4 md:left-8 md:right-auto md:w-96 z-[900] space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for a place..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/90 backdrop-blur-md border border-gray-200 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;

            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`
                  flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium text-xs sm:text-sm
                  transition-all duration-200 backdrop-blur-md
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg scale-105"
                      : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                  }
                `}>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="whitespace-nowrap">{filter.label}</span>
              </button>
            );
          })}
        </div>

        {/* Results Counter */}
        {searchQuery && (
          <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              Found{" "}
              <span className="font-bold text-gray-900">
                {filteredPlaces.length}
              </span>{" "}
              places
            </p>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="absolute inset-0 pt-16 sm:pt-20 z-0">
        <InteractiveMap
          places={filteredPlaces}
          selectedPlace={selectedPlace}
          onPlaceSelect={setSelectedPlace}
        />
      </div>

      {/* Place Detail Panel */}
      {selectedPlace && (
        <PlaceDetailPanel
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
        />
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 bg-white/90 backdrop-blur-md p-3 md:p-4 rounded-xl shadow-lg border border-gray-200 z-[800] hidden sm:block">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Safety Levels
        </h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow" />
            <span className="text-xs text-gray-700">Safe (70-100)</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow" />
            <span className="text-xs text-gray-700">Moderate (40-69)</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow" />
            <span className="text-xs text-gray-700">Unsafe (0-39)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
