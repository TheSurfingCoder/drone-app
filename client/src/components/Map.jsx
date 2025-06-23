import { MapContainer, TileLayer } from 'react-leaflet'
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
}) {
  const startPosition = [20, 0]
  const [terrainProvider, setTerrainProvider] = useState(null)

  const droneIcon = new L.Icon({
    iconUrl: '/drone-svgrepo-com.svg',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
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
      />
      {dronePosition && (
        <RotatingDroneMarker position={dronePosition} heading={droneHeading} icon={droneIcon} />
      )}
    </MapContainer>
  )
}
