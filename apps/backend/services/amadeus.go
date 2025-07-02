package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"cheapest-flight-backend/models"
)

type AmadeusService struct {
	BaseURL      string
	ClientID     string
	ClientSecret string
	AccessToken  string
	TokenExpiry  time.Time
	HTTPClient   *http.Client
	mutex        sync.RWMutex
}

func NewAmadeusService(baseURL, clientID, clientSecret string) *AmadeusService {
	return &AmadeusService{
		BaseURL:      strings.TrimSuffix(baseURL, "/"),
		ClientID:     clientID,
		ClientSecret: clientSecret,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// GetAccessToken retrieves or refreshes the access token
func (a *AmadeusService) GetAccessToken() (string, error) {
	a.mutex.RLock()
	// Check if we have a valid token
	if a.AccessToken != "" && time.Now().Before(a.TokenExpiry.Add(-5*time.Minute)) {
		token := a.AccessToken
		a.mutex.RUnlock()
		return token, nil
	}
	a.mutex.RUnlock()

	// Need to get a new token
	a.mutex.Lock()
	defer a.mutex.Unlock()

	// Double-check after acquiring write lock
	if a.AccessToken != "" && time.Now().Before(a.TokenExpiry.Add(-5*time.Minute)) {
		return a.AccessToken, nil
	}

	// Request new token
	tokenURL := fmt.Sprintf("%s/v1/security/oauth2/token", a.BaseURL)

	data := url.Values{}
	data.Set("grant_type", "client_credentials")
	data.Set("client_id", a.ClientID)
	data.Set("client_secret", a.ClientSecret)

	req, err := http.NewRequest("POST", tokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		return "", fmt.Errorf("failed to create token request: %w", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := a.HTTPClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to request token: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("token request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var tokenResp models.AmadeusTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return "", fmt.Errorf("failed to decode token response: %w", err)
	}

	a.AccessToken = tokenResp.AccessToken
	a.TokenExpiry = time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second)

	return a.AccessToken, nil
}

// SearchFlights searches for flights using the Amadeus API
func (a *AmadeusService) SearchFlights(req models.FlightSearchRequest) (*models.AmadeusFlightResponse, error) {
	token, err := a.GetAccessToken()
	if err != nil {
		return nil, fmt.Errorf("failed to get access token: %w", err)
	}

	// Build the search URL
	searchURL := fmt.Sprintf("%s/v2/shopping/flight-offers", a.BaseURL)

	// Prepare query parameters
	params := url.Values{}
	params.Set("originLocationCode", req.Origin)
	params.Set("destinationLocationCode", req.Destination)
	params.Set("departureDate", req.Date)
	params.Set("adults", strconv.Itoa(req.Passengers))
	params.Set("max", "250")          // Get up to 250 results for better route optimization
	params.Set("currencyCode", "USD") // Default to USD, could be configurable

	fullURL := fmt.Sprintf("%s?%s", searchURL, params.Encode())

	httpReq, err := http.NewRequest("GET", fullURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create search request: %w", err)
	}

	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := a.HTTPClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to search flights: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("flight search failed with status %d: %s", resp.StatusCode, string(body))
	}

	var flightResp models.AmadeusFlightResponse
	if err := json.Unmarshal(body, &flightResp); err != nil {
		return nil, fmt.Errorf("failed to decode flight response: %w", err)
	}

	return &flightResp, nil
}

// ConvertAmadeusFlights converts Amadeus flight offers to our Flight model
func (a *AmadeusService) ConvertAmadeusFlights(amadeusResp *models.AmadeusFlightResponse, originalReq models.FlightSearchRequest) []models.Flight {
	flights := make([]models.Flight, 0, len(amadeusResp.Data))

	for _, offer := range amadeusResp.Data {
		flight := a.convertSingleFlight(offer, originalReq)
		if flight != nil {
			flights = append(flights, *flight)
		}
	}

	return flights
}

// convertSingleFlight converts a single Amadeus offer to our Flight model
func (a *AmadeusService) convertSingleFlight(offer models.AmadeusFlightOffer, originalReq models.FlightSearchRequest) *models.Flight {
	if len(offer.Itineraries) == 0 || len(offer.Itineraries[0].Segments) == 0 {
		return nil
	}

	itinerary := offer.Itineraries[0]
	segments := itinerary.Segments

	// Build route
	route := make([]string, 0, len(segments)+1)
	route = append(route, segments[0].Departure.IataCode)
	for _, segment := range segments {
		route = append(route, segment.Arrival.IataCode)
	}

	// Parse price
	price, err := strconv.ParseFloat(offer.Price.Total, 64)
	if err != nil {
		return nil
	}

	// Get primary airline
	airline := segments[0].CarrierCode
	if len(segments) > 0 {
		// You might want to map carrier codes to airline names
		airline = a.getAirlineName(segments[0].CarrierCode)
	}

	// Calculate total stops
	stops := len(segments) - 1

	flight := &models.Flight{
		ID:          offer.ID,
		Origin:      originalReq.Origin,
		Destination: originalReq.Destination,
		Date:        originalReq.Date,
		Price:       price,
		Currency:    offer.Price.Currency,
		Airline:     airline,
		Duration:    a.formatDuration(itinerary.Duration),
		Stops:       stops,
		Route:       route,
		BookingURL:  "", // We'll implement booking URLs later
	}

	return flight
}

// getAirlineName maps carrier codes to airline names
func (a *AmadeusService) getAirlineName(carrierCode string) string {
	// This is a simplified mapping. In production, you'd want a comprehensive database
	airlines := map[string]string{
		"AA": "American Airlines",
		"UA": "United Airlines",
		"DL": "Delta Air Lines",
		"WN": "Southwest Airlines",
		"AS": "Alaska Airlines",
		"B6": "JetBlue Airways",
		"NK": "Spirit Airlines",
		"F9": "Frontier Airlines",
		"TG": "Thai Airways",
		"SQ": "Singapore Airlines",
		"CX": "Cathay Pacific",
		"EK": "Emirates",
		"QR": "Qatar Airways",
		"LH": "Lufthansa",
		"AF": "Air France",
		"KL": "KLM",
		"BA": "British Airways",
	}

	if name, exists := airlines[carrierCode]; exists {
		return name
	}
	return carrierCode // Return code if name not found
}

// formatDuration formats ISO 8601 duration to readable format
func (a *AmadeusService) formatDuration(isoDuration string) string {
	// Parse ISO 8601 duration (e.g., "PT2H30M")
	// This is a simplified parser
	if !strings.HasPrefix(isoDuration, "PT") {
		return isoDuration
	}

	duration := strings.TrimPrefix(isoDuration, "PT")

	// Extract hours and minutes
	var hours, minutes int
	var err error

	if hIndex := strings.Index(duration, "H"); hIndex != -1 {
		hoursStr := duration[:hIndex]
		hours, err = strconv.Atoi(hoursStr)
		if err != nil {
			return isoDuration
		}
		duration = duration[hIndex+1:]
	}

	if mIndex := strings.Index(duration, "M"); mIndex != -1 {
		minutesStr := duration[:mIndex]
		minutes, err = strconv.Atoi(minutesStr)
		if err != nil {
			return isoDuration
		}
	}

	if hours > 0 && minutes > 0 {
		return fmt.Sprintf("%dh %dm", hours, minutes)
	} else if hours > 0 {
		return fmt.Sprintf("%dh", hours)
	} else if minutes > 0 {
		return fmt.Sprintf("%dm", minutes)
	}

	return isoDuration
}

// HealthCheck checks if the Amadeus API is accessible
func (a *AmadeusService) HealthCheck() error {
	_, err := a.GetAccessToken()
	return err
}
