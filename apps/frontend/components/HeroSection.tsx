"use client";

interface HeroSectionProps {
  show: boolean;
}

export default function HeroSection({ show }: HeroSectionProps) {
  if (!show) return null;

  return (
    <div className="text-center mb-12">
      <h2 className="text-4xl font-bold text-gray-900 mb-4">
        Find the World Cheapest Flights
      </h2>
      <p className="text-xl text-gray-600 mb-2">
        We search creative multi-stop routes to save you up to 70% on airfare
      </p>
      <p className="text-gray-500">
        Discover hidden deals through smart routing analysis
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
  );
}
