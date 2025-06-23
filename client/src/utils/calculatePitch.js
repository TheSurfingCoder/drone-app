import { calculateDistance } from './distanceUtils'

export function calculatePitch(fromWaypoint, toWaypoint, targetWaypoint) {
  if (!fromWaypoint || !toWaypoint || !targetWaypoint) {
    return 0
  }

  // Calculate the distance to target
  const targetDistance = calculateDistance(fromWaypoint, targetWaypoint)

  // Calculate the height difference
  const heightDifference = targetWaypoint.height - fromWaypoint.height

  // Calculate pitch angle using arctangent
  const pitchRadians = Math.atan2(heightDifference, targetDistance)

  // Convert to degrees
  const pitchDegrees = pitchRadians * (180 / Math.PI)

  return pitchDegrees
}
