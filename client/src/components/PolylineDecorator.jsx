import { useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet-polylinedecorator'

export default function PolylineDecorator({ positions, segmentSpeeds, onSegmentClick }) {
  const map = useMap()

  
  
  

  useEffect(() => {
    if (!map || positions.length < 2) return

    const layerGroup = L.layerGroup().addTo(map)

    for (let i = 0; i < positions.length - 1; i++) {
      const from = positions[i]
      const to = positions[i + 1]
      const speed = segmentSpeeds[i] ?? 10 // fallback default

      // Draw clickable segment
      const segment = L.polyline([from, to], {
        color: 'blue',
        weight: 4,
      }).addTo(layerGroup)

      // Allow speed editing via click
      segment.on('click', () => {
        if (onSegmentClick) onSegmentClick(i)
      })

      // Midpoint label
      const midpoint = [
        (from[0] + to[0]) / 2,
        (from[1] + to[1]) / 2,
      ]

      L.marker(midpoint, {
        icon: L.divIcon({
          className: 'text-xs bg-white px-1 border border-gray-300 rounded',
          html: `${speed} m/s`,
        }),
        interactive: false,
      }).addTo(layerGroup)
    }

    return () => {
      map.removeLayer(layerGroup)
    }
  }, [map, positions, segmentSpeeds, onSegmentClick])

 

  return null
}
