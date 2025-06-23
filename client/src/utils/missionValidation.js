// Mission validation utilities for DJI Waypoint V2 compatibility

/**
 * Validates POI (Point of Interest) requirements for mission
 * @param {Object} missionSettings - Global mission settings
 * @param {Array} targets - Array of available targets
 * @param {Array} waypoints - Array of waypoints
 * @returns {Object} Validation result with errors and warnings
 */
export function validatePOIRequirements(missionSettings, targets, waypoints) {
  const errors = []
  const warnings = []

  // Check if POI mode is selected
  if (missionSettings.headingMode === 'TOWARD_POINT_OF_INTEREST') {
    // Check if any waypoints have focusTargetId assigned
    const waypointsWithPOI = waypoints.filter(
      (wp) => wp.focusTargetId !== null && wp.focusTargetId !== undefined,
    )

    if (waypointsWithPOI.length === 0) {
      errors.push('POI heading mode requires at least one waypoint to be assigned a target')
    }

    // Check if assigned targets exist
    const assignedTargetIds = [...new Set(waypointsWithPOI.map((wp) => wp.focusTargetId))]
    const existingTargetIds = targets.map((t) => t.id)

    const invalidTargetIds = assignedTargetIds.filter((id) => !existingTargetIds.includes(id))
    if (invalidTargetIds.length > 0) {
      errors.push(`Waypoints reference non-existent targets: ${invalidTargetIds.join(', ')}`)
    }

    // Check if targets array is empty
    if (targets.length === 0) {
      errors.push('No targets available for POI mode. Please add targets first.')
    }
  }

  return { errors, warnings }
}

/**
 * Detects actuator conflicts in mission actions
 * @param {Array} actions - Array of actions from all waypoints
 * @param {Array} waypoints - Array of waypoints
 * @returns {Object} Conflict detection result with errors and warnings
 */
export function detectActuatorConflicts(actions, waypoints) {
  const errors = []
  const warnings = []

  if (!actions || actions.length === 0) {
    return { errors, warnings }
  }

  // Group actions by trigger type and parameters
  const actionGroups = new Map()

  actions.forEach((action) => {
    const key = getActionTriggerKey(action)
    if (!actionGroups.has(key)) {
      actionGroups.set(key, [])
    }
    actionGroups.get(key).push(action)
  })

  // Check for conflicts within each group
  actionGroups.forEach((groupActions, key) => {
    if (groupActions.length > 1) {
      const conflicts = analyzeGroupConflicts(groupActions)
      errors.push(...conflicts.errors)
      warnings.push(...conflicts.warnings)
    }
  })

  // Check for simultaneous yaw/pitch actuator conflicts
  const yawPitchConflicts = detectYawPitchConflicts(actions)
  errors.push(...yawPitchConflicts.errors)
  warnings.push(...yawPitchConflicts.warnings)

  // Check for redundant actuator angles
  const redundantConflicts = detectRedundantActuatorAngles(actions)
  warnings.push(...redundantConflicts.warnings)

  return { errors, warnings }
}

/**
 * Gets a unique key for grouping actions by trigger
 * @param {Object} action - Action object
 * @returns {String} Unique trigger key
 */
function getActionTriggerKey(action) {
  switch (action.triggerType) {
    case 'reachPoint':
      return `reachPoint_${action.waypointIndex}`
    case 'distanceToPoint':
      return `distanceToPoint_${action.waypointIndex}_${action.distanceOffset}`
    case 'timeBased':
      return `timeBased_${Math.floor(action.timeMs / 1000)}` // Group by second
    case 'trajectory':
      return `trajectory_${Math.floor(action.missionPercent / 10)}` // Group by 10% intervals
    default:
      return `unknown_${action.triggerType}`
  }
}

/**
 * Analyzes conflicts within a group of actions triggered at the same time
 * @param {Array} groupActions - Actions triggered at the same time
 * @returns {Object} Conflict analysis result
 */
function analyzeGroupConflicts(groupActions) {
  const errors = []
  const warnings = []

  // Check for duplicate actuator types
  const actuatorTypes = groupActions.map((a) => a.actuatorType)
  const duplicateTypes = actuatorTypes.filter(
    (type, index) => actuatorTypes.indexOf(type) !== index,
  )

  if (duplicateTypes.length > 0) {
    const uniqueDuplicates = [...new Set(duplicateTypes)]
    errors.push(`Multiple ${uniqueDuplicates.join(', ')} actuators triggered simultaneously`)
  }

  // Check for conflicting recording actions
  const hasStartRecording = groupActions.some((a) => a.actuatorType === 'startRecording')
  const hasStopRecording = groupActions.some((a) => a.actuatorType === 'stopRecording')

  if (hasStartRecording && hasStopRecording) {
    errors.push('Start and stop recording actions triggered simultaneously')
  }

  // Check for conflicting focus/zoom actions
  const hasFocus = groupActions.some((a) => a.actuatorType === 'focus')
  const hasZoom = groupActions.some((a) => a.actuatorType === 'zoom')

  if (hasFocus && hasZoom) {
    warnings.push('Focus and zoom adjustments triggered simultaneously - may cause conflicts')
  }

  return { errors, warnings }
}

/**
 * Detects conflicts between yaw and pitch actuators
 * @param {Array} actions - All actions
 * @returns {Object} Yaw/pitch conflict analysis
 */
function detectYawPitchConflicts(actions) {
  const errors = []
  const warnings = []

  // Group actions by trigger time
  const timeGroups = new Map()

  actions.forEach((action) => {
    const timeKey = getActionTimeKey(action)
    if (!timeGroups.has(timeKey)) {
      timeGroups.set(timeKey, [])
    }
    timeGroups.get(timeKey).push(action)
  })

  timeGroups.forEach((groupActions, timeKey) => {
    const hasRotateAircraft = groupActions.some((a) => a.actuatorType === 'rotateAircraft')
    const hasRotateGimbal = groupActions.some((a) => a.actuatorType === 'rotateGimbal')

    if (hasRotateAircraft && hasRotateGimbal) {
      // Check if they have conflicting interpolation modes
      const aircraftAction = groupActions.find((a) => a.actuatorType === 'rotateAircraft')
      const gimbalAction = groupActions.find((a) => a.actuatorType === 'rotateGimbal')

      if (aircraftAction.interpolationMode !== gimbalAction.interpolationMode) {
        warnings.push(
          `Different interpolation modes for aircraft and gimbal rotation at ${timeKey}`,
        )
      }
    }
  })

  return { errors, warnings }
}

/**
 * Detects redundant actuator angles (same angle set multiple times)
 * @param {Array} actions - All actions
 * @returns {Object} Redundant angle analysis
 */
function detectRedundantActuatorAngles(actions) {
  const warnings = []

  // Group by actuator type and angle
  const angleGroups = new Map()

  actions.forEach((action) => {
    if (action.actuatorType === 'rotateAircraft' || action.actuatorType === 'rotateGimbal') {
      const key = `${action.actuatorType}_${action.actuatorType === 'rotateAircraft' ? action.yaw : action.pitch}`
      if (!angleGroups.has(key)) {
        angleGroups.set(key, [])
      }
      angleGroups.get(key).push(action)
    }
  })

  angleGroups.forEach((groupActions, key) => {
    if (groupActions.length > 1) {
      const actuatorType = key.split('_')[0]
      const angle = key.split('_')[1]
      warnings.push(`Multiple ${actuatorType} actions set to same angle (${angle}°)`)
    }
  })

  return { warnings }
}

/**
 * Gets a time-based key for grouping actions
 * @param {Object} action - Action object
 * @returns {String} Time-based key
 */
function getActionTimeKey(action) {
  switch (action.triggerType) {
    case 'reachPoint':
      return `waypoint_${action.waypointIndex}`
    case 'distanceToPoint':
      return `waypoint_${action.waypointIndex}_offset_${action.distanceOffset}`
    case 'timeBased':
      return `time_${Math.floor(action.timeMs / 1000)}s`
    case 'trajectory':
      return `progress_${Math.floor(action.missionPercent / 10)}0%`
    default:
      return 'unknown'
  }
}

/**
 * Validates mission upload readiness
 * @param {Object} missionSettings - Global mission settings
 * @param {Array} targets - Array of targets
 * @param {Array} waypoints - Array of waypoints
 * @param {Array} actions - Array of actions
 * @returns {Object} Complete validation result
 */
export function validateMissionUpload(missionSettings, targets, waypoints, actions) {
  const poiValidation = validatePOIRequirements(missionSettings, targets, waypoints)
  const conflictDetection = detectActuatorConflicts(actions, waypoints)
  const cornerRadiusValidation = validateCornerRadiusConstraints(waypoints, missionSettings)

  // Additional mission-level validations
  const errors = [
    ...poiValidation.errors,
    ...conflictDetection.errors,
    ...cornerRadiusValidation.errors,
  ]
  const warnings = [
    ...poiValidation.warnings,
    ...conflictDetection.warnings,
    ...cornerRadiusValidation.warnings,
  ]

  // Check minimum waypoints
  if (waypoints.length < 2) {
    errors.push('Mission requires at least 2 waypoints')
  }

  // Check waypoint spacing (minimum 0.5m apart)
  for (let i = 0; i < waypoints.length - 1; i++) {
    const distance = calculateDistance([waypoints[i], waypoints[i + 1]])
    if (distance < 0.5) {
      warnings.push(`Waypoints ${i + 1} and ${i + 2} are very close (${distance.toFixed(2)}m)`)
    }
  }

  // Check for valid mission settings
  if (missionSettings.autoFlightSpeed <= 0) {
    errors.push('Auto flight speed must be greater than 0')
  }

  if (missionSettings.maxFlightSpeed <= 0) {
    errors.push('Max flight speed must be greater than 0')
  }

  if (missionSettings.autoFlightSpeed > missionSettings.maxFlightSpeed) {
    errors.push('Auto flight speed cannot exceed max flight speed')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    canUpload: errors.length === 0,
    requiresAttention: warnings.length > 0,
  }
}

/**
 * Calculates distance between two waypoints
 * @param {Array} waypoints - Array of two waypoints
 * @returns {Number} Distance in meters
 */
function calculateDistance(waypoints) {
  if (waypoints.length < 2) return 0

  const [wp1, wp2] = waypoints
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

/**
 * Validates corner radius constraints for DJI Waypoint Mission V2
 * @param {Array} waypoints - Array of waypoints
 * @param {Object} missionSettings - Global mission settings
 * @returns {Object} Validation result with errors and warnings
 */
export function validateCornerRadiusConstraints(waypoints, missionSettings) {
  const errors = []
  const warnings = []

  // Only validate if flight path mode is CURVED
  if (missionSettings.flightPathMode !== 'CURVED') {
    return { errors, warnings }
  }

  for (let i = 0; i < waypoints.length - 1; i++) {
    const wpA = waypoints[i]
    const wpB = waypoints[i + 1]

    // Skip validation for first and last waypoints (cornerRadius is ignored)
    if (i === 0 || i === waypoints.length - 2) {
      continue
    }

    const cornerRadiusA = wpA.cornerRadius ?? 0.2
    const cornerRadiusB = wpB.cornerRadius ?? 0.2
    const distance = calculateDistance([wpA, wpB])

    // Check constraint: |Ra| + |Rb| < distance between A and B
    // Use absolute values since negative curvature is valid
    if (Math.abs(cornerRadiusA) + Math.abs(cornerRadiusB) >= distance) {
      errors.push(
        `Waypoints ${i + 1} and ${i + 2}: Corner radius constraint violated. ` +
          `Sum of absolute corner radii (${(Math.abs(cornerRadiusA) + Math.abs(cornerRadiusB)).toFixed(1)}m) must be less than ` +
          `distance between waypoints (${distance.toFixed(1)}m). ` +
          `Consider reducing corner radius values or increasing waypoint spacing.`,
      )
    }

    // Check minimum corner radius (0.2m per DJI SDK) - use absolute value
    if (Math.abs(cornerRadiusA) < 0.2) {
      warnings.push(
        `Waypoint ${i + 1}: Corner radius (${cornerRadiusA.toFixed(1)}m) is below DJI SDK minimum of 0.2m`,
      )
    }
    if (Math.abs(cornerRadiusB) < 0.2) {
      warnings.push(
        `Waypoint ${i + 2}: Corner radius (${cornerRadiusB.toFixed(1)}m) is below DJI SDK minimum of 0.2m`,
      )
    }

    // Check maximum corner radius (100m per DJI SDK) - use absolute value
    if (Math.abs(cornerRadiusA) > 100) {
      errors.push(
        `Waypoint ${i + 1}: Corner radius (${cornerRadiusA.toFixed(1)}m) exceeds DJI SDK maximum of 100m`,
      )
    }
    if (Math.abs(cornerRadiusB) > 100) {
      errors.push(
        `Waypoint ${i + 2}: Corner radius (${cornerRadiusB.toFixed(1)}m) exceeds DJI SDK maximum of 100m`,
      )
    }

    // Check minimum negative corner radius (-50m limit)
    if (cornerRadiusA < -50) {
      errors.push(
        `Waypoint ${i + 1}: Corner radius (${cornerRadiusA.toFixed(1)}m) is below minimum of -50m`,
      )
    }
    if (cornerRadiusB < -50) {
      errors.push(
        `Waypoint ${i + 2}: Corner radius (${cornerRadiusB.toFixed(1)}m) is below minimum of -50m`,
      )
    }
  }

  return { errors, warnings }
}
