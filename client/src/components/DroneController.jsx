import React, { useEffect, useRef, useState } from 'react'
import { moveToward } from '../utils/droneMovement'

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
}) {
  const [clicked, setClicked] = useState(false)
  const animationRef = useRef()
  const lastTimeRef = useRef(null)
  const currentIndexRef = useRef(0)
  const currentPositionRef = useRef(null)

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

    currentIndexRef.current = 0
    const initial = [waypoints[0].lat, waypoints[0].lng]
    currentPositionRef.current = initial
    setDronePosition(initial)
    lastTimeRef.current = null

    const step = (timestamp) => {
      const idx = currentIndexRef.current
      if (idx >= waypoints.length - 1) {
        const now = new Date().toLocaleTimeString()
        setLogs((prev) => [...prev, `[${now}] 🏁 Mission complete`])
        cancelAnimationFrame(animationRef.current)
        return
      }

      const to = waypoints[idx + 1]
      const speed = segmentSpeeds?.[idx] ?? 10

      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp
        animationRef.current = requestAnimationFrame(step)
        return
      }

      const deltaTime = (timestamp - lastTimeRef.current) / 1000
      lastTimeRef.current = timestamp

      const nextPos = moveToward({
        droneLatLng: currentPositionRef.current,
        targetLatLng: [to.lat, to.lng],
        speed,
        deltaTime,
      })

      currentPositionRef.current = nextPos
      setDronePosition(nextPos)

      const dist = Math.sqrt(
        Math.pow(to.lat - nextPos[0], 2) +
        Math.pow(to.lng - nextPos[1], 2)
      )

      if (dist < 0.00001) {
        const now = new Date().toLocaleTimeString()
        currentIndexRef.current += 1
        setLogs((prev) => [...prev, `[${now}] ✅ Arrived at waypoint ${idx + 1}`])
      }

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
