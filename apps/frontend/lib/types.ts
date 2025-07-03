// Airport types
export interface Airport {
  country_code: string;
  region_name: string;
  iata: string;
  icao: string;
  airport: string;
  latitude: string;
  longitude: string;
}

// Flight Search types
export interface FlightSearchRequest {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
}

export interface Flight {
  id: string;
  origin: string;
  destination: string;
  date: string;
  price: number;
  currency: string;
  airline: string;
  duration: string;
  stops: number;
  route: string[];
  bookingUrl?: string;
}

export interface FlightSearchResponse {
  flights: Flight[];
  message?: string;
  total: number;
  query: FlightSearchRequest;
}

// Form types
export interface SearchFormData {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
}

export interface SearchFormErrors {
  origin?: string;
  destination?: string;
  date?: string;
  passengers?: string;
}

// UI State types
export interface SearchState {
  isLoading: boolean;
  results: Flight[] | null;
  error: string | null;
  hasSearched: boolean;
}

// API Response types
export interface APIError {
  error: string;
  message: string;
  code?: number;
}
