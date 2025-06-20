import React, { useState, useRef, useEffect } from 'react'
import MapComponent from './Map'
import CesiumMap from './CesiumMap'
import UnitToggle from './UnitToggle'
import DroneController from './DroneController'
import CurrentLocationButton from './CurrentLocationButton'
import { Cartesian3, HeadingPitchRange } from 'cesium'
import QuickAccessToolbar from './QuickAccessToolbar'
import TargetWaypointModal from './TargetWayPointModal'
import { recalculateHeadings } from '../utils/recalculateHeadings'
import CountdownModal from './CountdownModal'
import MobileWaypointPanel from './MobileWaypointPanel'
import DesktopWaypointPanel from './DesktopWaypointPanel'
import L from 'leaflet'
import ModernStatusPillWrapper from './ModernStatusPillWrapper'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from './AuthModal'
import { UserIcon } from 'lucide-react'
import { DesktopFlightPanel } from './DesktopFlightPanel'
import { MobileFlightPanel } from './MobileFlightPanel'
import { calculateDistance, estimateDuration } from '../utils/distanceUtils'
import SaveFlightModal from './SaveFlightModal'
import { supabase } from '../lib/supabase'
import { DateTime } from 'luxon'

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
  const [selectedTargetId, setSelectedTargetId] = useState(null)
  const [showCountdown, setShowCountdown] = useState(false)
  const [countdownMessage, setCountdownMessage] = useState('Starting in')
  const [segmentSpeeds, setSegmentSpeeds] = useState([])
  const isMobile = useIsMobile()
  const [selectedWaypoint, setSelectedWaypoint] = useState(null)
  const [isMobileCollapsed, setIsMobileCollapsed] = useState(true)
  const [expandedSegmentId, setExpandedSegmentId] = useState(null)
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

  // Dynamic date/time/timezone state
  const [currentDate, setCurrentDate] = useState(DateTime.now().toFormat('yyyy-MM-dd'))
  const [currentTime, setCurrentTime] = useState(DateTime.now().toFormat('HH:mm'))
  const [currentTimezone, setCurrentTimezone] = useState('UTC')
  const [lastCameraPosition, setLastCameraPosition] = useState(null)

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

  // Function to check if camera moved enough to warrant timezone check
  const hasCameraMovedEnough = (newPosition) => {
    if (!lastCameraPosition) return true

    const latDiff = Math.abs(newPosition.lat - lastCameraPosition.lat)
    const lngDiff = Math.abs(newPosition.lng - lastCameraPosition.lng)

    // Convert to approximate meters (rough conversion)
    const latMeters = latDiff * 111000 // 1 degree lat ≈ 111km
    const lngMeters = lngDiff * 111000 * Math.cos((newPosition.lat * Math.PI) / 180)

    const totalDistance = Math.sqrt(latMeters * latMeters + lngMeters * lngMeters)
    return totalDistance > 1000 // 1000 meters threshold
  }

  // Function to fetch timezone data
  const fetchTimezone = async (lat, lng) => {
    const url = `http://localhost:8080/timezone?lat=${lat}&lng=${lng}`
    console.log('🌍 Making timezone request to:', url)

    try {
      const response = await fetch(url)
      console.log(' Response status:', response.status)
      console.log('🌍 Response headers:', response.headers)

      if (!response.ok) {
        console.warn('Timezone API failed, using UTC')
        const errorText = await response.text()
        console.log('🌍 Error response body:', errorText)
        return null
      }

      const data = await response.json()
      console.log('🌍 Timezone data received:', data)

      if (data.status === 'OK') {
        return data
      }
      return null
    } catch (error) {
      console.warn('Error fetching timezone:', error)
      return null
    }
  }

  // Function to update timezone based on camera position
  const updateTimezoneFromCamera = async (cameraPosition) => {
    console.log('📍 Camera position received:', cameraPosition)

    // If camera is above 2000 meters, reset to UTC (viewing the globe)
    if (cameraPosition.altitude >= 2000) {
      console.log('📍 Camera above 2000m, resetting to UTC')
      setCurrentTimezone('UTC')
      setLastCameraPosition(cameraPosition)
      return
    }

    if (!hasCameraMovedEnough(cameraPosition)) {
      console.log("📍 Camera hasn't moved enough, skipping timezone update")
      return
    }

    console.log('📍 Fetching timezone for:', cameraPosition.lat, cameraPosition.lng)
    const timezoneData = await fetchTimezone(cameraPosition.lat, cameraPosition.lng)

    if (timezoneData) {
      console.log('📍 Timezone data received:', timezoneData)
      setCurrentTimezone(timezoneData.zoneName)

      // Update the displayed time to match the new timezone
      const localTime = DateTime.fromFormat(timezoneData.formatted, 'yyyy-MM-dd HH:mm:ss', {
        zone: timezoneData.zoneName,
      })
      setCurrentDate(localTime.toFormat('yyyy-MM-dd'))
      setCurrentTime(localTime.toFormat('HH:mm'))
      setSunTime(localTime.toJSDate())
    } else {
      console.log('📍 No timezone data received, keeping current timezone')
    }

    setLastCameraPosition(cameraPosition)
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

  useEffect(() => {
    console.log('🧭 Updated waypoints:', waypoints)
  }, [waypoints])

  useEffect(() => {
    if (waypoints.length >= 2) {
      setSegmentSpeeds((prev) => {
        const needed = waypoints.length - 1

        // If segment count is already correct, update only fromId/toId
        if (prev.length === needed) {
          return prev.map((seg, i) => ({
            ...seg,
            fromId: waypoints[i].id,
            toId: waypoints[i + 1].id,
            curveTightness: seg.curveTightness ?? 15, // ← ensure it's present
          }))
        }

        // If too few segments, add new ones
        if (prev.length < needed) {
          const newSegments = []
          for (let i = prev.length; i < needed; i++) {
            newSegments.push({
              fromId: waypoints[i].id,
              toId: waypoints[i + 1].id,
              speed: 10,
              interpolateHeading: true,
              isCurved: false,
              curveTightness: 15, // ← default value
            })
          }
          return [...prev, ...newSegments]
        }

        // If too many segments (waypoints were deleted), truncate
        return prev.slice(0, needed)
      })
    } else {
      setSegmentSpeeds([])
    }
  }, [waypoints])

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

  const handleCurveTightnessChange = (fromId, toId, newTightness) => {
    setSegmentSpeeds((prev) =>
      prev.map((seg) =>
        seg.fromId === fromId && seg.toId === toId ? { ...seg, curveTightness: newTightness } : seg,
      ),
    )
  }

  const targetIndex = targets.findIndex((t) => t.id === selectedTargetId)

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

  const handleSegmentSpeedChange = (fromId, toId, newSpeed) => {
    const fromIndex = waypoints.findIndex((wp) => wp.id === fromId)
    const toIndex = waypoints.findIndex((wp) => wp.id === toId)
    const index = Math.min(fromIndex, toIndex)

    if (index < 0 || index >= segmentSpeeds.length) {
      console.warn('Invalid segment index:', index)
      return
    }

    const newSpeeds = [...segmentSpeeds]
    newSpeeds[index] = {
      ...newSpeeds[index], // keep existing data (interpolateHeading, etc)
      speed: newSpeed, // only update speed
    }
    setSegmentSpeeds(newSpeeds)
  }

  const handleWaypointHeightChange = (waypointId, newHeight) => {
    setWaypoints((prev) =>
      prev.map((wp) => (wp.id === waypointId ? { ...wp, height: newHeight } : wp)),
    )
  }

  const handleApplySpeedToAll = (newSpeed) => {
    const updated = segmentSpeeds.map((seg) => ({
      ...seg,
      speed: newSpeed,
    }))
    setSegmentSpeeds(updated)
    console.log('🚀 Applied speed to all segments:', updated)
  }

  const handleSelectWaypoint = (id) => {
    if (isMobile) setIsMobileCollapsed(false)
    if (isDesktop) setIsDesktopCollapsed(false)

    setExpandedSegmentId(null)
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

  const handleSelectSegment = (fromId, toId) => {
    setExpandedSegmentId(`${fromId}-${toId}`)
    setSelectedWaypoint(null) // Clear any waypoint selection

    if (isMobile) setIsMobileCollapsed(false)
    if (isDesktop) setIsDesktopCollapsed(false)

    const from = waypoints.find((wp) => wp.id === fromId)
    const to = waypoints.find((wp) => wp.id === toId)
    const map = mapRef.current

    if (from && to && map) {
      const midLat = (from.lat + to.lat) / 2
      const midLng = (from.lng + to.lng) / 2
      const zoom = map.getZoom()
      const adjustedZoom = zoom > 19 ? zoom : 19

      const midpoint = L.latLng(midLat, midLng)
      const point = map.project(midpoint, adjustedZoom)

      // Offset for desktop/mobile
      const offsetX = isDesktop ? 150 : 0 // shift left on desktop
      const offsetY = isMobile ? 100 : 0 // shift up on mobile
      const adjustedPoint = L.point(point.x + offsetX, point.y + offsetY)

      const newLatLng = map.unproject(adjustedPoint, adjustedZoom)
      map.setView(newLatLng, adjustedZoom)
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
    console.log(`📍 Handling locate for ${viewMode.toUpperCase()}:`, lat, lng)
    console.log(mapRef.current)
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
    setSegmentSpeeds([])
  }

  // Safely hydrate waypoints for Cesium. Used if your app ever loads saved/incomplete waypoints.
  const hydratedWaypoints = waypoints.map((wp) => ({
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

  // Add fetchFlights function
  const fetchFlights = async () => {
    if (!user) {
      console.log('No user, skipping fetchFlights')
      return
    }

    try {
      console.log('Fetching flights for user:', user.id)

      // Get the current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('Session error:', sessionError)
        throw sessionError
      }
      if (!session) {
        console.error('No active session')
        throw new Error('No active session')
      }

      console.log('Making request to /api/flights')
      const response = await fetch('/api/flights', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText)
        throw new Error(`Failed to fetch flights: ${response.status} ${response.statusText}`)
      }

      const flights = await response.json()
      console.log('Fetched flights:', flights)

      if (!Array.isArray(flights)) {
        console.error('Expected array of flights, got:', typeof flights)
        return
      }

      console.log(`Setting ${flights.length} flights in state`)
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
  const createFlightData = (waypoints, segmentSpeeds, name) => {
    console.log('Raw waypoints:', waypoints) // Debug log

    // Convert Cesium waypoints to plain objects
    const serializedWaypoints = waypoints
      .map((wp, index) => {
        // Debug log for each waypoint
        console.log(`Processing waypoint ${index}:`, wp)

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
          speed: segmentSpeeds.find((s) => s.toId === wp.id)?.speed || 5, // Get speed from segmentSpeeds array
          turnMode: 'CLOCKWISE',
          actions: [],
        }
      })
      .filter((wp) => wp !== null) // Remove any null waypoints

    // Calculate total distance and duration
    const totalDistance = calculateDistance(waypoints)
    const estimatedDuration = estimateDuration(totalDistance, segmentSpeeds)

    const flightData = {
      name,
      date: new Date().toISOString(),
      waypoints: serializedWaypoints,
      segmentSpeeds: segmentSpeeds || [],
      metadata: {
        totalWaypoints: waypoints.length,
        totalDistance,
        estimatedDuration,
      },
      // DJI SDK specific fields
      missionType: 'WAYPOINT',
      maxFlightSpeed: 15,
      autoFlightSpeed: 10,
      finishedAction: 'GO_HOME',
      headingHome: 'TOWARD_POINT_OF_INTEREST',
      flightpathMode: 'NORMAL',
      repeatTimes: 1,
      turnMode: 'CLOCKWISE',
      actions: [],
    }

    // Debug log the final flight data
    console.log('Created flight data:', flightData)

    return flightData
  }

  const handleSaveFlight = async (name) => {
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }

    if (!waypoints || waypoints.length < 2) {
      console.log('Please add at least 2 waypoints before saving')
      return
    }

    try {
      // Get the current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (!session) throw new Error('No active session')

      const flightData = createFlightData(waypoints, segmentSpeeds, name)

      // Log the request data
      console.log('Sending flight data:', JSON.stringify(flightData, null, 2))

      const response = await fetch('/api/flights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(flightData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Server error response:', errorData)
        throw new Error(
          errorData.message || `Failed to save flight: ${response.status} ${response.statusText}`,
        )
      }

      const savedFlight = await response.json()
      setSavedFlights((prev) => [...prev, savedFlight])
      console.log('Flight saved successfully!')
    } catch (error) {
      console.error('Error saving flight:', error)
      console.log(error.message || 'Failed to save flight. Please try again.')
    }
  }

  // Add load flight function
  const handleLoadFlight = (flight) => {
    console.log('Loading flight:', flight) // Debug log

    // Convert saved flight data back to Cesium objects
    const loadedWaypoints = flight.waypoints.map((wp) => {
      console.log('Processing waypoint:', wp) // Debug log

      const waypoint = {
        id: Date.now() + Math.random(), // Generate new ID
        lat: wp.coordinate.latitude,
        lng: wp.coordinate.longitude,
        height: wp.altitude,
        heading: wp.heading,
        pitch: wp.gimbalPitch,
        speed: wp.speed,
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

      console.log('Created waypoint:', waypoint) // Debug log
      return waypoint
    })

    console.log('Loaded waypoints:', loadedWaypoints) // Debug log
    setWaypoints(loadedWaypoints)
    setSegmentSpeeds(flight.segmentSpeeds)
    setShowFlights(false)
  }

  // Add handleDeleteFlight function
  const handleDeleteFlight = async (flightId) => {
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }

    try {
      // Get the current session
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
        throw new Error(`Failed to delete flight: ${response.status} ${response.statusText}`)
      }

      // Remove the flight from state
      setSavedFlights((prev) => prev.filter((flight) => flight.id !== flightId))
      console.log('Flight deleted successfully!')
    } catch (error) {
      console.error('Error deleting flight:', error)
      console.log(error.message || 'Failed to delete flight. Please try again.')
    }
  }

  // Add handleSignOut function
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setShowFlights(false)
    } catch (error) {
      console.error('Error signing out:', error)
      console.log('Error signing out. Please try again.')
    }
  }

  return (
    <div className=" relative w-screen h-screen ">
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
            segmentSpeeds={segmentSpeeds}
            unitSystem={unitSystem}
            mapRef={mapRef}
            droneHeadingRef={droneHeadingRef}
            setDroneHeading={setDroneHeading}
            droneHeading={droneHeading}
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
              {/* Only show icon on sm and up */}
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
            segmentSpeeds={segmentSpeeds}
            googlePhotorealistic={googlePhotorealistic}
            setGooglePhotorealistic={setGooglePhotorealistic}
            currentDate={currentDate}
            currentTime={currentTime}
            currentTimezone={currentTimezone}
            onDateTimeChange={handleDateTimeChange}
          />
        </div>
      </div>

      {/* 🗺 Map View (with top bar padding) */}
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
            segmentSpeeds={segmentSpeeds}
            onTargetClick={(targetId) => {
              setSelectedTargetId(targetId)
            }}
            expandedSegmentId={expandedSegmentId}
            setExpandedSegmentId={setExpandedSegmentId}
            setIsMobileCollapsed={setIsMobileCollapsed}
            setIsDesktopCollapsed={setIsDesktopCollapsed}
            isMobile={isMobile}
            isDesktop={isDesktop}
            onClick={handleSelectWaypoint}
            onSelectSegment={handleSelectSegment}
            droneHeading={droneHeading}
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
            segmentSpeeds={segmentSpeeds}
            unitSystem={unitSystem}
          />
        )}
      </div>

      {/* ✅ Modal rendered globally, not inside map logic */}
      {showCountdown && (
        <CountdownModal
          message={countdownMessage}
          seconds={countdownMessage === 'Starting in' ? 3 : 2}
          onComplete={() => {
            if (countdownMessage === 'Starting in') {
              setDronePosition([waypoints[0].lat, waypoints[0].lng])
              // mission simulation logic
            }
            setShowCountdown(false)
          }}
        />
      )}

      {showTargetModal && targetPendingFocus && (
        <TargetWaypointModal
          waypoints={waypoints}
          targetId={targetPendingFocus.id} // ✅ new target ID
          targetIndex={targets.length} // ✅ next index
          defaultSelectedWaypointIds={waypoints
            .filter((wp) => wp.focusTargetId === targetPendingFocus.id)
            .map((wp) => wp.id)}
          onConfirm={(selectedIds) => {
            const waypointsWithTarget = waypoints.map((wp) =>
              selectedIds.includes(wp.id) ? { ...wp, focusTargetId: targetPendingFocus.id } : wp,
            )

            const updatedWaypoints = recalculateHeadings(waypointsWithTarget, [
              ...targets,
              targetPendingFocus, // ✅ already has `id`
            ])

            setWaypoints(updatedWaypoints)
            setTargets((prev) => [...prev, targetPendingFocus])
            setTargetPendingFocus(null)
            setShowTargetModal(false)
          }}
          onCancel={() => {
            setTargetPendingFocus(null)
            setShowTargetModal(false)
          }}
        />
      )}

      {selectedTargetId !== null && (
        <TargetWaypointModal
          waypoints={waypoints}
          targetId={selectedTargetId}
          targetIndex={targetIndex}
          defaultSelectedWaypointIds={waypoints
            .filter((wp) => wp.focusTargetId === selectedTargetId)
            .map((wp) => wp.id)}
          onConfirm={(selectedIds) => {
            const updatedWaypoints = waypoints.map((wp) => {
              if (selectedIds.includes(wp.id)) {
                return { ...wp, focusTargetId: selectedTargetId }
              } else if (wp.focusTargetId === selectedTargetId) {
                // Unassigned this target
                return { ...wp, focusTargetId: null }
              }
              return wp
            })

            setWaypoints(recalculateHeadings(updatedWaypoints, targets))
            setSelectedTargetId(null)
          }}
          onCancel={() => setSelectedTargetId(null)}
        />
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
            setSelectedTargetId={setSelectedTargetId}
            setShowTargetModal={setShowTargetModal}
            setIsMobileCollapsed={setIsMobileCollapsed}
            onModeChange={setMapMode}
            isMobileCollapsed={isMobileCollapsed}
            expandedSegmentId={expandedSegmentId}
            setExpandedSegmentId={setExpandedSegmentId}
            handleSegmentSpeedChange={handleSegmentSpeedChange}
            segmentSpeeds={segmentSpeeds}
            handleApplySpeedToAll={handleApplySpeedToAll}
            handleSelectSegment={handleSelectSegment}
            targets={targets}
            handleWaypointHeightChange={handleWaypointHeightChange}
            unitSystem={unitSystem}
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
            segmentSpeeds={segmentSpeeds}
            expandedSegmentId={expandedSegmentId}
            setExpandedSegmentId={setExpandedSegmentId}
            handleSegmentSpeedChange={handleSegmentSpeedChange}
            handleApplySpeedToAll={handleApplySpeedToAll}
            setSelectedTargetId={setSelectedTargetId}
            setShowTargetModal={setShowTargetModal}
            onModeChange={setMapMode}
            unitSystem={unitSystem}
            isDesktopCollapsed={isDesktopCollapsed}
            setIsDesktopCollapsed={setIsDesktopCollapsed}
            onSelectSegment={handleSelectSegment}
            setSegmentSpeeds={setSegmentSpeeds}
            handleCurveTightnessChange={handleCurveTightnessChange}
            handleWaypointHeightChange={handleWaypointHeightChange}
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
    </div>
  )
}
