package services

import (
	"encoding/csv"
	"os"
	"strings"
)

type Airport struct {
	CountryCode string `json:"country_code"`
	RegionName  string `json:"region_name"`
	IATA        string `json:"iata"`
	ICAO        string `json:"icao"`
	AirportName string `json:"airport_name"`
	Latitude    string `json:"latitude"`
	Longitude   string `json:"longitude"`
}

type AirportService struct {
	airports map[string]Airport // IATA code -> Airport
}

func NewAirportService() *AirportService {
	service := &AirportService{
		airports: make(map[string]Airport),
	}
	service.loadAirports()
	return service
}

func (as *AirportService) loadAirports() {
	file, err := os.Open("airports.csv")
	if err != nil {
		// Fallback to basic airports if CSV not found
		as.loadBasicAirports()
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		as.loadBasicAirports()
		return
	}

	// Skip header row
	for i, record := range records {
		if i == 0 {
			continue
		}

		if len(record) >= 7 && record[2] != "" {
			airport := Airport{
				CountryCode: record[0],
				RegionName:  record[1],
				IATA:        strings.ToUpper(record[2]),
				ICAO:        record[3],
				AirportName: record[4],
				Latitude:    record[5],
				Longitude:   record[6],
			}
			as.airports[airport.IATA] = airport
		}
	}
}

func (as *AirportService) loadBasicAirports() {
	// Basic fallback airports
	basicAirports := []Airport{
		{"TH", "Bangkok", "BKK", "VTBS", "Bangkok - Suvarnabhumi", "13.6900", "100.7501"},
		{"TH", "Bangkok", "DMK", "VTBD", "Bangkok - Don Mueang", "13.9126", "100.6067"},
		{"SG", "Singapore", "SIN", "WSSS", "Singapore - Changi", "1.3644", "103.9915"},
		{"DE", "Frankfurt", "FRA", "EDDF", "Frankfurt", "50.0264", "8.5431"},
		{"GB", "London", "LHR", "EGLL", "London - Heathrow", "51.4700", "-0.4543"},
		{"US", "New York", "JFK", "KJFK", "John F. Kennedy International Airport", "40.6413", "-73.7781"},
		{"US", "Los Angeles", "LAX", "KLAX", "Los Angeles International Airport", "33.9425", "-118.4081"},
	}

	for _, airport := range basicAirports {
		as.airports[airport.IATA] = airport
	}
}

func (as *AirportService) ValidateAirportCode(code string) bool {
	code = strings.ToUpper(strings.TrimSpace(code))
	_, exists := as.airports[code]
	return exists && len(code) == 3
}

func (as *AirportService) GetAirportInfo(code string) (Airport, bool) {
	code = strings.ToUpper(strings.TrimSpace(code))
	airport, exists := as.airports[code]
	return airport, exists
}

func (as *AirportService) SearchAirports(query string) []Airport {
	query = strings.ToLower(query)
	var results []Airport

	for _, airport := range as.airports {
		if strings.Contains(strings.ToLower(airport.IATA), query) ||
			strings.Contains(strings.ToLower(airport.AirportName), query) ||
			strings.Contains(strings.ToLower(airport.RegionName), query) {
			results = append(results, airport)
		}

		// Limit results to prevent overwhelming response
		if len(results) >= 20 {
			break
		}
	}

	return results
}

func (as *AirportService) GetAllAirports() []Airport {
	var airports []Airport
	for _, airport := range as.airports {
		airports = append(airports, airport)
	}
	return airports
}
