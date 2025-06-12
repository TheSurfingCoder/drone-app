import React, { useState, Fragment, useEffect, useRef } from 'react'
import { ChevronUpIcon, ChevronDownIcon, RefreshCwIcon } from 'lucide-react'

const MobileWaypointPanel = ({
  waypoints,
  selectedWaypoint,
  onSelectWaypoint,
  onUpdateWaypoint,
  onDeleteWaypoint,
  setSelectedTargetId,
  setShowTargetModal,
  setIsMobileCollapsed,
  onModeChange,
  isMobileCollapsed,
  segmentSpeeds,
  expandedSegmentId,
  setExpandedSegmentId,
  handleSegmentSpeedChange,
  handleApplySpeedToAll,
  handleSelectSegment,
  targets,
  handleWaypointHeightChange,
  unitSystem,
}) => {
  const waypointRefs = useRef({})
  const segmentRefs = useRef({})
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
    console.log('🚀 segmentSpeeds updated:', segmentSpeeds)
  }, [segmentSpeeds])

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
    if (!isMobileCollapsed && expandedSegmentId && segmentRefs.current[expandedSegmentId]) {
      segmentRefs.current[expandedSegmentId].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      })
    }
  }, [expandedSegmentId, isMobileCollapsed])

  useEffect(() => {
    if (!isMobileCollapsed && selectedWaypoint !== null) {
      setExpandedPanel(selectedWaypoint)
    }
  }, [selectedWaypoint, isMobileCollapsed])

  const getTotalElevation = (wp) => {
    const totalMeters = (wp.groundHeight ?? 0) + (wp.height ?? 0)
    return unitSystem === 'imperial' ? metersToFeet(totalMeters) : totalMeters
  }

  const getSegmentSpeed = (fromId, toId) => {
    const fromIndex = waypoints.findIndex((wp) => wp.id === fromId)
    const toIndex = waypoints.findIndex((wp) => wp.id === toId)
    const index = Math.min(fromIndex, toIndex)
    return segmentSpeeds?.[index]?.speed ?? 10
  }

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

        <div
          className={`transition-all duration-300 ease-out overflow-hidden ${isMobileCollapsed ? 'max-h-0' : 'max-h-[60vh]'}`}
        >
          <div className="flex overflow-x-auto border-b border-gray-100 px-3 py-1 space-x-1">
            {waypoints.map((wp, index) => (
              <Fragment key={wp.id}>
                <button
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-medium transition-all duration-200 ${expandedPanel === wp.id && !expandedSegmentId ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  onClick={() => onSelectWaypoint(wp.id)}
                  ref={(el) => (waypointRefs.current[wp.id] = el)}
                >
                  #{index + 1}
                </button>
                {index < waypoints.length - 1 && (
                  <div className="flex items-center px-2">
                    <button
                      ref={(el) => {
                        const segId = `${wp.id}-${waypoints[index + 1].id}`
                        segmentRefs.current[segId] = el
                      }}
                      onClick={() => handleSelectSegment(wp.id, waypoints[index + 1].id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full border transition-all duration-200 ${
                        expandedSegmentId === `${wp.id}-${waypoints[index + 1].id}`
                          ? 'bg-amber-100 border-amber-300 shadow-md scale-105'
                          : 'bg-blue-50 hover:bg-blue-100 border-blue-200'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          expandedSegmentId === `${wp.id}-${waypoints[index + 1].id}`
                            ? 'bg-amber-500 animate-bounce'
                            : 'bg-blue-500 animate-pulse'
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          expandedSegmentId === `${wp.id}-${waypoints[index + 1].id}`
                            ? 'text-amber-700'
                            : 'text-blue-700'
                        }`}
                      >
                        {(getSegmentSpeed(wp.id, waypoints[index + 1].id)?.speed ?? 10).toFixed(1)}
                      </span>
                    </button>
                  </div>
                )}
              </Fragment>
            ))}
          </div>

          <div className="overflow-y-auto max-h-[27vh] p-3">
            {/* Waypoint Details */}
            {expandedPanel &&
              !expandedSegmentId &&
              waypoints
                .filter((wp) => wp.id === expandedPanel)
                .map((wp, i) => (
                  <div key={wp.id} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-bold text-gray-800">Waypoint #{i + 1}</h3>
                      <button
                        onClick={() => onDeleteWaypoint(wp.id)}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-medium transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-2 rounded-md">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                          Latitude
                        </span>
                        <p className="font-mono text-xs font-medium">{wp.lat?.toFixed(6)}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-md">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                          Longitude
                        </span>
                        <p className="font-mono text-xs font-medium">{wp.lng?.toFixed(6)}</p>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-blue-700">Height</span>
                        <span className="font-bold text-blue-800 text-sm">
                          {convertHeight(wp.height ?? 0).toFixed(1)} {getUnitLabel()}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={getMaxHeight()}
                        step={unitSystem === 'imperial' ? '1' : '0.5'}
                        value={convertHeight(wp.height ?? 0)}
                        onChange={(e) =>
                          handleWaypointHeightChange(
                            wp.id,
                            convertHeightToMeters(parseFloat(e.target.value)),
                          )
                        }
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-[10px] text-blue-600 mt-1">
                        <span>0{getUnitLabel()}</span>
                        <span>
                          {getMaxHeight()}
                          {getUnitLabel()}
                        </span>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-blue-700">Ground Height</span>
                        <span className="font-bold text-blue-800 text-sm">
                          {convertHeight(wp.groundHeight ?? 0).toFixed(1)} {getUnitLabel()}
                        </span>
                      </div>
                    </div>

                    <div className="bg-green-50 p-2 rounded-md border border-green-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-green-700">Total Elevation</span>
                        <span className="font-bold text-green-800 text-sm">
                          {getTotalElevation(wp).toFixed(1)} {getUnitLabel()}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-600">Focus Target</span>
                        <span className="text-xs text-gray-800">
                          {wp.focusTargetId !== null
                            ? (() => {
                                const index = targets.findIndex((t) => t.id === wp.focusTargetId)
                                return `#${index + 1}`
                              })()
                            : 'None'}
                        </span>
                      </div>
                      {wp.focusTargetId !== null ? (
                        <button
                          onClick={() => {
                            setSelectedTargetId(wp.focusTargetId)
                            setShowTargetModal(true)
                          }}
                          className="text-xs text-blue-600 underline hover:text-blue-800"
                        >
                          Change Focus Target
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setIsMobileCollapsed(true)
                            onModeChange('target')
                          }}
                          className="text-xs text-blue-600 underline hover:text-blue-800"
                        >
                          Add Focus Target
                        </button>
                      )}
                    </div>
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
                ))}

            {/* Segment Speed Editor */}
            {expandedSegmentId &&
              (() => {
                const [fromId, toId] = expandedSegmentId.split('-').map(Number)
                const speed = getSegmentSpeed(fromId, toId)
                console.log('🔥 Rendering speed slider with value:', speed)
                return (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-lg font-bold text-gray-800">
                          {speed.toFixed(1)} m/s
                        </span>
                      </div>
                      <button
                        onClick={() => handleApplySpeedToAll(speed)}
                        className="flex items-center text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded-md border border-blue-200 transition-colors"
                      >
                        <RefreshCwIcon size={12} className="mr-1" />
                        All
                      </button>
                    </div>
                    <div className="space-y-1">
                      <input
                        type="range"
                        min="0.1"
                        max="20"
                        step="0.1"
                        value={speed}
                        onChange={(e) =>
                          handleSegmentSpeedChange(fromId, toId, Number(e.target.value))
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(speed / 20) * 100}%, #e5e7eb ${(speed / 20) * 100}%, #e5e7eb 100%)`,
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>0.1</span>
                        <span>20 m/s</span>
                      </div>
                    </div>
                  </div>
                )
              })()}
          </div>
        </div>
      </div>
    </>
  )
}

export default MobileWaypointPanel
