import React from "react"

export default function Layers({ showOSM, onToggle }) {
    return (
        <div
            style={{
                position: "absolute",
                top: 200,
                left: 10,
                zIndex: 100,
                background: "rgba(255, 255, 255, 0.9)",
                padding: "0.5rem",
                borderRadius: "0.5rem",
                fontSize: "14px",
            }}
        >
            <label>
                <input
                    type="checkbox"
                    checked={showOSM}
                    onChange={() => onToggle("osm")}
                />
                {" "} Show OSM Buildings
            </label>
            <br />
        </div>

    )


}
