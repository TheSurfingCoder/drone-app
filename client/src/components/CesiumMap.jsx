import React, { useRef, useImperativeHandle, useEffect, useState } from 'react'
import { Viewer, Cesium3DTileset, Sun } from 'resium'
import {
  Ion,
  IonResource,
  Math as CesiumMath,
  JulianDate,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Cartographic,
  DynamicAtmosphereLightingType,
  SkyAtmosphere,
  Simon1994PlanetaryPositions,
  Transforms,
  Cartesian3,
  Matrix3,
  createWorldTerrainAsync,
  createWorldImageryAsync,
} from 'cesium'
import WaypointBillboardOverlay from './WaypointBillboardOverlay'
import SegmentLinesOverlay from './SegmentLinesOverlay'
import { recalculateHeadingsLegacy } from '../utils/recalculateHeadings'
import TargetEntity from './TargetEntity'
import config from '../config'
import {
  createPerformanceMonitor,
  applyPerformanceOptimizations,
} from '../utils/performanceMonitor'

Ion.defaultAccessToken = config.cesiumToken

export default function CesiumMap({
  waypoints,
  setWaypoints,
  ref,
  targets,
  setTargets,
  overlayType,
  googlePhotorealistic,
  sunTime,
  onCameraPositionChange,
  unitSystem,
  missionSettings,
}) {
  const viewerRef = useRef(null)
  const [viewer, setViewer] = useState(null)
  const [performanceMonitor, setPerformanceMonitor] = useState(null)

  // Attach viewer instance
  useEffect(() => {
    const interval = setInterval(() => {
      const cesiumElement = viewerRef.current?.cesiumElement
      if (cesiumElement && !viewer) {
        setViewer(cesiumElement)
        clearInterval(interval)
      }
    }, 200)
    return () => clearInterval(interval)
  }, [viewer])

  useEffect(() => {
    if (!viewer) return
    viewer.scene.atmosphere.dynamicLighting = DynamicAtmosphereLightingType.SUNLIGHT

    viewer.shadows = true
    viewer.scene.shadowMap.enabled = true
    viewer.scene.terrainShadows = true
    viewer.scene.shadowMap.fadingEnabled = true
    viewer.scene.sun.show = true
    viewer.scene.atmosphere.hueShift = 0.4 // Cycle 40% around the color wheel
    viewer.scene.atmosphere.brightnessShift = 0.25 // Increase the brightness
    viewer.scene.atmosphere.saturationShift = -0.1 // Desaturate the colors
    viewer.scene.skyAtmosphere = new SkyAtmosphere()
    viewer.scene.skyAtmosphere.show = true

    // Additional performance optimizations
    // Optimize globe rendering
    viewer.scene.globe.maximumScreenSpaceError = 4 // Start with medium detail
    viewer.scene.globe.tileCacheSize = 1000 // Increase tile cache size
    viewer.scene.globe.enableLighting = true // Disable lighting for better performance

    // Optimize scene rendering
    viewer.scene.fog.enabled = false // Disable fog for better performance

    // Optimize camera controls
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = false // Disable collision detection for better performance

    // Set reasonable memory limits
    viewer.scene.globe.maximumScreenSpaceError = 4
    viewer.scene.globe.tileCacheSize = 1000

    // Initialize performance monitor
    const monitor = createPerformanceMonitor(viewer)
    setPerformanceMonitor(monitor)
    monitor.startMonitoring()

    // Apply initial performance optimizations
    applyPerformanceOptimizations(viewer, 'balanced')
  }, [viewer])

  // Click handler to add waypoints
  useEffect(() => {
    if (!viewer) return

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)

    handler.setInputAction((movement) => {
      const pickedCartesian = viewer.scene.pickPosition(movement.position)
      if (!pickedCartesian) {
        console.warn('❌ Could not determine clicked position.')
        return
      }

      const carto = Cartographic.fromCartesian(pickedCartesian)
      const lat = CesiumMath.toDegrees(carto.latitude)
      const lng = CesiumMath.toDegrees(carto.longitude)
      const groundHeight = carto.height ?? 0

      const height = 50
      const groundPosition = pickedCartesian
      const elevatedPosition = Cartesian3.fromDegrees(lng, lat, groundHeight + height)

      if (overlayType === 'waypoint') {
        setWaypoints((prev) => {
          const updated = [
            ...prev,
            {
              id: Date.now(),
              lat,
              lng,
              height,
              groundHeight,
              groundPosition,
              elevatedPosition,
              heading: null,
              pitch: 0,
              roll: 0,
              focusTargetId: null,
              cornerRadius: 0.2, // Default corner radius per DJI SDK spec
            },
          ]
          return recalculateHeadingsLegacy(updated, targets) // targets must be in scope
        })
      }

      if (overlayType === 'target') {
        setTargets((prev) => [
          ...prev,
          {
            id: Date.now(),
            lat,
            lng,
            height,
            groundHeight,
            groundPosition,
            elevatedPosition,
          },
        ])
      }
    }, ScreenSpaceEventType.LEFT_CLICK)

    return () => {
      handler.destroy()
    }
  }, [viewer, googlePhotorealistic, setWaypoints, setTargets, targets])

  useEffect(() => {
    if (!viewer) return

    const imageryLayers = viewer.imageryLayers
    imageryLayers.removeAll() // Clear all imagery layers

    const setupLayers = async () => {
      if (!googlePhotorealistic) {
        // 1. Set terrain
        const worldTerrain = await createWorldTerrainAsync()
        viewer.terrainProvider = worldTerrain

        // 2. Add default Cesium imagery (e.g. Bing Aerial with labels)
        const worldImagery = await createWorldImageryAsync()
        imageryLayers.addImageryProvider(worldImagery)
      }
    }

    setupLayers()
  }, [viewer, googlePhotorealistic])

  // Expose viewer to parent
  useImperativeHandle(ref, () => ({
    get cesiumElement() {
      return viewerRef.current?.cesiumElement
    },
  }))

  const handleSunDateTimeChange = (jsDate) => {
    if (!viewer) return
    const julian = JulianDate.fromDate(jsDate)

    viewer.clock.currentTime = julian
    viewer.clock.shouldAnimate = false // freezes time

    updateSkyAtmosphereFromSun(viewer)
  }

  function updateSkyAtmosphereFromSun(viewer) {
    if (!viewer) return

    const time = viewer.clock.currentTime

    // Step 1: Get camera position
    const position = viewer.scene.camera.position

    // Step 2: Compute local "up" vector from camera
    const up = viewer.scene.globe.ellipsoid.geodeticSurfaceNormal(position, new Cartesian3())

    // Step 3: Compute sun position in inertial space
    const sunPosInertial = Simon1994PlanetaryPositions.computeSunPositionInEarthInertialFrame(time)

    // Step 4: Convert to Earth-fixed frame
    const transform = Transforms.computeTemeToPseudoFixedMatrix(time)
    if (!transform) {
      console.warn('🛑 TemeToFixed transform not available.')
      return
    }

    const sunPosFixed = Matrix3.multiplyByVector(transform, sunPosInertial, new Cartesian3())
    const sunDirection = Cartesian3.normalize(sunPosFixed, new Cartesian3())

    // Step 5: Dot product = how aligned sun is with "up"
    const dot = Cartesian3.dot(up, sunDirection)
    const elevationAngle = CesiumMath.toDegrees(Math.asin(CesiumMath.clamp(dot, -1.0, 1.0)))

    // Step 6: Adjust sky appearance based on sun elevation
    if (elevationAngle < -6) {
      // Night
      viewer.scene.skyAtmosphere.brightnessShift = -1.0
      viewer.scene.skyAtmosphere.hueShift = -0.3
      viewer.scene.skyAtmosphere.saturationShift = -0.2
    } else if (elevationAngle < 2) {
      // Civil twilight
      viewer.scene.skyAtmosphere.brightnessShift = -0.6
      viewer.scene.skyAtmosphere.hueShift = -0.2
      viewer.scene.skyAtmosphere.saturationShift = -0.1
    } else if (elevationAngle < 10) {
      // Golden hour
      viewer.scene.skyAtmosphere.brightnessShift = -0.3
      viewer.scene.skyAtmosphere.hueShift = -0.1
      viewer.scene.skyAtmosphere.saturationShift = 0.0
    } else {
      // Daytime
      viewer.scene.skyAtmosphere.brightnessShift = 0.0
      viewer.scene.skyAtmosphere.hueShift = 0.0
      viewer.scene.skyAtmosphere.saturationShift = 0.0
    }
  }

  useEffect(() => {
    if (sunTime && viewer) {
      handleSunDateTimeChange(sunTime)
    }
  }, [sunTime, viewer])

  // Camera position tracking
  useEffect(() => {
    if (!viewer || !onCameraPositionChange) return

    const handleCameraMove = () => {
      const camera = viewer.camera
      const position = camera.position
      const cartographic = Cartographic.fromCartesian(position)

      const lat = CesiumMath.toDegrees(cartographic.latitude)
      const lng = CesiumMath.toDegrees(cartographic.longitude)
      const altitude = cartographic.height

      // Only update timezone if camera is within 2000 meters of ground
      if (altitude < 2000) {
        onCameraPositionChange({ lat, lng, altitude })
      }
    }

    // Listen for camera move events
    viewer.camera.moveEnd.addEventListener(handleCameraMove)

    return () => {
      viewer.camera.moveEnd.removeEventListener(handleCameraMove)
    }
  }, [viewer, onCameraPositionChange])

  // Solution 2: Smart tile loading optimization
  useEffect(() => {
    if (!viewer) return

    const optimizeTileLoading = () => {
      const camera = viewer.camera
      const height = camera.positionCartographic.height

      // Optimize tile loading based on camera height
      if (height < 500) {
        // Close to ground - use high detail
        viewer.scene.globe.maximumScreenSpaceError = 2
      } else if (height < 2000) {
        // Medium distance - balanced detail
        viewer.scene.globe.maximumScreenSpaceError = 4
      } else if (height < 10000) {
        // Far distance - lower detail
        viewer.scene.globe.maximumScreenSpaceError = 8
      } else {
        // Very far - minimal detail
        viewer.scene.globe.maximumScreenSpaceError = 16
      }
    }

    // Apply optimization on camera move
    viewer.camera.moveEnd.addEventListener(optimizeTileLoading)

    // Apply initial optimization
    optimizeTileLoading()

    return () => {
      viewer.camera.moveEnd.removeEventListener(optimizeTileLoading)
    }
  }, [viewer])

  // Automatic performance optimization based on monitor feedback
  useEffect(() => {
    if (!performanceMonitor || !viewer) return

    const checkAndOptimize = () => {
      const stats = performanceMonitor.getPerformanceStats()

      // Automatically adjust performance level based on current performance
      if (stats.performanceStatus === 'poor') {
        applyPerformanceOptimizations(viewer, 'low')
      } else if (stats.performanceStatus === 'moderate') {
        applyPerformanceOptimizations(viewer, 'balanced')
      } else {
        applyPerformanceOptimizations(viewer, 'high')
      }

      // Log suggestions for manual optimization
      const suggestions = performanceMonitor.suggestOptimizations()
      if (suggestions.length > 0) {
        // Suggestions available but not logged to reduce console noise
      }
    }

    // Check performance every 10 seconds
    const interval = setInterval(checkAndOptimize, 10000)

    return () => {
      clearInterval(interval)
    }
  }, [performanceMonitor, viewer])

  // Cleanup performance monitor on unmount
  useEffect(() => {
    return () => {
      if (performanceMonitor) {
        performanceMonitor.stopMonitoring()
      }
    }
  }, [performanceMonitor])

  return (
    <div id="cesium map main div" className="relative w-full h-full bg-red-100">
      {console.trace('🟥 CesiumMap wrapper div rendered')}

      <Viewer
        ref={viewerRef}
        className="h-full w-full z-0"
        baseLayerPicker={false}
        timeline={false}
        sceneModePicker={false}
        imageryProvider={false}
        geocoder={false}
        shouldAnimate={true}
        homeButton={false}
        navigationHelpButton={false}
        animation={false}
      >
        <Sun show={true} />

        {googlePhotorealistic ? (
          <Cesium3DTileset
            key="google-tiles"
            url={IonResource.fromAssetId(2275207)}
            // Solution 1: Optimized Google tileset configuration
            maximumScreenSpaceError={16}
            maximumMemoryUsage={512}
            cullWithChildrenBounds={false}
            skipLevelOfDetail={true}
            baseScreenSpaceError={1024}
            skipScreenSpaceErrorFactor={4}
            skipLevels={1}
            onError={(e) => console.error('Google Tileset error', e)}
            onReady={(e) => {}}
          />
        ) : (
          <Cesium3DTileset
            key="osm-tiles"
            url={IonResource.fromAssetId(96188)}
            // Apply similar optimizations to OSM tileset
            maximumScreenSpaceError={16}
            maximumMemoryUsage={256}
            cullWithChildrenBounds={false}
            skipLevelOfDetail={true}
            baseScreenSpaceError={1024}
            skipScreenSpaceErrorFactor={4}
            skipLevels={1}
            onError={(e) => console.error('OSM Tileset error', e)}
            onReady={(e) => {}}
          />
        )}
        <WaypointBillboardOverlay waypoints={waypoints} sceneMode={viewer?.scene.mode} />
        <TargetEntity targets={targets} sceneMode={viewer?.scene.mode} />
        <SegmentLinesOverlay
          waypoints={waypoints}
          sceneMode={viewer?.scene.mode}
          unitSystem={unitSystem}
          missionSettings={missionSettings}
        />
      </Viewer>
    </div>
  )
}
