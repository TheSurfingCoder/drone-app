//this utility will be used in metrics panel to help download a GeoJSON file

import { lineString } from '@turf/turf'

export function downloadGeoJSON(waypoints, filename = 'flight-path.geojson') {
  if (waypoints.length < 2) return

  const coords = waypoints.map((wp) => [wp.lng, wp.lat]) // GeoJSON = [lng, lat]
  const geojson = lineString(coords, { name: 'Drone Flight Path' })

  const blob = new Blob([JSON.stringify(geojson, null, 2)], {
    type: 'application/json',
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
