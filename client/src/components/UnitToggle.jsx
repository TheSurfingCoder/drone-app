import React from 'react';

export default function UnitToggle({ unitSystem, onChange }) {
    return (
        <div style={{ padding: '8px' }}>
            <label htmlFor="unit-select">Units:</label>
            <select
                id="unit-select"
                value={unitSystem}
                onChange={(e) => onChange(e.target.value)}
                style={{ marginLeft: '8px' }}
            >
                <option value="metric">Metric (m)</option>
                <option value="imperial">Imperial (ft)</option>
            </select>
        </div>
    );
}
