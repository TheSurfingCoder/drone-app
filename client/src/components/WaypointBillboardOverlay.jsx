import { Entity } from 'resium';
import {
  Cartesian3,
  HeightReference,
  Color,
} from 'cesium';
import React from 'react';

export default function WaypointBillboardOverlay({ waypoints }) {
  const icon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='10' cy='10' r='8' fill='red' stroke='white' stroke-width='2' /%3E%3C/svg%3E";

  return waypoints.map((wp, i) => {
    const position = Cartesian3.fromDegrees(wp.lng, wp.lat, (wp.alt ?? 0) + 2); // lift a bit above disc

    return (
      <Entity
        key={i}
        position={position}
        billboard={{
          image: icon,
          scale: 1,
          heightReference: HeightReference.NONE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        }}
      />
    );
  });
}
