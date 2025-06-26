package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Mission represents a complete mission with timeline elements
type Mission struct {
	ID     primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID string             `bson:"user_id" json:"userId"`
	Name   string             `bson:"name" json:"name"`
	Date   time.Time          `bson:"date" json:"date"`

	// Timeline elements (ordered sequence)
	TimelineElements []TimelineElement `bson:"timeline_elements" json:"timelineElements"`

	// Global mission settings
	GlobalSettings GlobalMissionSettings `bson:"global_settings" json:"globalSettings"`

	// Metadata
	Metadata MissionMetadata `bson:"metadata" json:"metadata"`

	// Timestamps
	CreatedAt time.Time `bson:"created_at" json:"createdAt"`
	UpdatedAt time.Time `bson:"updated_at" json:"updatedAt"`
}

// TimelineElement represents a single element in the mission timeline
type TimelineElement struct {
	ID     string                 `bson:"id" json:"id"`
	Type   string                 `bson:"type" json:"type"` // "waypoint-mission", "record-video", "shoot-photo", "change-heading"
	Order  int                    `bson:"order" json:"order"`
	Config map[string]interface{} `bson:"config" json:"config"` // Flexible config based on type
}

// GlobalMissionSettings contains settings that apply to the entire mission
type GlobalMissionSettings struct {
	// Battery and safety settings
	BatteryAction    string `bson:"battery_action" json:"batteryAction"`
	BatteryThreshold int    `bson:"battery_threshold" json:"batteryThreshold"`
	SignalLostAction string `bson:"signal_lost_action" json:"signalLostAction"`

	// Home location
	HomeLat *float64 `bson:"home_lat" json:"homeLat"`
	HomeLng *float64 `bson:"home_lng" json:"homeLng"`

	// Drone type
	DroneType string `bson:"drone_type" json:"droneType"`
}

// WaypointMissionConfig represents the configuration for a waypoint mission timeline element
type WaypointMissionConfig struct {
	// Waypoint mission settings (from Waypoint Panel)
	AutoFlightSpeed            float64 `bson:"auto_flight_speed" json:"autoFlightSpeed"`
	MaxFlightSpeed             float64 `bson:"max_flight_speed" json:"maxFlightSpeed"`
	FinishedAction             string  `bson:"finished_action" json:"finishedAction"`
	RepeatTimes                int     `bson:"repeat_times" json:"repeatTimes"`
	GlobalTurnMode             string  `bson:"global_turn_mode" json:"globalTurnMode"`
	GimbalPitchRotationEnabled bool    `bson:"gimbal_pitch_rotation_enabled" json:"gimbalPitchRotationEnabled"`
	HeadingMode                string  `bson:"heading_mode" json:"headingMode"`
	FlightPathMode             string  `bson:"flight_path_mode" json:"flightPathMode"`

	// Targets/POIs
	Targets []Target `bson:"targets" json:"targets"`

	// Waypoints with their individual actions
	Waypoints []Waypoint `bson:"waypoints" json:"waypoints"`
}

// Waypoint represents a single waypoint within a waypoint mission
type Waypoint struct {
	ID           string     `bson:"id" json:"id"`
	Coordinate   Coordinate `bson:"coordinate" json:"coordinate"`
	Altitude     float64    `bson:"altitude" json:"altitude"`
	Heading      float64    `bson:"heading" json:"heading"`
	GimbalPitch  float64    `bson:"gimbal_pitch" json:"gimbalPitch"`
	Speed        float64    `bson:"speed" json:"speed"`
	CornerRadius float64    `bson:"corner_radius" json:"cornerRadius"`
	TurnMode     string     `bson:"turn_mode" json:"turnMode"`

	// Targets/POIs
	Targets []Target `bson:"targets" json:"targets"`

	// Waypoint-specific actions (different from timeline actions)
	Actions []WaypointAction `bson:"actions" json:"actions"`
}

// WaypointAction represents an action that can be attached to individual waypoints
type WaypointAction struct {
	ActionType  string  `bson:"action_type" json:"actionType"`
	ActionParam float64 `bson:"action_param" json:"actionParam"`
}

// Timeline Action Configurations

// RecordVideoActionConfig represents configuration for record video timeline action
type RecordVideoActionConfig struct {
	ActionType  string `bson:"action_type" json:"actionType"`   // "RecordVideoAction"
	CameraIndex int    `bson:"camera_index" json:"cameraIndex"` // Default 0
}

// TakePhotoActionConfig represents configuration for take photo timeline action
type TakePhotoActionConfig struct {
	PhotoType    string `bson:"photo_type" json:"photoType"`       // "single" or "interval"
	PhotoCount   *int   `bson:"photo_count" json:"photoCount"`     // For interval mode (1-10)
	TimeInterval *int   `bson:"time_interval" json:"timeInterval"` // Seconds between photos for interval
}

// ChangeHeadingActionConfig represents configuration for change heading timeline action
type ChangeHeadingActionConfig struct {
	Angle           float64 `bson:"angle" json:"angle"`                      // -180 to 180 degrees
	AngularVelocity float64 `bson:"angular_velocity" json:"angularVelocity"` // Degrees per second
}

// Supporting types

// Coordinate represents a 2D position
type Coordinate struct {
	Latitude  float64 `bson:"latitude" json:"latitude"`
	Longitude float64 `bson:"longitude" json:"longitude"`
}

// Target represents a point of interest (POI)
type Target struct {
	ID   string  `bson:"id" json:"id"`
	Name string  `bson:"name" json:"name"`
	Lat  float64 `bson:"lat" json:"lat"`
	Lng  float64 `bson:"lng" json:"lng"`
}

// MissionMetadata contains calculated mission information
type MissionMetadata struct {
	TotalTimelineElements int     `bson:"total_timeline_elements" json:"totalTimelineElements"`
	HasWaypointMission    bool    `bson:"has_waypoint_mission" json:"hasWaypointMission"`
	TotalWaypoints        int     `bson:"total_waypoints" json:"totalWaypoints"`
	TotalDistance         float64 `bson:"total_distance" json:"totalDistance"`
	EstimatedDuration     float64 `bson:"estimated_duration" json:"estimatedDuration"`
}

// ToJSON returns a map representation of the mission suitable for JSON
func (m *Mission) ToJSON() map[string]interface{} {
	return map[string]interface{}{
		"id":               m.ID.Hex(),
		"userId":           m.UserID,
		"name":             m.Name,
		"date":             m.Date,
		"timelineElements": m.TimelineElements,
		"globalSettings":   m.GlobalSettings,
		"metadata":         m.Metadata,
		"createdAt":        m.CreatedAt,
		"updatedAt":        m.UpdatedAt,
	}
}

// Helper functions for creating new missions
func NewMission(userID, name string) *Mission {
	now := time.Now()
	return &Mission{
		UserID:           userID,
		Name:             name,
		Date:             now,
		TimelineElements: []TimelineElement{},
		GlobalSettings:   GlobalMissionSettings{},
		Metadata:         MissionMetadata{},
		CreatedAt:        now,
		UpdatedAt:        now,
	}
}

// AddTimelineElement adds a new timeline element to the mission
func (m *Mission) AddTimelineElement(elementType string, config map[string]interface{}) {
	element := TimelineElement{
		ID:     primitive.NewObjectID().Hex(),
		Type:   elementType,
		Order:  len(m.TimelineElements),
		Config: config,
	}
	m.TimelineElements = append(m.TimelineElements, element)
	m.UpdatedAt = time.Now()
}

// GetWaypointMission returns the waypoint mission element if it exists
func (m *Mission) GetWaypointMission() *TimelineElement {
	for _, element := range m.TimelineElements {
		if element.Type == "waypoint-mission" {
			return &element
		}
	}
	return nil
}

// HasWaypointMission checks if the mission contains a waypoint mission
func (m *Mission) HasWaypointMission() bool {
	return m.GetWaypointMission() != nil
}
