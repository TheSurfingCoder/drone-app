package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Flight represents a saved flight plan
type Flight struct {
	ID            primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID        string             `json:"userId" bson:"userId"`
	Name          string             `json:"name" bson:"name"`
	Description   string             `json:"description" bson:"description"`
	Waypoints     []Waypoint         `json:"waypoints" bson:"waypoints"`
	Targets       []Target           `json:"targets" bson:"targets"`
	SegmentSpeeds []SegmentSpeed     `json:"segmentSpeeds" bson:"segmentSpeeds"`
	CreatedAt     time.Time          `json:"createdAt" bson:"createdAt"`
	UpdatedAt     time.Time          `json:"updatedAt" bson:"updatedAt"`
}

// NewFlight creates a new flight plan
func NewFlight(userID string, name, description string) *Flight {
	now := time.Now()
	return &Flight{
		UserID:      userID,
		Name:        name,
		Description: description,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
}

// ToJSON returns a map representation of the flight suitable for JSON
func (f *Flight) ToJSON() map[string]interface{} {
	return map[string]interface{}{
		"id":            f.ID.Hex(),
		"userId":        f.UserID,
		"name":          f.Name,
		"description":   f.Description,
		"waypoints":     f.Waypoints,
		"targets":       f.Targets,
		"segmentSpeeds": f.SegmentSpeeds,
		"createdAt":     f.CreatedAt,
		"updatedAt":     f.UpdatedAt,
	}
}

// Waypoint represents a point in the flight path
type Waypoint struct {
	ID            string  `json:"id" bson:"id"`
	Lat           float64 `json:"lat" bson:"lat"`
	Lng           float64 `json:"lng" bson:"lng"`
	Height        float64 `json:"height" bson:"height"`
	GroundHeight  float64 `json:"groundHeight" bson:"groundHeight"`
	Heading       float64 `json:"heading" bson:"heading"`
	Pitch         float64 `json:"pitch" bson:"pitch"`
	Roll          float64 `json:"roll" bson:"roll"`
	FocusTargetId string  `json:"focusTargetId" bson:"focusTargetId"`
}

// Target represents a target point
type Target struct {
	ID           string  `json:"id" bson:"id"`
	Lat          float64 `json:"lat" bson:"lat"`
	Lng          float64 `json:"lng" bson:"lng"`
	Height       float64 `json:"height" bson:"height"`
	GroundHeight float64 `json:"groundHeight" bson:"groundHeight"`
}

// SegmentSpeed represents speed settings for a flight segment
type SegmentSpeed struct {
	FromId             string  `json:"fromId" bson:"fromId"`
	ToId               string  `json:"toId" bson:"toId"`
	Speed              float64 `json:"speed" bson:"speed"`
	InterpolateHeading bool    `json:"interpolateHeading" bson:"interpolateHeading"`
	IsCurved           bool    `json:"isCurved" bson:"isCurved"`
	CurveTightness     float64 `json:"curveTightness" bson:"curveTightness"`
}
