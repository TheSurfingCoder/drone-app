import React from 'react'
import PropTypes from 'prop-types'
import { XIcon, Clock, MapPin } from 'lucide-react'

export const DesktopFlightPanel = ({ onClose, flights }) => {
  return (
    <div className="fixed inset-0 bg-white z-[99999] flex">
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Flights</h1>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
              aria-label="Close"
            >
              <XIcon size={28} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {flights.map((flight) => (
              <div
                key={flight.id}
                className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
              >
                <img
                  src={flight.thumbnail}
                  alt={flight.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{flight.name}</h3>
                  <div className="text-sm text-gray-500 mb-2">
                    {new Date(flight.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock size={16} />
                      <span>{flight.duration}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin size={16} />
                      <span>{flight.distance} km</span>
                    </div>
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
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      duration: PropTypes.string.isRequired,
      distance: PropTypes.string.isRequired,
      waypoints: PropTypes.number.isRequired,
      thumbnail: PropTypes.string.isRequired,
    }),
  ).isRequired,
}
