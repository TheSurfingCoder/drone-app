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
import { recalculateHeadings } from '../utils/recalculateHeadings'
import TargetEntity from './TargetEntity'
import config from '../config'

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
  segmentSpeeds,
  unitSystem,
}) {
  const viewerRef = useRef(null)
  const [viewer, setViewer] = useState(null)

  // Attach viewer instance
  useEffect(() => {
    const interval = setInterval(() => {
      const cesiumElement = viewerRef.current?.cesiumElement
      if (cesiumElement && !viewer) {
        console.log('🛠 Attaching Cesium viewer')
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
            },
          ]
          return recalculateHeadings(updated, targets) // targets must be in scope
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

    console.log('📆 Julian Date as JS date:', JulianDate.toDate(julian).toISOString())

    viewer.clock.currentTime = julian
    viewer.clock.shouldAnimate = false // freezes time

    console.log(viewer.scene.light)
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

    console.log('☀️ Sun Elevation:', elevationAngle.toFixed(2), '°')

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
            onError={(e) => console.error('Google Tileset error', e)}
            onReady={(e) => console.log('Google Tileset loaded', e)}
          />
        ) : (
          <Cesium3DTileset
            key="osm-tiles"
            url={IonResource.fromAssetId(96188)}
            onError={(e) => console.error('OSM Tileset error', e)}
            onReady={(e) => console.log('OSM Tileset loaded', e)}
          />
        )}
        <WaypointBillboardOverlay waypoints={waypoints} sceneMode={viewer?.scene.mode} />
        <TargetEntity targets={targets} sceneMode={viewer?.scene.mode} />
        <SegmentLinesOverlay
          waypoints={waypoints}
          segmentSpeeds={segmentSpeeds}
          sceneMode={viewer?.scene.mode}
          unitSystem={unitSystem}
        />
      </Viewer>
    </div>
  )
}
