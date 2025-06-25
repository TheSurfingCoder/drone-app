import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import WaypointManager from './WaypointManager'
import React, { useEffect, useState } from 'react'
import { Ion, createWorldTerrainAsync } from '@cesium/engine'
import 'leaflet-rotatedmarker'
import RotatingDroneMarker from './RotatingDroneMarker'

Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN

export default function MapComponent({
  waypoints,
  setWaypoints,
  unitSystem,
  dronePosition,
  targets,
  setTargets,
  mapMode,
  setTargetPendingFocus,
  setShowTargetModal,
  onTargetClick,
  expandedSegmentId,
  setExpandedSegmentId,
  setIsMobileCollapsed,
  setIsDesktopCollapsed,
  isMobile,
  isDesktop,
  onClick,
  onSelectSegment,
  droneHeading,
  ref,
  missionSettings,
  updateWaypointsWithHeadingSystem,
  setShowMultipleTargetsModal,
  homeLocation,
  isSettingHomeLocation,
  setHomeLocation,
  setMissionSettings,
}) {
  const startPosition = [20, 0]
  const [terrainProvider, setTerrainProvider] = useState(null)

  const droneIcon = new L.Icon({
    iconUrl: '/drone-svgrepo-com.svg',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })

  const homeIcon = new L.Icon({
    iconUrl: '/home-icon.svg',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    className: 'cursor-move hover:opacity-80 transition-opacity',
  })

  useEffect(() => {
    const loadTerrain = async () => {
      try {
        const terrain = await createWorldTerrainAsync()
        setTerrainProvider(terrain)
      } catch (err) {
        console.error('Failed to load Cesium terrain provider:', err)
      }
    }

    loadTerrain()
  }, [])

  const handleMapClick = (e) => {
    if (onClick) {
      onClick(e.latlng.lat, e.latlng.lng)
    }
  }

  return (
    <MapContainer
      ref={ref}
      center={startPosition}
      zoom={3}
      maxZoom={22}
      zoomControl={false}
      scrollWheelZoom={true}
      whenCreated={(map) => {}} // bind map ref on creation
      className="h-full w-full"
      onClick={handleMapClick}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
        maxZoom={22}
      />
      <WaypointManager
        waypoints={waypoints}
        setWaypoints={setWaypoints}
        unitSystem={unitSystem}
        terrainProvider={terrainProvider}
        targets={targets}
        setTargets={setTargets}
        mapMode={mapMode}
        setTargetPendingFocus={setTargetPendingFocus} // ✅ pass down
        setShowTargetModal={setShowTargetModal} // ✅ pass down
        onTargetClick={onTargetClick}
        setIsMobileCollapsed={setIsMobileCollapsed}
        setExpandedSegmentId={setExpandedSegmentId}
        isMobile={isMobile}
        isDesktop={isDesktop}
        setIsDesktopCollapsed={setIsDesktopCollapsed}
        onClick={onClick}
        onSelectSegment={onSelectSegment}
        missionSettings={missionSettings}
        updateWaypointsWithHeadingSystem={updateWaypointsWithHeadingSystem}
        setShowMultipleTargetsModal={setShowMultipleTargetsModal}
        isSettingHomeLocation={isSettingHomeLocation}
      />
      {dronePosition && (
        <RotatingDroneMarker position={dronePosition} heading={droneHeading} icon={droneIcon} />
      )}
      {homeLocation && (
        <Marker
          position={homeLocation}
          icon={homeIcon}
          draggable={true}
          title="Drag to move home location"
          eventHandlers={{
            dragstart: (e) => {
              // Add visual feedback for dragging
              e.target.getElement().style.opacity = '0.7'
              e.target.getElement().style.transform = 'scale(1.1)'
            },
            drag: (e) => {
              // Update popup content during drag
              const latlng = e.target.getLatLng()
              const popup = e.target.getPopup()
              if (popup) {
                popup.setContent(`
                  <div class="text-center">
                    <strong>Moving Home Location</strong><br/>
                    Lat: ${latlng.lat.toFixed(6)}<br/>
                    Lng: ${latlng.lng.toFixed(6)}<br/>
                    <small class="text-gray-500">Release to set new location</small>
                  </div>
                `)
              }
            },
            dragend: (e) => {
              // Reset visual feedback
              e.target.getElement().style.opacity = '1'
              e.target.getElement().style.transform = 'scale(1)'

              const newLat = e.target.getLatLng().lat
              const newLng = e.target.getLatLng().lng
              setHomeLocation({ lat: newLat, lng: newLng })
              setMissionSettings((prev) => ({
                ...prev,
                homeLat: newLat,
                homeLng: newLng,
              }))
            },
          }}
        >
          <Popup>
            <div className="text-center">
              <strong>Home Location</strong>
              <br />
              Lat: {homeLocation.lat.toFixed(6)}
              <br />
              Lng: {homeLocation.lng.toFixed(6)}
              <br />
              <small className="text-gray-500">Drag to move</small>
            </div>
          </Popup>
        </Marker>
      )}
      {isSettingHomeLocation && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-[1000]">
          Click on the map to set home location
        </div>
      )}
    </MapContainer>
  )
}
