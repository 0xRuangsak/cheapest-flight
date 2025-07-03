"use client";

import { Flight } from "@/lib/types";
import {
  formatPrice,
  formatDate,
  formatDuration,
  getStopsText,
  getStopsColor,
  renderRoute,
  calculateSavings,
} from "@/lib/utils";

interface FlightCardProps {
  flight: Flight;
  isBestDeal?: boolean;
  originalPrice?: number;
  onSelect: (flight: Flight) => void;
}

export default function FlightCard({
  flight,
  isBestDeal = false,
  originalPrice,
  onSelect,
}: FlightCardProps) {
  const savings = originalPrice
    ? calculateSavings(flight.price, originalPrice)
    : null;

  const handleSelect = () => {
    onSelect(flight);
  };

  const getAirlineIcon = (airline: string) => {
    // Extract airline code from airline name if needed
    const airlineCode = airline.includes(" ")
      ? airline.split(" ")[0].substring(0, 2).toUpperCase()
      : airline.substring(0, 2).toUpperCase();

    return airlineCode;
  };

  const getAirlineColor = (airline: string) => {
    // Simple color mapping based on airline name
    const colors = [
      "bg-blue-500",
      "bg-red-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-indigo-500",
      "bg-pink-500",
      "bg-yellow-500",
      "bg-teal-500",
    ];

    const hash = airline.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  };

  const renderLayovers = () => {
    if (flight.route.length <= 2) return null;

    const layovers = flight.route.slice(1, -1);
    return layovers.map((airport, index) => (
      <span key={airport}>
        • {airport} layover
        {index < layovers.length - 1 ? ", " : ""}
      </span>
    ));
  };

  return (
    <div
      className={`relative border rounded-xl p-6 transition-all duration-200 hover:shadow-md ${
        isBestDeal
          ? "border-2 border-green-200 bg-green-50"
          : "border border-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      {/* Best Deal Badge */}
      {isBestDeal && (
        <div className="absolute -top-3 left-6 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
          {savings
            ? `BEST DEAL - Save ${formatPrice(savings.amount)}`
            : "BEST DEAL"}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
        {/* Flight Info */}
        <div className="lg:col-span-2">
          <div className="flex items-center space-x-3 mb-3">
            <div
              className={`w-8 h-8 ${getAirlineColor(
                flight.airline
              )} rounded-full flex items-center justify-center`}
            >
              <span className="text-white text-xs font-bold">
                {getAirlineIcon(flight.airline)}
              </span>
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                {flight.airline}
              </div>
              <div className="text-sm text-gray-500">
                {formatDuration(flight.duration)} total
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-900">
              Route: {renderRoute(flight.route)}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600 flex-wrap">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStopsColor(
                  flight.stops
                )}`}
              >
                {getStopsText(flight.stops)}
              </span>
              <span>{formatDate(flight.date)}</span>
              {flight.stops > 0 && (
                <div className="flex items-center space-x-2">
                  {renderLayovers()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="text-center">
          <div
            className={`text-3xl font-bold ${
              isBestDeal ? "text-green-600" : "text-gray-900"
            }`}
          >
            {formatPrice(flight.price, flight.currency)}
          </div>
          {savings && savings.amount > 0 && (
            <>
              <div className="text-sm text-gray-500 line-through">
                {formatPrice(originalPrice!, flight.currency)}
              </div>
              <div className="text-xs text-green-600 font-medium">
                {savings.percentage}% cheaper
              </div>
            </>
          )}
          {!savings && <div className="text-xs text-gray-500">per person</div>}
        </div>

        {/* Select Button */}
        <div className="text-center">
          <button
            onClick={handleSelect}
            className={`w-full font-semibold py-3 px-6 rounded-xl transition-colors ${
              isBestDeal
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            Select Flight
          </button>
        </div>
      </div>
    </div>
  );
}
