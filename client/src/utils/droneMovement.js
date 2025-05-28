export function moveToward({ droneLatLng, targetLatLng, speed, deltaTime }) {
  const [lat1, lng1] = droneLatLng
  const [lat2, lng2] = targetLatLng

  const dx = lat2 - lat1
  const dy = lng2 - lng1
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance === 0) return droneLatLng

  // Distance = speed × time
  const step = (speed / 111139) * deltaTime // Convert meters/sec into degrees/sec

  if (step >= distance) return targetLatLng

  const ratio = step / distance
  return [
    lat1 + dx * ratio,
    lng1 + dy * ratio,
  ]
}
