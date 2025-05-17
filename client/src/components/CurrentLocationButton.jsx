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
      className="bg-gray-200 text-xs px-2 py-1 rounded sm:text-base"
    >
      📍 My Location
    </button>
  );
}
