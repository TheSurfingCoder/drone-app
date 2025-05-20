import { useState, useRef } from 'react';
import MapComponent from './Map';
import CesiumMap from './CesiumMap';
import UnitToggle from './UnitToggle';
import DroneController from './DroneController';
import LogPanel from './LogPanel';
import WaypointList from './WaypointList';
import MetricsPanel from './MetricsPanel';
import CurrentLocationButton from './CurrentLocationButton';
import { Cartesian3 } from '@cesium/engine';
import React from 'react';
import RedBox from './Redbox';
import BottomSheet from './BottomSheet';
import QuickAccessToolbar from './QuickAccessToolbar';
import ModernStatusPill from './ModernStatusPill';
export default function MissionPlannerWrapper() {
  const [viewMode, setViewMode] = useState('2d');
  const [waypoints, setWaypoints] = useState([]);
  const [unitSystem, setUnitSystem] = useState('metric');
  const [dronePosition, setDronePosition] = useState([37.7749, -122.4194]); // SF default
  const [logs, setLogs] = useState([]);
  const mapRef = useRef(null);
  const viewerRef = useRef(null);
  const [mapMode, setMapMode] = useState('waypoint')
  const [targets, setTargets] = useState([])

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
    <div className="flex flex-col relative w-screen h-screen ">

      {/* 🧭 Top Bar */}
      <div className="relative w-full h-[56px] sm:h-auto py-2 items-center bg-white px-4 flex flex-row justify-between gap-2 z-99 sm:h-auto
    
     sm:px-4  sm:py-0
     sm:flex-row
     sm:items-center
     sm:gap-0
     sm:py-2
      ">

        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1 items-center px-2 py-1 text-xs sm:flex sm:flex-row sm:items-center sm:gap-2 sm:text-base  ">
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
        <div
        className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[900]`}
      >        <ModernStatusPill waypoints={waypoints} unitSystem={unitSystem}></ModernStatusPill>
      </div>
      </div>

      {/* 🗺 Map View (with top bar padding) */}
      <div className=" flex-1">
        {console.trace("🟦 Div wrapper for 2D/3D map rendered")}
        {viewMode === '2d' ? (
          <MapComponent
            waypoints={waypoints}
            setWaypoints={setWaypoints}
            targets={targets}
            setTargets={setTargets}
            unitSystem={unitSystem}
            setUnitSystem={setUnitSystem}
            dronePosition={dronePosition}
            mapMode={mapMode}
            ref={mapRef} />

        ) : (
          <CesiumMap
            waypoints={waypoints}
            setWaypoints={setWaypoints}
            unitSystem={unitSystem}
            setUnitSystem={setUnitSystem}
            ref={viewerRef}
            mapMode={mapMode}
          />
        )}
      </div>

      {/* 📍 Floating Panels */}

      <QuickAccessToolbar
        onModeChange={setMapMode}
        currentMode={mapMode}
      ></QuickAccessToolbar>



     







    </div>
  );
}






