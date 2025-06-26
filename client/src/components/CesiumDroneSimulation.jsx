import React, { useEffect, useRef, useState } from 'react'
import {
  Cartesian3,
  CallbackPositionProperty,
  ClockRange,
  JulianDate,
  Color,
  Cartesian2,
} from 'cesium'
import { calculateDistance } from '../utils/distanceUtils'

export default function CesiumDroneSimulation({
  waypoints,
  viewerRef,
  onSimulationComplete,
  currentDate,
  currentTime,
  currentTimezone,
}) {
  const [isSimulating, setIsSimulating] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)

  // Essential refs only
  const droneEntityRef = useRef(null)
  const clockRef = useRef(null)
  const startTimeRef = useRef(null)
  const totalDurationRef = useRef(0)
  const waypointTimingsRef = useRef([])

  // Calculate real flight duration based on waypoint speeds
  const calculateFlightDuration = () => {
    if (!waypoints || waypoints.length < 2) return 0

    let totalDuration = 0
    const timings = []

    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i]
      const to = waypoints[i + 1]
      const speed = from.speed || 10 // m/s
      const distance = calculateDistance([from], [to]) // meters
      const segmentDuration = distance / speed

      totalDuration += segmentDuration
      timings.push({
        waypointIndex: i,
        startTime: totalDuration - segmentDuration,
        endTime: totalDuration,
        from,
        to,
        speed,
        distance,
      })
    }

    waypointTimingsRef.current = timings
    return totalDuration
  }

  // Create position callback property with real timing
  const createPositionProperty = () => {
    return new CallbackPositionProperty((time, result) => {
      if (!clockRef.current || !waypointTimingsRef.current.length) {
        return undefined
      }

      const elapsed = JulianDate.secondsDifference(time, startTimeRef.current)
      const progress = Math.min(1, elapsed / totalDurationRef.current)

      // Find current segment based on elapsed time
      const currentSegment = waypointTimingsRef.current.find(
        (segment) => elapsed >= segment.startTime && elapsed <= segment.endTime,
      )

      if (!currentSegment) {
        // Return first waypoint position if before start or last waypoint if after end
        if (elapsed < 0) {
          const first = waypoints[0]
          return Cartesian3.fromDegrees(first.lng, first.lat, first.height || 50, undefined, result)
        }
        const last = waypoints[waypoints.length - 1]
        return Cartesian3.fromDegrees(last.lng, last.lat, last.height || 50, undefined, result)
      }

      // Calculate progress within current segment
      const segmentProgress =
        (elapsed - currentSegment.startTime) / (currentSegment.endTime - currentSegment.startTime)

      // Linear interpolation between waypoints
      const from = currentSegment.from
      const to = currentSegment.to
      const lat = from.lat + (to.lat - from.lat) * segmentProgress
      const lng = from.lng + (to.lng - from.lng) * segmentProgress
      const height = from.height + (to.height - from.height) * segmentProgress

      setProgress(progress * 100)

      return Cartesian3.fromDegrees(lng, lat, height || 50, undefined, result)
    }, false)
  }

  // Start simulation
  const startSimulation = () => {
    if (!waypoints || waypoints.length < 2) {
      console.log('Need at least 2 waypoints for simulation')
      return
    }

    setIsSimulating(true)
    setIsPaused(false)
    setProgress(0)

    const viewer = viewerRef.current?.cesiumElement
    if (!viewer) {
      console.error('No Cesium viewer available')
      return
    }

    // Calculate real flight duration
    const totalDuration = calculateFlightDuration()
    totalDurationRef.current = totalDuration

    // Create start time from current date/time
    const startDateTime = new Date(`${currentDate}T${currentTime}`)
    const start = JulianDate.fromDate(startDateTime)
    const stop = JulianDate.addSeconds(start, totalDuration, new JulianDate())

    // Setup Cesium clock like Sandcastle example
    viewer.clock.startTime = start.clone()
    viewer.clock.stopTime = stop.clone()
    viewer.clock.currentTime = start.clone()
    viewer.clock.multiplier = 1.0
    viewer.clock.clockRange = ClockRange.LOOP_STOP
    viewer.clock.shouldAnimate = true

    clockRef.current = viewer.clock
    startTimeRef.current = start

    // Create drone entity
    const droneEntity = viewer.entities.add({
      position: createPositionProperty(),
      model: {
        uri: 'https://raw.githubusercontent.com/AnalyticalGraphicsInc/cesium/master/Apps/SampleData/models/CesiumAir/Cesium_Air.glb',
        minimumPixelSize: 64,
        maximumScale: 20000,
        scale: 1.0,
        color: Color.YELLOW,
      },
      label: {
        text: 'Drone',
        font: '14pt monospace',
        style: 1,
        outlineWidth: 2,
        verticalOrigin: 1,
        pixelOffset: new Cartesian2(0, -40),
      },
    })

    droneEntityRef.current = droneEntity
  }

  // Pause/resume simulation
  const togglePause = () => {
    const newPausedState = !isPaused
    setIsPaused(newPausedState)

    if (clockRef.current) {
      clockRef.current.shouldAnimate = !newPausedState
    }
  }

  // Stop simulation
  const stopSimulation = () => {
    setIsSimulating(false)
    setIsPaused(false)
    setProgress(0)

    if (clockRef.current) {
      clockRef.current.shouldAnimate = false
    }

    if (viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement
      if (droneEntityRef.current) {
        viewer.entities.remove(droneEntityRef.current)
        droneEntityRef.current = null
      }
    }

    onSimulationComplete?.()
  }

  // Main simulation effect
  useEffect(() => {
    if (!isSimulating) return

    startSimulation()

    return () => {
      if (droneEntityRef.current) {
        viewerRef.current?.cesiumElement?.entities.remove(droneEntityRef.current)
      }
    }
  }, [isSimulating])

  // Auto-start simulation when component mounts
  useEffect(() => {
    if (waypoints && waypoints.length >= 2) {
      startSimulation()
    }
  }, [])

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-white rounded-lg shadow-lg p-4">
      <div className="text-red-500 font-bold mb-2">🚁 3D SIMULATION</div>
      <div className="flex items-center space-x-4">
        <div className="text-sm font-medium">
          {isPaused ? 'Paused' : 'Simulating'} - {progress.toFixed(1)}%
        </div>

        <button
          onClick={togglePause}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>

        <button
          onClick={stopSimulation}
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Stop
        </button>
      </div>

      <div className="mt-2 w-64 bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
