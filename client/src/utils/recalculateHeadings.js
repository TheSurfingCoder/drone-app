import { calculateHeading } from './headingUtils'
import { calculatePitch } from './calculatePitch'

/**
 * Enhanced heading calculation system for DJI Waypoint V2 compatibility
 * Supports global heading modes, POI tracking, actuator overrides, and interpolation
 */

// Mission timeline calculation utilities
function calculateMissionTimeline(waypoints, missionSettings) {
  const timeline = []
  let cumulativeDistance = 0
  let cumulativeTime = 0

  for (let i = 0; i < waypoints.length; i++) {
    const wp = waypoints[i]
    const next = waypoints[i + 1]

    if (next) {
      const distance = calculateDistance(wp, next)
      const speed = wp.speed || missionSettings.autoFlightSpeed
      const segmentTime = distance / speed

      timeline.push({
        waypointIndex: i,
        distance: cumulativeDistance,
        time: cumulativeTime,
        speed,
        segmentDistance: distance,
        segmentTime,
      })

      cumulativeDistance += distance
      cumulativeTime += segmentTime
    } else {
      // Last waypoint
      timeline.push({
        waypointIndex: i,
        distance: cumulativeDistance,
        time: cumulativeTime,
        speed: wp.speed || missionSettings.autoFlightSpeed,
        segmentDistance: 0,
        segmentTime: 0,
      })
    }
  }

  return timeline
}

function calculateDistance(wp1, wp2) {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (wp1.lat * Math.PI) / 180
  const φ2 = (wp2.lat * Math.PI) / 180
  const Δφ = ((wp2.lat - wp1.lat) * Math.PI) / 180
  const Δλ = ((wp2.lng - wp1.lng) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

// Actuator timing simulation
function isActuatorActiveAt(timestamp, action, timeline, missionSettings) {
  const missionDuration = timeline[timeline.length - 1]?.time || 0
  const missionProgress = (timestamp / missionDuration) * 100

  switch (action.triggerType) {
    case 'reachPoint': {
      const targetTime = timeline[action.waypointIndex]?.time || 0
      return Math.abs(timestamp - targetTime) < 0.1 // Within 100ms
    }

    case 'distanceToPoint': {
      const baseTime = timeline[action.waypointIndex]?.time || 0
      const speed = timeline[action.waypointIndex]?.speed || missionSettings.autoFlightSpeed
      const offsetTime = action.distanceOffset / speed
      const calculatedTargetTime = baseTime + offsetTime
      return Math.abs(timestamp - calculatedTargetTime) < 0.1
    }

    case 'timeBased':
      return timestamp >= action.timeMs / 1000 && timestamp < action.timeMs / 1000 + 1

    case 'trajectory':
      return Math.abs(missionProgress - action.missionPercent) < 1 // Within 1%

    default:
      return false
  }
}

function getActiveActuatorsAtTime(timestamp, actions, timeline, missionSettings) {
  return actions.filter((action) =>
    isActuatorActiveAt(timestamp, action, timeline, missionSettings),
  )
}

// Heading interpolation utilities
function interpolateHeading(startHeading, endHeading, progress, interpolationMode = 'linear') {
  if (interpolationMode === 'none') return endHeading

  // Handle 180°/-180° boundary crossing
  let diff = endHeading - startHeading
  if (diff > 180) diff -= 360
  if (diff < -180) diff += 360

  const interpolated = startHeading + diff * progress
  return ((interpolated + 180) % 360) - 180 // Normalize to -180 to 180
}

function getHeadingAtTime(timestamp, waypoints, actions, targets, missionSettings, timeline) {
  // Find current waypoint segment
  let currentSegment = 0
  for (let i = 0; i < timeline.length - 1; i++) {
    if (timestamp >= timeline[i].time && timestamp < timeline[i + 1].time) {
      currentSegment = i
      break
    }
  }

  // Get base heading for current waypoint
  const currentWaypoint = waypoints[currentSegment]
  let baseHeading = currentWaypoint.heading || 0

  // Check for active actuators
  const activeActuators = getActiveActuatorsAtTime(timestamp, actions, timeline, missionSettings)
  const rotateAircraftActuator = activeActuators.find((a) => a.actuatorType === 'rotateAircraft')

  if (rotateAircraftActuator) {
    // Actuator override is active
    const actuatorStartTime = getActuatorStartTime(
      rotateAircraftActuator,
      timeline,
      missionSettings,
    )
    const actuatorProgress = Math.min(1, (timestamp - actuatorStartTime) / 1) // Assume 1 second duration

    if (rotateAircraftActuator.interpolationMode === 'linear') {
      baseHeading = interpolateHeading(
        baseHeading,
        rotateAircraftActuator.yaw,
        actuatorProgress,
        'linear',
      )
    } else {
      baseHeading = rotateAircraftActuator.yaw
    }
  }

  return baseHeading
}

function getActuatorStartTime(action, timeline, missionSettings) {
  switch (action.triggerType) {
    case 'reachPoint':
      return timeline[action.waypointIndex]?.time || 0
    case 'distanceToPoint': {
      const baseTime = timeline[action.waypointIndex]?.time || 0
      const speed = timeline[action.waypointIndex]?.speed || missionSettings.autoFlightSpeed
      return baseTime + action.distanceOffset / speed
    }
    case 'timeBased':
      return action.timeMs / 1000
    case 'trajectory': {
      const missionDuration = timeline[timeline.length - 1]?.time || 0
      return (action.missionPercent / 100) * missionDuration
    }
    default:
      return 0
  }
}

// Main recalculateHeadings function
export function recalculateHeadings(waypoints, targets, missionSettings = {}, actions = []) {
  if (!waypoints || waypoints.length === 0) {
    return {
      waypoints: [],
      timeline: [],
      getHeadingAtTime: () => 0,
      getActiveActuatorsAtTime: () => [],
      getMissionProgressAtTime: () => 0,
    }
  }

  // Calculate mission timeline
  const timeline = calculateMissionTimeline(waypoints, missionSettings)

  // Process waypoints based on heading mode
  const processedWaypoints = waypoints.map((wp, i, arr) => {
    let heading = null
    let pitch = 0
    let headingSource = 'calculated'
    let actuatorOverrides = []

    // Check for actuator overrides at this waypoint
    const waypointActuators = actions.filter(
      (action) => action.triggerType === 'reachPoint' && action.waypointIndex === i,
    )

    if (waypointActuators.length > 0) {
      actuatorOverrides = waypointActuators.map((action) => ({
        type: action.actuatorType,
        value: action.actuatorType === 'rotateAircraft' ? action.yaw : action.pitch,
        interpolationMode: action.interpolationMode,
      }))
    }

    // Calculate base heading based on heading mode
    switch (missionSettings.headingMode) {
      case 'TOWARD_POINT_OF_INTEREST': {
        if (wp.focusTargetId) {
          const target = targets.find((t) => t.id === wp.focusTargetId)
          if (target) {
            heading = calculateHeading(wp.lat, wp.lng, target.lat, target.lng)
            pitch = calculatePitch(wp, target)
            headingSource = 'poi'
          }
        } else {
          // Fallback to next waypoint
          const next = arr[i + 1]
          if (next) {
            heading = calculateHeading(wp.lat, wp.lng, next.lat, next.lng)
            pitch = calculatePitch(wp, next)
            headingSource = 'fallback'
          }
        }
        break
      }
      case 'USING_WAYPOINT_HEADING': {
        if (wp.waypointHeading !== undefined && wp.waypointHeading !== null) {
          heading = wp.waypointHeading
          headingSource = 'waypoint_specific'
        } else {
          // Fallback to next waypoint
          const next = arr[i + 1]
          if (next) {
            heading = calculateHeading(wp.lat, wp.lng, next.lat, next.lng)
            pitch = calculatePitch(wp, next)
            headingSource = 'fallback'
          }
        }
        break
      }
      case 'USING_INITIAL_DIRECTION': {
        if (i === 0) {
          // First waypoint - calculate to next waypoint
          const next = arr[i + 1]
          if (next) {
            heading = calculateHeading(wp.lat, wp.lng, next.lat, next.lng)
            pitch = calculatePitch(wp, next)
            headingSource = 'initial'
          }
        } else {
          // Use initial heading for all waypoints
          const firstWaypoint = arr[0]
          const secondWaypoint = arr[1]
          if (firstWaypoint && secondWaypoint) {
            heading = calculateHeading(
              firstWaypoint.lat,
              firstWaypoint.lng,
              secondWaypoint.lat,
              secondWaypoint.lng,
            )
            headingSource = 'initial_direction'
          }
        }
        break
      }
      case 'CONTROL_BY_REMOTE_CONTROLLER': {
        heading = 0 // Neutral position
        headingSource = 'remote_control'
        break
      }
      case 'AUTO':
      default: {
        // Face next waypoint
        const next = arr[i + 1]
        if (next) {
          heading = calculateHeading(wp.lat, wp.lng, next.lat, next.lng)
          pitch = calculatePitch(wp, next)
          headingSource = 'auto'
        }
        break
      }
    }

    return {
      ...wp,
      heading,
      pitch,
      headingSource,
      actuatorOverrides,
      waypointIndex: i,
    }
  })

  // Return enhanced result with timeline and utility functions
  return {
    waypoints: processedWaypoints,
    timeline,
    getHeadingAtTime: (timestamp) =>
      getHeadingAtTime(timestamp, processedWaypoints, actions, targets, missionSettings, timeline),
    getActiveActuatorsAtTime: (timestamp) =>
      getActiveActuatorsAtTime(timestamp, actions, timeline, missionSettings),
    getMissionProgressAtTime: (timestamp) => {
      const missionDuration = timeline[timeline.length - 1]?.time || 0
      return missionDuration > 0 ? (timestamp / missionDuration) * 100 : 0
    },
    getWaypointAtTime: (timestamp) => {
      for (let i = 0; i < timeline.length - 1; i++) {
        if (timestamp >= timeline[i].time && timestamp < timeline[i + 1].time) {
          return {
            waypoint: processedWaypoints[i],
            segment: i,
            progress: (timestamp - timeline[i].time) / timeline[i].segmentTime,
          }
        }
      }
      return {
        waypoint: processedWaypoints[processedWaypoints.length - 1],
        segment: timeline.length - 1,
        progress: 1,
      }
    },
  }
}

// Legacy compatibility function
export function recalculateHeadingsLegacy(waypoints, targets) {
  const result = recalculateHeadings(waypoints, targets, { headingMode: 'AUTO' })
  return result.waypoints
}
