import React, { useState, useRef, useEffect } from 'react'
import MapComponent from './Map'
import CesiumMap from './CesiumMap'
import UnitToggle from './UnitToggle'
import DroneController from './DroneController'
import CurrentLocationButton from './CurrentLocationButton'
import { Cartesian3, HeadingPitchRange } from 'cesium'
import QuickAccessToolbar from './QuickAccessToolbar'
import CountdownModal from './CountdownModal'
import MobileWaypointPanel from './MobileWaypointPanel'
import DesktopWaypointPanel from './DesktopWaypointPanel'
import L from 'leaflet'
import ModernStatusPillWrapper from './ModernStatusPillWrapper'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from './AuthModal'
import { UserIcon } from 'lucide-react'
import { DesktopFlightPanel } from './DesktopFlightPanel'
import MobileFlightPanel from './MobileFlightPanel'
import { calculateDistance, estimateDuration } from '../utils/distanceUtils'
import SaveFlightModal from './SaveFlightModal'
import { supabase } from '../lib/supabase'
import { DateTime } from 'luxon'
import POIGuidance from './POIGuidance'
import POIRemovalModal from './POIRemovalModal'

// Add flight data structure

export default function MissionPlannerWrapper() {
  const [viewMode, setViewMode] = useState('2d')
  const [waypoints, setWaypoints] = useState([])
  const [unitSystem, setUnitSystem] = useState('metric')
  const [dronePosition, setDronePosition] = useState(null) // SF default
  const [logs, setLogs] = useState([])
  const mapRef = useRef(null)
  const viewerRef = useRef(null)
  const [mapMode, setMapMode] = useState('waypoint')
  const [targets, setTargets] = useState([])
  const [showTargetModal, setShowTargetModal] = useState(false)
  const [targetPendingFocus, setTargetPendingFocus] = useState(null)
  const [showCountdown, setShowCountdown] = useState(false)
  const [countdownMessage, setCountdownMessage] = useState('Starting in')
  const isMobile = useIsMobile()
  const [selectedWaypoint, setSelectedWaypoint] = useState(null)
  const [isMobileCollapsed, setIsMobileCollapsed] = useState(true)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)
  const hasAutoOpenedDesktopPanel = useRef(false) // tracks if we've already opened it
  const [googlePhotorealistic, setGooglePhotorealistic] = useState(true)
  const [sunTime, setSunTime] = useState(new Date())
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const { user } = useAuth()
  const [showFlights, setShowFlights] = useState(false)
  const [savedFlights, setSavedFlights] = useState([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const isDesktop = !isMobile
  const [droneHeading, setDroneHeading] = useState(0)
  const droneHeadingRef = useRef(0)

  // POI guidance and confirmation state
  const [showPOIGuidance, setShowPOIGuidance] = useState(false)
  const [showPOIRemovalModal, setShowPOIRemovalModal] = useState(false)
  const [showMultipleTargetsModal, setShowMultipleTargetsModal] = useState(false)
  const [previousHeadingMode, setPreviousHeadingMode] = useState('AUTO')

  // Enhanced heading system state
  const [headingSystem, setHeadingSystem] = useState({
    timeline: [],
    getHeadingAtTime: () => 0,
    getActiveActuatorsAtTime: () => [],
    getMissionProgressAtTime: () => 0,
    getWaypointAtTime: () => ({ waypoint: null, segment: 0, progress: 0 }),
  })

  // Global mission settings
  const [missionSettings, setMissionSettings] = useState({
    autoFlightSpeed: 10, // Default cruise speed (m/s)
    maxFlightSpeed: 15, // Max allowed speed (m/s)
    finishedAction: 'GO_HOME', // What drone does after mission
    repeatTimes: 1, // Number of times to repeat mission
    globalTurnMode: 'CLOCKWISE', // Default yaw direction
    gimbalPitchRotationEnabled: true, // Enable per-waypoint gimbal control
    headingMode: 'AUTO', // How aircraft faces during flight
    flightPathMode: 'NORMAL', // Flight path mode: 'NORMAL' or 'CURVED'
  })

  // Dynamic date/time/timezone state
  const [currentDate, setCurrentDate] = useState(DateTime.now().toFormat('yyyy-MM-dd'))
  const [currentTime, setCurrentTime] = useState(DateTime.now().toFormat('HH:mm'))
  const [currentTimezone, setCurrentTimezone] = useState('UTC')

  const lastCameraPosition = useRef(null)

  // Initialize with current UTC time and update every minute
  useEffect(() => {
    const updateTime = () => {
      const now = DateTime.now()

      // If we have a specific timezone (not UTC), update time in that timezone
      if (currentTimezone && currentTimezone !== 'UTC') {
        const localTime = now.setZone(currentTimezone)
        setCurrentDate(localTime.toFormat('yyyy-MM-dd'))
        setCurrentTime(localTime.toFormat('HH:mm'))
        setSunTime(localTime.toJSDate())
      } else {
        // Default to UTC when viewing the globe
        const utcTime = now.toUTC()
        setCurrentDate(utcTime.toFormat('yyyy-MM-dd'))
        setCurrentTime(utcTime.toFormat('HH:mm'))
        setCurrentTimezone('UTC')
        setSunTime(utcTime.toJSDate())
      }
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [currentTimezone]) // Add currentTimezone as dependency

  // Function to update timezone based on camera position
  const updateTimezoneFromCamera = async (cameraPosition) => {
    if (!cameraPosition) return

    // Check if camera has moved enough to warrant a new timezone request
    if (lastCameraPosition.current) {
      const latDiff = Math.abs(cameraPosition.lat - lastCameraPosition.current.lat)
      const lngDiff = Math.abs(cameraPosition.lng - lastCameraPosition.current.lng)

      // Only update if moved more than 0.1 degrees (roughly 11km)
      if (latDiff < 0.1 && lngDiff < 0.1) {
        return
      }
    }

    // Reset to UTC if camera is too high
    if (cameraPosition.altitude > 2000) {
      setCurrentTimezone('UTC')
      lastCameraPosition.current = cameraPosition
      return
    }

    // Check if camera has moved enough to warrant a new timezone request
    if (lastCameraPosition.current) {
      const latDiff = Math.abs(cameraPosition.lat - lastCameraPosition.current.lat)
      const lngDiff = Math.abs(cameraPosition.lng - lastCameraPosition.current.lng)

      // Only update if moved more than 0.1 degrees (roughly 11km)
      if (latDiff < 0.1 && lngDiff < 0.1) {
        return
      }
    }

    try {
      const url = `https://api.timezonedb.com/v2.1/get-time-zone?key=${import.meta.env.VITE_TIMEZONE_API_KEY}&format=json&by=position&lat=${cameraPosition.lat}&lng=${cameraPosition.lng}`

      const response = await fetch(url)

      if (!response.ok) {
        console.warn('Timezone API failed, using UTC')
        setCurrentTimezone('UTC')
        return
      }

      const data = await response.json()

      if (data.status === 'OK' && data.zoneName) {
        setCurrentTimezone(data.zoneName)
        lastCameraPosition.current = cameraPosition
      } else {
        console.warn('Error fetching timezone:', data)
        setCurrentTimezone('UTC')
      }
    } catch (error) {
      console.warn('Error fetching timezone:', error)
      setCurrentTimezone('UTC')
    }
  }

  // Function to handle date/time changes from SunControlPanel
  const handleDateTimeChange = (date, time, timezone) => {
    setCurrentDate(date)
    setCurrentTime(time)
    setCurrentTimezone(timezone)

    const dt = DateTime.fromISO(`${date}T${time}`, { zone: timezone })
    if (dt.isValid) {
      const utcDate = dt.toUTC().toJSDate()
      setSunTime(utcDate)
    }
  }

  function useIsMobile() {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768 || window.innerHeight <= 500)

    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth <= 768 || window.innerHeight <= 500)
      }

      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [])

    return isMobile
  }

  // Per-waypoint handlers
  const handleWaypointSpeedChange = (waypointId, newSpeed) => {
    setWaypoints((prev) =>
      prev.map((wp) => (wp.id === waypointId ? { ...wp, speed: newSpeed } : wp)),
    )
  }

  const handleWaypointCurvatureChange = (waypointId, newCornerRadius) => {
    setWaypoints((prev) =>
      prev.map((wp) => (wp.id === waypointId ? { ...wp, cornerRadius: newCornerRadius } : wp)),
    )
  }

  const handleWaypointHeightChange = (waypointId, newHeight) => {
    setWaypoints((prev) =>
      prev.map((wp) => (wp.id === waypointId ? { ...wp, height: newHeight } : wp)),
    )
  }

  // Helper function to update waypoints with enhanced heading system
  const updateWaypointsWithHeadingSystem = (newWaypoints) => {
    setWaypoints(newWaypoints)
  }

  const handleWaypointHeadingChange = (waypointId, newHeading) => {
    const updatedWaypoints = waypoints.map((wp) =>
      wp.id === waypointId
        ? {
            ...wp,
            waypointHeading: newHeading,
            heading: newHeading, // Also update the calculated heading for map display
          }
        : wp,
    )
    updateWaypointsWithHeadingSystem(updatedWaypoints)
  }

  const handleSelectWaypoint = (id) => {
    if (isMobile) setIsMobileCollapsed(false)
    if (isDesktop) setIsDesktopCollapsed(false)

    setSelectedWaypoint(id)

    const wp = waypoints.find((w) => w.id === id)
    if (!wp) return

    // Handle 2D map view
    if (viewMode === '2d' && mapRef.current) {
      const map = mapRef.current
      const currentZoom = map.getZoom()
      const targetZoom = currentZoom < 19 ? 19 : currentZoom

      const point = map.project([wp.lat, wp.lng], targetZoom)
      const offsetY = 100
      const newPoint = L.point(point.x, point.y + offsetY)
      const targetLatLng = map.unproject(newPoint, targetZoom)

      map.setView(targetLatLng, targetZoom)
    }

    // Handle 3D Cesium view
    if (viewMode === '3d' && viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement

      // Find the waypoint entity by name
      const waypointIndex = waypoints.findIndex((w) => w.id === wp.id)
      const waypointEntity = viewer.entities.values.find(
        (entity) => entity.name === `Waypoint ${waypointIndex + 1}`,
      )

      if (waypointEntity) {
        // Convert waypoint heading to radians for Cesium
        const headingRad = ((wp.heading || 0) * Math.PI) / 180

        // Fly to the waypoint entity with the waypoint's heading
        viewer.flyTo(waypointEntity, {
          offset: new HeadingPitchRange(
            headingRad, // Use waypoint's heading
            -0.4, // pitch (look down slightly)
            100, // distance in meters
          ),
        })
      } else {
        console.warn('Waypoint entity not found for:', wp.id)
      }
    }
  }

  const handleUpdateWaypoint = (id, updates) => {
    setWaypoints((prev) => prev.map((wp) => (wp.id === id ? { ...wp, ...updates } : wp)))
  }

  const handleDeleteWaypoint = (id) => {
    setWaypoints((prev) => prev.filter((wp) => wp.id !== id))
    if (selectedWaypoint === id) setSelectedWaypoint(null)
  }

  const handleLocateMe = (lat, lng) => {
    if (viewMode === '2d') {
      const map = mapRef.current
      map.setView([lat, lng], 15)
      map.invalidateSize()
    }

    if (viewMode === '3d') {
      const viewer = viewerRef.current?.cesiumElement
      if (viewer) {
        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(lng, lat, 1500),
        })
      } else {
        console.warn('3D viewer not ready.')
      }
    }
  }

  const clearWaypoints = () => {
    setWaypoints([])
    setTargets([])
    setHeadingSystem({
      timeline: [],
      getHeadingAtTime: () => 0,
      getActiveActuatorsAtTime: () => [],
      getMissionProgressAtTime: () => 0,
      getWaypointAtTime: () => ({ waypoint: null, segment: 0, progress: 0 }),
    })
  }

  // Add fetchFlights function
  const fetchFlights = async () => {
    if (!user) {
      return
    }

    try {
      const response = await fetch('/api/flights', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText)
        return
      }

      const flights = await response.json()

      if (!Array.isArray(flights)) {
        console.error('Expected array of flights, got:', typeof flights)
        return
      }

      setSavedFlights(flights)
    } catch (error) {
      console.error('Error fetching flights:', error)
    }
  }

  // Fetch flights when user signs in
  useEffect(() => {
    if (user) {
      fetchFlights()
    }
  }, [user])

  const handleAuthClick = () => {
    if (user) {
      fetchFlights() // Fetch flights when opening the panel
      setShowFlights(true)
    } else {
      setIsAuthModalOpen(true)
    }
  }

  // Create flight data function (moved up to fix ESLint error)
  const createFlightData = (waypoints, name) => {
    // Convert Cesium waypoints to plain objects
    const serializedWaypoints = waypoints
      .map((wp, index) => {
        // Safety check for required properties
        if (typeof wp.lat === 'undefined' || typeof wp.lng === 'undefined') {
          console.error(`Waypoint ${index} is missing lat/lng:`, wp)
          return null
        }

        return {
          coordinate: {
            latitude: wp.lat,
            longitude: wp.lng,
          },
          altitude: wp.height || 0,
          heading: wp.heading || 0,
          gimbalPitch: wp.pitch || 0,
          speed: wp.speed || 10, // Use waypoint speed
          cornerRadius: wp.cornerRadius || 0.2, // Use waypoint corner radius
          turnMode: 'CLOCKWISE',
          actions: [],
        }
      })
      .filter((wp) => wp !== null) // Remove any null waypoints

    // Calculate total distance and duration
    const totalDistance = calculateDistance(waypoints)
    const estimatedDuration = estimateDuration(waypoints) // Updated to not use segmentSpeeds

    const flightData = {
      name: name,
      waypoints: serializedWaypoints,
      missionSettings: missionSettings, // Include global mission settings
      metadata: {
        totalWaypoints: waypoints.length,
        totalDistance: totalDistance,
        estimatedDuration: estimatedDuration,
      },
      date: new Date().toISOString(),
    }

    return flightData
  }

  const handleSaveFlight = async (name) => {
    if (!user) {
      console.error('No user logged in')
      return
    }

    try {
      const flightData = createFlightData(waypoints, name)

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (!session) throw new Error('No active session')

      const response = await fetch('/api/flights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(flightData),
      })

      if (!response.ok) {
        throw new Error(`Failed to save flight: ${response.status}`)
      }

      await response.json()

      // Refresh flights list
      await fetchFlights()
      setShowSaveModal(false)
    } catch (error) {
      console.error('Error saving flight:', error)
    }
  }

  const handleLoadFlight = (flight) => {
    // Convert saved flight data back to Cesium objects
    const loadedWaypoints = flight.waypoints.map((wp) => {
      const waypoint = {
        id: Date.now() + Math.random(), // Generate new ID
        lat: wp.coordinate.latitude,
        lng: wp.coordinate.longitude,
        height: wp.altitude,
        heading: wp.heading,
        pitch: wp.gimbalPitch,
        speed: wp.speed || 10, // Load waypoint speed
        cornerRadius: wp.cornerRadius || 0.2, // Load waypoint corner radius
        turnMode: wp.turnMode,
        actions: wp.actions || [],
      }

      // Add Cesium positions
      waypoint.groundPosition = Cartesian3.fromDegrees(
        waypoint.lng,
        waypoint.lat,
        0, // Ground height
      )
      waypoint.elevatedPosition = Cartesian3.fromDegrees(
        waypoint.lng,
        waypoint.lat,
        waypoint.height,
      )

      return waypoint
    })

    setWaypoints(loadedWaypoints)

    // Load mission settings if they exist
    if (flight.missionSettings) {
      setMissionSettings(flight.missionSettings)
    }

    setShowFlights(false)
  }

  // Add handleDeleteFlight function
  const handleDeleteFlight = async (flightId) => {
    if (!user) {
      console.error('No user logged in')
      return
    }

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (!session) throw new Error('No active session')

      const response = await fetch(`/api/flights/${flightId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete flight: ${response.status}`)
      }

      await fetchFlights() // Refresh the list
    } catch (error) {
      console.error('Error deleting flight:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setSavedFlights([])
      setShowFlights(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  useEffect(() => {
    if (
      waypoints.length === 1 && // just added first
      isDesktop && // desktop only
      isDesktopCollapsed && // currently collapsed
      !hasAutoOpenedDesktopPanel.current // hasn't auto-opened yet
    ) {
      setIsDesktopCollapsed(false) // open the panel
      hasAutoOpenedDesktopPanel.current = true // mark it as opened
    }
  }, [waypoints, isDesktop, isDesktopCollapsed])

  // Safely hydrate waypoints for Cesium. Used if your app ever loads saved/incomplete waypoints.
  const hydratedWaypoints = (Array.isArray(waypoints) ? waypoints : []).map((wp) => ({
    ...wp,
    groundPosition:
      typeof wp.groundPosition === 'object'
        ? wp.groundPosition
        : Cartesian3.fromDegrees(wp.lng, wp.lat, wp.groundHeight ?? 0),
    elevatedPosition:
      typeof wp.elevatedPosition === 'object'
        ? wp.elevatedPosition
        : Cartesian3.fromDegrees(wp.lng, wp.lat, (wp.groundHeight ?? 0) + (wp.height ?? 50)),
  }))

  const handleMissionSettingChange = (setting, value) => {
    // Handle heading mode changes for POI guidance
    if (setting === 'headingMode') {
      const hasPOI =
        Array.isArray(waypoints) &&
        waypoints.some((wp) => wp.focusTargetId !== null && wp.focusTargetId !== undefined)

      if (value === 'TOWARD_POINT_OF_INTEREST') {
        // Switching TO POI mode
        if (!hasPOI && targets.length === 0) {
          // No POI exists, show guidance
          setShowPOIGuidance(true)
        }
      } else if (previousHeadingMode === 'TOWARD_POINT_OF_INTEREST' && hasPOI) {
        // Switching AWAY from POI mode with existing POI
        setShowPOIRemovalModal(true)
        return // Don't update yet, wait for user confirmation
      }

      setPreviousHeadingMode(missionSettings.headingMode)
    }

    setMissionSettings((prev) => ({
      ...prev,
      [setting]: value,
    }))
  }

  // POI removal confirmation handlers
  const handlePOIRemovalConfirm = () => {
    // Remove all POI assignments from waypoints
    const updatedWaypoints = (Array.isArray(waypoints) ? waypoints : []).map((wp) => ({
      ...wp,
      focusTargetId: null,
    }))

    // Remove the target from targets array
    setTargets([])

    // Switch to Auto heading mode
    setMissionSettings((prev) => ({
      ...prev,
      headingMode: 'AUTO',
    }))

    // Update waypoints with new heading system
    updateWaypointsWithHeadingSystem(updatedWaypoints)

    setShowPOIRemovalModal(false)
  }

  const handlePOIRemovalCancel = () => {
    // Revert heading mode back to POI
    setMissionSettings((prev) => ({
      ...prev,
      headingMode: 'TOWARD_POINT_OF_INTEREST',
    }))
    setShowPOIRemovalModal(false)
  }

  const handlePOIGuidanceComplete = () => {
    setShowPOIGuidance(false)
  }

  const handlePOIGuidanceDismiss = () => {
    setShowPOIGuidance(false)
  }

  // Function to handle target removal
  const handleRemoveTarget = () => {
    // Remove all POI assignments from waypoints
    const updatedWaypoints = (Array.isArray(waypoints) ? waypoints : []).map((wp) => ({
      ...wp,
      focusTargetId: null,
    }))

    // Remove the target from targets array
    setTargets([])

    // Switch to Auto heading mode
    setMissionSettings((prev) => ({
      ...prev,
      headingMode: 'AUTO',
    }))

    // Update waypoints with new heading system
    updateWaypointsWithHeadingSystem(updatedWaypoints)
  }

  // Update heading system when mission settings change
  useEffect(() => {
    if (Array.isArray(waypoints) && waypoints.length > 0) {
      updateWaypointsWithHeadingSystem(waypoints)
    }
  }, [missionSettings.headingMode, missionSettings.autoFlightSpeed])

  // Hide POI guidance when targets are added
  useEffect(() => {
    if (showPOIGuidance && targets.length > 0) {
      setShowPOIGuidance(false)
    }
  }, [targets.length, showPOIGuidance])

  return (
    <div className="relative w-screen h-screen ">
      {/* 🧭 Top Bar */}
      <div className="fixed top-0 w-full h-[56px] sm:h-auto py-2 items-center bg-white px-4 flex flex-row justify-between gap-2 z-[9999] sm:h-auto sm:px-4 sm:py-0 sm:flex-row sm:items-center sm:gap-0 sm:py-2">
        <div className="flex items-center gap-3">
          <div className="w-30 flex flex-col gap-1 items-center px-2 py-1 text-xs sm:flex sm:flex-row sm:items-center sm:gap-2 sm:text-base">
            <UnitToggle unitSystem={unitSystem} onChange={setUnitSystem} />
            <CurrentLocationButton onLocate={handleLocateMe} />
          </div>
          <DroneController
            className="bg-green-600 text-white px-3 py-0 rounded"
            waypoints={waypoints}
            setDronePosition={setDronePosition}
            dronePosition={dronePosition}
            logs={logs}
            setLogs={setLogs}
            handleClearWaypoints={clearWaypoints}
            showCountdown={showCountdown}
            setShowCountdown={setShowCountdown}
            setCountdownMessage={setCountdownMessage}
            unitSystem={unitSystem}
            mapRef={mapRef}
            droneHeadingRef={droneHeadingRef}
            setDroneHeading={setDroneHeading}
            droneHeading={droneHeading}
            missionSettings={missionSettings}
          />
        </div>
        <div className="flex items-center space-x-4">
          <button
            className="bg-blue-600 text-white px-3 py-0 rounded text-xs sm:text-base"
            onClick={() => setViewMode(viewMode === '2d' ? '3d' : '2d')}
          >
            Switch to {viewMode === '2d' ? '3D' : '2D'}
          </button>

          {!user && (
            <button
              onClick={handleAuthClick}
              className="flex items-center border rounded-full px-3 py-1 hover:bg-gray-50 text-xs sm:text-base space-x-2"
            >
              <UserIcon size={16} className="text-gray-600  sm:inline-block" />
              <span>Sign In</span>
            </button>
          )}
          {user && (
            <button
              onClick={handleAuthClick}
              className="flex items-center border rounded-full px-3 py-1 hover:bg-gray-50 text-xs sm:text-base space-x-2"
            >
              <UserIcon size={16} className="text-gray-600  sm:inline-block" />
              <span>My Flights</span>
            </button>
          )}
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[49]">
          <ModernStatusPillWrapper
            viewMode={viewMode}
            waypoints={waypoints}
            unitSystem={unitSystem}
            googlePhotorealistic={googlePhotorealistic}
            setGooglePhotorealistic={setGooglePhotorealistic}
            currentDate={currentDate}
            currentTime={currentTime}
            currentTimezone={currentTimezone}
            onDateTimeChange={handleDateTimeChange}
          />
        </div>
      </div>

      {/* Map Container */}
      <div className="absolute inset-0 z-0">
        {viewMode === '2d' ? (
          <MapComponent
            waypoints={waypoints}
            setWaypoints={setWaypoints}
            targets={targets}
            setTargets={setTargets}
            unitSystem={unitSystem}
            setUnitSystem={setUnitSystem}
            setTargetPendingFocus={setTargetPendingFocus}
            setShowTargetModal={setShowTargetModal}
            dronePosition={dronePosition}
            setDronePosition={setDronePosition}
            mapMode={mapMode}
            ref={mapRef}
            onTargetClick={(targetId) => {
              // No longer showing target modal - targets are managed globally as POI
            }}
            setIsMobileCollapsed={setIsMobileCollapsed}
            setIsDesktopCollapsed={setIsDesktopCollapsed}
            isMobile={isMobile}
            isDesktop={isDesktop}
            onClick={handleSelectWaypoint}
            droneHeading={droneHeading}
            missionSettings={missionSettings}
            updateWaypointsWithHeadingSystem={updateWaypointsWithHeadingSystem}
            setShowMultipleTargetsModal={setShowMultipleTargetsModal}
          />
        ) : (
          <CesiumMap
            waypoints={hydratedWaypoints}
            setWaypoints={setWaypoints}
            ref={viewerRef}
            overlayType={mapMode}
            targets={targets}
            setTargets={setTargets}
            googlePhotorealistic={googlePhotorealistic}
            sunTime={sunTime}
            onCameraPositionChange={updateTimezoneFromCamera}
            unitSystem={unitSystem}
            missionSettings={missionSettings}
          />
        )}
      </div>

      {/* ✅ Modal rendered globally, not inside map logic */}
      {showCountdown && (
        <CountdownModal
          message={countdownMessage}
          seconds={countdownMessage === 'Starting in' ? 3 : 2}
          onComplete={() => {
            if (
              countdownMessage === 'Starting in' &&
              Array.isArray(waypoints) &&
              waypoints.length > 0
            ) {
              setDronePosition([waypoints[0].lat, waypoints[0].lng])
              // mission simulation logic
            }
            setShowCountdown(false)
          }}
        />
      )}

      {showTargetModal && targetPendingFocus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add POI Target</h3>
            <p className="text-gray-600 mb-6">
              This target will be used as the Point of Interest (POI) for all waypoints. All
              waypoints will automatically focus on this target when POI heading mode is enabled.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setTargetPendingFocus(null)
                  setShowTargetModal(false)
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Add the target and make all waypoints focus on it
                  const newTargets = [...targets, targetPendingFocus]
                  setTargets(newTargets)

                  // Update all waypoints to focus on this target
                  const updatedWaypoints = waypoints.map((wp) => ({
                    ...wp,
                    focusTargetId: targetPendingFocus.id,
                  }))

                  // Switch to POI heading mode
                  setMissionSettings((prev) => ({
                    ...prev,
                    headingMode: 'TOWARD_POINT_OF_INTEREST',
                  }))

                  // Update waypoints with new heading system
                  updateWaypointsWithHeadingSystem(updatedWaypoints)
                  setTargetPendingFocus(null)
                  setShowTargetModal(false)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add POI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📍 Floating Panels */}
      <QuickAccessToolbar
        isMobile={isMobile}
        onModeChange={setMapMode}
        currentMode={mapMode}
        onSave={() => setShowSaveModal(true)}
      />
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-999">
          <MobileWaypointPanel
            waypoints={waypoints}
            selectedWaypoint={selectedWaypoint}
            onSelectWaypoint={handleSelectWaypoint}
            onUpdateWaypoint={handleUpdateWaypoint}
            onDeleteWaypoint={handleDeleteWaypoint}
            setIsMobileCollapsed={setIsMobileCollapsed}
            onModeChange={setMapMode}
            isMobileCollapsed={isMobileCollapsed}
            handleWaypointHeightChange={handleWaypointHeightChange}
            handleWaypointSpeedChange={handleWaypointSpeedChange}
            handleWaypointCurvatureChange={handleWaypointCurvatureChange}
            handleWaypointHeadingChange={handleWaypointHeadingChange}
            targets={targets}
            unitSystem={unitSystem}
            missionSettings={missionSettings}
          />
        </div>
      )}
      {isDesktop && (
        <div className="absolute right-0 top-0 bottom-0 z-9999 ">
          <DesktopWaypointPanel
            waypoints={waypoints}
            selectedWaypoint={selectedWaypoint}
            onSelectWaypoint={handleSelectWaypoint}
            onUpdateWaypoint={handleUpdateWaypoint}
            onDeleteWaypoint={handleDeleteWaypoint}
            onModeChange={setMapMode}
            unitSystem={unitSystem}
            isDesktopCollapsed={isDesktopCollapsed}
            setIsDesktopCollapsed={setIsDesktopCollapsed}
            handleWaypointHeightChange={handleWaypointHeightChange}
            handleWaypointSpeedChange={handleWaypointSpeedChange}
            handleWaypointCurvatureChange={handleWaypointCurvatureChange}
            handleWaypointHeadingChange={handleWaypointHeadingChange}
            missionSettings={missionSettings}
            onMissionSettingChange={handleMissionSettingChange}
            targets={targets}
            headingSystem={headingSystem}
            onRemoveTarget={handleRemoveTarget}
          />
        </div>
      )}

      {/* Flight Panels */}
      {showFlights && isMobile && (
        <MobileFlightPanel
          onClose={() => setShowFlights(false)}
          flights={savedFlights}
          onLoadFlight={handleLoadFlight}
          onDeleteFlight={handleDeleteFlight}
          onSignOut={handleSignOut}
        />
      )}
      {showFlights && !isMobile && (
        <DesktopFlightPanel
          onClose={() => setShowFlights(false)}
          flights={savedFlights}
          onLoadFlight={handleLoadFlight}
          onDeleteFlight={handleDeleteFlight}
          onSignOut={handleSignOut}
        />
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <SaveFlightModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveFlight}
      />

      {/* POI Guidance and Confirmation Modals */}
      <POIGuidance
        isVisible={showPOIGuidance}
        onComplete={handlePOIGuidanceComplete}
        onDismiss={handlePOIGuidanceDismiss}
      />

      <POIRemovalModal
        isVisible={showPOIRemovalModal}
        onConfirm={handlePOIRemovalConfirm}
        onCancel={handlePOIRemovalCancel}
      />

      {/* Multiple Targets Warning Modal */}
      {showMultipleTargetsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-orange-600">
              ⚠️ Multiple POI Targets Not Allowed
            </h3>
            <p className="text-gray-600 mb-6">
              You can only have one Point of Interest (POI) target at a time. To add a new POI,
              first remove the existing one or move it to a new location.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowMultipleTargetsModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
