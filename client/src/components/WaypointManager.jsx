import { useMapEvents, Polyline } from 'react-leaflet'
import WaypointMarker from './WaypointMarker.jsx'
import TargetMarker from './TargetMarker.jsx'
import { getCesiumAltitude } from '../utils/getCesiumAltitude'
import { recalculateHeadings } from '../utils/recalculateHeadings'
import 'leaflet-polylinedecorator'
import PolylineDecorator from './PolylineDecorator.jsx'
import React from 'react'

export default function WaypointManager({
  waypoints,
  setWaypoints,
  unitSystem,
  terrainProvider,
  targets,
  setTargets,
  mapMode,
  setTargetPendingFocus,
  setShowTargetModal,
  onTargetClick
}) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng
      let groundHeight = 0
      let height = 50
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
        id: Date.now(),
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
        setWaypoints((prev) =>
          recalculateHeadings([...prev, newPoint], targets)
        )
      } else if (mapMode === 'target') {
        const newTargetId = Date.now() // ✅ generate unique ID early
        setTargetPendingFocus({ ...newPoint, id: newTargetId }) // ✅ assign it here
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
          heading={wp.heading}
          onDragEnd={async (newLat, newLng) => {
            let groundHeight = 0
            if (terrainProvider) {
              try {
                groundHeight = await getCesiumAltitude(
                  terrainProvider,
                  newLat,
                  newLng
                )
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
              return recalculateHeadings(updated, targets)
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
          id={target.id}
          onDragEnd={(id, newLat, newLng) => {
            setTargets((prev) => {
              const updated = [...prev]
              updated[id] = { ...updated[id], lat: newLat, lng: newLng }
              return updated
            })

            setWaypoints((prevWaypoints) =>
              recalculateHeadings(prevWaypoints, targets.map((t, i) =>
                i === id ? { ...t, lat: newLat, lng: newLng } : t
              ))
            )

          }}
          onClick={(targetId) => {
            if (onTargetClick) onTargetClick(targetId)
          }}
          
        />
      ))}
    </>
  )
}
