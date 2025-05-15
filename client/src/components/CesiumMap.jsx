import React, {
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState,
} from "react";
import {
  Viewer,
  Cesium3DTileset, Sun
} from "resium";
import {
  Ion,
  IonResource,
  Math as CesiumMath,
  JulianDate,
  ClockRange,
  ClockStep,
  SunLight,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Cartographic,
  IonGeocodeProviderType,
  ShadowMode,
  Color,
  DynamicAtmosphereLightingType,
  SkyAtmosphere
} from "cesium";
import WaypointBillboardOverlay from "./WaypointBillboardOverlay";
import Layers from "./Layers";
import SunControlPanel from "./SunControlPanel";
import SunMarker from './SunMarker';


Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;

export default function CesiumMap({ waypoints, setWaypoints, ref }) {
  const viewerRef = useRef(null);
  const [viewer, setViewer] = useState(null);
  const [showOSM, setShowOSM] = useState(false);
  const [showGoogle, setShowGoogle] = useState(true);
  const [sunDirection, setSunDirection] = useState(null);


  // Attach viewer instance
  useEffect(() => {
    const interval = setInterval(() => {
      const cesiumElement = viewerRef.current?.cesiumElement;
      if (cesiumElement && !viewer) {
        console.log("🛠 Attaching Cesium viewer");
        setViewer(cesiumElement);
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [viewer]);

  useEffect(() => {
    if (!viewer) return;
    viewer.scene.atmosphere.dynamicLighting = DynamicAtmosphereLightingType.SUNLIGHT;
    viewer.shadows = true;
    viewer.scene.shadowMap.enabled = true;
    viewer.scene.terrainShadows = true;
    viewer.scene.shadowMap.fadingEnabled = false;
    viewer.scene.sun.show = true;
    viewer.scene.atmosphere.hueShift = 0.4; // Cycle 40% around the color wheel
    viewer.scene.atmosphere.brightnessShift = 0.25; // Increase the brightness
    viewer.scene.atmosphere.saturationShift = -0.1; // Desaturate the colors
    viewer.scene.skyAtmosphere = new SkyAtmosphere();
    viewer.scene.skyAtmosphere.show = true;

  }, [viewer]);



  // Click handler to add waypoints
  useEffect(() => {
    if (!viewer) return;

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement) => {
      const picked = viewer.scene.pickPosition(movement.position);
      if (!picked) return;

      const carto = Cartographic.fromCartesian(picked);
      const lat = CesiumMath.toDegrees(carto.latitude);
      const lng = CesiumMath.toDegrees(carto.longitude);
      const alt = carto.height;

      setWaypoints((prev) => [...prev, { lat, lng, alt }]);
    }, ScreenSpaceEventType.LEFT_CLICK);

    return () => handler.destroy();
  }, [viewer, setWaypoints]);

  // Expose viewer to parent
  useImperativeHandle(ref, () => ({
    get cesiumElement() {
      return viewerRef.current?.cesiumElement;
    },
  }));

  const handleToggle = (layer) => {
    if (layer === "osm") setShowOSM((prev) => !prev);
  };

  const handleSunDateTimeChange = (jsDate) => {
    if (!viewer) return;
    const julian = JulianDate.fromDate(jsDate);
    viewer.clock.currentTime = julian;
    

    
  };




  return (
    <div id="cesium map main div" className="relative w-full h-full z-0 bg-red-100">
      {console.trace("🟥 CesiumMap wrapper div rendered")}
      <Layers
        showOSM={showOSM}
        onToggle={handleToggle}
      />
      {viewerRef.current?.cesiumElement && (
        <SunControlPanel onDateTimeChange={handleSunDateTimeChange} />
      )}

      <Viewer
        ref={viewerRef}
        className="absolute inset-0 z-0"
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
        <Sun
          show={true}
        />
        {showOSM && (
          <Cesium3DTileset
            url={IonResource.fromAssetId(96188)}
            onError={(e) => console.error("OSM Tileset error", e)}
            onReady={(e) => console.log("OSM Tileset loaded", e)}
          />
        )}
        <Cesium3DTileset
          url={IonResource.fromAssetId(2275207)}
          onError={(e) => console.error("OSM Tileset error", e)}
          onReady={(e) => console.log("OSM Tileset loaded", e)}
        />
        {waypoints.map((wp, i) => (
          <div key={i}>
            <WaypointBillboardOverlay waypoints={waypoints} />
          </div>
        ))}
      </Viewer>
    </div>
  );
};

