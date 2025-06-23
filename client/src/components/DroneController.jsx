import React, { useEffect, useRef, useState } from 'react'
import { moveToward } from '../utils/droneMovement'
import { getBezierCurvePoints } from '../utils/geometry'
import { calculateHeadingFromTo } from '../utils/interpolationHeading'

export default function DroneController({
  waypoints,
  setDronePosition,
  setLogs,
  handleClearWaypoints,
  showCountdown,
  setShowCountdown,
  setCountdownMessage,
  mapRef,
  droneHeadingRef,
  setDroneHeading,
  droneHeading,
  missionSettings,
}) {
  const [clicked, setClicked] = useState(false)

  // Used to cancel animation loop
  const animationRef = useRef()
  // Timestamp of last animation frame
  const lastTimeRef = useRef(null)
  // Full lat/lng path to simulate drone movement
  const currentPathRef = useRef([])
  // Index of current path step
  const currentPathIndexRef = useRef(0)
  // Current lat/lng position of drone
  const currentPositionRef = useRef(null)
  // Heading interpolation state per segment
  const headingStateRef = useRef({ segmentId: null, start: 0, end: 0 })

  function normalizeHeading(deg) {
    return ((deg % 360) + 360) % 360
  }

  function lerpAngleShortest(start, end, t) {
    start = normalizeHeading(start)
    end = normalizeHeading(end)
    let delta = end - start
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    return normalizeHeading(start + delta * t)
  }

  function distance2D(a, b) {
    return Math.sqrt(Math.pow(a.lat - b.lat, 2) + Math.pow(a.lng - b.lng, 2))
  }

  const handleStartMission = () => {
    setClicked(true)
    setTimeout(() => setClicked(false), 150)
    if (!waypoints || waypoints.length === 0) {
      setCountdownMessage('There are no waypoints. Please click on the map to set some.')
      setShowCountdown(true)
      return
    }
    setCountdownMessage('Starting in')
    setShowCountdown(true)
  }

  useEffect(() => {
    if (showCountdown) return
    if (!waypoints || waypoints.length < 2) return

    const fullPath = [] // Holds all drone lat/lng steps

    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i]
      const to = waypoints[i + 1]
      const isCurved =
        missionSettings?.flightPathMode === 'CURVED' && Math.abs(from.cornerRadius ?? 0.2) > 0.2
      const tightness = from.cornerRadius ?? 0.2
      const bezierPoints = getBezierCurvePoints(from, to, tightness, 20)

      if (isCurved) {
        fullPath.push(...bezierPoints) // curved segment path
      } else if (i === 0) {
        fullPath.push({ lat: from.lat, lng: from.lng })
      }
      fullPath.push({ lat: to.lat, lng: to.lng }) // straight segment step
    }

    // Add final point to ensure completion
    fullPath.push({
      lat: waypoints[waypoints.length - 1].lat,
      lng: waypoints[waypoints.length - 1].lng,
    })

    // Initialize simulation state
    currentPathRef.current = fullPath
    currentPathIndexRef.current = 0
    currentPositionRef.current = fullPath[0]
    setDronePosition(fullPath[0])
    lastTimeRef.current = null

    // Set initial heading
    const fromWp = waypoints[0]
    const fallbackInitialHeading = calculateHeadingFromTo(waypoints[0], waypoints[1])
    const initialHeading = normalizeHeading(fromWp?.heading ?? fallbackInitialHeading)
    droneHeadingRef.current = initialHeading
    setDroneHeading(initialHeading)

    // Begin animation loop
    const step = (timestamp) => {
      const idx = currentPathIndexRef.current
      if (idx >= currentPathRef.current.length - 1) {
        cancelAnimationFrame(animationRef.current)
        return
      }

      const to = currentPathRef.current[idx + 1]
      const segmentIdx = Math.min(waypoints.length - 2, idx)
      const speed = waypoints[segmentIdx]?.speed ?? 10

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

      const fromWp = waypoints[segmentIdx]
      const toWp = waypoints[segmentIdx + 1]

      // Setup heading interpolation for this segment
      if (headingStateRef.current.segmentId !== segmentIdx) {
        const fallbackStart = calculateHeadingFromTo(fromWp, toWp)
        const fallbackEnd = calculateHeadingFromTo(fromWp, toWp)
        headingStateRef.current = {
          segmentId: segmentIdx,
          start: normalizeHeading(fromWp?.heading ?? fallbackStart),
          end: normalizeHeading(toWp?.heading ?? fallbackEnd),
        }
      }

      const totalDist = distance2D(fromWp, toWp)
      const distSoFar = distance2D(fromWp, currentPositionRef.current)
      const progress = Math.max(0, Math.min(1, distSoFar / totalDist))

      const { start, end } = headingStateRef.current
      const interpolatedHeading = lerpAngleShortest(start, end, progress)

      // Update drone position and heading
      droneHeadingRef.current = interpolatedHeading
      setDroneHeading(interpolatedHeading)
      currentPositionRef.current = nextPos
      setDronePosition(nextPos)

      const dist = Math.sqrt(Math.pow(to.lat - nextPos.lat, 2) + Math.pow(to.lng - nextPos.lng, 2))

      // Advance to next point if close enough
      if (dist < 0.00001) {
        const now = new Date().toLocaleTimeString()
        currentPathIndexRef.current += 1
        headingStateRef.current.segmentId = null
        droneHeadingRef.current = headingStateRef.current.end
        setDroneHeading(headingStateRef.current.end)
        setLogs((prev) => [...prev, `[${now}] ✅ Passed point ${idx + 1}`])
      }

      if (isNaN(dist)) {
        console.error('❌ Distance calculation returned NaN', { to, nextPos })
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
