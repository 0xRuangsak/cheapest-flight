"use client";

import { useState } from "react";
import FlightSearchForm from "@/components/FlightSearchForm";
import FlightResults from "@/components/FlightResults";
import { apiClient } from "@/lib/api";
import { SearchFormData, SearchState } from "@/lib/types";

export default function SearchPage() {
  const [searchState, setSearchState] = useState<SearchState>({
    isLoading: false,
    results: null,
    error: null,
  });

  const [lastSearch, setLastSearch] = useState<SearchFormData | null>(null);

  const handleSearch = async (formData: SearchFormData) => {
    console.log("Starting flight search with:", formData);

    setSearchState({
      isLoading: true,
      results: null,
      error: null,
    });

    setLastSearch(formData);

    try {
      const response = await apiClient.searchFlights({
        origin: formData.origin,
        destination: formData.destination,
        date: formData.date,
        passengers: formData.passengers,
      });

      console.log("Search response:", response);

      setSearchState({
        isLoading: false,
        results: response.flights,
        error: null,
      });

      // Scroll to results after search completes
      setTimeout(() => {
        const resultsElement = document.getElementById("search-results");
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } catch (error) {
      console.error("Search failed:", error);

      setSearchState({
        isLoading: false,
        results: null,
        error:
          error instanceof Error
            ? error.message
            : "Search failed. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Cheapest Flight Finder
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        {!searchState.results && !searchState.isLoading && (
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Find the World Cheapest Flights
            </h2>
            <p className="text-xl text-gray-600 mb-2">
              We search creative multi-stop routes to save you up to 70% on
              airfare
            </p>
            <p className="text-gray-500">
              Sometimes the best deals require a little creativity in your
              routing
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center space-x-8 mt-8 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Up to 3 stops analyzed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Global route coverage</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Real-time pricing</span>
              </div>
            </div>
          </div>
        )}

        {/* Search Form */}
        <div className="max-w-4xl mx-auto mb-8">
          <FlightSearchForm
            onSearch={handleSearch}
            isLoading={searchState.isLoading}
          />
        </div>

        {/* Search Results */}
        <div id="search-results">
          {(searchState.isLoading ||
            searchState.results ||
            searchState.error) && (
            <div className="max-w-6xl mx-auto">
              <FlightResults
                flights={searchState.results || []}
                isLoading={searchState.isLoading}
                error={searchState.error}
                searchQuery={lastSearch || undefined}
              />
            </div>
          )}
        </div>

        {/* Features Section (Only show when no search has been performed) */}
        {!searchState.results &&
          !searchState.isLoading &&
          !searchState.error && (
            <div className="mt-16">
              <div className="text-center mb-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  How We Find Cheaper Flights
                </h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Traditional flight search engines only show direct and simple
                  connecting flights. We go deeper to find creative routing
                  options that can save you hundreds.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-6 h-6 text-blue-600"
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
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Smart Route Analysis
                  </h4>
                  <p className="text-sm text-gray-600">
                    We analyze up to 3-stop routes through major hub airports to
                    find hidden deals
                  </p>
                </div>

                <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Maximum Savings
                  </h4>
                  <p className="text-sm text-gray-600">
                    Find deals that are 30-70% cheaper than traditional direct
                    flight options
                  </p>
                </div>

                <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Real-Time Results
                  </h4>
                  <p className="text-sm text-gray-600">
                    Live pricing from airlines ensures you get the most current
                    deals available
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>
              &copy; 2025 Cheapest Flight Finder. Built with Next.js and Go.
            </p>
            <p className="mt-2">
              Currently in beta - showing mock data.
              <span className="text-blue-600">
                {" "}
                Real Amadeus integration coming in Phase 3
              </span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
