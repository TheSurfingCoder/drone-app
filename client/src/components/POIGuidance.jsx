import React from 'react'

const POIGuidance = ({ isVisible, onComplete, onDismiss }) => {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 text-blue-600">
          🎯 Point of Interest (POI) Guidance
        </h3>

        <div className="space-y-3 text-gray-700">
          <p>
            <strong>What is a POI?</strong> A Point of Interest is a target that your drone will
            automatically focus on during flight.
          </p>

          <p>
            <strong>How it works:</strong> When you add a POI target and enable POI heading mode,
            all waypoints will automatically face toward this target.
          </p>

          <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
            <p className="text-sm">
              <strong>💡 Tip:</strong> This is perfect for filming a specific object or location
              from multiple angles!
            </p>
          </div>

          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Add a POI target by clicking on the map</li>
            <li>Switch to &quot;Toward POI&quot; heading mode</li>
            <li>All waypoints will automatically focus on your target</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Dismiss
          </button>
          <button
            onClick={onComplete}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  )
}

export default POIGuidance
