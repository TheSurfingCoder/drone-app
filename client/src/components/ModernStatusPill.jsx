import { calculateDistance, estimateDuration } from '../utils/distanceUtils'
import React from 'react'

export default function ModernStatusPill({ waypoints, unitSystem }) {
  const distanceKm = calculateDistance(waypoints)
  const distance =
    unitSystem === 'imperial' ? (distanceKm * 0.621371).toFixed(2) : distanceKm.toFixed(2)

  const distanceLabel = unitSystem === 'imperial' ? 'mi' : 'km'
  const durationMin = (estimateDuration(waypoints) / 60).toFixed(1)

  return (
    <div className="inline-flex items-center bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-full px-4 py-1.5 shadow-lg transition-all duration-300 hover:shadow-xl space-x-3 w-auto">
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
        <span className="text-gray-700 font-medium">
          {distance} {distanceLabel}
        </span>
      </div>
      <div className="w-px h-4 bg-gray-300" />
      <span className="text-gray-700 font-medium">{durationMin} min</span>
    </div>
  )
}
