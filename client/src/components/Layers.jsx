import React from "react";

export default function Layers({ mapMode, setMapMode, showOSMBuildings, toggleOSMBuildings }) {
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
      <div>
        <label>
          <input
            type="radio"
            name="mapMode"
            value="google"
            checked={mapMode === "google"}
            onChange={() => setMapMode("google")}
          />
          {" "}Google Photorealistic
        </label>
        <br />
        <label>
          <input
            type="radio"
            name="mapMode"
            value="osm"
            checked={mapMode === "osm"}
            onChange={() => setMapMode("osm")}
          />
          {" "}OSM Mode
        </label>
      </div>

      {mapMode === "osm" && (
        <div style={{ marginTop: "0.5rem" }}>
          <label>
            <input
              type="checkbox"
              checked={showOSMBuildings}
              onChange={toggleOSMBuildings}
            />
            {" "}Show OSM Buildings
          </label>
        </div>
      )}
    </div>
  );
}
