import React from 'react'
export default function CurrentLocationButton({ onLocate }) {
  const handleClick = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        onLocate(latitude, longitude)
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Unable to retrieve your location.')
      },
      { enableHighAccuracy: true }, // optional: improves GPS precision
    )
  }

  return (
    <button
      onClick={handleClick}
      className="w-full bg-gray-200 rounded px-1 py-.5 text-xs sm:text-base sm: w-max "
    >
      📍 My Location
    </button>
  )
}
