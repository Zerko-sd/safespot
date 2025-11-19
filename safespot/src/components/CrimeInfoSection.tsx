import React from "react";
import { Shield, AlertTriangle, AlertCircle } from "lucide-react";
import { CrimeData } from "@/types";

interface CrimeInfoSectionProps {
  crime: CrimeData;
}

export default function CrimeInfoSection({ crime }: CrimeInfoSectionProps) {
  const crimeTypes = [
    {
      name: "Violent Crime",
      value: crime.violent,
      icon: AlertCircle,
      description: "Assault, robbery with violence",
    },
    {
      name: "Property Crime",
      value: crime.property,
      icon: AlertTriangle,
      description: "Theft, burglary, pickpocketing",
    },
    {
      name: "Accidents",
      value: crime.accident,
      icon: Shield,
      description: "Traffic incidents, public accidents",
    },
  ];

  const getCrimeLevel = (value: number) => {
    if (value < 20) return { text: "Low", color: "text-green-600 bg-green-50" };
    if (value < 50)
      return { text: "Moderate", color: "text-yellow-600 bg-yellow-50" };
    return { text: "High", color: "text-red-600 bg-red-50" };
  };

  return (
    <div className="space-y-3">
      {crimeTypes.map((type) => {
        const level = getCrimeLevel(type.value);
        const Icon = type.icon;

        return (
          <div
            key={type.name}
            className="flex items-start space-x-3 p-3 rounded-xl bg-white border border-gray-100 hover:shadow-sm transition-shadow">
            <div className="flex-shrink-0">
              <div className={`p-2 rounded-lg ${level.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold text-gray-900">
                  {type.name}
                </h4>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${level.color}`}>
                  {level.text}
                </span>
              </div>
              <p className="text-xs text-gray-500">{type.description}</p>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    type.value < 20
                      ? "bg-green-500"
                      : type.value < 50
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  } transition-all duration-300`}
                  style={{ width: `${type.value}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
