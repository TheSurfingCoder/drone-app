import React from 'react';

export default function UnitToggle({ unitSystem, onChange }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 text-xs sm:text-base">
      <label htmlFor="unit-select" className="text-gray-700">
        Units:
      </label>
      <select
        id="unit-select"
        value={unitSystem}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-base"
      >
        <option value="metric">Metric (m)</option>
        <option value="imperial">Imperial (ft)</option>
      </select>
    </div>
  );
}
