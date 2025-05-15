// SunMarker.jsx
import { Cartesian3, Color } from 'cesium'; // ✅ FIXED
import { Entity } from 'resium';

export default function SunMarker({ sunDirection }) {
  if (!sunDirection) return null;

  const sunPosition = Cartesian3.multiplyByScalar(sunDirection, 2e6, new Cartesian3()); // Pull closer if needed

  return (
    <Entity
      name="Sun"
      position={sunPosition}
      point={{
        pixelSize: 20,
        color: Color.YELLOW.withAlpha(0.9),
        outlineColor: Color.ORANGE,
        outlineWidth: 4
      }}
      label={{
        text: "☀ Sun",
        font: "14px sans-serif",
        fillColor: Color.YELLOW,
        showBackground: true,
        style: 2,
        verticalOrigin: 1,
        pixelOffset: new Cartesian3(0, -30, 0)
      }}
    />
  );
}
