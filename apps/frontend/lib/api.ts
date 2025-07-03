import { FlightSearchRequest, FlightSearchResponse, Airport } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

class APIClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
          message: "Request failed",
        }));
        throw new Error(
          errorData.message ||
            errorData.error ||
            `Request failed with status ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  }

  async searchFlights(
    searchData: FlightSearchRequest
  ): Promise<FlightSearchResponse> {
    return this.request<FlightSearchResponse>("/api/search", {
      method: "POST",
      body: JSON.stringify(searchData),
    });
  }

  async getAirports(
    query?: string
  ): Promise<{ airports: Airport[]; total: number }> {
    const queryParam = query ? `?q=${encodeURIComponent(query)}` : "";
    return this.request<{ airports: Airport[]; total: number }>(
      `/api/airports${queryParam}`
    );
  }

  async healthCheck(): Promise<{ status: string; service: string }> {
    return this.request<{ status: string; service: string }>("/health");
  }
}

export const apiClient = new APIClient();
