import React, { useState } from 'react'
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'

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
  isMobileCollapsed
}) => {
  const [expandedPanel, setExpandedPanel] = useState(null)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)

  if (!waypoints.length) return null

  const getTotalElevation = (wp) => {
    return (wp.groundHeight ?? 0) + (wp.height ?? 0)
  }

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white rounded-t-xl shadow-2xl transition-all duration-300 ease-out">
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
        <div className={`transition-all duration-300 ease-out overflow-hidden ${isMobileCollapsed ? 'max-h-0' : 'max-h-[60vh]'}`}>
          <div className="flex overflow-x-auto border-b border-gray-100 px-3 py-1 space-x-1">
            {waypoints.map((wp) => (
              <button
                key={wp.id}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-medium transition-all duration-200 ${expandedPanel === wp.id || selectedWaypoint === wp.id ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                onClick={() => {
                  setExpandedPanel(wp.id)
                  onSelectWaypoint(wp.id)
                }}
              >
                #{wp.id}
              </button>
            ))}
          </div>
          <div className="overflow-y-auto max-h-[45vh] p-3">
            {expandedPanel &&
              waypoints.filter((wp) => wp.id === expandedPanel).map((wp) => (
                <div key={wp.id} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-bold text-gray-800">Waypoint #{wp.id}</h3>
                    <button
                      onClick={() => onDeleteWaypoint(wp.id)}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-medium transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-2 rounded-md">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wide">Latitude</span>
                      <p className="font-mono text-xs font-medium">{wp.lat?.toFixed(6)}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-md">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wide">Longitude</span>
                      <p className="font-mono text-xs font-medium">{wp.lng?.toFixed(6)}</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-blue-700">Height</span>
                      <span className="font-bold text-blue-800 text-sm">{wp.height?.toFixed(1)} m</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={wp.height}
                      onChange={(e) =>
                        onUpdateWaypoint(wp.id, {
                          height: parseFloat(e.target.value),
                        })
                      }
                      className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-[10px] text-blue-600 mt-1">
                      <span>0m</span>
                      <span>100m</span>
                    </div>
                  </div>
                  <div className="bg-green-50 p-2 rounded-md border border-green-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-green-700">Total Elevation</span>
                      <span className="font-bold text-green-800 text-sm">
                        {getTotalElevation(wp).toFixed(1)} m
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-600">Focus Target</span>
                      <span className="text-xs text-gray-800">
                        {wp.focusTargetId != null ? `#${wp.focusTargetId}` : 'None'}
                      </span>
                    </div>
                    {wp.focusTargetId != null ? (
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
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default MobileWaypointPanel