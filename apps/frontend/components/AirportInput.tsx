"use client";

import { useState, useEffect, useRef } from "react";
import { Airport } from "@/lib/types";
import { apiClient } from "@/lib/api";
import { validateAirportCode, normalizeAirportCode } from "@/lib/utils";

interface AirportInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export default function AirportInput({
  label,
  value,
  onChange,
  placeholder = "Airport code (e.g., JFK)",
  required = false,
  error,
}: AirportInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch suggestions when user types
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (value.length >= 1) {
      timeoutRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const response = await apiClient.getAirports(value);
          setSuggestions(response.airports.slice(0, 6)); // Limit to 6 suggestions
        } catch (error) {
          console.error("Failed to fetch airports:", error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value]);

  // Find selected airport info
  useEffect(() => {
    if (validateAirportCode(value)) {
      const airport = suggestions.find(
        (a) => a.iata.toLowerCase() === value.toLowerCase()
      );
      setSelectedAirport(airport || null);
    } else {
      setSelectedAirport(null);
    }
  }, [value, suggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = normalizeAirportCode(e.target.value);
    onChange(inputValue);
  };

  const handleSuggestionClick = (airport: Airport) => {
    onChange(airport.iata);
    setSelectedAirport(airport);
    setIsFocused(false);
    setSuggestions([]);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking
    setTimeout(() => setIsFocused(false), 200);
  };

  const showSuggestions =
    isFocused && value.length >= 1 && suggestions.length > 0;

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full px-4 py-3 text-lg border-2 rounded-xl focus:outline-none transition-colors ${
            error
              ? "border-red-300 focus:border-red-500"
              : "border-gray-200 focus:border-blue-500"
          }`}
          maxLength={3}
          required={required}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isLoading ? (
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          ) : (
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Suggestion dropdown */}
      {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
          <div className="p-2 space-y-1">
            {suggestions.map((airport) => (
              <button
                key={airport.iata}
                type="button"
                onClick={() => handleSuggestionClick(airport)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {airport.iata} - {airport.airport}
                    </div>
                    <div className="text-sm text-gray-500">
                      {airport.region_name}, {airport.country_code}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected airport info */}
      {selectedAirport && (
        <p className="mt-1 text-sm text-gray-500">
          {selectedAirport.airport}, {selectedAirport.region_name}
        </p>
      )}

      {/* Validation info */}
      {value && value.length === 3 && !selectedAirport && (
        <p className="mt-1 text-xs text-gray-500">Airport code: {value}</p>
      )}

      {/* Error message */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
