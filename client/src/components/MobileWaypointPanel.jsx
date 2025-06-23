import React, { useState, Fragment, useEffect, useRef } from 'react'
import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react'

const MobileWaypointPanel = ({
  waypoints,
  selectedWaypoint,
  onSelectWaypoint,
  onUpdateWaypoint,
  onDeleteWaypoint,
  setIsMobileCollapsed,
  onModeChange,
  isMobileCollapsed,
  handleWaypointHeightChange,
  handleWaypointSpeedChange,
  handleWaypointCurvatureChange,
  targets,
  unitSystem,
  missionSettings,
}) => {
  const waypointRefs = useRef({})
  const [expandedPanel, setExpandedPanel] = useState(null)

  // Conversion functions
  const metersToFeet = (meters) => meters * 3.28084
  const feetToMeters = (feet) => feet / 3.28084

  // Convert height based on unit system
  const convertHeight = (height) => {
    if (unitSystem === 'imperial') {
      return metersToFeet(height)
    }
    return height
  }

  // Convert height back to meters for storage
  const convertHeightToMeters = (height) => {
    if (unitSystem === 'imperial') {
      return feetToMeters(height)
    }
    return height
  }

  // Get the appropriate unit label
  const getUnitLabel = () => (unitSystem === 'imperial' ? 'ft' : 'm')

  // Get max height based on unit system
  const getMaxHeight = () => (unitSystem === 'imperial' ? 328 : 100) // 100m = ~328ft

  useEffect(() => {
    if (!isMobileCollapsed && selectedWaypoint && waypointRefs.current[selectedWaypoint]) {
      waypointRefs.current[selectedWaypoint].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      })
    }
  }, [selectedWaypoint, isMobileCollapsed])

  useEffect(() => {
    if (!isMobileCollapsed && selectedWaypoint !== null) {
      setExpandedPanel(selectedWaypoint)
    }
  }, [selectedWaypoint, isMobileCollapsed])

  return (
    <>
      <div className="md:hidden w-full h-auto bg-white rounded-t-xl shadow-2xl transition-all duration-300 ease-out">
        <div
          className="w-full flex flex-col items-center py-2 cursor-pointer border-b border-gray-100"
          onClick={() => setIsMobileCollapsed(!isMobileCollapsed)}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full mb-1"></div>
          <div className="flex items-center justify-between w-full px-3">
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-gray-800 text-sm">Waypoints</h2>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {waypoints.length}
              </span>
            </div>
            {isMobileCollapsed ? (
              <ChevronUpIcon size={18} className="text-gray-500" />
            ) : (
              <ChevronDownIcon size={18} className="text-gray-500" />
            )}
          </div>
        </div>

        <div className="max-h-[60vh] overflow-hidden">
          {/* Waypoint List */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {waypoints.map((wp, index) => (
                <Fragment key={wp.id}>
                  <button
                    onClick={() => onSelectWaypoint(wp.id)}
                    className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                      selectedWaypoint === wp.id
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                    ref={(el) => (waypointRefs.current[wp.id] = el)}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        selectedWaypoint === wp.id
                          ? 'bg-white text-blue-500'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium">WP {index + 1}</span>
                  </button>
                  {index < waypoints.length - 1 && (
                    <div className="flex items-center px-1">
                      <div className="w-2 h-0.5 bg-gray-300 rounded-full" />
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto max-h-[27vh] p-3">
            {/* Waypoint Details */}
            {expandedPanel &&
              waypoints
                .filter((wp) => wp.id === expandedPanel)
                .map((wp) => (
                  <div key={wp.id} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-600">Latitude</span>
                          <span className="text-xs font-mono text-gray-800">
                            {wp.lat?.toFixed(5)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-600">Longitude</span>
                          <span className="text-xs font-mono text-gray-800">
                            {wp.lng?.toFixed(5)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-gray-600">Height</span>
                        <span className="text-xs font-mono text-gray-800">
                          {convertHeight(wp.height).toFixed(1)} {getUnitLabel()}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={getMaxHeight()}
                        step={unitSystem === 'imperial' ? '1' : '0.5'}
                        value={convertHeight(wp.height)}
                        onChange={(e) =>
                          handleWaypointHeightChange(
                            wp.id,
                            convertHeightToMeters(parseFloat(e.target.value)),
                          )
                        }
                        className="w-full"
                      />
                    </div>

                    {/* Speed Control */}
                    <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-gray-600">Speed</span>
                        <span className="text-xs font-mono text-gray-800">
                          {(wp.speed ?? 10).toFixed(1)} m/s
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="20"
                        step="0.1"
                        value={wp.speed ?? 10}
                        onChange={(e) =>
                          handleWaypointSpeedChange(wp.id, parseFloat(e.target.value))
                        }
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>0.1</span>
                        <span>20 m/s</span>
                      </div>
                    </div>

                    {/* Curvature Control */}
                    {missionSettings?.flightPathMode === 'CURVED' ? (
                      <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium text-gray-600">Corner Radius</span>
                          <span
                            className={`text-xs font-mono ${(wp.cornerRadius ?? 0.2) < 0 ? 'text-red-600' : 'text-blue-600'}`}
                          >
                            {(wp.cornerRadius ?? 0.2).toFixed(1)} m
                            {(wp.cornerRadius ?? 0.2) < 0 ? ' (Inward)' : ' (Outward)'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="100"
                          step="0.1"
                          value={wp.cornerRadius ?? 0.2}
                          onChange={(e) =>
                            handleWaypointCurvatureChange(wp.id, parseFloat(e.target.value))
                          }
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>Inward (-50m)</span>
                          <span>Outward (100m)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                        <div className="text-center">
                          <p className="text-xs text-gray-600">
                            ⚠️ Curvature disabled in Normal mode
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-600">Heading</span>
                          <span className="text-xs font-mono text-gray-800">
                            {typeof wp.heading === 'number' ? `${wp.heading.toFixed(1)}°` : '—'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-600">Pitch</span>
                          <span className="text-xs font-mono text-gray-800">
                            {typeof wp.pitch === 'number' ? `${wp.pitch.toFixed(1)}°` : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default MobileWaypointPanel
