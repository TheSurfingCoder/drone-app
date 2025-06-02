export function moveToward({ droneLatLng, targetLatLng, speed, deltaTime }) {
  const { lat: lat1, lng: lng1 } = droneLatLng
  const { lat: lat2, lng: lng2 } = targetLatLng

  const dx = lat2 - lat1
  const dy = lng2 - lng1
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance === 0) return droneLatLng

  const step = (speed / 111139) * deltaTime
  if (step >= distance) return targetLatLng

  const ratio = step / distance
  return {
    lat: lat1 + dx * ratio,
    lng: lng1 + dy * ratio,
  }
}
