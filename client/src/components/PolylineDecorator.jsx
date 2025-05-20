import { useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet-polylinedecorator'

export default function PolylineDecorator({ positions, patterns }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !positions || positions.length < 2) return

    const decorator = L.polylineDecorator(positions, { patterns }).addTo(map)

    return () => {
      map.removeLayer(decorator)
    }
  }, [map, positions, patterns])

  return null
}
