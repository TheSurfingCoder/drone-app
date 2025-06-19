package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"drone-planner/server/models"
)

type FlightHandler struct {
	collection *mongo.Collection
}

func NewFlightHandler(collection *mongo.Collection) *FlightHandler {
	return &FlightHandler{collection: collection}
}

// CreateFlight handles the creation of a new flight plan
func (h *FlightHandler) CreateFlight(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID, ok := r.Context().Value("userID").(string)
	if !ok || userID == "" {
		log.Printf("Auth error: userID not found in context")
		http.Error(w, "Unauthorized: No user ID found in context", http.StatusUnauthorized)
		return
	}
	log.Printf("Processing request for user: %s", userID)

	// Read and log the raw request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("Error reading request body: %v", err)
		http.Error(w, "Error reading request body", http.StatusBadRequest)
		return
	}
	log.Printf("Received request body: %s", string(body))

	// Create a new reader for the body since we consumed it
	r.Body = io.NopCloser(bytes.NewBuffer(body))

	var flight models.Flight
	if err := json.NewDecoder(r.Body).Decode(&flight); err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Log the decoded flight data
	log.Printf("Decoded flight data: %+v", flight)

	// Validate required fields
	if flight.Name == "" {
		log.Printf("Validation error: Flight name is empty")
		http.Error(w, "Flight name is required", http.StatusBadRequest)
		return
	}

	if len(flight.Waypoints) < 2 {
		log.Printf("Validation error: Insufficient waypoints (got %d, need at least 2)", len(flight.Waypoints))
		http.Error(w, "At least 2 waypoints are required", http.StatusBadRequest)
		return
	}

	// Validate waypoints
	for i, wp := range flight.Waypoints {
		if wp.Coordinate.Latitude == 0 && wp.Coordinate.Longitude == 0 {
			log.Printf("Validation error: Invalid coordinates for waypoint %d", i)
			http.Error(w, fmt.Sprintf("Invalid coordinates for waypoint %d", i), http.StatusBadRequest)
			return
		}
	}

	// Set user ID and timestamps
	flight.UserID = userID
	now := time.Now()
	flight.CreatedAt = now
	flight.UpdatedAt = now

	// Parse date if provided, otherwise use current time
	if flight.Date.IsZero() {
		flight.Date = now
	}

	// Insert into database
	result, err := h.collection.InsertOne(context.Background(), flight)
	if err != nil {
		log.Printf("Database error: %v", err)
		http.Error(w, "Failed to save flight: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Set the ID from the result
	flight.ID = result.InsertedID.(primitive.ObjectID)

	// Return the created flight
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(flight.ToJSON()); err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
	log.Printf("Successfully created flight with ID: %s", flight.ID.Hex())
}

// GetFlights retrieves all flights for the authenticated user
func (h *FlightHandler) GetFlights(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID, ok := r.Context().Value("userID").(string)
	if !ok || userID == "" {
		log.Printf("Auth error: userID not found in context")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	log.Printf("Processing GetFlights request for user: %s", userID)

	// Find all flights for the user, sorted by date descending
	filter := bson.M{"user_id": userID}
	opts := options.Find().SetSort(bson.D{{Key: "date", Value: -1}})

	log.Printf("Querying flights with filter: %+v", filter)

	cursor, err := h.collection.Find(context.Background(), filter, opts)
	if err != nil {
		log.Printf("Database error: %v", err)
		http.Error(w, "Failed to retrieve flights: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	var flights []models.Flight
	if err := cursor.All(context.Background(), &flights); err != nil {
		log.Printf("Error decoding flights: %v", err)
		http.Error(w, "Failed to decode flights: "+err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("Found %d flights for user %s", len(flights), userID)

	// Convert flights to JSON format
	flightsJSON := make([]map[string]interface{}, len(flights))
	for i, flight := range flights {
		flightsJSON[i] = flight.ToJSON()
		log.Printf("Flight %d: %+v", i, flightsJSON[i])
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(flightsJSON); err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
	log.Printf("Successfully sent %d flights", len(flightsJSON))
}

// GetFlight retrieves a specific flight plan
func (h *FlightHandler) GetFlight(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID, ok := r.Context().Value("userID").(string)
	if !ok || userID == "" {
		log.Printf("Auth error: userID not found in context")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	log.Printf("Processing GetFlight request for user: %s", userID)

	// Get flight ID from URL
	vars := mux.Vars(r)
	flightID, err := primitive.ObjectIDFromHex(vars["id"])
	if err != nil {
		log.Printf("Invalid flight ID format: %v", err)
		http.Error(w, "Invalid flight ID", http.StatusBadRequest)
		return
	}
	log.Printf("Retrieving flight with ID: %s", flightID.Hex())

	// Find flight in database
	var flight models.Flight
	err = h.collection.FindOne(context.Background(), bson.M{
		"_id":     flightID,
		"user_id": userID,
	}).Decode(&flight)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			log.Printf("Flight not found: %s", flightID.Hex())
			http.Error(w, "Flight not found", http.StatusNotFound)
			return
		}
		log.Printf("Database error: %v", err)
		http.Error(w, "Error retrieving flight", http.StatusInternalServerError)
		return
	}

	// Log flight data before sending
	log.Printf("Retrieved flight data: %+v", flight)
	log.Printf("Number of waypoints: %d", len(flight.Waypoints))
	for i, wp := range flight.Waypoints {
		log.Printf("Waypoint %d: lat=%v, lng=%v, alt=%v",
			i,
			wp.Coordinate.Latitude,
			wp.Coordinate.Longitude,
			wp.Altitude)
	}

	// Return flight data
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(flight.ToJSON()); err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
	log.Printf("Successfully sent flight data for ID: %s", flightID.Hex())
}

// UpdateFlight updates an existing flight plan
func (h *FlightHandler) UpdateFlight(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(string)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	id, err := primitive.ObjectIDFromHex(vars["id"])
	if err != nil {
		http.Error(w, "Invalid flight ID", http.StatusBadRequest)
		return
	}

	var flight models.Flight
	if err := json.NewDecoder(r.Body).Decode(&flight); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Validate required fields
	if flight.Name == "" {
		http.Error(w, "Flight name is required", http.StatusBadRequest)
		return
	}

	if len(flight.Waypoints) < 2 {
		http.Error(w, "At least 2 waypoints are required", http.StatusBadRequest)
		return
	}

	filter := bson.M{
		"_id":    id,
		"userId": userID,
	}

	update := bson.M{
		"$set": bson.M{
			"name":          flight.Name,
			"waypoints":     flight.Waypoints,
			"segmentSpeeds": flight.SegmentSpeeds,
			"metadata":      flight.Metadata,
			"updatedAt":     time.Now(),
		},
	}

	result, err := h.collection.UpdateOne(context.Background(), filter, update)
	if err != nil {
		http.Error(w, "Failed to update flight: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if result.MatchedCount == 0 {
		http.Error(w, "Flight not found", http.StatusNotFound)
		return
	}

	// Get the updated flight
	err = h.collection.FindOne(context.Background(), filter).Decode(&flight)
	if err != nil {
		http.Error(w, "Failed to retrieve updated flight: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(flight.ToJSON())
}

// DeleteFlight deletes a flight plan
func (h *FlightHandler) DeleteFlight(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID, ok := r.Context().Value("userID").(string)
	if !ok || userID == "" {
		log.Printf("Auth error: userID not found in context")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	log.Printf("Processing DeleteFlight request for user: %s", userID)

	// Get flight ID from URL
	vars := mux.Vars(r)
	flightID, err := primitive.ObjectIDFromHex(vars["id"])
	if err != nil {
		log.Printf("Invalid flight ID format: %v", err)
		http.Error(w, "Invalid flight ID", http.StatusBadRequest)
		return
	}
	log.Printf("Attempting to delete flight with ID: %s", flightID.Hex())

	// Delete flight from database
	filter := bson.M{
		"_id":     flightID,
		"user_id": userID,
	}
	log.Printf("Using filter: %+v", filter)

	result, err := h.collection.DeleteOne(context.Background(), filter)
	if err != nil {
		log.Printf("Database error: %v", err)
		http.Error(w, "Failed to delete flight: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if result.DeletedCount == 0 {
		log.Printf("No flight found with ID: %s", flightID.Hex())
		http.Error(w, "Flight not found", http.StatusNotFound)
		return
	}

	log.Printf("Successfully deleted flight with ID: %s", flightID.Hex())
	w.WriteHeader(http.StatusNoContent)
}
