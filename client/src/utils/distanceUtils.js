import {lineString, length} from '@turf/turf'


//lineString takes an array of positions and draws lines between them
//length calculates distance of the linestring features in kilometeres
//we're going to pass the waypoints from map.jsx
/*turf uses GeoJSON for all geo data and expects data to be stored in WGS84 long, lat coords
  -to use lineString the only requirement is to have an array of arrays of coordinates
*/
export function calculateDistance(waypoints){

    if(waypoints.length < 2) return 0;

    const coords = waypoints.map(wp => [wp.lng, wp.lat]); //we are creating an array, coords, from our waypoints array
    const line = lineString(coords); //returns Feature<LineString, GeoJsonProperties> LineString Feature
    const distInKm = length(line);  //returns number length of GeoJSON
    return distInKm;

}

export function estimateDuration(waypoints, segmentSpeeds) {
  if (waypoints.length < 2 || segmentSpeeds.length < 1) return 0;

  let totalSeconds = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    const speed = segmentSpeeds[i] ?? 5; // fallback to 5 m/s if undefined

    const dx = to.lng - from.lng;
    const dy = to.lat - from.lat;
    const distanceDegrees = Math.sqrt(dx * dx + dy * dy);
    const metersPerDegree = 111_139; // avg Earth conversion

    const meters = distanceDegrees * metersPerDegree;
    totalSeconds += meters / speed;
  }

  return totalSeconds;
}