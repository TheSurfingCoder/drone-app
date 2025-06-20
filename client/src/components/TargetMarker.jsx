import React from 'react'
import { Marker } from 'react-leaflet'
import L from 'leaflet'

export default function TargetMarker({ id, onDragEnd, position, onClick }) {
  const targetIcon = L.divIcon({
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `
      <div class="relative">
        <div class="bg-white text-red-500 rounded-full w-[20px] h-[20px] 
          flex items-center justify-center font-bold text-lg shadow-lg border-2 border-red-500 cursor-grab active:cursor-grabbing">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        </div>
      </div>
    `,
  })

  return (
    <Marker
      position={position}
      icon={targetIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target
          const { lat, lng } = marker.getLatLng()
          onDragEnd(id, lat, lng)
        },
        click: () => {
          if (onClick) onClick(id)
        },
      }}
    />
  )
}
