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
import { useTimeline } from '../contexts/TimelineContext'
import AuthModal from './AuthModal'
import { UserIcon } from 'lucide-react'
import { DesktopFlightPanel } from './DesktopFlightPanel'
import MobileFlightPanel from './MobileFlightPanel'
import { recalculateHeadings } from '../utils/recalculateHeadings'
import { supabase } from '../lib/supabase'
import { DateTime } from 'luxon'
import POIGuidance from './POIGuidance'
import POIRemovalModal from './POIRemovalModal'
import CesiumDroneSimulation from './CesiumDroneSimulation'
import { createMission, getMissions, deleteMission } from '../services/missionService'

// Add flight data structure

export default function MissionPlannerWrapper() {
  const [viewMode, setViewMode] = useState('2d')
  const [waypoints, setWaypoints] = useState([])
  const [unitSystem, setUnitSystem] = useState('metric')
  const [dronePosition, setDronePosition] = useState(null)
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
  const isDesktop = !isMobile
  const [droneHeading, setDroneHeading] = useState(0)
  const droneHeadingRef = useRef(0)

  // Simulation state management
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationType, setSimulationType] = useState(null) // '2d' or '3d'
  const [show3DCountdown, setShow3DCountdown] = useState(false)
  const [shouldCancelSimulation, setShouldCancelSimulation] = useState(false)
  const [show3DSimulation, setShow3DSimulation] = useState(false)

  // Timeline context
  const { elements, removeElement, updateElement } = useTimeline()

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
    flightName: '', // Flight name for saving
    homeLat: null, // Home location latitude
    homeLng: null, // Home location longitude
    droneType: '', // Selected drone type
    batteryAction: 'return_home', // Action on low battery
    batteryThreshold: 20, // Battery threshold percentage
    signalLostAction: 'hover', // Action on signal loss
  })

  // Dynamic date/time/timezone state
  const [currentDate, setCurrentDate] = useState(DateTime.now().toFormat('yyyy-MM-dd'))
  const [currentTime, setCurrentTime] = useState(DateTime.now().toFormat('HH:mm'))
  const [currentTimezone, setCurrentTimezone] = useState('UTC')

  const lastCameraPosition = useRef(null)

  // Home location state
  const [homeLocation, setHomeLocation] = useState(null)
  const [isSettingHomeLocation, setIsSettingHomeLocation] = useState(false)

  // Add fetchMissions function (moved up to fix ESLint error)
  const fetchMissions = async () => {
    if (!user) {
      return
    }

    try {
      const missions = await getMissions(supabase)
      setSavedFlights(missions) // Keep the same state variable for now
    } catch (error) {
      console.error('Error fetching missions:', error)
    }
  }

  // Create mission data function (moved up to fix ESLint error)
  const createMissionData = (waypoints, name) => {
    // Convert Cesium waypoints to plain objects
    const serializedWaypoints = waypoints
      .map((wp, index) => {
        if (typeof wp.lat === 'undefined' || typeof wp.lng === 'undefined') {
          console.error(`Waypoint ${index} is missing lat/lng:`, wp)
          return null
        }

        return {
          id: `wp${index}`,
          coordinate: {
            latitude: wp.lat,
            longitude: wp.lng,
          },
          altitude: wp.height || 0,
          heading: wp.heading || 0,
          gimbalPitch: wp.pitch || 0,
          speed: wp.speed || 10,
          cornerRadius: wp.cornerRadius || 0.2,
          turnMode: 'CLOCKWISE',
          actions: [],
        }
      })
      .filter((wp) => wp !== null)

    // Create timeline element for waypoint mission
    const timelineElement = {
      id: '1',
      type: 'waypoint-mission',
      order: 0,
      config: {
        autoFlightSpeed: missionSettings.autoFlightSpeed || 10,
        maxFlightSpeed: missionSettings.maxFlightSpeed || 15,
        finishedAction: missionSettings.finishedAction || 'GO_HOME',
        repeatTimes: missionSettings.repeatTimes || 1,
        globalTurnMode: missionSettings.globalTurnMode || 'CLOCKWISE',
        gimbalPitchRotationEnabled: missionSettings.gimbalPitchRotationEnabled || true,
        headingMode: missionSettings.headingMode || 'USING_WAYPOINT_HEADING',
        flightPathMode: missionSettings.flightPathMode || 'NORMAL',
        waypoints: serializedWaypoints,
      },
    }

    const missionData = {
      name: name,
      timelineElements: [timelineElement],
      globalSettings: {
        batteryAction: missionSettings.batteryAction || 'GO_HOME',
        batteryThreshold: missionSettings.batteryThreshold || 20,
        signalLostAction: missionSettings.signalLostAction || 'GO_HOME',
        droneType: missionSettings.droneType || 'DJI_Mavic_3',
      },
    }

    return missionData
  }

  const handleSaveMission = async (name) => {
    if (!user) {
      console.error('No user logged in')
      return
    }

    try {
      const missionData = createMissionData(waypoints, name)
      await createMission(missionData, supabase)

      // Refresh missions list
      await fetchMissions()
    } catch (error) {
      console.error('Error saving mission:', error)
    }
  }

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
  const updateWaypointsWithHeadingSystem = (newWaypoints, newTargets = targets) => {
    // Recalculate headings using the proper utility function
    const headingResult = recalculateHeadings(newWaypoints, newTargets, missionSettings, [])

    // Update waypoints with calculated headings
    setWaypoints(headingResult.waypoints)

    // Update heading system with the result
    setHeadingSystem(headingResult)
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

    // Remove waypoint mission timeline elements when clearing waypoints
    elements.forEach((element) => {
      if (element.type === 'waypoint-mission') {
        removeElement(element.id)
      }
    })
  }

  // Fetch flights when user signs in
  useEffect(() => {
    if (user) {
      fetchMissions()
    }
  }, [user])

  const handleAuthClick = () => {
    if (user) {
      fetchMissions() // Fetch flights when opening the panel
      setShowFlights(true)
    } else {
      setIsAuthModalOpen(true)
    }
  }

  const handleLoadMission = (mission) => {
    // Find the waypoint mission element
    const waypointElement = mission.timelineElements.find((el) => el.type === 'waypoint-mission')

    if (!waypointElement || !waypointElement.config.waypoints) {
      console.error('No waypoint mission found in mission data')
      return
    }

    // Convert saved waypoint data back to Cesium objects
    const loadedWaypoints = waypointElement.config.waypoints.map((wp) => {
      const waypoint = {
        id: Date.now() + Math.random(), // Generate new ID
        lat: wp.coordinate.latitude,
        lng: wp.coordinate.longitude,
        height: wp.altitude,
        heading: wp.heading,
        pitch: wp.gimbalPitch,
        speed: wp.speed || 10,
        cornerRadius: wp.cornerRadius || 0.2,
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

    // Load global settings if they exist
    if (mission.globalSettings) {
      setMissionSettings((prev) => ({
        ...prev,
        ...mission.globalSettings,
      }))
    }

    setShowFlights(false)
  }

  // Add handleDeleteFlight function
  const handleDeleteMission = async (missionId) => {
    if (!user) {
      console.error('No user logged in')
      return
    }

    try {
      await deleteMission(missionId, supabase)
      await fetchMissions() // Refresh the list
    } catch (error) {
      console.error('Error deleting mission:', error)
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
    const updatedTargets = []
    setTargets(updatedTargets)

    // Switch to Auto heading mode
    setMissionSettings((prev) => ({
      ...prev,
      headingMode: 'AUTO',
    }))

    // Update waypoints with new heading system
    updateWaypointsWithHeadingSystem(updatedWaypoints, updatedTargets)

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
    const updatedTargets = []
    setTargets(updatedTargets)

    // Switch to Auto heading mode
    setMissionSettings((prev) => ({
      ...prev,
      headingMode: 'AUTO',
    }))

    // Update waypoints with new heading system
    updateWaypointsWithHeadingSystem(updatedWaypoints, updatedTargets)
  }

  // Handle setting home location
  const handleSetHomeLocation = () => {
    setIsSettingHomeLocation(true)
    // The actual placement will be handled by map click events
  }

  // Handle map click for home location placement
  const handleMapClick = (lat, lng) => {
    if (isSettingHomeLocation) {
      setHomeLocation({ lat, lng })
      setMissionSettings((prev) => ({
        ...prev,
        homeLat: lat,
        homeLng: lng,
      }))
      setIsSettingHomeLocation(false)
      return
    }

    // Existing waypoint/target placement logic
    if (mapMode === 'waypoint') {
      const newWaypoint = {
        id: Date.now() + Math.random(),
        lat,
        lng,
        height: 50,
        heading: null,
        pitch: 0,
        speed: missionSettings.autoFlightSpeed,
        cornerRadius: 0.2,
        turnMode: 'CLOCKWISE',
        groundHeight: 0,
        groundPosition: Cartesian3.fromDegrees(lng, lat, 0),
        elevatedPosition: Cartesian3.fromDegrees(lng, lat, 50),
      }
      setWaypoints((prev) => [...prev, newWaypoint])
    } else if (mapMode === 'target') {
      const newTarget = {
        id: Date.now() + Math.random(),
        lat,
        lng,
        name: `Target ${targets.length + 1}`,
      }
      setTargets((prev) => [...prev, newTarget])
    }
  }

  // Update heading system when mission settings change
  useEffect(() => {
    if (Array.isArray(waypoints) && waypoints.length > 0) {
      // Recalculate headings when mission settings change
      const headingResult = recalculateHeadings(waypoints, targets, missionSettings, [])
      setWaypoints(headingResult.waypoints)
      setHeadingSystem(headingResult)
    }
  }, [missionSettings.headingMode, missionSettings.autoFlightSpeed])

  // Hide POI guidance when targets are added
  useEffect(() => {
    if (showPOIGuidance && targets.length > 0) {
      setShowPOIGuidance(false)
    }
  }, [targets.length, showPOIGuidance])

  // Update waypoint mission timeline elements when waypoints change
  useEffect(() => {
    // Only update timeline elements if there are waypoints and timeline elements exist
    if (waypoints.length > 0 && elements.length > 0) {
      elements.forEach((element) => {
        if (element.type === 'waypoint-mission') {
          // Only update if the waypoints have actually changed
          const currentWaypointIds = element.config?.waypoints?.map((wp) => wp.id) || []
          const newWaypointIds = waypoints.map((wp) => wp.id)

          // Check if waypoint IDs have changed (indicating waypoints were added/removed)
          const waypointsChanged =
            currentWaypointIds.length !== newWaypointIds.length ||
            currentWaypointIds.some((id, index) => id !== newWaypointIds[index])

          if (waypointsChanged) {
            updateElement(element.id, {
              config: {
                ...element.config,
                waypoints: waypoints.map((wp) => ({ ...wp })),
              },
            })
          }
        }
      })
    }
  }, [waypoints.length, elements.length, updateElement]) // Only depend on lengths, not the full arrays

  // Handle view mode changes and cancel ongoing simulations
  const handleViewModeChange = (newViewMode) => {
    // Always cancel any ongoing simulation or countdown when switching view modes
    console.log(`🔄 Switching from ${viewMode} to ${newViewMode} - canceling all simulations`)
    console.log('Current state:', { isSimulating, simulationType, showCountdown, show3DCountdown })

    // Cancel any ongoing simulation
    if (isSimulating) {
      console.log(`🛑 Cancelling ${simulationType} simulation due to view mode change`)
      setIsSimulating(false)
      setSimulationType(null)
    }

    // Always cancel both countdown states
    console.log('🛑 Canceling both countdown states')
    setShowCountdown(false)
    setShow3DCountdown(false)
    setDronePosition(null)
    setDroneHeading(0)
    setShouldCancelSimulation(true) // Signal to cancel simulation

    console.log('🛑 Setting shouldCancelSimulation = true', shouldCancelSimulation)

    setViewMode(newViewMode)
  }

  const handleStartSimulation = () => {
    if (!waypoints || waypoints.length === 0) {
      setCountdownMessage('There are no waypoints. Please click on the map to set some.')
      setShowCountdown(true)
      return
    }

    if (shouldCancelSimulation) {
      setShouldCancelSimulation(false)
    }

    if (viewMode === '3d') {
      // Start 3D simulation
      console.log('🚁 Starting 3D simulation...')
      setIsSimulating(true)
      setSimulationType('3d')
      setShow3DCountdown(true)
      setCountdownMessage('Starting 3D simulation in')
    } else {
      // Start 2D simulation
      console.log('🗺️ Starting 2D simulation...')
      setShowCountdown(true)
      setCountdownMessage('Starting in')
    }
  }

  const handle3DSimulationComplete = () => {
    console.log('✅ 3D simulation completed')
    setIsSimulating(false)
    setSimulationType(null)
    setShow3DSimulation(false)
  }

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
            viewMode={viewMode}
            onStartSimulation={handleStartSimulation}
            shouldCancelSimulation={shouldCancelSimulation}
            setShouldCancelSimulation={setShouldCancelSimulation}
          />
        </div>
        <div className="flex items-center space-x-4">
          <button
            className="bg-blue-600 text-white px-3 py-0 rounded text-xs sm:text-base"
            onClick={() => handleViewModeChange(viewMode === '2d' ? '3d' : '2d')}
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
            onClick={handleMapClick}
            droneHeading={droneHeading}
            missionSettings={missionSettings}
            updateWaypointsWithHeadingSystem={updateWaypointsWithHeadingSystem}
            setShowMultipleTargetsModal={setShowMultipleTargetsModal}
            homeLocation={homeLocation}
            isSettingHomeLocation={isSettingHomeLocation}
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
            homeLocation={homeLocation}
            isSettingHomeLocation={isSettingHomeLocation}
            onMapClick={handleMapClick}
            show3DSimulation={show3DSimulation}
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

      {/* 3D Simulation Countdown Modal */}
      {show3DCountdown && (
        <CountdownModal
          message={countdownMessage}
          seconds={3}
          onComplete={() => {
            console.log('🔍 3D countdown onComplete triggered')
            if (
              countdownMessage === 'Starting 3D simulation in' &&
              Array.isArray(waypoints) &&
              waypoints.length > 0
            ) {
              console.log('🚁 3D simulation countdown complete - starting simulation...')
              setShow3DCountdown(false)
              setShow3DSimulation(true)
            }
            setShow3DCountdown(false)
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
                  updateWaypointsWithHeadingSystem(updatedWaypoints, newTargets)
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
        onSetHomeLocation={handleSetHomeLocation}
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
            onDeleteWaypoint={handleDeleteWaypoint}
            onModeChange={setMapMode}
            isDesktopCollapsed={isDesktopCollapsed}
            setIsDesktopCollapsed={setIsDesktopCollapsed}
            handleWaypointHeightChange={handleWaypointHeightChange}
            handleWaypointSpeedChange={handleWaypointSpeedChange}
            handleWaypointCurvatureChange={handleWaypointCurvatureChange}
            handleWaypointHeadingChange={handleWaypointHeadingChange}
            missionSettings={missionSettings}
            onMissionSettingChange={handleMissionSettingChange}
            unitSystem={unitSystem}
            targets={targets}
            headingSystem={headingSystem}
            onRemoveTarget={handleRemoveTarget}
            clearWaypoints={clearWaypoints}
            onSave={() => handleSaveMission(missionSettings.flightName)}
          />
        </div>
      )}

      {/* Flight Panels */}
      {showFlights && isMobile && (
        <MobileFlightPanel
          onClose={() => setShowFlights(false)}
          flights={savedFlights}
          onLoadFlight={handleLoadMission}
          onDeleteFlight={handleDeleteMission}
          onSignOut={handleSignOut}
        />
      )}
      {showFlights && !isMobile && (
        <DesktopFlightPanel
          onClose={() => setShowFlights(false)}
          flights={savedFlights}
          onLoadFlight={handleLoadMission}
          onDeleteFlight={handleDeleteMission}
          onSignOut={handleSignOut}
        />
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

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

      {/* 3D Simulation Component */}
      {show3DSimulation && (
        <CesiumDroneSimulation
          waypoints={waypoints}
          viewerRef={viewerRef}
          setLogs={setLogs}
          onSimulationComplete={handle3DSimulationComplete}
          currentDate={currentDate}
          currentTime={currentTime}
          currentTimezone={currentTimezone}
        />
      )}
    </div>
  )
}
