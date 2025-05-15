//console-style activitygi

import React from "react"

export default function LogPanel({ logs, clearLogs }) {
    return (
        <div style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '10px',
            borderRadius: '8px',
            maxHeight: '150px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            width: '250px',
            zIndex: 1000,
            pointerEvents: 'auto'
        }}
        onClick={e => e.stopPropagation()}
        >
            <strong>📋 Mission Log</strong>
            <ul style={{ margin: 0, paddingLeft: '1em' }}>
                {logs.map((log, i) => (
                    <li key={i}>{log}</li>
                ))}
            </ul>
            <button onClick={()=>clearLogs()} style={{
               fontSize: '0.75rem',
               marginBottom: '0.5em',
               background: '#eee',
               border: 'none',
               padding: '4px 8px',
               cursor: 'pointer',
               borderRadius: '4px',
            }}> 
               🧹 Clear Log
            </button>
        </div>
    )
}