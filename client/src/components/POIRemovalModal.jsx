import React from 'react'
import { AlertTriangleIcon } from 'lucide-react'

export default function POIRemovalModal({ isVisible, onConfirm, onCancel }) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-6 max-w-md mx-4 animate-in fade-in duration-300">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangleIcon size={24} className="text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-800">Remove Point of Interest?</h3>
        </div>
        <p className="text-gray-600 mb-6">
          Do you want to remove your point of interest from this mission? This will unassign all
          targets from waypoints.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            Remove POI
          </button>
        </div>
      </div>
    </div>
  )
}
