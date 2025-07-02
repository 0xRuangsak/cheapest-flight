package handlers

import (
	"context"
	"fmt"
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
	airportService *services.AirportService
}

func NewFlightSearchHandler(routeOptimizer *services.RouteOptimizer, amadeusService *services.AmadeusService, airportService *services.AirportService) *FlightSearchHandler {
	return &FlightSearchHandler{
		routeOptimizer: routeOptimizer,
		amadeusService: amadeusService,
		airportService: airportService,
	}
}

// SearchFlights handles flight search requests
func (h *FlightSearchHandler) SearchFlights(w http.ResponseWriter, r *http.Request) {
	utils.LogRequest(r)

	if r.Method != http.MethodPost {
		utils.WriteErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req models.FlightSearchRequest
	if err := utils.ParseJSONRequest(r, &req); err != nil {
		utils.WriteErrorResponse(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	// Enhanced validation with airport service
	if validationErrors := h.validateFlightSearchRequest(&req); len(validationErrors) > 0 {
		response := models.ErrorResponse{
			Error:   "Validation failed",
			Message: "Request validation failed: " + validationErrors[0],
			Code:    http.StatusBadRequest,
		}
		utils.WriteJSONResponse(w, http.StatusBadRequest, response)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	log.Printf("Searching cheapest flights: %s -> %s on %s for %d passengers",
		req.Origin, req.Destination, req.Date, req.Passengers)

	// Search for flights using the route optimizer
	flights, err := h.routeOptimizer.OptimizeRoutes(ctx, req)
	if err != nil {
		log.Printf("Flight search error: %v", err)
		utils.WriteErrorResponse(w, http.StatusInternalServerError, "Flight search failed: "+err.Error())
		return
	}

	// Create response with route and airline info only
	response := models.FlightSearchResponse{
		Flights: flights,
		Total:   len(flights),
		Query:   req,
		Message: h.generateResponseMessage(flights),
	}

	log.Printf("Found %d flight options for %s -> %s", len(flights), req.Origin, req.Destination)
	utils.WriteJSONResponse(w, http.StatusOK, response)
}

// Enhanced validation using airport service
func (h *FlightSearchHandler) validateFlightSearchRequest(req *models.FlightSearchRequest) []string {
	var errors []string

	// Normalize airport codes
	req.Origin = utils.NormalizeAirportCode(req.Origin)
	req.Destination = utils.NormalizeAirportCode(req.Destination)

	// Validate origin airport
	if !h.airportService.ValidateAirportCode(req.Origin) {
		errors = append(errors, "invalid origin airport code: "+req.Origin)
	}

	// Validate destination airport
	if !h.airportService.ValidateAirportCode(req.Destination) {
		errors = append(errors, "invalid destination airport code: "+req.Destination)
	}

	// Check if origin and destination are different
	if req.Origin == req.Destination {
		errors = append(errors, "origin and destination cannot be the same")
	}

	// Validate date
	if err := utils.ValidateDateString(req.Date); err != nil {
		errors = append(errors, "date must be in YYYY-MM-DD format and not in the past")
	}

	// Validate passengers
	if !utils.ValidatePassengerCount(req.Passengers) {
		errors = append(errors, "passenger count must be between 1 and 9")
	}

	return errors
}

func (h *FlightSearchHandler) generateResponseMessage(flights []models.Flight) string {
	if len(flights) == 0 {
		return "No flights found for your search criteria"
	}

	directFlights := 0
	oneStopFlights := 0
	multiStopFlights := 0
	cheapestPrice := flights[0].Price
	mostExpensivePrice := flights[0].Price

	for _, flight := range flights {
		switch flight.Stops {
		case 0:
			directFlights++
		case 1:
			oneStopFlights++
		default:
			multiStopFlights++
		}

		if flight.Price < cheapestPrice {
			cheapestPrice = flight.Price
		}
		if flight.Price > mostExpensivePrice {
			mostExpensivePrice = flight.Price
		}
	}

	savings := mostExpensivePrice - cheapestPrice
	if savings > 0 && len(flights) > 1 {
		return fmt.Sprintf("Found %d options with up to $%.0f savings through creative routing", len(flights), savings)
	}

	if directFlights > 0 {
		return "Found flights including direct options"
	} else if oneStopFlights > 0 {
		return "Found flights with creative routing to save money"
	} else {
		return "Found multi-stop routes with significant savings"
	}
}

// HealthCheck endpoint
func (h *FlightSearchHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

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
		"airports_loaded": len(h.airportService.GetAllAirports()),
		"timestamp":       time.Now().UTC().Format(time.RFC3339),
	}

	utils.WriteJSONResponse(w, http.StatusOK, response)
}

// GetSupportedAirports returns airport information from CSV
func (h *FlightSearchHandler) GetSupportedAirports(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	query := r.URL.Query().Get("q")
	var airports []services.Airport

	if query != "" {
		airports = h.airportService.SearchAirports(query)
	} else {
		airports = h.airportService.GetAllAirports()
		// Limit to first 50 for performance
		if len(airports) > 50 {
			airports = airports[:50]
		}
	}

	response := map[string]interface{}{
		"airports": airports,
		"total":    len(airports),
		"query":    query,
	}

	utils.WriteJSONResponse(w, http.StatusOK, response)
}
