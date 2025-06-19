import React from 'react'
import PropTypes from 'prop-types'
import { XIcon, Clock, MapPin, Loader2, Trash2, LogOut } from 'lucide-react'

export const DesktopFlightPanel = ({
  onClose,
  flights,
  onLoadFlight,
  onDeleteFlight,
  onSignOut,
}) => {
  return (
    <div className="fixed inset-0 bg-white z-[99999] flex">
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">My Flights</h1>
              <button
                onClick={onSignOut}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
              aria-label="Close"
            >
              <XIcon size={28} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 z-[999999]">
            {flights.map((flight) => (
              <div
                key={flight.id}
                className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
              >
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{flight.name}</h3>
                  <div className="text-sm text-gray-500 mb-2">
                    {new Date(flight.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-6 text-sm mb-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock size={16} />
                      <span>{flight.metadata.estimatedDuration.toFixed(1)} min</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin size={16} />
                      <span>{flight.metadata.totalDistance.toFixed(2)} km</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onLoadFlight(flight)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
                    >
                      <Loader2 size={16} />
                      Load Flight
                    </button>
                    <button
                      onClick={() => onDeleteFlight(flight.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center"
                      title="Delete Flight"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

DesktopFlightPanel.propTypes = {
  onClose: PropTypes.func.isRequired,
  flights: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      waypoints: PropTypes.array.isRequired,
      segmentSpeeds: PropTypes.array.isRequired,
      metadata: PropTypes.shape({
        totalWaypoints: PropTypes.number.isRequired,
        totalDistance: PropTypes.number.isRequired,
        estimatedDuration: PropTypes.number.isRequired,
      }).isRequired,
    }),
  ).isRequired,
  onLoadFlight: PropTypes.func.isRequired,
  onDeleteFlight: PropTypes.func.isRequired,
  onSignOut: PropTypes.func.isRequired,
}
