import L from "leaflet";
import 'leaflet-geometryutil' 


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
  




/**
 * Generates interpolated lat/lng points forming a curved path between two waypoints.
 * @param {Object} from - Starting waypoint with lat/lng.
 * @param {Object} to - Ending waypoint with lat/lng.
 * @param {number} tightness - Radius of curve (in meters). Higher = gentler curve.
 * @param {number} numPoints - Number of intermediate points to generate.
 * @returns {Array} Array of [lat, lng] pairs.
 */

/**
 * Generates a curved arc between two lat/lng points, bowing outward.
 * @param {Object} from - Start point ({ lat, lng })
 * @param {Object} to - End point ({ lat, lng })
 * @param {number} maxOffsetMeters - Max lateral deviation (curve tightness)
 * @param {Object} map - Leaflet map instance (for zoom)
 * @returns {Array} Array of lat/lng points forming the curve
 */


/**
 * Generates a single smooth curved arc from A to B.
 */
export function generateCurvePoints(from, to, maxOffsetMeters = 15, map) {
    if (!L || !L.latLng || !L.GeometryUtil?.interpolateOnLine || !L.GeometryUtil?.destination) {
      throw new Error("Leaflet GeometryUtil or LatLng not available")
    }
  
    const zoom = map?.getZoom?.() ?? 18
    const resolution = Math.max(10, Math.round(zoom * 2 + 10)) // Adaptive resolution
  
    const fromLatLng = L.latLng(from.lat, from.lng)
    const toLatLng = L.latLng(to.lat, to.lng)
    const line = [fromLatLng, toLatLng]
  
    const curvedPoints = []
  
    // Calculate the base heading (in degrees)
    const baseAngle = getAngleBetweenPoints(from, to)
  
    for (let i = 0; i <= resolution; i++) {
      const t = i / resolution
      const interpolated = L.GeometryUtil.interpolateOnLine(map, line, t)
      if (!interpolated?.latLng) continue
  
      // Perpendicular angle (always to same side)
      const perpendicularAngle = (baseAngle + 90) % 360
  
      // Offset magnitude (sine curve)
      const offset = maxOffsetMeters * Math.sin(t * Math.PI)
  
      const offsetLatLng = L.GeometryUtil.destination(interpolated.latLng, perpendicularAngle, offset)
      curvedPoints.push({ lat: offsetLatLng.lat, lng: offsetLatLng.lng })
    }
  
    console.log("🌀 Fixed curve generated", {
      from,
      to,
      maxOffsetMeters,
      resolution,
      curvedPoints
    })
  
    return curvedPoints
  }
  
  
  
  
  

  /**
 * Calculates the angle (in degrees) between two lat/lng points.
 * @param {Object} from - Point A with lat/lng.
 * @param {Object} to - Point B with lat/lng.
 * @returns {number} Angle in degrees from A to B.
 */
export function getAngleBetweenPoints(from, to) {
    const lat1 = from.lat * Math.PI / 180;
    const lat2 = to.lat * Math.PI / 180;
    const deltaLng = (to.lng - from.lng) * Math.PI / 180;
  
    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
  
    const angleRad = Math.atan2(y, x);
    const angleDeg = (angleRad * 180) / Math.PI;
    return (angleDeg + 360) % 360; // Normalize to 0–360
  }
  