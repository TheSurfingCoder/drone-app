import React, { useEffect, useState } from 'react';
import { moveToward } from '../utils/droneMovement';

export default function DroneController({
  waypoints,
  setDronePosition,
  dronePosition,
  logs,
  setLogs,
  handleClearWaypoints,
  showCountdown,
  setShowCountdown,
  setCountdownMessage,
}) {
  const [clicked, setClicked] = useState(false);

  const handleStartMission = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 150);

    if (!waypoints || waypoints.length === 0) {
      setCountdownMessage(
        'There are no waypoints. Please click on the map to set some.'
      );
      setShowCountdown(true);
      return;
    }

    setCountdownMessage('Starting in');
    setShowCountdown(true);
  };

  useEffect(() => {
    // Only start mission after countdown completes and waypoints exist
    if (showCountdown) return;
    if (!waypoints || waypoints.length === 0) return;

    let currentIndex = 0;
    let currentTarget = [waypoints[0].lat, waypoints[0].lng];
    let currentPosition = [waypoints[0].lat, waypoints[0].lng];
    setDronePosition(currentPosition);

    const interval = setInterval(() => {
      const nextPos = moveToward(currentPosition, currentTarget);
      currentPosition = nextPos;
      setDronePosition(nextPos);

      const now = new Date().toLocaleTimeString();

      // Arrived at waypoint
      if (
        nextPos[0] === currentTarget[0] &&
        nextPos[1] === currentTarget[1]
      ) {
        currentIndex++;
        setLogs((prev) => [
          ...prev,
          `[${now}] ✅ Arrived at waypoint ${currentIndex}`,
        ]);

        if (currentIndex >= waypoints.length) {
          clearInterval(interval);
          setLogs((prev) => [
            ...prev,
            `[${now}] 🏁 Mission complete`,
          ]);
          return;
        }

        currentTarget = [
          waypoints[currentIndex].lat,
          waypoints[currentIndex].lng,
        ];
      }
    }, 30);

    return () => clearInterval(interval);
  }, [showCountdown]);
    /*
        1. checks waypoints length. if it's 0 then return and do nothing
        2. setDroneposition is actually changing the drone's positon and it's running every 30 milliseconds
        3. so every 30 milliseconds we're reutrning an array from nextPos which is setting the drone position and moving it
    */


    return (
      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 text-xs sm:text-base w-max">
        <button
          onClick={handleStartMission}
          className={`${clicked ? 'bg-green-700' : 'bg-green-600'
            } text-white px-1 py-.5 rounded-md shadow-sm transition-colors duration-100`}
        >
          Simulate Mission
        </button>

        <button
          onClick={handleClearWaypoints}
          className="bg-red-500 text-white px-1 py-.5 rounded-md shadow-sm transition-colors duration-100 "
        >
          Clear All
        </button>
      </div>
    );

  
}