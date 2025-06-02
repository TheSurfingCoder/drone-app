import React, { useEffect, useRef, useState } from 'react'
import { moveToward } from '../utils/droneMovement'
import { generateCurvePoints } from '../utils/geometry'
import { getBezierCurvePoints } from '../utils/geometry'

export default function DroneController({
  waypoints,
  segmentSpeeds,
  setDronePosition,
  dronePosition,
  logs,
  setLogs,
  handleClearWaypoints,
  showCountdown,
  setShowCountdown,
  setCountdownMessage,
  mapRef
}) {
  const [clicked, setClicked] = useState(false)
  const animationRef = useRef()
  const lastTimeRef = useRef(null)
  const currentPathRef = useRef([])
  const currentPathIndexRef = useRef(0)
  const currentPositionRef = useRef(null)
  const [droneHeading, setDroneHeading] = useState(null)
const [dronePitch, setDronePitch] = useState(null)



  const handleStartMission = () => {
    setClicked(true)
    setTimeout(() => setClicked(false), 150)

    if (!waypoints || waypoints.length === 0) {
      setCountdownMessage(
        'There are no waypoints. Please click on the map to set some.'
      )
      setShowCountdown(true)
      return
    }

    setCountdownMessage('Starting in')
    setShowCountdown(true)
  }

  useEffect(() => {
    if (showCountdown) return
    if (!waypoints || waypoints.length < 2) return

    // Build the full path
    const fullPath = []

    console.log("Map ref at time of sim init:", mapRef?.current)


    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i]
      const to = waypoints[i + 1]
      const seg = segmentSpeeds?.[i]
      const bezierPoints = getBezierCurvePoints(from, to, seg.curveTightness ?? 15, 20)

      

      if (seg?.isCurved) {
        const curvePoints = generateCurvePoints(from, to, seg.curveTightness ?? 15, mapRef.current)
        console.log("🌀 Curve point count:", curvePoints.length)
        fullPath.push(...bezierPoints)

      }
      else if (i === 0) {
        fullPath.push({ lat: from.lat, lng: from.lng }) // Add only once at the beginning
      }
      fullPath.push({ lat: to.lat, lng: to.lng })       // Add the `to` for each segment
      
     

    }

    // Push last waypoint explicitly
    fullPath.push({ lat: waypoints[waypoints.length - 1].lat, lng: waypoints[waypoints.length - 1].lng })

    currentPathRef.current = fullPath
    currentPathIndexRef.current = 0
    currentPositionRef.current = fullPath[0]
    setDronePosition(fullPath[0])
    lastTimeRef.current = null
    console.log("🚁 Built fullPath:", fullPath)
    console.log("👣 Path point count:", fullPath.length)


    const step = (timestamp) => {
      const idx = currentPathIndexRef.current
      if (idx >= currentPathRef.current.length - 1) {
        const now = new Date().toLocaleTimeString()
        setLogs((prev) => [...prev, `[${now}] 🏁 Mission complete`])
        cancelAnimationFrame(animationRef.current)
        return
      }
      console.log(`🛰️ Moving to index ${currentPathIndexRef.current + 1} of ${fullPath.length}`);
      
      const to = currentPathRef.current[idx + 1]
     

      const segmentIdx = Math.min(waypoints.length - 2, idx)
      const speed = segmentSpeeds?.[segmentIdx]?.speed ?? 10

      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp
        animationRef.current = requestAnimationFrame(step)
        return
      }

      const deltaTime = (timestamp - lastTimeRef.current) / 1000
      lastTimeRef.current = timestamp

      const nextPos = moveToward({
        droneLatLng: currentPositionRef.current,
        targetLatLng: to,
        speed,
        deltaTime,
      })

      currentPositionRef.current = nextPos
      setDronePosition(nextPos)

      const dist = Math.sqrt(
        Math.pow(to.lat - nextPos.lat, 2) + Math.pow(to.lng - nextPos.lng, 2)
      )
      

      if (dist < 0.00001) {
        const now = new Date().toLocaleTimeString()
        currentPathIndexRef.current += 1
        setLogs((prev) => [...prev, `[${now}] ✅ Passed point ${idx + 1}`])
        console.log("📏 Distance to next point:", dist)

      }

      if (isNaN(dist)) {
        console.error("❌ Distance calculation returned NaN", { to, nextPos })
      }
      

      console.log("🚶 Current:", currentPositionRef.current)
      console.log("🎯 Target:", to)
      console.log("📏 Dist:", dist)

      animationRef.current = requestAnimationFrame(step)
    }

    animationRef.current = requestAnimationFrame(step)

    return () => cancelAnimationFrame(animationRef.current)
  }, [showCountdown])

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 text-xs sm:text-base w-max">
      <button
        onClick={handleStartMission}
        className={`${clicked ? 'bg-green-700' : 'bg-green-600'} text-white px-1 py-.5 rounded-md shadow-sm transition-colors duration-100`}
      >
        Simulate Mission
      </button>

      <button
        onClick={handleClearWaypoints}
        className="bg-red-500 text-white px-1 py-.5 rounded-md shadow-sm transition-colors duration-100"
      >
        Clear All
      </button>
    </div>
  )
}
