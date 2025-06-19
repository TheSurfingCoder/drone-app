package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"
)

// TimezoneResponse represents the response from TimeZoneDB API
type TimezoneResponse struct {
	Status           string `json:"status"`
	Message          string `json:"message"`
	CountryCode      string `json:"countryCode"`
	CountryName      string `json:"countryName"`
	ZoneName         string `json:"zoneName"`
	Abbreviation     string `json:"abbreviation"`
	GmtOffset        int    `json:"gmtOffset"`
	Dst              string `json:"dst"`
	ZoneStart        int64  `json:"zoneStart"`
	ZoneEnd          int64  `json:"zoneEnd"`
	NextAbbreviation string `json:"nextAbbreviation"`
	Timestamp        int64  `json:"timestamp"`
	Formatted        string `json:"formatted"`
}

// TimezoneCache represents a cached timezone response
type TimezoneCache struct {
	Data      TimezoneResponse
	Timestamp time.Time
}

// TimezoneHandler handles timezone-related requests
type TimezoneHandler struct {
	cache map[string]TimezoneCache
	mutex sync.RWMutex
}

// NewTimezoneHandler creates a new timezone handler
func NewTimezoneHandler() *TimezoneHandler {
	return &TimezoneHandler{
		cache: make(map[string]TimezoneCache),
	}
}

// roundCoordinate rounds a coordinate to 2 decimal places for caching
func roundCoordinate(coord float64) float64 {
	return math.Round(coord*100) / 100
}

// getCacheKey generates a cache key from lat/lng coordinates
func getCacheKey(lat, lng float64) string {
	roundedLat := roundCoordinate(lat)
	roundedLng := roundCoordinate(lng)
	return fmt.Sprintf("%.2f:%.2f", roundedLat, roundedLng)
}

// isCacheValid checks if a cached entry is still valid (24 hours)
func isCacheValid(timestamp time.Time) bool {
	return time.Since(timestamp) < 24*time.Hour
}

// GetTimezone handles timezone requests
func (h *TimezoneHandler) GetTimezone(w http.ResponseWriter, r *http.Request) {
	log.Printf("🌍 Timezone request received: %s %s", r.Method, r.URL.String())
	log.Printf("🌍 Headers: %v", r.Header)

	// Parse query parameters
	latStr := r.URL.Query().Get("lat")
	lngStr := r.URL.Query().Get("lng")

	log.Printf("🌍 Query params - lat: %s, lng: %s", latStr, lngStr)

	if latStr == "" || lngStr == "" {
		http.Error(w, "Missing lat or lng parameters", http.StatusBadRequest)
		return
	}

	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		http.Error(w, "Invalid lat parameter", http.StatusBadRequest)
		return
	}

	lng, err := strconv.ParseFloat(lngStr, 64)
	if err != nil {
		http.Error(w, "Invalid lng parameter", http.StatusBadRequest)
		return
	}

	// Generate cache key
	cacheKey := getCacheKey(lat, lng)

	// Check cache first
	h.mutex.RLock()
	if cached, exists := h.cache[cacheKey]; exists && isCacheValid(cached.Timestamp) {
		h.mutex.RUnlock()
		log.Printf("Cache hit for coordinates %s", cacheKey)
		json.NewEncoder(w).Encode(cached.Data)
		return
	}
	h.mutex.RUnlock()

	// Cache miss or expired, fetch from TimeZoneDB
	log.Printf("Cache miss for coordinates %s, fetching from TimeZoneDB", cacheKey)

	timezoneData, err := h.fetchFromTimeZoneDB(lat, lng)
	if err != nil {
		log.Printf("Error fetching timezone data: %v, falling back to UTC", err)
		// Return UTC fallback
		utcResponse := TimezoneResponse{
			Status:       "OK",
			ZoneName:     "UTC",
			Abbreviation: "UTC",
			GmtOffset:    0,
			Formatted:    time.Now().UTC().Format("2006-01-02 15:04:05"),
		}
		json.NewEncoder(w).Encode(utcResponse)
		return
	}

	// Cache the result
	h.mutex.Lock()
	h.cache[cacheKey] = TimezoneCache{
		Data:      timezoneData,
		Timestamp: time.Now(),
	}
	h.mutex.Unlock()

	// Return the response
	json.NewEncoder(w).Encode(timezoneData)
}

// fetchFromTimeZoneDB calls the TimeZoneDB API
func (h *TimezoneHandler) fetchFromTimeZoneDB(lat, lng float64) (TimezoneResponse, error) {
	apiKey := os.Getenv("TIMEZONEDB_API_KEY")
	if apiKey == "" {
		return TimezoneResponse{}, fmt.Errorf("TIMEZONEDB_API_KEY environment variable not set")
	}

	url := fmt.Sprintf("http://api.timezonedb.com/v2.1/get-time-zone?key=%s&format=json&by=position&lat=%.6f&lng=%.6f",
		apiKey, lat, lng)

	resp, err := http.Get(url)
	if err != nil {
		return TimezoneResponse{}, fmt.Errorf("failed to call TimeZoneDB API: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return TimezoneResponse{}, fmt.Errorf("TimeZoneDB API returned status %d", resp.StatusCode)
	}

	var timezoneData TimezoneResponse
	if err := json.NewDecoder(resp.Body).Decode(&timezoneData); err != nil {
		return TimezoneResponse{}, fmt.Errorf("failed to decode TimeZoneDB response: %v", err)
	}

	if timezoneData.Status != "OK" {
		return TimezoneResponse{}, fmt.Errorf("TimeZoneDB API error: %s", timezoneData.Message)
	}

	return timezoneData, nil
}
