package utils

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"cheapest-flight-backend/models"
)

// WriteJSONResponse writes a JSON response with proper headers
func WriteJSONResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// WriteErrorResponse writes an error response
func WriteErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	WriteJSONResponse(w, statusCode, models.ErrorResponse{
		Error:   http.StatusText(statusCode),
		Message: message,
		Code:    statusCode,
	})
}

// ParseJSONRequest parses JSON request body into the provided interface
func ParseJSONRequest(r *http.Request, dest interface{}) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields() // Reject unknown fields
	return decoder.Decode(dest)
}

// ValidateAirportCode validates airport IATA codes
func ValidateAirportCode(code string) bool {
	if len(code) != 3 {
		return false
	}

	// Check if all characters are letters
	for _, char := range strings.ToUpper(code) {
		if char < 'A' || char > 'Z' {
			return false
		}
	}

	return true
}

// ValidateDateString validates date string format and ensures it's not in the past
func ValidateDateString(dateStr string) error {
	parsedDate, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return err
	}

	// Check if date is not in the past
	today := time.Now().Truncate(24 * time.Hour)
	if parsedDate.Before(today) {
		return fmt.Errorf("date cannot be in the past")
	}

	return nil
}

// NormalizeAirportCode normalizes airport code to uppercase
func NormalizeAirportCode(code string) string {
	return strings.ToUpper(strings.TrimSpace(code))
}

// ValidatePassengerCount validates passenger count
func ValidatePassengerCount(count int) bool {
	return count >= 1 && count <= 9
}

// SanitizeString removes dangerous characters and trims whitespace
func SanitizeString(input string) string {
	// Remove null bytes and control characters
	result := strings.Map(func(r rune) rune {
		if r < 32 && r != '\t' && r != '\n' && r != '\r' {
			return -1
		}
		return r
	}, input)

	return strings.TrimSpace(result)
}

// ValidateFlightSearchRequest validates the entire flight search request
func ValidateFlightSearchRequest(req *models.FlightSearchRequest) []string {
	var errors []string

	// Normalize airport codes
	req.Origin = NormalizeAirportCode(req.Origin)
	req.Destination = NormalizeAirportCode(req.Destination)

	// Validate origin
	if !ValidateAirportCode(req.Origin) {
		errors = append(errors, "origin must be a valid 3-letter airport code")
	}

	// Validate destination
	if !ValidateAirportCode(req.Destination) {
		errors = append(errors, "destination must be a valid 3-letter airport code")
	}

	// Check if origin and destination are different
	if req.Origin == req.Destination {
		errors = append(errors, "origin and destination cannot be the same")
	}

	// Validate date
	if err := ValidateDateString(req.Date); err != nil {
		errors = append(errors, "date must be in YYYY-MM-DD format and not in the past")
	}

	// Validate passengers
	if !ValidatePassengerCount(req.Passengers) {
		errors = append(errors, "passenger count must be between 1 and 9")
	}

	return errors
}

// LogRequest logs incoming requests (for debugging)
func LogRequest(r *http.Request) {
	log.Printf("%s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)
}

// GetClientIP gets the real client IP from request
func GetClientIP(r *http.Request) string {
	// Check X-Forwarded-For header first
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		// Take the first IP in the chain
		if parts := strings.Split(xff, ","); len(parts) > 0 {
			return strings.TrimSpace(parts[0])
		}
	}

	// Check X-Real-IP header
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}

	// Fall back to RemoteAddr
	return r.RemoteAddr
}
