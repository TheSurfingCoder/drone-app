import React from 'react';
import { Entity } from 'resium';
import { Color, Cartesian2 } from 'cesium';

export default function TargetEntity({ targets, sceneMode }) {
  return (
    <>
      {targets.map((target, i) => (
        <Entity
          key={target.id}
          position={target.elevatedPosition}
          point={{ pixelSize: 10, color: Color.RED }}
          label={{
            text: `Target #${i + 1}`,
            font: '14px sans-serif',
            pixelOffset: new Cartesian2(0, -20),
            fillColor: Color.WHITE,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            showBackground: true,
          }}
        />
      ))}
    </>
  );
}
