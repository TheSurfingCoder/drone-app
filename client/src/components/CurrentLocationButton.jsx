import React from "react";
export default function CurrentLocationButton({ onLocate }) {
  const handleClick = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocate(latitude, longitude);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to retrieve your location.");
      },
      { enableHighAccuracy: true } // optional: improves GPS precision
    );
  };

  return (
    <button
      onClick={handleClick}
    >
      📍 My Location
    </button>
  );
}
