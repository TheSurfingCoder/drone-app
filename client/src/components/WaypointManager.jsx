import React from 'react'
import { useMapEvents, Polyline, Marker } from 'react-leaflet'
import L from 'leaflet'
import WaypointMarker from './WaypointMarker.jsx'
import TargetMarker from './TargetMarker.jsx'
import { getCesiumAltitude } from '../utils/getCesiumAltitude'
import { recalculateHeadings } from '../utils/recalculateHeadings'
import { getTangentAngle, getBezierCurvePoints } from '../utils/geometry'
import 'leaflet-polylinedecorator'
import PolylineDecorator from './PolylineDecorator.jsx'
import { Cartesian3 } from 'cesium'

const DRONE_HEADING_COLOR = '#00bcd4'

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
  onTargetClick,
  segmentSpeeds,
  onClick,
  onSelectSegment,
}) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng
      let groundHeight = 0
      const height = 50
      let groundPosition
      let elevatedPosition

      if (terrainProvider) {
        try {
          groundHeight = await getCesiumAltitude(terrainProvider, lat, lng)
          groundPosition = Cartesian3.fromDegrees(lng, lat, groundHeight)
          elevatedPosition = Cartesian3.fromDegrees(lng, lat, groundHeight + height)
        } catch (err) {
          console.warn('Failed to get terrain height, defaulting to 0', err)
          groundPosition = Cartesian3.fromDegrees(lng, lat, 0)
          elevatedPosition = Cartesian3.fromDegrees(lng, lat, height)
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
        setWaypoints((prev) => recalculateHeadings([...prev, newPoint], targets))
      } else if (mapMode === 'target') {
        const newTargetId = Date.now()
        setTargetPendingFocus({ ...newPoint, id: newTargetId })
        setShowTargetModal(true)
      }
    },
  })

  return (
    <>
      {waypoints.map((wp, i) => (
        <WaypointMarker
          key={wp.id || i}
          id={wp.id}
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
              return recalculateHeadings(updated, targets)
            })
          }}
          onClick={onClick}
        />
      ))}

      {waypoints.map((wp, i) => {
        if (i >= waypoints.length - 1) return null
        const next = waypoints[i + 1]
        const speedData = segmentSpeeds?.[i] || {}
        const isCurved = speedData.isCurved
        const tightness = speedData.curveTightness ?? 15
        const latlngs = isCurved
          ? getBezierCurvePoints(wp, next, tightness)
          : [
              [wp.lat, wp.lng],
              [next.lat, next.lng],
            ]

        return (
          <>
            <Polyline
              key={`segment-${wp.id}-${next.id}`}
              positions={latlngs}
              pathOptions={{
                color: isCurved ? '#a855f7' : '#2563eb',
                weight: 3,
                dashArray: isCurved ? '5,6' : undefined,
              }}
              eventHandlers={{
                click: () => onSelectSegment?.(wp.id, next.id),
              }}
            />
            <PolylineDecorator
              segmentLatLngs={waypoints.slice(0, -1).map((wp, i) => {
                const next = waypoints[i + 1]
                const speedData = segmentSpeeds?.[i] || {}
                const isCurved = speedData.isCurved
                const tightness = speedData.curveTightness ?? 15
                return isCurved
                  ? getBezierCurvePoints(wp, next, tightness)
                  : [
                      [wp.lat, wp.lng],
                      [next.lat, next.lng],
                    ]
              })}
              segmentSpeeds={segmentSpeeds}
              onSelectSegment={onSelectSegment}
              unitSystem={unitSystem}
              waypoints={waypoints}
            />
          </>
        )
      })}

      {waypoints.map((wp, i) => {
        const next = waypoints[i + 1]
        const speedData = segmentSpeeds?.[i] || {}
        if (speedData.isCurved && next) {
          try {
            const angle = getTangentAngle(wp, next)
            const arrowLat = wp.lat + 0.00008 * Math.sin((angle * Math.PI) / 180)
            const arrowLng = wp.lng + 0.00008 * Math.cos((angle * Math.PI) / 180)

            return (
              <Marker
                key={`arrow-${wp.id}-${next.id}`}
                position={[arrowLat, arrowLng]}
                icon={L.divIcon({
                  className: 'heading-arrow',
                  html: `<div style="transform: rotate(${angle}deg); width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 10px solid ${DRONE_HEADING_COLOR};"></div>`,
                })}
              />
            )
          } catch (err) {
            console.warn('Failed to compute tangent angle:', err)
            return null
          }
        }
        return null
      })}

      {targets.map((target, i) => (
        <TargetMarker
          key={target.id || i}
          position={[target.lat, target.lng]}
          id={target.id}
          onDragEnd={(id, newLat, newLng) => {
            setTargets((prev) => {
              return prev.map((target) =>
                target.id === id ? { ...target, lat: newLat, lng: newLng } : target,
              )
            })

            setWaypoints((prevWaypoints) =>
              recalculateHeadings(
                prevWaypoints,
                targets.map((t) => (t.id === id ? { ...t, lat: newLat, lng: newLng } : t)),
              ),
            )
          }}
          onTargetClick={onTargetClick}
        />
      ))}
    </>
  )
}
