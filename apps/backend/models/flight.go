package models

import (
	"errors"
	"time"
)

// FlightSearchRequest represents the incoming search request
type FlightSearchRequest struct {
	Origin      string `json:"origin" validate:"required,len=3"`
	Destination string `json:"destination" validate:"required,len=3"`
	Date        string `json:"date" validate:"required"`
	Passengers  int    `json:"passengers" validate:"required,min=1,max=9"`
}

// Validate validates the flight search request
func (r *FlightSearchRequest) Validate() error {
	if r.Origin == "" || len(r.Origin) != 3 {
		return errors.New("origin must be a 3-letter airport code")
	}
	if r.Destination == "" || len(r.Destination) != 3 {
		return errors.New("destination must be a 3-letter airport code")
	}
	if r.Origin == r.Destination {
		return errors.New("origin and destination cannot be the same")
	}
	if r.Date == "" {
		return errors.New("date is required")
	}

	// Validate date format and ensure it's not in the past
	parsedDate, err := time.Parse("2006-01-02", r.Date)
	if err != nil {
		return errors.New("date must be in YYYY-MM-DD format")
	}
	if parsedDate.Before(time.Now().Truncate(24 * time.Hour)) {
		return errors.New("date cannot be in the past")
	}

	if r.Passengers < 1 || r.Passengers > 9 {
		return errors.New("passengers must be between 1 and 9")
	}

	return nil
}

// Flight represents a flight option
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
	BookingURL  string   `json:"bookingUrl,omitempty"`
}

// FlightSearchResponse represents the response to a flight search
type FlightSearchResponse struct {
	Flights []Flight            `json:"flights"`
	Message string              `json:"message,omitempty"`
	Total   int                 `json:"total"`
	Query   FlightSearchRequest `json:"query"`
}

// AmadeusTokenRequest represents the token request to Amadeus
type AmadeusTokenRequest struct {
	GrantType    string `json:"grant_type"`
	ClientID     string `json:"client_id"`
	ClientSecret string `json:"client_secret"`
}

// AmadeusTokenResponse represents the token response from Amadeus
type AmadeusTokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
}

// AmadeusFlightOffer represents a flight offer from Amadeus API
type AmadeusFlightOffer struct {
	Type                     string                   `json:"type"`
	ID                       string                   `json:"id"`
	Source                   string                   `json:"source"`
	InstantTicketingRequired bool                     `json:"instantTicketingRequired"`
	NonHomogeneous           bool                     `json:"nonHomogeneous"`
	OneWay                   bool                     `json:"oneWay"`
	LastTicketingDate        string                   `json:"lastTicketingDate"`
	NumberOfBookableSeats    int                      `json:"numberOfBookableSeats"`
	Itineraries              []AmadeusItinerary       `json:"itineraries"`
	Price                    AmadeusPrice             `json:"price"`
	PricingOptions           AmadeusPricingOptions    `json:"pricingOptions"`
	ValidatingAirlineCodes   []string                 `json:"validatingAirlineCodes"`
	TravelerPricings         []AmadeusTravelerPricing `json:"travelerPricings"`
}

// AmadeusItinerary represents an itinerary in Amadeus response
type AmadeusItinerary struct {
	Duration string           `json:"duration"`
	Segments []AmadeusSegment `json:"segments"`
}

// AmadeusSegment represents a flight segment
type AmadeusSegment struct {
	Departure       AmadeusEndpoint  `json:"departure"`
	Arrival         AmadeusEndpoint  `json:"arrival"`
	CarrierCode     string           `json:"carrierCode"`
	Number          string           `json:"number"`
	Aircraft        AmadeusAircraft  `json:"aircraft"`
	Operating       AmadeusOperating `json:"operating"`
	Duration        string           `json:"duration"`
	ID              string           `json:"id"`
	NumberOfStops   int              `json:"numberOfStops"`
	BlacklistedInEU bool             `json:"blacklistedInEU"`
}

// AmadeusEndpoint represents departure/arrival information
type AmadeusEndpoint struct {
	IataCode string `json:"iataCode"`
	Terminal string `json:"terminal"`
	At       string `json:"at"`
}

// AmadeusAircraft represents aircraft information
type AmadeusAircraft struct {
	Code string `json:"code"`
}

// AmadeusOperating represents operating airline information
type AmadeusOperating struct {
	CarrierCode string `json:"carrierCode"`
}

// AmadeusPrice represents pricing information
type AmadeusPrice struct {
	Currency   string       `json:"currency"`
	Total      string       `json:"total"`
	Base       string       `json:"base"`
	Fees       []AmadeusFee `json:"fees"`
	GrandTotal string       `json:"grandTotal"`
}

// AmadeusFee represents fee information
type AmadeusFee struct {
	Amount string `json:"amount"`
	Type   string `json:"type"`
}

// AmadeusPricingOptions represents pricing options
type AmadeusPricingOptions struct {
	FareType                []string `json:"fareType"`
	IncludedCheckedBagsOnly bool     `json:"includedCheckedBagsOnly"`
}

// AmadeusTravelerPricing represents traveler pricing
type AmadeusTravelerPricing struct {
	TravelerID   string       `json:"travelerId"`
	FareOption   string       `json:"fareOption"`
	TravelerType string       `json:"travelerType"`
	Price        AmadeusPrice `json:"price"`
}

// AmadeusFlightResponse represents the full response from Amadeus
type AmadeusFlightResponse struct {
	Meta AmadeusMeta          `json:"meta"`
	Data []AmadeusFlightOffer `json:"data"`
}

// AmadeusMeta represents metadata in Amadeus response
type AmadeusMeta struct {
	Count int                    `json:"count"`
	Links map[string]interface{} `json:"links"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    int    `json:"code,omitempty"`
}
