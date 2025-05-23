import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

export default function WaypointMarker({ lat, lng, alt, index, unitSystem, onDragEnd, heading }) {
  const altitude = alt ?? 0
  const formattedAlt =
    unitSystem === 'metric'
      ? `${altitude.toFixed(1)} m`
      : `${(altitude * 3.28084).toFixed(1)} ft`

      const icon = L.divIcon({
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        html: renderToStaticMarkup(
          <div className="relative w-10 h-10">
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2"
              style={{ transform: `rotate(${heading ?? 0}deg)` }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
                <path d="M12 2 L15 8 H9 L12 2 Z" />
              </svg>
            </div>
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
              {index + 1}
            </div>
          </div>
        ),
      })
      

  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target
          const { lat, lng } = marker.getLatLng()
          onDragEnd(lat, lng)
        },
      }}
    >
      <Popup>
        <div>
          <strong>Waypoint {index + 1}</strong>
          <div>{`lat: ${lat}`}</div>
          <div>{`lng: ${lng}`}</div>
          <br />
          Alt: {formattedAlt}
        </div>
      </Popup>
    </Marker>
  )
}
