import React, { useState } from 'react'
import { XIcon } from 'lucide-react'

export default function TargetWaypointModal({ waypoints, onConfirm, onCancel }) {
  const [selectedWaypointIds, setSelectedWaypointIds] = useState([])

  const handleToggle = (id) => {
    setSelectedWaypointIds((prev) =>
      prev.includes(id)
        ? prev.filter((wpId) => wpId !== id)
        : [...prev, id]
    )
  }

  const handleConfirm = () => {
    onConfirm(selectedWaypointIds)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">Assign Waypoints to Target</h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <p className="text-gray-600 mb-4">
            Select which waypoints should focus on this target:
          </p>
          {waypoints.length === 0 ? (
            <p className="text-gray-500 italic">No waypoints available.</p>
          ) : (
            <div className="space-y-2">
              {waypoints.map((wp) => {
                const isSelected = selectedWaypointIds.includes(wp.id)
                return (
                  <div
                    key={wp.id}
                    onClick={() => handleToggle(wp.id)}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3 ${
                        isSelected
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-gray-400'
                      }`}
                    >
                      {isSelected && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">Waypoint #{wp.id}</div>
                      <div className="text-xs text-gray-500">
                        {wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedWaypointIds.length === 0}
            className={`px-4 py-2 rounded-md transition-colors ${
              selectedWaypointIds.length > 0
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
