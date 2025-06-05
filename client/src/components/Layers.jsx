import React from 'react'

export default function Layers({ mapMode, setMapMode, showOSMBuildings, toggleOSMBuildings }) {
  return (
    <div
      className="
    
    bg-white/90
    p-2 rounded
    text-xs
    sm:text-base
  "
    >
      <div>
        <label>
          <input
            type="radio"
            name="mapMode"
            value="google"
            checked={mapMode === 'google'}
            onChange={() => setMapMode('google')}
          />{' '}
          Google Photorealistic
        </label>
        <br />
        <label>
          <input
            type="radio"
            name="mapMode"
            value="osm"
            checked={mapMode === 'osm'}
            onChange={() => setMapMode('osm')}
          />{' '}
          OSM Mode
        </label>
      </div>

      {mapMode === 'osm' && (
        <div style={{ marginTop: '0.5rem' }}>
          <label>
            <input type="checkbox" checked={showOSMBuildings} onChange={toggleOSMBuildings} /> Show
            OSM Buildings
          </label>
        </div>
      )}
    </div>
  )
}
