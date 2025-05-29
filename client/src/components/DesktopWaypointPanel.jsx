import React from 'react'
import { ChevronLeftIcon, XIcon } from 'lucide-react'
import SpeedConnector from './SpeedConnector'

export default function DesktopWaypointPanel({
  waypoints,
  selectedWaypoint,
  onSelectWaypoint,
  onUpdateWaypoint,
  onDeleteWaypoint,
  onModeChange,
  setSelectedTargetId,
  setShowTargetModal,
  isDesktopCollapsed,
  setIsDesktopCollapsed,
  segmentSpeeds,
  handleSegmentSpeedChange,
  handleApplySpeedToAll,
  expandedSegmentId,
  setExpandedSegmentId,
}) {
  const getTotalElevation = (wp) => (wp.groundHeight ?? 0) + (wp.height ?? 0)

  const handleWaypointClick = (id) => {
    onSelectWaypoint(id)
    setExpandedSegmentId(null)
    const el = document.getElementById(`waypoint-${id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div
      className={`hidden md:block fixed right-0 top-0 bottom-0 z-30 transition-all duration-300 ease-out ${
        isDesktopCollapsed ? 'translate-x-full' : 'translate-x-0'
      }`}
    >
      <button
        onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full bg-white hover:bg-gray-50 rounded-l-lg shadow-lg p-2 transition-all duration-200 border border-r-0 border-gray-200"
      >
        <ChevronLeftIcon size={20} className="text-gray-600" />
      </button>

      <div className="w-[400px] h-full bg-white rounded-l-xl shadow-2xl border-l border-gray-200 flex flex-col">
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Waypoints</h2>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">
                {waypoints.length} total
              </span>
              <button
                onClick={() => setIsDesktopCollapsed(true)}
                className="p-1 hover:bg-white/50 rounded-full transition-colors duration-200"
              >
                <XIcon size={18} className="text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {waypoints.map((wp, i) => (
            <React.Fragment key={wp.id}>
              <div
                id={`waypoint-${wp.id}`}
                className={`group p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                  selectedWaypoint === wp.id && !expandedSegmentId
                  ? 'border-blue-300 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => handleWaypointClick(wp.id)}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        selectedWaypoint === wp.id && !expandedSegmentId
                        ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                      }`}
                    >
                      {wp.id}
                    </div>
                    <span className="font-medium text-gray-800">
                      Waypoint #{wp.id}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteWaypoint(wp.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-md font-medium transition-all duration-200"
                  >
                    Delete
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                  <div>
                    <div className="text-[10px] uppercase">Lat</div>
                    <div className="font-mono">{wp.lat?.toFixed(5)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase">Lng</div>
                    <div className="font-mono">{wp.lng?.toFixed(5)}</div>
                  </div>
                </div>

                <div className="text-xs text-gray-600 mb-2">
                  <div className="flex justify-between mb-1">
                    <span>Height</span>
                    <span>{wp.height?.toFixed(1)} m</span>
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
                    className="w-full"
                  />
                </div>

                <div className="text-xs text-green-700 mb-2">
                  <div className="flex justify-between">
                    <span>Total Elevation</span>
                    <span className="font-semibold text-green-800">
                      {getTotalElevation(wp).toFixed(1)} m
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-600 mb-2">
                  <div className="flex justify-between">
                    <span>Heading</span>
                    <span className="font-mono">
                      {typeof wp.heading === 'number'
                        ? `${wp.heading.toFixed(1)}°`
                        : '—'}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-600">
                  <div className="flex justify-between mb-1">
                    <span>Focus Target</span>
                    <span>
                      {wp.focusTargetId != null ? `#${wp.focusTargetId}` : 'None'}
                    </span>
                  </div>
                  {wp.focusTargetId != null ? (
                    <button
                      onClick={() => {
                        setSelectedTargetId(wp.focusTargetId)
                        setShowTargetModal(true)
                      }}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Change Focus Target
                    </button>
                  ) : (
                    <button
                      onClick={() => onModeChange('target')}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Add Focus Target
                    </button>
                  )}
                </div>
              </div>

              {i < waypoints.length - 1 && (
                <SpeedConnector
                speed={segmentSpeeds?.[i] ?? 10}
                isExpanded={expandedSegmentId === `${wp.id}-${waypoints[i + 1].id}`}
                onToggle={() =>
                  setExpandedSegmentId(
                    expandedSegmentId === `${wp.id}-${waypoints[i + 1].id}`
                      ? null
                      : `${wp.id}-${waypoints[i + 1].id}`
                  )
                }
                onChange={(newSpeed) =>   handleSegmentSpeedChange(wp.id, waypoints[i + 1].id, newSpeed)


                }
                onApplyToAll={handleApplySpeedToAll}
              />
              
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
