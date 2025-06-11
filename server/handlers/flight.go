package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

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
	userID := r.Context().Value("userID").(string)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var flight models.Flight
	if err := json.NewDecoder(r.Body).Decode(&flight); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	flight.UserID = userID
	flight.CreatedAt = time.Now()
	flight.UpdatedAt = time.Now()

	result, err := h.collection.InsertOne(context.Background(), flight)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	flight.ID = result.InsertedID.(primitive.ObjectID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(flight.ToJSON())
}

// GetFlights retrieves all flights for the authenticated user
func (h *FlightHandler) GetFlights(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(string)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	filter := bson.M{"userId": userID}
	cursor, err := h.collection.Find(context.Background(), filter)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	var flights []models.Flight
	if err := cursor.All(context.Background(), &flights); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Convert flights to JSON format
	flightsJSON := make([]map[string]interface{}, len(flights))
	for i, flight := range flights {
		flightsJSON[i] = flight.ToJSON()
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(flightsJSON)
}

// GetFlight retrieves a specific flight by ID
func (h *FlightHandler) GetFlight(w http.ResponseWriter, r *http.Request) {
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

	filter := bson.M{
		"_id":    id,
		"userId": userID,
	}

	var flight models.Flight
	err = h.collection.FindOne(context.Background(), filter).Decode(&flight)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			http.Error(w, "Flight not found", http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(flight.ToJSON())
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
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	filter := bson.M{
		"_id":    id,
		"userId": userID,
	}

	update := bson.M{
		"$set": bson.M{
			"name":          flight.Name,
			"description":   flight.Description,
			"waypoints":     flight.Waypoints,
			"targets":       flight.Targets,
			"segmentSpeeds": flight.SegmentSpeeds,
			"updatedAt":     time.Now(),
		},
	}

	result, err := h.collection.UpdateOne(context.Background(), filter, update)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.MatchedCount == 0 {
		http.Error(w, "Flight not found", http.StatusNotFound)
		return
	}

	flight.ID = id
	flight.UserID = userID
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(flight.ToJSON())
}

// DeleteFlight deletes a flight plan
func (h *FlightHandler) DeleteFlight(w http.ResponseWriter, r *http.Request) {
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

	filter := bson.M{
		"_id":    id,
		"userId": userID,
	}

	result, err := h.collection.DeleteOne(context.Background(), filter)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.DeletedCount == 0 {
		http.Error(w, "Flight not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
