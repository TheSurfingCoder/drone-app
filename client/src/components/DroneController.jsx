// drone component with logic from droneMovement.js
//drone component is receiving props from map
import { moveToward } from "../utils/droneMovement";
import React from "react";
export default function DroneController({ waypoints, setDronePosition, logs, setLogs, handleClearWaypoints }) {

    function handleStartMission() {
        console.log("Starting mission...");
        console.log("Waypoints:", waypoints);
        const time = new Date().toLocaleTimeString(); //creating time for logs


        //drone movement 
        if (waypoints.length === 0) return; //this will ensure nothing happens if we click start and the waypoints array is empty
        setLogs(prev => [...prev, `[${time}]🟢 Starting mission...`]); //Mission Logs
        let currentIndex = 0;
        let currentTarget = [waypoints[0].lat, waypoints[0].lng]

        const interval = setInterval(() => {

            const now = new Date(); // Create a Date object.
            const time = now.toLocaleTimeString(); // //i'm calling it within setInterval because i need a new time every 30 milliseconds
            setDronePosition(prev => {
                const nextPos = moveToward(prev, currentTarget)

                // Check if drone has arrived at the current target
                if (nextPos[0] === currentTarget[0] &&
                    nextPos[1] === currentTarget[1]
                ) {
                    currentIndex++;
                    setLogs(prev => [...prev, `[${time}] ✅ Arrived at waypoint ${currentIndex}`]); //Mission logs
                    console.log(logs)
                    if (currentIndex >= waypoints.length) {
                        clearInterval(interval);
                        console.log("Mission complete")
                        setLogs(prev => [...prev, `[${time}]🏁 Mission complete`]);
                        return nextPos;
                    }

                    currentTarget = [waypoints[currentIndex].lat, waypoints[currentIndex].lng];
                }
                return nextPos;

            })
        }, 30)

    }
    /*
        1. checks waypoints length. if it's 0 then return and do nothing
        2. setDroneposition is actually changing the drone's positon and it's running every 30 milliseconds
        3. so every 30 milliseconds we're reutrning an array from nextPos which is setting the drone position and moving it
    */


        return (
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 text-xs sm:text-base w-max">
              <button
                onClick={handleStartMission}
                className="bg-green-600 text-white px-2 py-1 rounded"
              >
                Simulate Mission
              </button>
              <button
                onClick={handleClearWaypoints}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Clear Waypoints
              </button>
            </div>
          );

}