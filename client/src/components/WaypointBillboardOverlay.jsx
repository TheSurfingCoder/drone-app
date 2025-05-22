import { Entity, EllipseGraphics } from 'resium';
import {
  Cartesian3,
  HeightReference,
  Color,
  Cartesian2, SceneMode, Transforms, HeadingPitchRoll, Ellipsoid, Math as CesiumMath
} from 'cesium';
import React from 'react';

export default function WaypointBillboardOverlay({ waypoints, sceneMode }) {
  const icon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='10' cy='10' r='8' fill='red' stroke='white' stroke-width='2' /%3E%3C/svg%3E";


  return (
    <>
      {waypoints.map((wp, i) => {
        console.log(`Rendering waypoint ${i}: height = ${wp.height}, elevatedPosition =`, wp.elevatedPosition);
        return (
          <React.Fragment key={i}>
            {/* Waypoint marker at elevated position */}
            <Entity
              name={`Waypoint ${i + 1}`}
              position={wp.elevatedPosition}
              point={{ pixelSize: 10, color: Color.YELLOW }}
              label={{
                text: `WP ${i + 1}`,
                font: '14px sans-serif',
                pixelOffset: new Cartesian2(0, -20),
                fillColor: Color.WHITE,
                outlineColor: Color.BLACK,
                outlineWidth: 2,
                showBackground: true,
              }}
            />
            {sceneMode === SceneMode.SCENE3D && wp.elevatedPosition && (
            <Entity
            position={wp.elevatedPosition}
            orientation={Transforms.headingPitchRollQuaternion(
              wp.elevatedPosition,
              new HeadingPitchRoll(
                CesiumMath.toRadians((wp.heading ?? 0)-90),
                CesiumMath.toRadians(wp.pitch ?? 0),
                CesiumMath.toRadians(wp.roll ?? 0)
              )
            )}
            model={{
              uri: '/models/Cesium_Air.glb', 
              scale: 0.05,
              minimumPixelSize: 32,
              maximumScale: 200,
              silhouetteColor: Color.YELLOW,
              silhouetteSize: 1
            }}
          />
          
          )}

            {/* Base disc (only in 3D) */}
            {sceneMode === SceneMode.SCENE3D && (
              <Entity position={wp.groundPosition}>
                <EllipseGraphics
                  semiMajorAxis={5.0}
                  semiMinorAxis={5.0}
                  material={Color.RED.withAlpha(0.6)}
                  heightReference={HeightReference.CLAMP_TO_GROUND}
                />
              </Entity>
            )}

            {/* Line from ground to elevated (only in 3D) */}
            {sceneMode === SceneMode.SCENE3D && (
              <Entity
                polyline={{
                  positions: [wp.groundPosition, wp.elevatedPosition],
                  width: 2,
                  material: Color.ORANGE,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}
