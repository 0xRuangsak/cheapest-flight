package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"

	"cheapest-flight-backend/config"
	"cheapest-flight-backend/handlers"
	"cheapest-flight-backend/services"
)

const (
	Version = "2.0.0"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	log.Printf("Starting Cheapest Flight Backend v%s", Version)
	log.Printf("Environment: %s", cfg.Environment)
	log.Printf("Port: %s", cfg.Port)

	// Initialize services
	amadeusService := services.NewAmadeusService(cfg.AmadeusBaseURL, cfg.AmadeusAPIKey, cfg.AmadeusAPISecret)
	routeOptimizer := services.NewRouteOptimizer(amadeusService)

	// Initialize handlers
	healthHandler := handlers.NewHealthHandler(Version)
	flightHandler := handlers.NewFlightSearchHandler(routeOptimizer, amadeusService)

	// Create router
	r := mux.NewRouter()

	// Health check routes
	r.HandleFunc("/health", healthHandler.HealthCheck).Methods("GET")
	r.HandleFunc("/health/ready", healthHandler.ReadinessCheck).Methods("GET")
	r.HandleFunc("/health/live", healthHandler.LivenessCheck).Methods("GET")

	// Flight search routes
	r.HandleFunc("/api/search", flightHandler.SearchFlights).Methods("POST")
	r.HandleFunc("/api/search/health", flightHandler.HealthCheck).Methods("GET")
	r.HandleFunc("/api/airports", flightHandler.GetSupportedAirports).Methods("GET")

	// API info route
	r.HandleFunc("/api/info", func(w http.ResponseWriter, r *http.Request) {
		info := map[string]interface{}{
			"service":     "cheapest-flight-backend",
			"version":     Version,
			"environment": cfg.Environment,
			"endpoints": map[string]string{
				"health":        "GET /health",
				"search":        "POST /api/search",
				"airports":      "GET /api/airports",
				"search_health": "GET /api/search/health",
			},
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(info)
	}).Methods("GET")

	// Setup CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   cfg.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: false,
		MaxAge:           300, // 5 minutes
	})

	handler := c.Handler(r)

	// Setup server
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Setup graceful shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	// Start server in a goroutine
	go func() {
		log.Printf("Server starting on port %s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	// Test Amadeus connection on startup
	go func() {
		time.Sleep(2 * time.Second) // Give server time to start
		log.Printf("Testing Amadeus API connection...")
		if err := amadeusService.HealthCheck(); err != nil {
			log.Printf("Warning: Amadeus API connection failed: %v", err)
			log.Printf("The service will continue but flight searches may not work properly")
		} else {
			log.Printf("Amadeus API connection successful")
		}
	}()

	// Wait for interrupt signal
	<-stop
	log.Printf("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	} else {
		log.Printf("Server exited gracefully")
	}
}
