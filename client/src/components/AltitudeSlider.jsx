import React from 'react';

export default function AltitudeSlider({ value, onChange, unitSystem, minHeight }) {
  const isMetric = unitSystem === 'metric';
  const displayValue = isMetric
    ? `${value.toFixed(1)} m`
    : `${(value * 3.28084).toFixed(1)} ft`;

  return (
    <div style={{ marginTop: '6px' }}>
      <label>
        <b>Elevation + Height:</b> <strong>{displayValue}</strong>
      </label>
      <input
        type="range"
        min={minHeight}
        max={minHeight+250} // You can tweak this max value
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
}
