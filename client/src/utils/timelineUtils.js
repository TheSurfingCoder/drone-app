// Timeline utilities for DJI drone mission planning

import { TIMELINE_ELEMENT_TYPES } from '../contexts/TimelineContext'

// Calculate mission duration for waypoint missions only
export function calculateMissionDuration(timelineElements, waypoints) {
  let totalDuration = 0

  timelineElements.forEach((element) => {
    if (element.type === 'waypointMission' && element.parameters?.waypoints) {
      const waypointIds = element.parameters.waypoints
      const missionWaypoints = waypoints.filter((wp) => waypointIds.includes(wp.id))

      if (missionWaypoints.length >= 2) {
        // Calculate distance and duration for this waypoint mission
        let missionDuration = 0

        for (let i = 0; i < missionWaypoints.length - 1; i++) {
          const from = missionWaypoints[i]
          const to = missionWaypoints[i + 1]
          const speed = from.speed ?? 10 // Use waypoint speed, fallback to 10 m/s

          const dx = to.lng - from.lng
          const dy = to.lat - from.lat
          const distanceDegrees = Math.sqrt(dx * dx + dy * dy)
          const metersPerDegree = 111_139 // avg Earth conversion

          const meters = distanceDegrees * metersPerDegree
          missionDuration += meters / speed
        }

        // Add hover time per waypoint (default 2 seconds)
        const hoverTimePerWaypoint = 2
        missionDuration += missionWaypoints.length * hoverTimePerWaypoint

        totalDuration += missionDuration
      }
    }
    // Other action types (Heading, Record Video, Shoot Photo) are not included in duration
  })

  return totalDuration
}

// Validate timeline element
export function validateTimelineElement(element) {
  const errors = []

  if (!element.type) {
    errors.push('Element type is required')
  }

  if (!element.config) {
    errors.push('Element configuration is required')
  }

  switch (element.type) {
    case TIMELINE_ELEMENT_TYPES.WAYPOINT_MISSION:
      if (!Array.isArray(element.config.waypoints)) {
        errors.push('Waypoints must be an array')
      }
      if (element.config.waypoints && element.config.waypoints.length < 2) {
        errors.push('Waypoint mission must have at least 2 waypoints')
      }
      if (typeof element.config.speed !== 'number' || element.config.speed <= 0) {
        errors.push('Speed must be a positive number')
      }
      break
    case TIMELINE_ELEMENT_TYPES.HEADING:
      if (typeof element.config.angle !== 'number') {
        errors.push('Angle must be a number')
      }
      if (typeof element.config.velocity !== 'number' || element.config.velocity <= 0) {
        errors.push('Velocity must be a positive number')
      }
      break
    case TIMELINE_ELEMENT_TYPES.SHOOT_PHOTO:
      if (!['single', 'interval'].includes(element.config.photoType)) {
        errors.push('Photo type must be "single" or "interval"')
      }
      if (element.config.photoType === 'interval') {
        if (
          typeof element.config.photoCount !== 'number' ||
          element.config.photoCount < 1 ||
          element.config.photoCount > 10
        ) {
          errors.push('Photo count must be between 1 and 10')
        }
        if (
          typeof element.config.timeInterval !== 'number' ||
          element.config.timeInterval < 1 ||
          element.config.timeInterval > 60
        ) {
          errors.push('Time interval must be between 1 and 60 seconds')
        }
      }
      break
    case TIMELINE_ELEMENT_TYPES.RECORD_VIDEO:
      // No validation needed for record video
      break
    default: {
      errors.push(`Unknown element type: ${element.type}`)
    }
  }

  return errors
}

// Create a new timeline element
export function createTimelineElement(type) {
  const baseElement = {
    id: Date.now().toString(),
    order: 0, // Will be set by the context
    type: type,
  }

  switch (type) {
    case TIMELINE_ELEMENT_TYPES.WAYPOINT_MISSION:
      return {
        ...baseElement,
        config: {
          waypoints: [], // Array of waypoint IDs
          speed: 10, // Default speed in m/s
          finishedAction: 'NO_ACTION',
        },
      }

    case TIMELINE_ELEMENT_TYPES.HEADING:
      return {
        ...baseElement,
        config: {
          angle: 0, // Yaw angle in degrees
          velocity: 10, // Velocity in m/s
        },
      }

    case TIMELINE_ELEMENT_TYPES.RECORD_VIDEO:
      return {
        ...baseElement,
        config: {
          // No additional configuration needed for continuous recording
        },
      }

    case TIMELINE_ELEMENT_TYPES.SHOOT_PHOTO:
      return {
        ...baseElement,
        config: {
          photoType: 'single', // 'single' or 'interval'
          photoCount: 1, // 1-10 for interval mode
          timeInterval: 5, // 1-60 seconds for interval mode
        },
      }
  }
  throw new Error(`Unknown timeline element type: ${type}`)
}

// Get timeline element display name
export function getElementTypeDisplayName(type) {
  switch (type) {
    case TIMELINE_ELEMENT_TYPES.WAYPOINT_MISSION:
      return 'Waypoint Mission'
    case TIMELINE_ELEMENT_TYPES.HEADING:
      return 'Heading'
    case TIMELINE_ELEMENT_TYPES.RECORD_VIDEO:
      return 'Record Video'
    case TIMELINE_ELEMENT_TYPES.SHOOT_PHOTO:
      return 'Shoot Photo'
    default:
      return 'Unknown'
  }
}

// Get timeline element icon
export function getElementTypeIcon(type) {
  switch (type) {
    case TIMELINE_ELEMENT_TYPES.WAYPOINT_MISSION:
      return 'MapPin'
    case TIMELINE_ELEMENT_TYPES.HEADING:
      return 'RotateCw'
    case TIMELINE_ELEMENT_TYPES.RECORD_VIDEO:
      return 'Video'
    case TIMELINE_ELEMENT_TYPES.SHOOT_PHOTO:
      return 'Camera'
    default:
      return 'Circle'
  }
}

// Format duration in seconds to human readable format
export function formatDuration(seconds) {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

// Get the default configuration for a timeline element type
export function getDefaultConfig(type) {
  switch (type) {
    case TIMELINE_ELEMENT_TYPES.WAYPOINT_MISSION:
      return {
        waypoints: [],
        speed: 10,
        finishedAction: 'NO_ACTION',
      }
    case TIMELINE_ELEMENT_TYPES.HEADING:
      return {
        angle: 0,
        velocity: 10,
      }
    case TIMELINE_ELEMENT_TYPES.RECORD_VIDEO:
      return {}
    case TIMELINE_ELEMENT_TYPES.SHOOT_PHOTO:
      return {
        photoType: 'single',
        photoCount: 1,
        timeInterval: 5,
      }
  }
  return {}
}
