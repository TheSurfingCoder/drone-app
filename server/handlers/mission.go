package handlers

import (
	"bytes"
	"context"
	"encoding/json"
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

type MissionHandler struct {
	collection *mongo.Collection
}

func NewMissionHandler(collection *mongo.Collection) *MissionHandler {
	return &MissionHandler{collection: collection}
}

// CreateMission handles the creation of a new mission
func (h *MissionHandler) CreateMission(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID, ok := r.Context().Value("userID").(string)
	if !ok || userID == "" {
		log.Printf("Auth error: userID not found in context")
		http.Error(w, "Unauthorized: No user ID found in context", http.StatusUnauthorized)
		return
	}
	log.Printf("Processing CreateMission request for user: %s", userID)

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

	var mission models.Mission
	if err := json.NewDecoder(r.Body).Decode(&mission); err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Log the decoded mission data
	log.Printf("Decoded mission data: %+v", mission)

	// Validate required fields
	if mission.Name == "" {
		log.Printf("Validation error: Mission name is empty")
		http.Error(w, "Mission name is required", http.StatusBadRequest)
		return
	}

	// Validate timeline elements
	if len(mission.TimelineElements) == 0 {
		log.Printf("Validation error: No timeline elements")
		http.Error(w, "At least one timeline element is required", http.StatusBadRequest)
		return
	}

	// Validate that there's at least one waypoint mission
	hasWaypointMission := false
	for _, element := range mission.TimelineElements {
		if element.Type == "waypoint-mission" {
			hasWaypointMission = true
			// Validate waypoint mission has waypoints
			if config, ok := element.Config["waypoints"]; ok {
				if waypoints, ok := config.([]interface{}); ok {
					if len(waypoints) < 2 {
						log.Printf("Validation error: Waypoint mission must have at least 2 waypoints")
						http.Error(w, "Waypoint mission must have at least 2 waypoints", http.StatusBadRequest)
						return
					}
				}
			}
		}
	}

	if !hasWaypointMission {
		log.Printf("Validation error: No waypoint mission found")
		http.Error(w, "At least one waypoint mission is required", http.StatusBadRequest)
		return
	}
	mission.UserID = userID
	now := time.Now()
	mission.CreatedAt = now
	mission.UpdatedAt = now
	mission.Date = now

	// Insert mission into database
	result, err := h.collection.InsertOne(context.Background(), mission)

	if err != nil {
		log.Printf("Database error: %v", err)
		http.Error(w, "Failed to create mission: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return the created mission
	mission.ID = result.InsertedID.(primitive.ObjectID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(mission.ToJSON())
}

// GetMissions retrieves all missions for the authenticated user
func (h *MissionHandler) GetMissions(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID, ok := r.Context().Value("userID").(string)
	if !ok || userID == "" {
		log.Printf("Auth error: userID not found in context")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	log.Printf("Processing GetMissions request for user: %s", userID)

	// Find all missions for the user, sorted by date descending
	filter := bson.M{"user_id": userID}
	opts := options.Find().SetSort(bson.D{{Key: "date", Value: -1}})

	cursor, err := h.collection.Find(context.Background(), filter, opts)
	if err != nil {
		log.Printf("Database error: %v", err)
		http.Error(w, "Failed to retrieve missions: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	var missions []models.Mission
	if err := cursor.All(context.Background(), &missions); err != nil {
		log.Printf("Error decoding missions: %v", err)
		http.Error(w, "Failed to decode missions: "+err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("Found %d missions for user %s", len(missions), userID)

	// Convert missions to JSON format
	missionsJSON := make([]map[string]interface{}, len(missions))
	for i, mission := range missions {
		missionsJSON[i] = mission.ToJSON()
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(missionsJSON); err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
	log.Printf("Successfully sent %d missions", len(missionsJSON))
}

// GetMission retrieves a specific mission
func (h *MissionHandler) GetMission(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID, ok := r.Context().Value("userID").(string)
	if !ok || userID == "" {
		log.Printf("Auth error: userID not found in context")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get mission ID from URL
	vars := mux.Vars(r)
	missionID, err := primitive.ObjectIDFromHex(vars["id"])
	if err != nil {
		log.Printf("Invalid mission ID format: %v", err)
		http.Error(w, "Invalid mission ID", http.StatusBadRequest)
		return
	}

	// Find mission in database
	var mission models.Mission
	err = h.collection.FindOne(context.Background(), bson.M{
		"_id":     missionID,
		"user_id": userID,
	}).Decode(&mission)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			http.Error(w, "Mission not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Error retrieving mission", http.StatusInternalServerError)
		return
	}

	// Return mission data
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(mission.ToJSON())
}

// UpdateMission updates an existing mission
func (h *MissionHandler) UpdateMission(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(string)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	id, err := primitive.ObjectIDFromHex(vars["id"])
	if err != nil {
		http.Error(w, "Invalid mission ID", http.StatusBadRequest)
		return
	}

	var mission models.Mission
	if err := json.NewDecoder(r.Body).Decode(&mission); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	filter := bson.M{
		"_id":     id,
		"user_id": userID,
	}

	update := bson.M{
		"$set": bson.M{
			"name":             mission.Name,
			"timelineElements": mission.TimelineElements,
			"globalSettings":   mission.GlobalSettings,
			"metadata":         mission.Metadata,
			"updatedAt":        time.Now(),
		},
	}

	result, err := h.collection.UpdateOne(context.Background(), filter, update)
	if err != nil {
		http.Error(w, "Failed to update mission: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if result.MatchedCount == 0 {
		http.Error(w, "Mission not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(mission.ToJSON())
}

// DeleteMission deletes a mission
func (h *MissionHandler) DeleteMission(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID, ok := r.Context().Value("userID").(string)
	if !ok || userID == "" {
		log.Printf("Auth error: userID not found in context")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get mission ID from URL
	vars := mux.Vars(r)
	missionID, err := primitive.ObjectIDFromHex(vars["id"])
	if err != nil {
		log.Printf("Invalid mission ID format: %v", err)
		http.Error(w, "Invalid mission ID", http.StatusBadRequest)
		return
	}

	// Delete mission from database
	filter := bson.M{
		"_id":     missionID,
		"user_id": userID,
	}

	result, err := h.collection.DeleteOne(context.Background(), filter)
	if err != nil {
		log.Printf("Database error: %v", err)
		http.Error(w, "Failed to delete mission: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if result.DeletedCount == 0 {
		http.Error(w, "Mission not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
