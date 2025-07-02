package handlers

import (
	"net/http"
	"runtime"
	"time"

	"cheapest-flight-backend/utils"
)

type HealthHandler struct {
	StartTime time.Time
	Version   string
}

func NewHealthHandler(version string) *HealthHandler {
	return &HealthHandler{
		StartTime: time.Now(),
		Version:   version,
	}
}

// HealthCheck handles the health check endpoint
func (h *HealthHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	uptime := time.Since(h.StartTime)

	response := map[string]interface{}{
		"status":    "healthy",
		"service":   "cheapest-flight-backend",
		"version":   h.Version,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"uptime":    uptime.String(),
		"system": map[string]interface{}{
			"goroutines": runtime.NumGoroutine(),
			"memory_mb":  getMemoryUsageMB(),
			"go_version": runtime.Version(),
		},
		"dependencies": h.checkDependencies(),
	}

	utils.WriteJSONResponse(w, http.StatusOK, response)
}

// getMemoryUsageMB returns current memory usage in MB
func getMemoryUsageMB() float64 {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	return float64(m.Alloc) / 1024 / 1024
}

// checkDependencies checks the status of external dependencies
func (h *HealthHandler) checkDependencies() map[string]string {
	deps := make(map[string]string)

	// Check Amadeus API connectivity (simplified check)
	// In a real implementation, you might want to make a lightweight API call
	deps["amadeus_api"] = "unknown" // We'll implement this properly in the Amadeus service

	return deps
}

// ReadinessCheck handles the readiness check endpoint
func (h *HealthHandler) ReadinessCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Check if all required services are ready
	isReady := h.checkReadiness()

	response := map[string]interface{}{
		"ready":     isReady,
		"service":   "cheapest-flight-backend",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}

	statusCode := http.StatusOK
	if !isReady {
		statusCode = http.StatusServiceUnavailable
	}

	utils.WriteJSONResponse(w, statusCode, response)
}

// checkReadiness checks if the service is ready to serve requests
func (h *HealthHandler) checkReadiness() bool {
	// Add checks for:
	// - Database connectivity (if applicable)
	// - External API availability
	// - Required environment variables
	// - Other dependencies

	// For now, we assume ready if the service is running
	return true
}

// LivenessCheck handles the liveness check endpoint
func (h *HealthHandler) LivenessCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	response := map[string]interface{}{
		"alive":     true,
		"service":   "cheapest-flight-backend",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}

	utils.WriteJSONResponse(w, http.StatusOK, response)
}
