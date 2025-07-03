"use client";

import { useFlightSearch } from "@/hooks/useFlightSearch";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SearchForm from "@/components/SearchForm";
import SearchResults from "@/components/SearchResults";
import Footer from "@/components/Footer";

export default function Home() {
  const { searchState, lastSearch, searchFlights, clearSearch } =
    useFlightSearch();

  const handleLogoClick = () => {
    clearSearch();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLogoClick={handleLogoClick} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HeroSection show={!searchState.hasSearched} />

        <SearchForm
          onSearch={searchFlights}
          isLoading={searchState.isLoading}
        />

        {(searchState.isLoading ||
          searchState.results ||
          searchState.error) && (
          <SearchResults
            flights={searchState.results || []}
            isLoading={searchState.isLoading}
            error={searchState.error}
            searchQuery={lastSearch || undefined}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
