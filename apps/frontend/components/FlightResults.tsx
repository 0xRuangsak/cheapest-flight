"use client";

import { Flight } from "@/lib/types";

interface FlightResultsProps {
  flights: Flight[];
  isLoading: boolean;
  error: string | null;
  searchQuery?: {
    origin: string;
    destination: string;
    date: string;
    passengers: number;
  };
}

export default function FlightResults({
  flights,
  isLoading,
  error,
  searchQuery,
}: FlightResultsProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3">
            <svg
              className="animate-spin h-8 w-8 text-blue-500"
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
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 border border-red-200">
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
    );
  }

  if (!flights || flights.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
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
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(price);
  };

  const getStopsText = (stops: number) => {
    if (stops === 0) return "Direct";
    if (stops === 1) return "1 Stop";
    return `${stops} Stops`;
  };

  const renderRoute = (route: string[]) => {
    return route.join(" → ");
  };

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      {searchQuery && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-4 text-sm">
              <span className="font-medium text-blue-900">
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
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            Flight Options (Sorted by Price)
          </h3>
          <div className="text-sm text-gray-500">
            Showing top {Math.min(flights.length, 10)} results
          </div>
        </div>

        {/* Flight Cards */}
        <div className="space-y-4">
          {flights.slice(0, 10).map((flight, index) => (
            <div
              key={flight.id}
              className={`relative border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                index === 0
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200 bg-gray-50 hover:bg-white"
              }`}
            >
              {/* Best Deal Badge */}
              {index === 0 && (
                <div className="absolute -top-2 left-4 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Best Deal
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
                {/* Flight Info */}
                <div className="lg:col-span-2">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {flight.airline}
                      </div>
                      <div className="text-sm text-gray-500">
                        {flight.duration}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900">
                      Route: {renderRoute(flight.route)}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          flight.stops === 0
                            ? "bg-green-100 text-green-800"
                            : flight.stops === 1
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {getStopsText(flight.stops)}
                      </span>
                      <span>{formatDate(flight.date)}</span>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPrice(flight.price, flight.currency)}
                  </div>
                  <div className="text-xs text-gray-500">per person</div>
                </div>

                {/* Book Button */}
                <div className="text-center">
                  <button
                    className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors duration-200 ${
                      index === 0
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                    onClick={() => {
                      // TODO: Implement booking logic
                      alert(
                        `Booking flight ${flight.id} - This will be implemented in Phase 4`
                      );
                    }}
                  >
                    Select Flight
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show More */}
        {flights.length > 10 && (
          <div className="text-center mt-6">
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              Show {flights.length - 10} more options
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
