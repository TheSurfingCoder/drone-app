//click handling + waypoint storage + polyline
import { useMapEvents, Polyline } from 'react-leaflet';
import WaypointMarker from './WaypointMarker.jsx';
import { getCesiumAltitude } from '../utils/getCesiumAltitude'; // adjust path as needed
import React from 'react';
import TargetMarker from './TargetMarker.jsx';


export default function WaypointManager({ waypoints, setWaypoints, unitSystem, terrainProvider, targets, setTargets, mapMode }) {

  useMapEvents({
    click: async (e) => {
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
        lat,
        lng,
        height,
        groundHeight,
        groundPosition,
        elevatedPosition,
      }

      if (mapMode === 'waypoint') {
        setWaypoints((prev) => [...prev, newPoint])
      } else if (mapMode === 'target') {
        setTargets((prev) => [...prev, newPoint])
      }
    },
  })

  console.log(waypoints);
  return (
    <>
      {
        waypoints.map((wp, i) => {
          return (
            <WaypointMarker
              key={i}
              lat={wp.lat}
              lng={wp.lng}
              alt={wp.groundHeight}
              height={wp.height}
              groundPosition={wp.groundPosition}
              elevatedPosition={wp.elevatedPosition}
              index={i}
              unitSystem={unitSystem}
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
                    height: groundHeight, // or any offset logic
                  }
                  return updated
                })
              }}
            />
          )
        })
      }
      {waypoints.length > 1 && (
        <Polyline
          positions={waypoints.map(wp => [wp.lat, wp.lng])}
          pathOptions={{ color: 'blue', weight: 3 }}
        />
      )}
      {targets && targets.map((target, i) => (
        <TargetMarker
          key={`target-${i}`}
          position={[target.lat, target.lng]}
          id={i}
          onDragEnd={(id, newLat, newLng) => {
            setTargets(prev => {
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