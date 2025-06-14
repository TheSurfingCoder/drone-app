import React, { useState, useRef, useEffect } from 'react'
import MapComponent from './Map'
import CesiumMap from './CesiumMap'
import UnitToggle from './UnitToggle'
import DroneController from './DroneController'
import CurrentLocationButton from './CurrentLocationButton'
import { Cartesian3 } from 'cesium'
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

  const isDesktop = !isMobile

  const [droneHeading, setDroneHeading] = useState(0)
  const droneHeadingRef = useRef(0)

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
    if (wp && mapRef.current) {
      const map = mapRef.current
      const currentZoom = map.getZoom()
      const targetZoom = currentZoom < 19 ? 19 : currentZoom

      const point = map.project([wp.lat, wp.lng], targetZoom)
      const offsetY = 100
      const newPoint = L.point(point.x, point.y + offsetY)
      const targetLatLng = map.unproject(newPoint, targetZoom)

      map.setView(targetLatLng, targetZoom)
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

  const handleAuthClick = () => {
    if (user) {
      setShowFlights(true)
    } else {
      setIsAuthModalOpen(true)
    }
  }

  // Sample flights data - replace with actual data from your backend
  const flights = [
    {
      id: 1,
      name: 'City Center Survey',
      date: '2024-01-15',
      duration: '1h 45m',
      distance: '12.5',
      waypoints: 8,
      thumbnail:
        'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=300&h=200',
    },
    {
      id: 2,
      name: 'Harbor Inspection',
      date: '2024-01-14',
      duration: '2h 15m',
      distance: '15.2',
      waypoints: 12,
      thumbnail:
        'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=300&h=200',
    },
    {
      id: 2,
      name: 'Harbor Inspection',
      date: '2024-01-14',
      duration: '2h 15m',
      distance: '15.2',
      waypoints: 12,
      thumbnail:
        'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=300&h=200',
    },
    {
      id: 2,
      name: 'Harbor Inspection',
      date: '2024-01-14',
      duration: '2h 15m',
      distance: '15.2',
      waypoints: 12,
      thumbnail:
        'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=300&h=200',
    },
    {
      id: 2,
      name: 'Harbor Inspection',
      date: '2024-01-14',
      duration: '2h 15m',
      distance: '15.2',
      waypoints: 12,
      thumbnail:
        'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=300&h=200',
    },
  ]

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
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign In
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
            currentTimeUTC={`${sunTime.toUTCString().slice(17, 22)} UTC`}
            onDateTimeChange={setSunTime}
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
      <QuickAccessToolbar isMobile={isMobile} onModeChange={setMapMode} currentMode={mapMode} />
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
        <MobileFlightPanel onClose={() => setShowFlights(false)} flights={flights} />
      )}
      {showFlights && !isMobile && (
        <DesktopFlightPanel onClose={() => setShowFlights(false)} flights={flights} />
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )
}
