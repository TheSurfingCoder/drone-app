import { useMap } from 'react-leaflet'
import { useEffect, useRef } from 'react'
import L from 'leaflet'

export default function RotatingDroneMarker({ position, heading, icon }) {
  const map = useMap()
  const markerRef = useRef()

  useEffect(() => {
    const correctedHeading = (heading + 360) % 360

    if (!markerRef.current) {
      markerRef.current = L.marker(position, {
        icon,
        rotationAngle: correctedHeading,
        rotationOrigin: 'center center',
      }).addTo(map)
    } else {
      markerRef.current.setLatLng(position)
      markerRef.current.setRotationAngle(heading - 90)
    }

    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current)
        markerRef.current = null
      }
    }
  }, [position, heading, icon, map])

  return null
}
