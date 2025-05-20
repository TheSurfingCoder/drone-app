import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import React from 'react';

  const waypoint = new L.Icon({
    iconUrl: '/marker-svgrepo-com.svg',
    iconSize: [40, 40],
  });


export default function WaypointMarker({ lat, lng, alt, index, unitSystem, onDragEnd }) {
  const altitude = alt ?? 0;
  const formattedAlt =
    unitSystem === 'metric'
      ? `${altitude.toFixed(1)} m`
      : `${(altitude * 3.28084).toFixed(1)} ft`;

  return (
    <Marker position={[lat, lng]} icon={waypoint} draggable={true}
    eventHandlers={{
      dragend: (e) => {
        const marker = e.target
        const { lat, lng } = marker.getLatLng()
        onDragEnd(lat, lng)
      },
    }}>
      <Popup>
        <div>
          <strong>Waypoint {index + 1}
        <div>
          {`lat: ${lat}`}
        </div>
        <div>
          {`lng: ${lng}`}
        </div>
      </strong>
          <br />
          Alt: {formattedAlt}
        </div>
      </Popup>
      
    </Marker>
  );
}
