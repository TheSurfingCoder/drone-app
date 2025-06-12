import { Entity, EllipseGraphics } from 'resium'
import {
  HeightReference,
  Color,
  Cartesian2,
  SceneMode,
  Transforms,
  HeadingPitchRoll,
  Math as CesiumMath,
  Cartesian3,
} from 'cesium'
import React from 'react'

export default function WaypointBillboardOverlay({ waypoints, sceneMode }) {
  return (
    <>
      {waypoints.map((wp, i) => {
        // Recalculate elevatedPosition based on current height
        const elevatedPosition = Cartesian3.fromDegrees(
          wp.lng,
          wp.lat,
          (wp.groundHeight ?? 0) + (wp.height ?? 0),
        )

        console.log(
          `Rendering waypoint ${i}: height = ${wp.height}, elevatedPosition =`,
          elevatedPosition,
        )
        return (
          <React.Fragment key={i}>
            {/* Waypoint marker at elevated position */}
            <Entity
              name={`Waypoint ${i + 1}`}
              position={elevatedPosition}
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
            {sceneMode === SceneMode.SCENE3D && elevatedPosition && (
              <Entity
                position={elevatedPosition}
                orientation={Transforms.headingPitchRollQuaternion(
                  elevatedPosition,
                  new HeadingPitchRoll(
                    CesiumMath.toRadians((wp.heading ?? 0) - 90),
                    CesiumMath.toRadians(wp.pitch ?? 0),
                    CesiumMath.toRadians(wp.roll ?? 0),
                  ),
                )}
                model={{
                  uri: '/models/Cesium_Air.glb',
                  scale: 0.05,
                  minimumPixelSize: 32,
                  maximumScale: 200,
                  silhouetteColor: Color.YELLOW,
                  silhouetteSize: 1,
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
                  height={0}
                />
              </Entity>
            )}

            {/* Line from ground to elevated (only in 3D) */}
            {sceneMode === SceneMode.SCENE3D && (
              <Entity
                polyline={{
                  positions: [wp.groundPosition, elevatedPosition],
                  width: 2,
                  material: Color.ORANGE,
                }}
              />
            )}
          </React.Fragment>
        )
      })}
    </>
  )
}
