import React from 'react'

export default function SpeedConnector({
  speed,
  isExpanded,
  onToggle,
  onApplyToAll,
  onChange,
  highlight,
  ref: speedRef,
  interpolateHeading,
  isCurved,
  onToggleInterpolate,
  onToggleCurve,
  curveTightness,
  onCurveTightnessChange,
}) {
  return (
    <div className="px-4 py-2" ref={speedRef}>
      <button
        onClick={onToggle}
        className={`text-sm font-semibold px-4 py-1 rounded-full border transition
          ${highlight ? 'text-orange-700 bg-amber-100 border-amber-300 shadow-md' : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'}
        `}
      >
        {speed?.toFixed?.(1) ?? '--'} m/s {isExpanded ? '▲' : '▼'}
      </button>

      {isExpanded && (
        <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm space-y-3">
          <input
            type="range"
            min="0.1"
            max="20"
            step="0.1"
            value={typeof speed === 'number' ? speed : 10}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full"
          />

          {/* ✅ Restore Apply to All */}
          <button onClick={() => onApplyToAll?.(speed)} className="text-xs text-blue-600 underline">
            Apply to All
          </button>

          <div className="flex justify-between text-xs text-gray-700">
            <button
              onClick={onToggleInterpolate}
              className={`px-2 py-1 rounded-full border text-xs font-medium ${
                interpolateHeading
                  ? 'bg-green-100 border-green-300 text-green-700'
                  : 'bg-gray-100 border-gray-300 text-gray-600'
              }`}
            >
              ↻ Interpolate
            </button>

            <button
              onClick={onToggleCurve}
              className={`px-2 py-1 rounded-full border text-xs font-medium ${
                isCurved
                  ? 'bg-purple-100 border-purple-300 text-purple-700'
                  : 'bg-gray-100 border-gray-300 text-gray-600'
              }`}
            >
              ~ Curve
            </button>
          </div>

          {isCurved && (
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Curve Tightness
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="1"
                value={curveTightness ?? 15}
                onChange={(e) => onCurveTightnessChange?.(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {curveTightness ?? 15} meters
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
