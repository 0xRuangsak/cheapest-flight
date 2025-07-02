"use client";

import { useState } from "react";
import AirportInput from "./AirportInput";
import { SearchFormData } from "@/lib/types";

interface FlightSearchFormProps {
  onSearch: (formData: SearchFormData) => void;
  isLoading: boolean;
}

export default function FlightSearchForm({
  onSearch,
  isLoading,
}: FlightSearchFormProps) {
  const [formData, setFormData] = useState<SearchFormData>({
    origin: "",
    destination: "",
    date: "",
    passengers: 1,
  });

  const [errors, setErrors] = useState<Partial<SearchFormData>>({});

  // Get tomorrow's date as minimum date
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<SearchFormData> = {};

    if (!formData.origin || formData.origin.length !== 3) {
      newErrors.origin = "Please enter a valid 3-letter airport code";
    }

    if (!formData.destination || formData.destination.length !== 3) {
      newErrors.destination = "Please enter a valid 3-letter airport code";
    }

    if (formData.origin === formData.destination) {
      newErrors.destination = "Destination must be different from origin";
    }

    if (!formData.date) {
      newErrors.date = "Please select a departure date";
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Find Cheapest Flights
        </h2>
        <p className="text-gray-600">
          We will search up to 3 stops to find you the best price
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Origin and Destination Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <AirportInput
              label="From"
              value={formData.origin}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, origin: value }));
                if (errors.origin)
                  setErrors((prev) => ({ ...prev, origin: undefined }));
              }}
              placeholder="Origin airport"
              required
            />
            {errors.origin && (
              <p className="mt-1 text-sm text-red-600">{errors.origin}</p>
            )}
          </div>

          <div className="relative">
            <AirportInput
              label="To"
              value={formData.destination}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, destination: value }));
                if (errors.destination)
                  setErrors((prev) => ({ ...prev, destination: undefined }));
              }}
              placeholder="Destination airport"
              required
            />
            {errors.destination && (
              <p className="mt-1 text-sm text-red-600">{errors.destination}</p>
            )}

            {/* Swap Button */}
            <button
              type="button"
              onClick={handleSwapAirports}
              className="absolute -left-6 top-8 md:top-10 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-md transition-colors duration-200 z-10"
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
        </div>

        {/* Date and Passengers Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departure Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, date: e.target.value }));
                if (errors.date)
                  setErrors((prev) => ({ ...prev, date: undefined }));
              }}
              min={getTomorrowDate()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
              required
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passengers <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.passengers}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  passengers: parseInt(e.target.value),
                }));
                if (errors.passengers)
                  setErrors((prev) => ({ ...prev, passengers: undefined }));
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
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
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Searching for flights...
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
              Search Flights
            </>
          )}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
            <h4 className="font-medium text-blue-900 mb-1">How it works</h4>
            <p className="text-sm text-blue-700">
              We search direct flights and creative multi-stop routes (up to 3
              stops) to find you the absolute cheapest options. Sometimes flying
              through multiple cities can save you 50% or more!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
