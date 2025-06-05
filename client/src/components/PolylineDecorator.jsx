import { useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet-polylinedecorator'
import 'leaflet-geometryutil'

export default function PolylineDecorator({
  segmentLatLngs,
  segmentSpeeds,
  onSelectSegment,
  unitSystem,
  waypoints,
}) {
  const map = useMap()

  useEffect(() => {
    if (!map || segmentLatLngs.length === 0) return

    const layerGroup = L.layerGroup().addTo(map)

    segmentLatLngs.forEach((latlngs, i) => {
      if (!latlngs || latlngs.length < 2) return

      const speed = segmentSpeeds?.[i]?.speed ?? 10
      const displaySpeed =
        unitSystem === 'metric' ? `${speed.toFixed(1)} m/s` : `${(speed * 2.23694).toFixed(1)} mph`

      const segment = L.polyline(latlngs, {
        color: 'transparent',
        weight: 10,
        interactive: true,
        bubblingMouseEvents: false,
      }).addTo(layerGroup)

      segment.getElement?.()?.style?.setProperty('cursor', 'pointer')

      segment.on('click', (e) => {
        e.originalEvent.stopPropagation()
        const fromWp = waypoints[i]
        const toWp = waypoints[i + 1]
        if (onSelectSegment && fromWp && toWp) {
          onSelectSegment(fromWp.id, toWp.id)
        }
      })

      let midpoint
      if (latlngs.length === 2 && L.GeometryUtil) {
        const interpolated = L.GeometryUtil.interpolateOnLine(map, latlngs, 0.5)
        midpoint = interpolated?.latLng
      } else {
        const midIndex = Math.floor(latlngs.length / 2)
        midpoint = latlngs[midIndex]
      }

      const marker = L.marker(midpoint, {
        icon: L.divIcon({
          className: '',
          html: `
  <div style="
    display: inline-block;
    font-size: 12px;
    background-color: white;
    padding: 4px 6px;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    color: #1e3a8a;
    font-weight: 600;
    font-family: sans-serif;
    cursor: pointer;
    pointer-events: auto;
    user-select: none;
    white-space: nowrap;
  ">
    ${displaySpeed}
  </div>
        `,
        }),
        interactive: true,
        bubblingMouseEvents: false,
      })

      marker.on('click', (e) => {
        e.originalEvent.stopPropagation()
        const fromWp = waypoints[i]
        const toWp = waypoints[i + 1]
        if (onSelectSegment && fromWp && toWp) {
          onSelectSegment(fromWp.id, toWp.id)
        }
      })

      marker.addTo(layerGroup)
    })

    return () => {
      map.removeLayer(layerGroup)
    }
  }, [map, segmentLatLngs, segmentSpeeds, onSelectSegment, unitSystem, waypoints])

  return null
}
