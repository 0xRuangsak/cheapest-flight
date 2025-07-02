package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

type FlightSearchRequest struct {
	Origin      string `json:"origin"`
	Destination string `json:"destination"`
	Date        string `json:"date"`
	Passengers  int    `json:"passengers"`
}

type FlightSearchResponse struct {
	Flights []Flight `json:"flights"`
	Message string   `json:"message,omitempty"`
}

type Flight struct {
	ID          string   `json:"id"`
	Origin      string   `json:"origin"`
	Destination string   `json:"destination"`
	Date        string   `json:"date"`
	Price       float64  `json:"price"`
	Currency    string   `json:"currency"`
	Airline     string   `json:"airline"`
	Duration    string   `json:"duration"`
	Stops       int      `json:"stops"`
	Route       []string `json:"route"`
}

type AmadeusClient struct {
	APIKey    string
	APISecret string
	BaseURL   string
	Token     string
}

func main() {
	// Get environment variables
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	apiKey := os.Getenv("AMADEUS_API_KEY")
	apiSecret := os.Getenv("AMADEUS_API_SECRET")
	baseURL := os.Getenv("AMADEUS_BASE_URL")

	if apiKey == "" || apiSecret == "" {
		log.Fatal("AMADEUS_API_KEY and AMADEUS_API_SECRET must be set")
	}

	// Initialize Amadeus client
	amadeusClient := &AmadeusClient{
		APIKey:    apiKey,
		APISecret: apiSecret,
		BaseURL:   baseURL,
	}

	// Create router
	r := mux.NewRouter()

	// Routes
	r.HandleFunc("/health", healthCheck).Methods("GET")
	r.HandleFunc("/api/search", searchFlights(amadeusClient)).Methods("POST")

	// CORS
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:3000"},
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"*"},
	})

	handler := c.Handler(r)

	fmt.Printf("Server starting on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "healthy",
		"service": "cheapest-flight-backend",
	})
}

func searchFlights(client *AmadeusClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		var req FlightSearchRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// For now, return mock data
		// TODO: Implement actual Amadeus API integration
		response := FlightSearchResponse{
			Flights: []Flight{
				{
					ID:          "mock-1",
					Origin:      req.Origin,
					Destination: req.Destination,
					Date:        req.Date,
					Price:       299.99,
					Currency:    "USD",
					Airline:     "Mock Airlines",
					Duration:    "5h 30m",
					Stops:       0,
					Route:       []string{req.Origin, req.Destination},
				},
				{
					ID:          "mock-2",
					Origin:      req.Origin,
					Destination: req.Destination,
					Date:        req.Date,
					Price:       189.99,
					Currency:    "USD",
					Airline:     "Budget Air",
					Duration:    "8h 15m",
					Stops:       1,
					Route:       []string{req.Origin, "HUB", req.Destination},
				},
			},
			Message: "Mock data - Amadeus integration pending",
		}

		json.NewEncoder(w).Encode(response)
	}
}
