"use client";

import { useState } from "react";
import AirportInput from "./AirportInput";
import { SearchFormData, SearchFormErrors } from "@/lib/types";
import { getTomorrowDate, validateAirportCode } from "@/lib/utils";

interface SearchFormProps {
  onSearch: (formData: SearchFormData) => void;
  isLoading: boolean;
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [formData, setFormData] = useState<SearchFormData>({
    origin: "",
    destination: "",
    date: getTomorrowDate(),
    passengers: 1,
  });

  const [errors, setErrors] = useState<SearchFormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: SearchFormErrors = {};

    if (!formData.origin || !validateAirportCode(formData.origin)) {
      newErrors.origin = "Please enter a valid 3-letter airport code";
    }

    if (!formData.destination || !validateAirportCode(formData.destination)) {
      newErrors.destination = "Please enter a valid 3-letter airport code";
    }

    if (formData.origin === formData.destination) {
      newErrors.destination = "Destination must be different from origin";
    }

    if (!formData.date) {
      newErrors.date = "Please select a departure date";
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = "Date cannot be in the past";
      }
    }

    if (formData.passengers < 1 || formData.passengers > 9) {
      newErrors.passengers = "Passengers must be between 1 and 9";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSearch(formData);
    }
  };

  const handleSwapAirports = () => {
    setFormData((prev) => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin,
    }));
    setErrors({}); // Clear errors when swapping
  };

  const clearError = (field: keyof SearchFormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto mb-12">
      <div className="bg-white rounded-2xl card-shadow p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Route Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {/* Origin */}
            <div>
              <AirportInput
                label="From"
                value={formData.origin}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, origin: value }));
                  clearError("origin");
                }}
                placeholder="Airport code (e.g., JFK)"
                required
                error={errors.origin}
              />
            </div>

            {/* Destination */}
            <div>
              <AirportInput
                label="To"
                value={formData.destination}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, destination: value }));
                  clearError("destination");
                }}
                placeholder="Airport code (e.g., BKK)"
                required
                error={errors.destination}
              />
            </div>

            {/* Swap Button */}
            <button
              type="button"
              onClick={handleSwapAirports}
              className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-colors z-10 md:block hidden"
              title="Swap airports"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </button>
          </div>

          {/* Date and Passengers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Departure Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, date: e.target.value }));
                  clearError("date");
                }}
                min={getTomorrowDate()}
                className={`w-full px-4 py-3 text-lg border-2 rounded-xl focus:outline-none transition-colors ${
                  errors.date
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-blue-500"
                }`}
                required
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Passengers <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.passengers}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    passengers: parseInt(e.target.value),
                  }));
                  clearError("passengers");
                }}
                className={`w-full px-4 py-3 text-lg border-2 rounded-xl focus:outline-none transition-colors ${
                  errors.passengers
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-blue-500"
                }`}
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "Passenger" : "Passengers"}
                  </option>
                ))}
              </select>
              {errors.passengers && (
                <p className="mt-1 text-sm text-red-600">{errors.passengers}</p>
              )}
            </div>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-colors flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Searching for flights...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>Search Flights</span>
              </>
            )}
          </button>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-blue-500 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">
                Smart Routing Technology
              </h4>
              <p className="text-sm text-blue-700">
                We analyze up to 3-stop routes through major hub airports to
                find you the absolute cheapest options. Sometimes flying through
                multiple cities can save you 50% or more!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
