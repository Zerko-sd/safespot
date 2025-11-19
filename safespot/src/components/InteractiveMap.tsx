"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Place } from "@/types";
import {
  calculateSafetyMetrics,
  getSafetyColor,
} from "@/utils/safetyCalculations";
import "leaflet/dist/leaflet.css";

interface InteractiveMapProps {
  places: Place[];
  selectedPlace: Place | null;
  onPlaceSelect: (place: Place) => void;
  center?: [number, number];
  zoom?: number;
}

// Custom marker icons based on safety level
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s;
      ">
        <div style="
          width: 12px;
          height: 12px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Component to handle map updates
function MapUpdater({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}

export default function InteractiveMap({
  places,
  selectedPlace,
  onPlaceSelect,
  center = [13.0827, 80.2707], // Chennai coordinates
  zoom = 12,
}: InteractiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full rounded-none sm:rounded-2xl shadow-lg z-0"
        zoomControl={true}
        ref={mapRef}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater center={center} zoom={zoom} />

        {places.map((place) => {
          const metrics = calculateSafetyMetrics(place);
          const color = getSafetyColor(metrics.safetyTier);
          const icon = createCustomIcon(color);

          return (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onPlaceSelect(place),
              }}>
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {place.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${color}20`,
                        color: color,
                      }}>
                      {metrics.safetyTier}
                    </span>
                    <span className="text-sm text-gray-600">
                      Score: {metrics.finalSafetyScore}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Custom CSS for marker hover effect */}
      <style jsx global>{`
        .custom-marker:hover > div {
          transform: scale(1.1);
        }
        .leaflet-container {
          font-family: "Inter", sans-serif;
          z-index: 0 !important;
        }
        .leaflet-pane {
          z-index: auto !important;
        }
        .leaflet-top,
        .leaflet-bottom {
          z-index: 400 !important;
        }
        .leaflet-control {
          z-index: 500 !important;
        }
        .leaflet-popup {
          z-index: 600 !important;
        }
        .leaflet-marker-pane {
          z-index: 300 !important;
        }
      `}</style>
    </div>
  );
}
