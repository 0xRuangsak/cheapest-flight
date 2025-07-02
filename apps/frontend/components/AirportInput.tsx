"use client";

import { useState } from "react";

interface AirportInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function AirportInput({
  label,
  value,
  onChange,
  placeholder = "Enter airport code",
  required = false,
}: AirportInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  // Popular airports for quick selection
  const popularAirports = [
    { code: "BKK", name: "Bangkok - Suvarnabhumi", city: "Bangkok" },
    { code: "DMK", name: "Bangkok - Don Mueang", city: "Bangkok" },
    { code: "CNX", name: "Chiang Mai", city: "Chiang Mai" },
    { code: "HKT", name: "Phuket", city: "Phuket" },
    { code: "SIN", name: "Singapore - Changi", city: "Singapore" },
    { code: "KUL", name: "Kuala Lumpur", city: "Kuala Lumpur" },
    { code: "MNL", name: "Manila", city: "Manila" },
    { code: "ICN", name: "Seoul - Incheon", city: "Seoul" },
    { code: "NRT", name: "Tokyo - Narita", city: "Tokyo" },
    { code: "FRA", name: "Frankfurt", city: "Frankfurt" },
  ];

  const filteredAirports = popularAirports.filter(
    (airport) =>
      airport.code.toLowerCase().includes(value.toLowerCase()) ||
      airport.name.toLowerCase().includes(value.toLowerCase()) ||
      airport.city.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
        maxLength={3}
        required={required}
      />

      {/* Dropdown suggestions */}
      {isFocused && value && filteredAirports.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredAirports.slice(0, 6).map((airport) => (
            <button
              key={airport.code}
              type="button"
              onClick={() => {
                onChange(airport.code);
                setIsFocused(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-b-0"
            >
              <div>
                <div className="font-medium text-gray-900">{airport.code}</div>
                <div className="text-sm text-gray-500">{airport.name}</div>
              </div>
              <div className="text-xs text-gray-400">{airport.city}</div>
            </button>
          ))}
        </div>
      )}

      {/* Show entered code validation */}
      {value && value.length === 3 && (
        <div className="mt-1 text-xs text-gray-500">Airport code: {value}</div>
      )}
    </div>
  );
}
