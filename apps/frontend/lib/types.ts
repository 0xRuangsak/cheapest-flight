// Flight Search Types
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
}

export interface FlightSearchResponse {
  flights: Flight[];
  message?: string;
}

export interface APIError {
  error: string;
  details?: string;
}

// UI State Types
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

export interface SearchState {
  isLoading: boolean;
  results: Flight[] | null;
  error: string | null;
}

// Airport data type (for future autocomplete)
export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}
