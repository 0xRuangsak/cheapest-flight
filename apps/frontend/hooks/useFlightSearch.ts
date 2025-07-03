"use client";

import { useState, useCallback } from "react";
import { SearchFormData, SearchState } from "@/lib/types";
import { apiClient } from "@/lib/api";

export function useFlightSearch() {
  const [searchState, setSearchState] = useState<SearchState>({
    isLoading: false,
    results: null,
    error: null,
    hasSearched: false,
  });

  const [lastSearch, setLastSearch] = useState<SearchFormData | null>(null);

  const searchFlights = useCallback(async (formData: SearchFormData) => {
    console.log("Starting flight search with:", formData);

    setSearchState({
      isLoading: true,
      results: null,
      error: null,
      hasSearched: true,
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
        hasSearched: true,
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
        hasSearched: true,
      });
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchState({
      isLoading: false,
      results: null,
      error: null,
      hasSearched: false,
    });
    setLastSearch(null);
  }, []);

  return {
    searchState,
    lastSearch,
    searchFlights,
    clearSearch,
  };
}
