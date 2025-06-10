import React, { useState } from 'react'

export default function CurrentLocationButton({ onLocate }) {
  const [error, setError] = useState(null)

  const handleClick = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        onLocate(latitude, longitude)
        setError(null)
      },
      (error) => {
        console.error('Geolocation error:', error)
        setError('Unable to retrieve your location.')
      },
      { enableHighAccuracy: true }, // optional: improves GPS precision
    )
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="w-full bg-gray-200 rounded px-1 py-.5 text-xs sm:text-base sm:w-max"
      >
        📍 My Location
      </button>
      {error && (
        <div className="absolute top-full left-0 mt-1 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
