import React from "react"

export default function SpeedConnector({ speed, isExpanded, onToggle, onApplyToAll, onChange, highlight, ref: speedRef }) {
  return (
    <div className="px-4 py-2" ref={speedRef}>
      <button
        onClick={onToggle}
        className={`text-sm font-semibold px-4 py-1 rounded-full border transition
          ${highlight ? 'text-orange-700 bg-amber-100 border-amber-300 shadow-md' : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'}
        `}
      >
        {speed.toFixed(1)} m/s {isExpanded ? '▲' : '▼'}
      </button>

      {isExpanded && (
        <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
          <input
            type="range"
            min="0.1"
            max="20"
            step="0.1"
            value={speed}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full"
          />
          <button
            onClick={() => onApplyToAll(speed)}
            className="mt-2 text-xs text-blue-600 underline"
          >
            Apply to All
          </button>
        </div>
      )}
    </div>
  )
}
