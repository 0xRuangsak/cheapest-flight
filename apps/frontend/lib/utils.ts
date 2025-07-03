export function formatPrice(price: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatDuration(duration: string): string {
  // If duration is already formatted (e.g., "18h 45m"), return as is
  if (duration.includes("h") && duration.includes("m")) {
    return duration;
  }

  // Otherwise, assume it's in minutes and convert
  const totalMinutes = parseInt(duration);
  if (isNaN(totalMinutes)) return duration;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}

export function getStopsText(stops: number): string {
  if (stops === 0) return "Direct";
  if (stops === 1) return "1 Stop";
  return `${stops} Stops`;
}

export function getStopsColor(stops: number): string {
  if (stops === 0) return "bg-green-100 text-green-800";
  if (stops === 1) return "bg-yellow-100 text-yellow-800";
  return "bg-orange-100 text-orange-800";
}

export function renderRoute(route: string[]): string {
  return route.join(" → ");
}

export function calculateSavings(
  currentPrice: number,
  originalPrice: number
): {
  amount: number;
  percentage: number;
} {
  const savings = originalPrice - currentPrice;
  const percentage = Math.round((savings / originalPrice) * 100);
  return { amount: savings, percentage };
}

export function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

export function validateAirportCode(code: string): boolean {
  return /^[A-Z]{3}$/.test(code);
}

export function normalizeAirportCode(code: string): string {
  return code.toUpperCase().trim();
}

// Simple className utility (replaces clsx + tailwind-merge)
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
