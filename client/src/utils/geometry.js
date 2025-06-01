export function getTangentAngle(from, to, curveRadiusMeters = 30) {
    if (!from || !to || !from.lat || !from.lng || !to.lat || !to.lng) {
      throw new Error("Invalid coordinates passed to getTangentAngle");
    }
  
    // Convert lat/lng to approximate planar coordinates (meters)
    const lat1 = from.lat;
    const lng1 = from.lng;
    const lat2 = to.lat;
    const lng2 = to.lng;
  
    const dx = (lng2 - lng1) * Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180));
    const dy = (lat2 - lat1);
  
    // Normalize vector to curve radius
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    if (magnitude === 0) return 0;
  
    const ux = dx / magnitude;
    const uy = dy / magnitude;
  
    // Scaled tangent vector
    const tx = ux * curveRadiusMeters;
    const ty = uy * curveRadiusMeters;
  
    // Tangent angle
    const angle = Math.atan2(ty, tx) * (180 / Math.PI);
    return angle;
  }
  

  export function getBezierCurvePoints(from, to, curveTightness = 15, numPoints = 20) {
    if (!from || !to) return []
  
    const controlLat = (from.lat + to.lat) / 2
    const controlLng = (from.lng + to.lng) / 2
  
    const dx = to.lng - from.lng
    const dy = to.lat - from.lat
    const len = Math.sqrt(dx * dx + dy * dy)
  
    // Move control point perpendicular to path by curveTightness meters
    const offsetLng = -dy / len * (curveTightness / 111320)
    const offsetLat = dx / len * (curveTightness / 110540)
  
    const control = {
      lat: controlLat + offsetLat,
      lng: controlLng + offsetLng
    }
  
    const points = []
    for (let t = 0; t <= 1; t += 1 / numPoints) {
      const lat = (1 - t) ** 2 * from.lat + 2 * (1 - t) * t * control.lat + t ** 2 * to.lat
      const lng = (1 - t) ** 2 * from.lng + 2 * (1 - t) * t * control.lng + t ** 2 * to.lng
      points.push({ lat, lng })
    }
  
    return points
  }
  