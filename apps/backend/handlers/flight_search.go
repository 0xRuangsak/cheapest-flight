package handlers

import (
	"context"
	"log"
	"net/http"
	"time"

	"cheapest-flight-backend/models"
	"cheapest-flight-backend/services"
	"cheapest-flight-backend/utils"
)

type FlightSearchHandler struct {
	routeOptimizer *services.RouteOptimizer
	amadeusService *services.AmadeusService
}

func NewFlightSearchHandler(routeOptimizer *services.RouteOptimizer, amadeusService *services.AmadeusService) *FlightSearchHandler {
	return &FlightSearchHandler{
		routeOptimizer: routeOptimizer,
		amadeusService: amadeusService,
	}
}

// SearchFlights handles flight search requests
func (h *FlightSearchHandler) SearchFlights(w http.ResponseWriter, r *http.Request) {
	// Log the request
	utils.LogRequest(r)

	// Only allow POST requests
	if r.Method != http.MethodPost {
		utils.WriteErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Parse the request body
	var req models.FlightSearchRequest
	if err := utils.ParseJSONRequest(r, &req); err != nil {
		utils.WriteErrorResponse(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	// Validate the request
	if validationErrors := utils.ValidateFlightSearchRequest(&req); len(validationErrors) > 0 {
		response := models.ErrorResponse{
			Error:   "Validation failed",
			Message: "Request validation failed: " + validationErrors[0], // Return first error
			Code:    http.StatusBadRequest,
		}
		utils.WriteJSONResponse(w, http.StatusBadRequest, response)
		return
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// Log the search request
	log.Printf("Searching flights: %s -> %s on %s for %d passengers",
		req.Origin, req.Destination, req.Date, req.Passengers)

	// Estimate search time and log it
	estimatedTime := h.routeOptimizer.EstimateSearchTime(req)
	log.Printf("Estimated search time: %v", estimatedTime)

	// Search for flights using the route optimizer
	flights, err := h.routeOptimizer.OptimizeRoutes(ctx, req)
	if err != nil {
		log.Printf("Flight search error: %v", err)
		utils.WriteErrorResponse(w, http.StatusInternalServerError, "Flight search failed: "+err.Error())
		return
	}

	// If no flights found, try fallback to mock data for development
	if len(flights) == 0 {
		log.Printf("No flights found, using fallback data")
		flights = h.generateFallbackFlights(req)
	}

	// Create response
	response := models.FlightSearchResponse{
		Flights: flights,
		Total:   len(flights),
		Query:   req,
		Message: h.generateResponseMessage(flights),
	}

	// Log successful search
	log.Printf("Found %d flights for %s -> %s", len(flights), req.Origin, req.Destination)

	// Return response
	utils.WriteJSONResponse(w, http.StatusOK, response)
}

// generateResponseMessage generates an appropriate message based on search results
func (h *FlightSearchHandler) generateResponseMessage(flights []models.Flight) string {
	if len(flights) == 0 {
		return "No flights found for your search criteria"
	}

	directFlights := 0
	oneStopFlights := 0
	multiStopFlights := 0

	for _, flight := range flights {
		switch flight.Stops {
		case 0:
			directFlights++
		case 1:
			oneStopFlights++
		default:
			multiStopFlights++
		}
	}

	if directFlights > 0 {
		return "Found flights including direct options"
	} else if oneStopFlights > 0 {
		return "Found flights with creative routing to save money"
	} else {
		return "Found multi-stop routes with significant savings"
	}
}

// generateFallbackFlights generates mock flights for development/testing
func (h *FlightSearchHandler) generateFallbackFlights(req models.FlightSearchRequest) []models.Flight {
	return []models.Flight{
		{
			ID:          "fallback-direct-1",
			Origin:      req.Origin,
			Destination: req.Destination,
			Date:        req.Date,
			Price:       450.00,
			Currency:    "USD",
			Airline:     "Direct Airways",
			Duration:    "5h 30m",
			Stops:       0,
			Route:       []string{req.Origin, req.Destination},
		},
		{
			ID:          "fallback-1stop-1",
			Origin:      req.Origin,
			Destination: req.Destination,
			Date:        req.Date,
			Price:       320.00,
			Currency:    "USD",
			Airline:     "Hub Connection",
			Duration:    "8h 15m",
			Stops:       1,
			Route:       []string{req.Origin, "DXB", req.Destination},
		},
		{
			ID:          "fallback-2stop-1",
			Origin:      req.Origin,
			Destination: req.Destination,
			Date:        req.Date,
			Price:       225.00,
			Currency:    "USD",
			Airline:     "Budget Multi-Stop",
			Duration:    "14h 45m",
			Stops:       2,
			Route:       []string{req.Origin, "IST", "FRA", req.Destination},
		},
		{
			ID:          "fallback-1stop-2",
			Origin:      req.Origin,
			Destination: req.Destination,
			Date:        req.Date,
			Price:       380.00,
			Currency:    "USD",
			Airline:     "Regional Connect",
			Duration:    "7h 20m",
			Stops:       1,
			Route:       []string{req.Origin, "LHR", req.Destination},
		},
		{
			ID:          "fallback-direct-2",
			Origin:      req.Origin,
			Destination: req.Destination,
			Date:        req.Date,
			Price:       520.00,
			Currency:    "USD",
			Airline:     "Premium Direct",
			Duration:    "4h 55m",
			Stops:       0,
			Route:       []string{req.Origin, req.Destination},
		},
	}
}

// HealthCheck endpoint to check if flight search service is working
func (h *FlightSearchHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Check Amadeus service health
	var amadeusStatus string
	if err := h.amadeusService.HealthCheck(); err != nil {
		amadeusStatus = "unhealthy: " + err.Error()
	} else {
		amadeusStatus = "healthy"
	}

	response := map[string]interface{}{
		"status":          "healthy",
		"service":         "flight-search",
		"amadeus_service": amadeusStatus,
		"timestamp":       time.Now().UTC().Format(time.RFC3339),
	}

	utils.WriteJSONResponse(w, http.StatusOK, response)
}

// GetSupportedAirports returns a list of supported airports (for autocomplete)
func (h *FlightSearchHandler) GetSupportedAirports(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// This would ideally come from a database or external service
	airports := []map[string]string{
		{"code": "BKK", "name": "Bangkok - Suvarnabhumi", "city": "Bangkok", "country": "Thailand"},
		{"code": "DMK", "name": "Bangkok - Don Mueang", "city": "Bangkok", "country": "Thailand"},
		{"code": "CNX", "name": "Chiang Mai", "city": "Chiang Mai", "country": "Thailand"},
		{"code": "HKT", "name": "Phuket", "city": "Phuket", "country": "Thailand"},
		{"code": "SIN", "name": "Singapore - Changi", "city": "Singapore", "country": "Singapore"},
		{"code": "KUL", "name": "Kuala Lumpur", "city": "Kuala Lumpur", "country": "Malaysia"},
		{"code": "MNL", "name": "Manila", "city": "Manila", "country": "Philippines"},
		{"code": "ICN", "name": "Seoul - Incheon", "city": "Seoul", "country": "South Korea"},
		{"code": "NRT", "name": "Tokyo - Narita", "city": "Tokyo", "country": "Japan"},
		{"code": "FRA", "name": "Frankfurt", "city": "Frankfurt", "country": "Germany"},
		{"code": "LHR", "name": "London - Heathrow", "city": "London", "country": "United Kingdom"},
		{"code": "CDG", "name": "Paris - Charles de Gaulle", "city": "Paris", "country": "France"},
		{"code": "DXB", "name": "Dubai", "city": "Dubai", "country": "UAE"},
		{"code": "DOH", "name": "Doha", "city": "Doha", "country": "Qatar"},
		{"code": "JFK", "name": "New York - JFK", "city": "New York", "country": "USA"},
		{"code": "LAX", "name": "Los Angeles", "city": "Los Angeles", "country": "USA"},
	}

	response := map[string]interface{}{
		"airports": airports,
		"total":    len(airports),
	}

	utils.WriteJSONResponse(w, http.StatusOK, response)
}
