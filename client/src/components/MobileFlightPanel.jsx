import React from 'react'
import PropTypes from 'prop-types'
import { XIcon, TrashIcon, PlayIcon } from 'lucide-react'

const MobileFlightPanel = ({ onClose, flights, onLoadFlight, onDeleteFlight, onSignOut }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">My Flights</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XIcon size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Flight List */}
        <div className="overflow-y-auto max-h-[calc(80vh-120px)] p-4">
          {flights.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">No saved flights</div>
              <div className="text-sm text-gray-500">Create and save your first mission</div>
            </div>
          ) : (
            <div className="space-y-3">
              {flights.map((flight) => (
                <div key={flight.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-800">{flight.name}</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onLoadFlight(flight)}
                        className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                      >
                        <PlayIcon size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteFlight(flight.id)}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Waypoints: {flight.metadata?.totalWaypoints || 0}</div>
                    <div>Distance: {flight.metadata?.totalDistance?.toFixed(2) || 0} km</div>
                    <div>
                      Duration:{' '}
                      {flight.metadata?.estimatedDuration
                        ? (flight.metadata.estimatedDuration / 60).toFixed(1)
                        : 0}{' '}
                      min
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(flight.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onSignOut}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

MobileFlightPanel.propTypes = {
  onClose: PropTypes.func.isRequired,
  flights: PropTypes.array.isRequired,
  onLoadFlight: PropTypes.func.isRequired,
  onDeleteFlight: PropTypes.func.isRequired,
  onSignOut: PropTypes.func.isRequired,
}

export default MobileFlightPanel
