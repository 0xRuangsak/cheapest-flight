package config

import (
	"fmt"
	"os"
)

type Config struct {
	Port             string
	AmadeusAPIKey    string
	AmadeusAPISecret string
	AmadeusBaseURL   string
	Environment      string
	AllowedOrigins   []string
}

func Load() (*Config, error) {
	config := &Config{
		Port:             getEnv("PORT", "8080"),
		AmadeusAPIKey:    os.Getenv("AMADEUS_API_KEY"),
		AmadeusAPISecret: os.Getenv("AMADEUS_API_SECRET"),
		AmadeusBaseURL:   getEnv("AMADEUS_BASE_URL", "https://test.api.amadeus.com"),
		Environment:      getEnv("ENVIRONMENT", "development"),
		AllowedOrigins:   []string{"http://localhost:3000", "http://frontend:3000"},
	}

	// Validate required fields
	if config.AmadeusAPIKey == "" {
		return nil, fmt.Errorf("AMADEUS_API_KEY is required")
	}
	if config.AmadeusAPISecret == "" {
		return nil, fmt.Errorf("AMADEUS_API_SECRET is required")
	}

	return config, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
