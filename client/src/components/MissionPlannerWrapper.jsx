import { useState, useRef } from 'react';
import MapComponent from './Map';
import CesiumMap from './CesiumMap';
import UnitToggle from './UnitToggle';
import DroneController from './DroneController';
import LogPanel from './LogPanel';
import WaypointList from './WaypointList';
import CurrentLocationButton from './CurrentLocationButton';
import { Cartesian3 } from '@cesium/engine';
import React from 'react';
import BottomSheet from './BottomSheet';
import QuickAccessToolbar from './QuickAccessToolbar';
import ModernStatusPill from './ModernStatusPill';
import { calculateHeading } from '../utils/headingUtils' // we'll create this next
import TargetWaypointModal from './TargetWayPointModal';
import { recalculateHeadings } from '../utils/recalculateHeadings';
import CountdownModal from './CountdownModal';
import AltitudeSlider from './AltitudeSlider';

export default function MissionPlannerWrapper() {
  const [viewMode, setViewMode] = useState('2d');
  const [waypoints, setWaypoints] = useState([]);
  const [unitSystem, setUnitSystem] = useState('metric');
  const [dronePosition, setDronePosition] = useState(null); // SF default
  const [logs, setLogs] = useState([]);
  const mapRef = useRef(null);
  const viewerRef = useRef(null);
  const [mapMode, setMapMode] = useState('waypoint')
  const [targets, setTargets] = useState([])
  const [showTargetModal, setShowTargetModal] = useState(false)
  const [targetPendingFocus, setTargetPendingFocus] = useState(null)
  const [selectedTargetId, setSelectedTargetId] = useState(null)
  const [showCountdown, setShowCountdown] = useState(false)
  const [countdownMessage, setCountdownMessage] = useState("Starting in")


  const selectedTarget = targets.find((t) => t.id === selectedTargetId)
  const targetIndex = targets.findIndex((t) => t.id === selectedTargetId)



  const handleLocateMe = (lat, lng) => {
    console.log(`📍 Handling locate for ${viewMode.toUpperCase()}:`, lat, lng);
    console.log(mapRef.current)
    if (viewMode === '2d') {
      const map = mapRef.current;
      map.setView([lat, lng], 15);
      map.invalidateSize()




    }

    if (viewMode === '3d') {
      const viewer = viewerRef.current?.cesiumElement;
      if (viewer) {
        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(lng, lat, 1500),
        });
      } else {
        console.warn("3D viewer not ready.");
      }
    }
  };


  const clearWaypoints = () => {
    setWaypoints([]);
    setTargets([])
  };

  const clearLogs = () => {
    setLogs([]);
  };




  return (
    <div className="flex flex-col relative w-screen h-screen">
      {/* 🧭 Top Bar */}
      <div className="relative w-full h-[56px] sm:h-auto py-2 items-center bg-white px-4 flex flex-row justify-between gap-2 z-99 sm:h-auto sm:px-4 sm:py-0 sm:flex-row sm:items-center sm:gap-0 sm:py-2">
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
          />
        </div>
        <div>
          <button
            className="bg-blue-600 text-white px-3 py-0 rounded text-xs sm:text-base"
            onClick={() => setViewMode(viewMode === '2d' ? '3d' : '2d')}
          >
            Switch to {viewMode === '2d' ? '3D' : '2D'}
          </button>
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[900]">
          <ModernStatusPill waypoints={waypoints} unitSystem={unitSystem} />
        </div>
      </div>

      {/* 🗺 Map View (with top bar padding) */}
      <div className="flex-1">
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
              setSelectedTargetId(targetId)
            }}
          />
        ) : (
          <CesiumMap
            waypoints={waypoints}
            setWaypoints={setWaypoints}
            unitSystem={unitSystem}
            setUnitSystem={setUnitSystem}
            ref={viewerRef}
            overlayType={mapMode}
            dronePosition={dronePosition}
            setDronePosition={setDronePosition}
            targets={targets}
            setTargets={setTargets}
          />
        )}
      </div>

      {/* ✅ Modal rendered globally, not inside map logic */}
      {showCountdown && (
        <CountdownModal
          message={countdownMessage}
          seconds={countdownMessage === "Starting in" ? 3 : 2}
          onComplete={() => {
            if (countdownMessage === "Starting in") {
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
          targetIndex={targets.length}     // ✅ next index
          defaultSelectedWaypointIds={waypoints
            .filter((wp) => wp.focusTargetId === targetPendingFocus.id)
            .map((wp) => wp.id)}
          onConfirm={(selectedIds) => {
            const waypointsWithTarget = waypoints.map((wp) =>
              selectedIds.includes(wp.id)
                ? { ...wp, focusTargetId: targetPendingFocus.id }
                : wp
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
      <QuickAccessToolbar onModeChange={setMapMode} currentMode={mapMode} />
      <div className="sm:absolute sm:top-[4.5rem] sm:right-4 sm:z-30 sm:w-80 hidden sm:block">
        <WaypointList waypoints={waypoints} setWaypoints={setWaypoints} unitSystem={unitSystem} />
      </div>
    </div>

  )

}






