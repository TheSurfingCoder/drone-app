//lineString takes an array of positions and draws lines between them
//length calculates distance of the linestring features in kilometeres
//we're going to pass the waypoints from map.jsx
/*turf uses GeoJSON for all geo data and expects data to be stored in WGS84 long, lat coords
  -to use lineString the only requirement is to have an array of arrays of coordinates
*/
export function calculateDistance(waypoints) {
  if (waypoints.length < 2) return 0

  let totalDistance = 0
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i]
    const to = waypoints[i + 1]

    const dx = to.lng - from.lng
    const dy = to.lat - from.lat
    const distanceDegrees = Math.sqrt(dx * dx + dy * dy)
    const metersPerDegree = 111_139 // avg Earth conversion

    const meters = distanceDegrees * metersPerDegree
    totalDistance += meters
  }

  return totalDistance / 1000 // Convert to kilometers
}

export function estimateDuration(waypoints) {
  if (waypoints.length < 2) return 0

  let totalSeconds = 0
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i]
    const to = waypoints[i + 1]
    const speed = from.speed ?? 10 // Use waypoint speed, fallback to 10 m/s

    const dx = to.lng - from.lng
    const dy = to.lat - from.lat
    const distanceDegrees = Math.sqrt(dx * dx + dy * dy)
    const metersPerDegree = 111_139 // avg Earth conversion

    const meters = distanceDegrees * metersPerDegree
    totalSeconds += meters / speed
  }

  return totalSeconds
}
