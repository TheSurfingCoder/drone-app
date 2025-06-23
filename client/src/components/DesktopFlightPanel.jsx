import React from 'react'
import PropTypes from 'prop-types'
import { XIcon, TrashIcon, PlayIcon } from 'lucide-react'

export const DesktopFlightPanel = ({
  onClose,
  flights,
  onLoadFlight,
  onDeleteFlight,
  onSignOut,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">My Flights</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XIcon size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Flight List */}
        <div className="overflow-y-auto max-h-[calc(80vh-140px)] p-6">
          {flights.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2 text-lg">No saved flights</div>
              <div className="text-sm text-gray-500">Create and save your first mission</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {flights.map((flight) => (
                <div
                  key={flight.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-800 text-lg">{flight.name}</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onLoadFlight(flight)}
                        className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                        title="Load Flight"
                      >
                        <PlayIcon size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteFlight(flight.id)}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                        title="Delete Flight"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <div className="font-medium">Waypoints</div>
                      <div>{flight.metadata?.totalWaypoints || 0}</div>
                    </div>
                    <div>
                      <div className="font-medium">Distance</div>
                      <div>{flight.metadata?.totalDistance?.toFixed(2) || 0} km</div>
                    </div>
                    <div>
                      <div className="font-medium">Duration</div>
                      <div>
                        {flight.metadata?.estimatedDuration
                          ? (flight.metadata.estimatedDuration / 60).toFixed(1)
                          : 0}{' '}
                        min
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-3">
                    {new Date(flight.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onSignOut}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

DesktopFlightPanel.propTypes = {
  onClose: PropTypes.func.isRequired,
  flights: PropTypes.array.isRequired,
  onLoadFlight: PropTypes.func.isRequired,
  onDeleteFlight: PropTypes.func.isRequired,
  onSignOut: PropTypes.func.isRequired,
}
