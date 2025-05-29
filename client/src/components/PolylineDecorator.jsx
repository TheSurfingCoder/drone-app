import { useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet-polylinedecorator'

export default function PolylineDecorator({ positions, segmentSpeeds, onSelectSegment, unitSystem, waypoints }) {
  const map = useMap()

  useEffect(() => {
    if (!map || positions.length < 2) return

    const layerGroup = L.layerGroup().addTo(map)

    for (let i = 0; i < positions.length - 1; i++) {
      const from = positions[i]
      const to = positions[i + 1]
      const speed = segmentSpeeds[i] ?? 10
      const displaySpeed = unitSystem === 'metric'
        ? `${speed.toFixed(1)} m/s`
        : `${(speed * 2.23694).toFixed(1)} mph`
      
      // Draw clickable segment
      const segment = L.polyline([from, to], {
        color: 'blue',
        weight: 4,
        interactive: true,
        bubblingMouseEvents: false,
      }).addTo(layerGroup)

      // Improve click experience
      segment.getElement?.()?.style?.setProperty('cursor', 'pointer')

      segment.on('click', (e) => {
        e.originalEvent.stopPropagation();
        const from = waypoints[i];
        const to = waypoints[i + 1];
        if (onSelectSegment && from && to) {
          onSelectSegment(from.id, to.id);
        }
      });
      

      // Midpoint label
      const midpoint = [
        (from[0] + to[0]) / 2,
        (from[1] + to[1]) / 2,
      ]

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
`

          ,
        }),
        interactive: true,
        bubblingMouseEvents: false,
      })

      marker.on('click', (e) => {
        e.originalEvent.stopPropagation();
        const from = waypoints[i];
        const to = waypoints[i + 1];
        if (onSelectSegment && from && to) {
          onSelectSegment(from.id, to.id);
        }
      });

      marker.addTo(layerGroup)
    }

    return () => {
      map.removeLayer(layerGroup)
    }
  }, [map, positions, segmentSpeeds, onSelectSegment])

  return null
}
