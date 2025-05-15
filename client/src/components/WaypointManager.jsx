//click handling + waypoint storage + polyline
import { useMapEvents, Polyline } from 'react-leaflet';
import WaypointMarker from './WaypointMarker.jsx';
import { getCesiumAltitude } from '../utils/getCesiumAltitude'; // adjust path as needed
import React from 'react';


export default function WaypointManager({ waypoints, setWaypoints, unitSystem, terrainProvider }) {

  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      let alt = 0;

      if (terrainProvider) {
        try {
          alt = await getCesiumAltitude(terrainProvider, lat, lng);
        } catch (err) {
          console.warn("Failed to get terrain height, defaulting to 0", err);
        }
      }

      setWaypoints((prev) => [...prev, { lat, lng, alt, groundAlt: alt }]);
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
              alt={wp.alt}
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