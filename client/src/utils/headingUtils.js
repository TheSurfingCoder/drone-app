export function calculateHeading(lat1, lng1, lat2, lng2) {
  const dLon = ((lng2 - lng1) * Math.PI) / 180
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180)
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon)
  const heading = (Math.atan2(y, x) * 180) / Math.PI
  return ((heading + 180) % 360) - 180
}

// Heading control enforcement and validation
export function getHeadingControlState({ headingMode, actions, poiTarget }) {
  // Check if any Rotate Aircraft actuator exists
  const hasRotateAircraft = actions.some((a) => a.actuatorType === 'rotateAircraft')

  // Check if POI is set (lat/lon or targetId)
  const poiSet = poiTarget && poiTarget.lat !== undefined && poiTarget.lng !== undefined

  // UI/UX enforcement rules
  if (headingMode === 'TOWARD_POINT_OF_INTEREST') {
    return {
      perWaypointHeadingEnabled: false,
      rotateAircraftEnabled: false,
      poiSelectorEnabled: true,
      warning: 'POI heading mode overrides any custom yaw controls.',
      poiRequired: !poiSet,
      poiRequiredWarning: !poiSet ? 'Please assign a valid target for POI tracking.' : null,
      rotateAircraftWarning: hasRotateAircraft
        ? 'Rotate Aircraft actuators are disabled in POI mode.'
        : null,
    }
  }
  if (headingMode === 'USING_WAYPOINT_HEADING') {
    return {
      perWaypointHeadingEnabled: true,
      rotateAircraftEnabled: true,
      poiSelectorEnabled: false,
      warning: hasRotateAircraft
        ? 'Rotate Aircraft actuator will override waypoint heading during its trigger.'
        : null,
      poiRequired: false,
      poiRequiredWarning: null,
      rotateAircraftWarning: hasRotateAircraft
        ? 'Rotate Aircraft actuator will override waypoint heading during its trigger.'
        : null,
    }
  }
  // AUTO, USING_INITIAL_DIRECTION, CONTROL_BY_REMOTE_CONTROLLER
  return {
    perWaypointHeadingEnabled: false,
    rotateAircraftEnabled: true,
    poiSelectorEnabled: false,
    warning: 'Yaw is managed globally. Use Rotate Aircraft actuators for manual yaw control.',
    poiRequired: false,
    poiRequiredWarning: null,
    rotateAircraftWarning: null,
  }
}
