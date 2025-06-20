import { Entity } from 'resium'
import { Color, Cartesian3, Cartesian2 } from 'cesium'
import React from 'react'
import { getBezierCurvePoints } from '../utils/geometry'

export default function SegmentLinesOverlay({
  waypoints,
  segmentSpeeds,
  sceneMode,
  unitSystem = 'metric',
}) {
  if (!waypoints || waypoints.length < 2 || !segmentSpeeds) {
    return null
  }

  return (
    <>
      {waypoints.map((wp, i) => {
        if (i >= waypoints.length - 1) return null

        const next = waypoints[i + 1]
        const speedData = segmentSpeeds[i] || {}
        const isCurved = speedData.isCurved
        const tightness = speedData.curveTightness ?? 15
        const speed = speedData.speed ?? 10

        // Get positions for the segment
        let positions = []

        if (isCurved) {
          // Generate curved path points
          const curvePoints = getBezierCurvePoints(wp, next, tightness, 20)
          positions = curvePoints.map((point) => {
            // Interpolate height between waypoints
            const progress = curvePoints.indexOf(point) / (curvePoints.length - 1)
            const interpolatedHeight = wp.height + (next.height - wp.height) * progress
            const groundHeight = wp.groundHeight + (next.groundHeight - wp.groundHeight) * progress

            return Cartesian3.fromDegrees(point.lng, point.lat, groundHeight + interpolatedHeight)
          })
        } else {
          // Straight line between waypoints
          const fromPosition = Cartesian3.fromDegrees(
            wp.lng,
            wp.lat,
            (wp.groundHeight ?? 0) + (wp.height ?? 0),
          )
          const toPosition = Cartesian3.fromDegrees(
            next.lng,
            next.lat,
            (next.groundHeight ?? 0) + (next.height ?? 0),
          )
          positions = [fromPosition, toPosition]
        }

        // Determine line color and style based on segment properties
        const lineColor = isCurved ? Color.PURPLE : Color.BLUE
        const lineWidth = 3

        // Calculate midpoint for speed label
        const midIndex = Math.floor(positions.length / 2)
        const midPosition = positions[midIndex]

        // Format speed display
        const displaySpeed =
          unitSystem === 'metric'
            ? `${speed.toFixed(1)} m/s`
            : `${(speed * 2.23694).toFixed(1)} mph`

        return (
          <React.Fragment key={`segment-${wp.id}-${next.id}`}>
            {/* Flight path line */}
            <Entity
              polyline={{
                positions: positions,
                width: lineWidth,
                material: lineColor,
                clampToGround: false,
                zIndex: 1,
              }}
            />

            {/* Speed label at midpoint */}
            <Entity
              position={midPosition}
              label={{
                text: displaySpeed,
                font: '12px sans-serif',
                pixelOffset: new Cartesian2(0, -10),
                fillColor: Color.WHITE,
                outlineColor: Color.BLACK,
                outlineWidth: 2,
                showBackground: true,
                backgroundColor: lineColor.withAlpha(0.8),
                backgroundPadding: new Cartesian2(4, 2),
                style: 2, // FILL_AND_OUTLINE
                scale: 0.8,
              }}
            />
          </React.Fragment>
        )
      })}
    </>
  )
}
