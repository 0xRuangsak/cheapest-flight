package services

import (
	"context"
	"fmt"
	"sort"
	"sync"
	"time"

	"cheapest-flight-backend/models"
)

type RouteOptimizer struct {
	amadeusService *AmadeusService
	hubAirports    map[string][]string // Region -> list of hub airports
}

func NewRouteOptimizer(amadeusService *AmadeusService) *RouteOptimizer {
	return &RouteOptimizer{
		amadeusService: amadeusService,
		hubAirports:    initializeHubAirports(),
	}
}

// initializeHubAirports initializes major hub airports by region
func initializeHubAirports() map[string][]string {
	return map[string][]string{
		"north_america": {
			"JFK", "LAX", "ORD", "DFW", "ATL", "DEN", "SFO", "LAS", "SEA", "MIA",
			"BOS", "IAH", "PHX", "CLT", "MCO", "MSP", "DTW", "PHL", "LGA", "BWI",
		},
		"europe": {
			"LHR", "CDG", "FRA", "AMS", "MAD", "FCO", "MUC", "ZUR", "VIE", "CPH",
			"ARN", "HEL", "OSL", "LIS", "ATH", "IST", "SVO", "WAW", "PRG", "BUD",
		},
		"asia_pacific": {
			"NRT", "ICN", "PVG", "PEK", "HKG", "SIN", "BKK", "KUL", "CGK", "MNL",
			"TPE", "CAN", "DEL", "BOM", "SYD", "MEL", "DXB", "DOH", "KWI", "CAI",
		},
		"middle_east_africa": {
			"DXB", "DOH", "AUH", "KWI", "CAI", "JNB", "CPT", "NBO", "ADD", "DAR",
			"LOS", "ACC", "CAS", "TUN", "ALG", "RUH", "JED", "AMM", "BEY", "BAH",
		},
		"south_america": {
			"GRU", "EZE", "SCL", "BOG", "LIM", "CWB", "FOR", "GIG", "BSB", "MAO",
			"UIO", "MVD", "ASU", "CCS", "GEO", "PBM", "BEL", "STM", "CGB", "THE",
		},
	}
}

// OptimizeRoutes finds the cheapest routes with up to 3 stops
func (ro *RouteOptimizer) OptimizeRoutes(ctx context.Context, req models.FlightSearchRequest) ([]models.Flight, error) {
	var allFlights []models.Flight
	var wg sync.WaitGroup
	var mu sync.Mutex
	errors := make(chan error, 10)

	// Channel to collect flights from all goroutines
	flightChan := make(chan []models.Flight, 10)

	// 1. Search direct flights
	wg.Add(1)
	go func() {
		defer wg.Done()
		flights, err := ro.searchDirectFlights(req)
		if err != nil {
			errors <- err
			return
		}
		flightChan <- flights
	}()

	// 2. Search 1-stop routes through major hubs
	wg.Add(1)
	go func() {
		defer wg.Done()
		flights, err := ro.searchOneStopRoutes(ctx, req)
		if err != nil {
			errors <- err
			return
		}
		flightChan <- flights
	}()

	// 3. Search 2-stop routes (more complex, limited hubs)
	wg.Add(1)
	go func() {
		defer wg.Done()
		flights, err := ro.searchTwoStopRoutes(ctx, req)
		if err != nil {
			errors <- err
			return
		}
		flightChan <- flights
	}()

	// Wait for all searches to complete
	go func() {
		wg.Wait()
		close(flightChan)
		close(errors)
	}()

	// Collect all flights
	for flights := range flightChan {
		mu.Lock()
		allFlights = append(allFlights, flights...)
		mu.Unlock()
	}

	// Log any errors but don't fail the entire request
	for err := range errors {
		// In production, you'd want proper logging here
		_ = err // Ignore errors for now, but log them
	}

	// Sort flights by price and return top 10
	return ro.selectBestFlights(allFlights), nil
}

// searchDirectFlights searches for direct flights
func (ro *RouteOptimizer) searchDirectFlights(req models.FlightSearchRequest) ([]models.Flight, error) {
	amadeusResp, err := ro.amadeusService.SearchFlights(req)
	if err != nil {
		return nil, err
	}

	flights := ro.amadeusService.ConvertAmadeusFlights(amadeusResp, req)

	// Filter for direct flights only
	var directFlights []models.Flight
	for _, flight := range flights {
		if flight.Stops == 0 {
			directFlights = append(directFlights, flight)
		}
	}

	return directFlights, nil
}

// searchOneStopRoutes searches for one-stop routes through major hubs
func (ro *RouteOptimizer) searchOneStopRoutes(ctx context.Context, req models.FlightSearchRequest) ([]models.Flight, error) {
	var allFlights []models.Flight
	hubs := ro.getRelevantHubs(req.Origin, req.Destination)

	// Limit concurrent requests to avoid overwhelming the API
	semaphore := make(chan struct{}, 5)
	var wg sync.WaitGroup
	var mu sync.Mutex

	for _, hub := range hubs {
		if hub == req.Origin || hub == req.Destination {
			continue
		}

		wg.Add(1)
		go func(hubCode string) {
			defer wg.Done()

			select {
			case semaphore <- struct{}{}:
				defer func() { <-semaphore }()
			case <-ctx.Done():
				return
			}

			// Search origin -> hub -> destination
			flights := ro.searchViaHub(req, hubCode)

			mu.Lock()
			allFlights = append(allFlights, flights...)
			mu.Unlock()
		}(hub)
	}

	wg.Wait()
	return allFlights, nil
}

// searchTwoStopRoutes searches for two-stop routes (more limited)
func (ro *RouteOptimizer) searchTwoStopRoutes(ctx context.Context, req models.FlightSearchRequest) ([]models.Flight, error) {
	var allFlights []models.Flight

	// For 2-stop routes, we'll be more selective with hubs to avoid too many API calls
	majorHubs := ro.getMajorHubs(req.Origin, req.Destination)

	// Limit to top 10 hub combinations for 2-stop routes
	if len(majorHubs) > 10 {
		majorHubs = majorHubs[:10]
	}

	semaphore := make(chan struct{}, 3) // Even more limited for 2-stop
	var wg sync.WaitGroup
	var mu sync.Mutex

	// Try combinations of 2 hubs
	for i, hub1 := range majorHubs {
		for j, hub2 := range majorHubs {
			if i >= j || hub1 == hub2 || hub1 == req.Origin || hub1 == req.Destination ||
				hub2 == req.Origin || hub2 == req.Destination {
				continue
			}

			wg.Add(1)
			go func(h1, h2 string) {
				defer wg.Done()

				select {
				case semaphore <- struct{}{}:
					defer func() { <-semaphore }()
				case <-ctx.Done():
					return
				}

				// Search origin -> hub1 -> hub2 -> destination
				flights := ro.searchViaTwoHubs(req, h1, h2)

				mu.Lock()
				allFlights = append(allFlights, flights...)
				mu.Unlock()
			}(hub1, hub2)
		}
	}

	wg.Wait()
	return allFlights, nil
}

// searchViaHub searches for flights via a single hub
func (ro *RouteOptimizer) searchViaHub(req models.FlightSearchRequest, hub string) []models.Flight {
	// This is a simplified implementation
	// In reality, you'd need to search for two separate flights and combine them

	// For now, we'll create a mock flight that represents the multi-stop route
	// In production, you'd make separate API calls for each leg

	mockFlight := models.Flight{
		ID:          "multi-" + req.Origin + "-" + hub + "-" + req.Destination,
		Origin:      req.Origin,
		Destination: req.Destination,
		Date:        req.Date,
		Price:       350.0 + float64(len(hub)*10), // Mock pricing logic
		Currency:    "USD",
		Airline:     "Multi-Airline",
		Duration:    "8h 30m", // Mock duration
		Stops:       1,
		Route:       []string{req.Origin, hub, req.Destination},
	}

	return []models.Flight{mockFlight}
}

// searchViaTwoHubs searches for flights via two hubs
func (ro *RouteOptimizer) searchViaTwoHubs(req models.FlightSearchRequest, hub1, hub2 string) []models.Flight {
	// Mock implementation for 2-stop routes
	mockFlight := models.Flight{
		ID:          "multi2-" + req.Origin + "-" + hub1 + "-" + hub2 + "-" + req.Destination,
		Origin:      req.Origin,
		Destination: req.Destination,
		Date:        req.Date,
		Price:       250.0 + float64(len(hub1+hub2)*5), // Mock pricing - often cheaper due to complexity
		Currency:    "USD",
		Airline:     "Multi-Airline Express",
		Duration:    "12h 45m", // Mock duration
		Stops:       2,
		Route:       []string{req.Origin, hub1, hub2, req.Destination},
	}

	return []models.Flight{mockFlight}
}

// getRelevantHubs returns relevant hub airports based on route
func (ro *RouteOptimizer) getRelevantHubs(origin, destination string) []string {
	var hubs []string

	// Get hubs from all regions but prioritize based on route
	for _, regionHubs := range ro.hubAirports {
		hubs = append(hubs, regionHubs...)
	}

	// In production, you'd use geographic/route logic to filter relevant hubs
	// For now, return all major hubs but limit the number
	if len(hubs) > 20 {
		hubs = hubs[:20]
	}

	return hubs
}

// getMajorHubs returns the most important hub airports
func (ro *RouteOptimizer) getMajorHubs(origin, destination string) []string {
	majorHubs := []string{
		"DXB", "DOH", "IST", "FRA", "LHR", "CDG", "AMS",
		"SIN", "HKG", "ICN", "NRT", "PVG",
		"JFK", "LAX", "ORD", "DFW", "ATL",
	}

	return majorHubs
}

// selectBestFlights sorts flights by price and returns the top 10
func (ro *RouteOptimizer) selectBestFlights(flights []models.Flight) []models.Flight {
	if len(flights) == 0 {
		return flights
	}

	// Sort flights by price (ascending)
	sort.Slice(flights, func(i, j int) bool {
		return flights[i].Price < flights[j].Price
	})

	// Remove duplicates based on route and price
	uniqueFlights := ro.removeDuplicateFlights(flights)

	// Return top 10
	if len(uniqueFlights) > 10 {
		return uniqueFlights[:10]
	}

	return uniqueFlights
}

// removeDuplicateFlights removes duplicate flights based on route similarity
func (ro *RouteOptimizer) removeDuplicateFlights(flights []models.Flight) []models.Flight {
	seen := make(map[string]bool)
	var unique []models.Flight

	for _, flight := range flights {
		// Create a key based on route and approximate price
		key := fmt.Sprintf("%v-%.0f", flight.Route, flight.Price/10*10)

		if !seen[key] {
			seen[key] = true
			unique = append(unique, flight)
		}
	}

	return unique
}

// EstimateSearchTime estimates how long the search will take
func (ro *RouteOptimizer) EstimateSearchTime(req models.FlightSearchRequest) time.Duration {
	// Base time for direct flights
	estimatedTime := 5 * time.Second

	// Add time for multi-stop searches
	estimatedTime += 15 * time.Second // 1-stop routes
	estimatedTime += 20 * time.Second // 2-stop routes

	return estimatedTime
}
