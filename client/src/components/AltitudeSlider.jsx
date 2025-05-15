import React from 'react';

export default function AltitudeSlider({ value, onChange, unitSystem, minAltitude }) {
  const isMetric = unitSystem === 'metric';
  const displayValue = isMetric
    ? `${value.toFixed(1)} m`
    : `${(value * 3.28084).toFixed(1)} ft`;

  return (
    <div style={{ marginTop: '6px' }}>
      <label>
        Altitude: <strong>{displayValue}</strong>
      </label>
      <input
        type="range"
        min={minAltitude}
        max={minAltitude+500} // You can tweak this max value
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
}
