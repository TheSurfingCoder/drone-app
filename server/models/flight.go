package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Flight represents a saved flight plan
type Flight struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID          string             `bson:"user_id" json:"userId"`
	Name            string             `bson:"name" json:"name"`
	Date            time.Time          `bson:"date" json:"date"`
	Waypoints       []Waypoint         `bson:"waypoints" json:"waypoints"`
	SegmentSpeeds   []SegmentSpeed     `bson:"segment_speeds" json:"segmentSpeeds"`
	Metadata        FlightMetadata     `bson:"metadata" json:"metadata"`
	MissionType     string             `bson:"mission_type" json:"missionType"`
	MaxFlightSpeed  float64            `bson:"max_flight_speed" json:"maxFlightSpeed"`
	AutoFlightSpeed float64            `bson:"auto_flight_speed" json:"autoFlightSpeed"`
	FinishedAction  string             `bson:"finished_action" json:"finishedAction"`
	HeadingHome     string             `bson:"heading_home" json:"headingHome"`
	FlightpathMode  string             `bson:"flightpath_mode" json:"flightpathMode"`
	RepeatTimes     int                `bson:"repeat_times" json:"repeatTimes"`
	TurnMode        string             `bson:"turn_mode" json:"turnMode"`
	Actions         []Action           `bson:"actions" json:"actions"`
	CreatedAt       time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt       time.Time          `bson:"updated_at" json:"updatedAt"`
}

// Waypoint represents a point in the flight path
type Waypoint struct {
	Coordinate  Coordinate `json:"coordinate" bson:"coordinate"`
	Altitude    float64    `json:"altitude" bson:"altitude"`
	Heading     float64    `json:"heading" bson:"heading"`
	GimbalPitch float64    `json:"gimbalPitch" bson:"gimbalPitch"`
	Speed       float64    `json:"speed" bson:"speed"`
	TurnMode    string     `json:"turnMode" bson:"turnMode"`
	Actions     []Action   `json:"actions" bson:"actions"`
}

// Coordinate represents a 2D position
type Coordinate struct {
	Latitude  float64 `json:"latitude" bson:"latitude"`
	Longitude float64 `json:"longitude" bson:"longitude"`
}

// Action represents a waypoint action
type Action struct {
	ActionType  string  `json:"actionType" bson:"actionType"`
	ActionParam float64 `json:"actionParam" bson:"actionParam"`
}

// FlightMetadata contains calculated flight information
type FlightMetadata struct {
	TotalWaypoints    int     `json:"totalWaypoints" bson:"totalWaypoints"`
	TotalDistance     float64 `json:"totalDistance" bson:"totalDistance"`
	EstimatedDuration float64 `json:"estimatedDuration" bson:"estimatedDuration"`
}

// SegmentSpeed represents the speed settings between two waypoints
type SegmentSpeed struct {
	FromID             int64   `bson:"from_id" json:"fromId"`
	ToID               int64   `bson:"to_id" json:"toId"`
	Speed              float64 `bson:"speed" json:"speed"`
	InterpolateHeading bool    `bson:"interpolate_heading" json:"interpolateHeading"`
	IsCurved           bool    `bson:"is_curved" json:"isCurved"`
	CurveTightness     int     `bson:"curve_tightness" json:"curveTightness"`
}


// ToJSON returns a map representation of the flight suitable for JSON
func (f *Flight) ToJSON() map[string]interface{} {
	return map[string]interface{}{
		"id":              f.ID.Hex(),
		"userId":          f.UserID,
		"name":            f.Name,
		"date":            f.Date,
		"waypoints":       f.Waypoints,
		"segmentSpeeds":   f.SegmentSpeeds,
		"metadata":        f.Metadata,
		"createdAt":       f.CreatedAt,
		"updatedAt":       f.UpdatedAt,
		"missionType":     f.MissionType,
		"maxFlightSpeed":  f.MaxFlightSpeed,
		"autoFlightSpeed": f.AutoFlightSpeed,
		"finishedAction":  f.FinishedAction,
		"headingHome":     f.HeadingHome,
		"flightpathMode":  f.FlightpathMode,
		"repeatTimes":     f.RepeatTimes,
		"turnMode":        f.TurnMode,
		"actions":         f.Actions,
	}
}
