"use client";

import { useState } from "react";
import { Flight, SearchFormData } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import FlightCard from "./FlightCard";

interface SearchResultsProps {
  flights: Flight[];
  isLoading: boolean;
  error: string | null;
  searchQuery?: SearchFormData;
}

type SortOption = "price" | "duration" | "stops";

export default function SearchResults({
  flights,
  isLoading,
  error,
  searchQuery,
}: SearchResultsProps) {
  const [sortBy, setSortBy] = useState<SortOption>("price");
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <div id="search-results" className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl card-shadow p-8 border border-gray-200">
          <div className="text-center">
            <div className="inline-flex items-center space-x-3">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Searching for flights...
                </h3>
                <p className="text-gray-600">
                  This may take up to 60 seconds as we check multiple routes
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-2 text-sm text-gray-500">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Checking direct flights...</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100"></div>
                <span>Searching 1-stop routes...</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-200"></div>
                <span>Exploring creative multi-stop options...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="search-results" className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl card-shadow p-8 border border-red-200">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Search Failed
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-gray-500 text-sm">
              Please try again with different search criteria.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!flights || flights.length === 0) {
    return (
      <div id="search-results" className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl card-shadow p-8 border border-gray-200">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
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
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No flights found
            </h3>
            <p className="text-gray-600 mb-4">
              We could not find any flights for your search criteria.
            </p>
            <p className="text-gray-500 text-sm">
              Try adjusting your dates or searching for nearby airports.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Sort flights
  const sortedFlights = [...flights].sort((a, b) => {
    switch (sortBy) {
      case "price":
        return a.price - b.price;
      case "duration":
        // Convert duration to minutes for comparison
        const getDurationMinutes = (duration: string) => {
          const match = duration.match(/(\d+)h\s*(\d+)?m?/);
          if (match) {
            const hours = parseInt(match[1]) || 0;
            const minutes = parseInt(match[2]) || 0;
            return hours * 60 + minutes;
          }
          return 0;
        };
        return getDurationMinutes(a.duration) - getDurationMinutes(b.duration);
      case "stops":
        return a.stops - b.stops;
      default:
        return 0;
    }
  });

  const displayedFlights = showAll ? sortedFlights : sortedFlights.slice(0, 8);
  const worstPrice = sortedFlights[sortedFlights.length - 1]?.price;

  const handleFlightSelect = (flight: Flight) => {
    // TODO: Implement booking logic
    alert(`Booking flight ${flight.id} - This will be implemented in Phase 4`);
  };

  const getSortLabel = (option: SortOption) => {
    const labels = {
      price: "Price ↑",
      duration: "Duration",
      stops: "Stops",
    };
    return labels[option];
  };

  return (
    <div id="search-results" className="max-w-6xl mx-auto space-y-6">
      {/* Search Summary */}
      {searchQuery && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-4 text-sm">
              <span className="font-semibold text-blue-900">
                {searchQuery.origin} → {searchQuery.destination}
              </span>
              <span className="text-blue-700">
                {formatDate(searchQuery.date)}
              </span>
              <span className="text-blue-700">
                {searchQuery.passengers}{" "}
                {searchQuery.passengers === 1 ? "Passenger" : "Passengers"}
              </span>
            </div>
            <div className="text-sm text-blue-700">
              Found {flights.length}{" "}
              {flights.length === 1 ? "option" : "options"}
            </div>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="bg-white rounded-xl card-shadow p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h3 className="text-xl font-bold text-gray-900">
            Flight Options (Sorted by {getSortLabel(sortBy)})
          </h3>
          <div className="flex space-x-2 text-sm">
            {(["price", "duration", "stops"] as SortOption[]).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  sortBy === option
                    ? "bg-blue-100 text-blue-600 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {getSortLabel(option)}
              </button>
            ))}
          </div>
        </div>

        {/* Flight Cards */}
        <div className="space-y-4">
          {displayedFlights.map((flight, index) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              isBestDeal={index === 0 && sortBy === "price"}
              originalPrice={
                sortBy === "price" && index === 0 ? worstPrice : undefined
              }
              onSelect={handleFlightSelect}
            />
          ))}
        </div>

        {/* Show More Button */}
        {flights.length > 8 && !showAll && (
          <div className="text-center mt-6">
            <button
              onClick={() => setShowAll(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Show {flights.length - 8} more options
            </button>
          </div>
        )}

        {/* Show Less Button */}
        {showAll && flights.length > 8 && (
          <div className="text-center mt-6">
            <button
              onClick={() => setShowAll(false)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Show less
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
