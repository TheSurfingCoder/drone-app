//click handling + waypoint storage + polyline
import { useMapEvents, Polyline } from 'react-leaflet';
import WaypointMarker from './WaypointMarker.jsx';
import { getCesiumAltitude } from '../utils/getCesiumAltitude'; // adjust path as needed
import React from 'react';


export default function WaypointManager({ waypoints, setWaypoints, unitSystem, terrainProvider }) {

  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      let groundHeight = 0;
      let height = 0;
      let groundPosition = 0;
      let elevatedPosition = 0;

      if (terrainProvider) {
        try {
          groundHeight = await getCesiumAltitude(terrainProvider, lat, lng);
        } catch (err) {
          console.warn("Failed to get terrain height, defaulting to 0", err);
        }
      }

      setWaypoints((prev) => [...prev, { lat, lng, height, groundHeight, groundPosition, elevatedPosition }]);
    },
  });
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

    </>
  )
}