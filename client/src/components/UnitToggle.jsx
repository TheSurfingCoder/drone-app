import React from 'react'

export default function UnitToggle({ unitSystem, onChange }) {
  return (
    <div>
      <select
        id="unit-select"
        value={unitSystem}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded px-2 py-1 text-xs sm:text-base"
      >
        <option value="metric">Metric (m)</option>
        <option value="imperial">Imperial (ft)</option>
      </select>
    </div>
  )
}
