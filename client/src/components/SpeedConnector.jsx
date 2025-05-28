import React from "react"

export default function SpeedConnector({ speed, isExpanded, onToggle, onApplyToAll, onChange }) {
    return (
      <div className="px-4 py-2">
        <button
          onClick={onToggle}
          className={`text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-1 rounded-full border border-blue-200 transition`}
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
  