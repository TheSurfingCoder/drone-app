import { useMapEvents, Polyline } from 'react-leaflet'
import WaypointMarker from './WaypointMarker.jsx'
import { getCesiumAltitude } from '../utils/getCesiumAltitude'
import React from 'react'
import TargetMarker from './TargetMarker.jsx'
import 'leaflet-polylinedecorator'
import PolylineDecorator from './PolylineDecorator'

export default function WaypointManager({
  waypoints,
  setWaypoints,
  unitSystem,
  terrainProvider,
  targets,
  setTargets,
  mapMode,
  setShowTargetModal,
  setTargetPendingFocus,
}) {
  useMapEvents({
    click: async (e) => {
      console.log("📍 Map clicked in mode:", mapMode) 
      const { lat, lng } = e.latlng
      let groundHeight = 0
      let height = 0
      let groundPosition = 0
      let elevatedPosition = 0

      if (terrainProvider) {
        try {
          groundHeight = await getCesiumAltitude(terrainProvider, lat, lng)
        } catch (err) {
          console.warn('Failed to get terrain height, defaulting to 0', err)
        }
      }

      const newPoint = {
        id: Date.now(), // ensures uniqueness
        lat,
        lng,
        height,
        groundHeight,
        groundPosition,
        elevatedPosition,
        heading: null,
        focusTargetId: null,
      }

      if (mapMode === 'waypoint') {
        setWaypoints((prev) => [...prev, newPoint])
      } else if (mapMode === 'target') {
        console.log("🛠 Target mode: opening modal")

        setTargetPendingFocus(newPoint)         // ⬅️ trigger modal
        setShowTargetModal(true)
      }

      console.log('waypoints', waypoints)
    },
  })

  return (
    <>
      {waypoints.map((wp, i) => (
        <WaypointMarker
          key={wp.id || i}
          lat={wp.lat}
          lng={wp.lng}
          alt={wp.groundHeight}
          height={wp.height}
          groundPosition={wp.groundPosition}
          elevatedPosition={wp.elevatedPosition}
          index={i}
          unitSystem={unitSystem}
          heading={wp.heading} // ⬅️ pass heading to show arrow
          onDragEnd={async (newLat, newLng) => {
            let groundHeight = 0
            if (terrainProvider) {
              try {
                groundHeight = await getCesiumAltitude(terrainProvider, newLat, newLng)
              } catch (err) {
                console.warn('Failed to fetch terrain height on drag:', err)
              }
            }

            setWaypoints((prev) => {
              const updated = [...prev]
              updated[i] = {
                ...updated[i],
                lat: newLat,
                lng: newLng,
                groundHeight,
                elevatedPosition: 0,
                groundPosition: 0,
                height: groundHeight,
              }
              return updated
            })
          }}
        />
      ))}

      {waypoints.length > 1 && (
        <>
          <Polyline
            positions={waypoints.map((wp) => [wp.lat, wp.lng])}
            pathOptions={{ color: 'blue', weight: 3 }}
          />
          <PolylineDecorator
            positions={waypoints.map((wp) => [wp.lat, wp.lng])}
            patterns={[
              {
                offset: '5%',
                repeat: '20%',
                symbol: L.Symbol.arrowHead({
                  pixelSize: 8,
                  polygon: false,
                  pathOptions: { stroke: true, color: '#1e40af' },
                }),
              },
            ]}
          />
        </>
      )}

      {targets.map((target, i) => (
        <TargetMarker
          key={target.id || i}
          position={[target.lat, target.lng]}
          id={i}
          onDragEnd={(id, newLat, newLng) => {
            setTargets((prev) => {
              const updated = [...prev]
              updated[id] = { ...updated[id], lat: newLat, lng: newLng }
              return updated
            })
          }}
        />
      ))}
    </>
  )
}
