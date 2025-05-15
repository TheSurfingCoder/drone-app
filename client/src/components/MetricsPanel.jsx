import { calculateDistance, estimateDuration } from '../utils/distanceUtils'
import { downloadGeoJSON } from '../utils/exportUtils';
import React from 'react';

export default function MetricsPanel({ waypoints, setWaypoints, setLogs }) {

    const distanceKm = calculateDistance(waypoints);
    const durationSec = estimateDuration(distanceKm);

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
      
        const reader = new FileReader();
      
        reader.onload = (e) => {
            console.log("Raw file content:", e.target.result); 
            try {
            const geojson = JSON.parse(e.target.result);
      
            if (
              geojson.type === "Feature" &&
              geojson.geometry.type === "LineString"
            ) {
              const coords = geojson.geometry.coordinates;
      
              const newWaypoints = coords.map(([lng, lat]) => ({
                lat,
                lng,
              }));
      
              setWaypoints(newWaypoints); // <-- passed from parent
              setLogs(prev => [...prev, `📥 Imported ${newWaypoints.length} waypoints`]);
      
            } else {
              alert("Invalid GeoJSON: Must be a Feature with LineString geometry.");
            }
          } catch (err) {
            alert("Failed to parse GeoJSON." + err.message);
            console.error(err);
          }
        };
      
        reader.readAsText(file);
      }
      

    return (
        <div style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'white',
            padding: '10px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            zIndex: 1000
        }}>
            <p>📏 Distance: {distanceKm.toFixed(2)} km</p>
            <p>⏱️ Duration: {(durationSec / 60).toFixed(1)} min</p>
            <button
                onClick={() => downloadGeoJSON(waypoints)}
                style={{
                    marginTop: '0.5em',
                    padding: '6px 10px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    backgroundColor: '#e0e0e0',
                    border: 'none'
                }}
            >
                📁 Download Flight Plan (.geojson)
            </button>
            <br></br>
            <input
                type="file"
                accept=".geojson,application/geo+json"
                onChange={handleFileUpload}
                style={{marginTop: '0.5em' }}
            />

        </div>
    )
}


