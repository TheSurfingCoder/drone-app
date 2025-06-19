import React, { useState } from 'react'
import {
  SatelliteIcon,
  BuildingIcon,
  SunIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from 'lucide-react'
import SunControlPanel from './SunControlPanel'
import { calculateDistance, estimateDuration } from '../utils/distanceUtils'

export default function ModernStatus3DPill({
  googlePhotorealistic,
  setGooglePhotorealistic,
  currentDate,
  currentTime,
  currentTimezone,
  onDateTimeChange,
  waypoints,
  segmentSpeeds,
  unitSystem,
}) {
  const [showControls, setShowControls] = useState(false)

  const distanceKm = calculateDistance(waypoints)
  const distance =
    unitSystem === 'imperial' ? (distanceKm * 0.621371).toFixed(2) : distanceKm.toFixed(2)
  const distanceLabel = unitSystem === 'imperial' ? 'mi' : 'km'
  const durationMin = (estimateDuration(waypoints, segmentSpeeds) / 60).toFixed(1)

  // Format current time for display
  const currentTimeDisplay = `${currentTime} ${currentTimezone}`

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="bg-white rounded-full shadow-lg border border-gray-200 px-2 py-1 flex items-center space-x-1 max-w-fit">
        {/* Distance + Duration */}
        <div className="inline-flex items-center bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-full px-3 py-1 shadow transition duration-300 hover:shadow-md space-x-2 text-xs">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
            <span className="text-gray-700 font-medium">
              {distance} {distanceLabel}
            </span>
          </div>
          <div className="w-px h-3.5 bg-gray-300" />
          <span className="text-gray-700 font-medium">{durationMin} min</span>
        </div>

        {/* Map Style Toggle */}
        <div className="flex bg-gray-100 rounded-full p-0.5">
          <button
            onClick={() => setGooglePhotorealistic(true)}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              googlePhotorealistic
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <SatelliteIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Photoreal</span>
          </button>
          <button
            onClick={() => setGooglePhotorealistic(false)}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              !googlePhotorealistic
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <BuildingIcon className="w-4 h-4" />
            <span className="hidden sm:inline">OSM</span>
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-7 bg-gray-200" />

        {/* Sun Widget Toggle */}
        <button
          onClick={() => setShowControls((prev) => !prev)}
          className="flex items-center space-x-2 px-3 py-1.5 hover:bg-gray-50 rounded-full transition-all duration-200 group text-xs"
        >
          <div className="flex items-center space-x-2">
            <div className="relative">
              <SunIcon className="w-4 h-4 text-orange-500 animate-pulse" />
              <div className="absolute inset-0 w-4 h-4 bg-orange-400 rounded-full opacity-20 animate-ping"></div>
            </div>
            <div className="hidden md:block">
              <div className="text-[10px] text-gray-500 leading-none">Sun</div>
              <div className="text-xs font-medium text-gray-900">{currentTimeDisplay}</div>
            </div>
            <div className="md:hidden">
              <ClockIcon className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <div className="transition-transform">
            {showControls ? (
              <ChevronUpIcon className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </button>
      </div>

      {/* Expanded Sun Control Panel */}
      {showControls && (
        <div className="bg-white border border-gray-200 shadow-md rounded-xl p-4 mt-1 w-[300px]">
          <SunControlPanel
            currentDate={currentDate}
            currentTime={currentTime}
            currentTimezone={currentTimezone}
            onDateTimeChange={onDateTimeChange}
          />
        </div>
      )}
    </div>
  )
}
