
/*
import { useEffect } from 'react';
import {
  EllipseGeometry,
  GeometryInstance,
  Material,
  MaterialAppearance,
  Primitive,
  Cartesian3,
  Color,
  HeightReference,
  EllipsoidSurfaceAppearance,
  ClassificationType,
  ColorGeometryInstanceAttribute
} from '@cesium/engine';
import { useCesium } from 'resium';

export default function FlatWaypointDisc({ waypoints }) {
  const { scene } = useCesium();

  useEffect(() => {
    if (!scene || !scene.primitives) return;

    // Clean up existing discs on re-render
    const primitive = new Primitive({
      geometryInstances: waypoints.map((wp) => {
        const position = Cartesian3.fromDegrees(wp.lng, wp.lat, wp.groundAlt ?? 0);

        return new GeometryInstance({
          geometry: new EllipseGeometry({
            center: position,
            semiMajorAxis: 1.5, // 5m diameter
            semiMinorAxis: 1.5,
            height: wp.groundAlt ?? 0
          }),
          attributes: {
            color: ColorGeometryInstanceAttribute.fromColor(Color.RED.withAlpha(0.95)),
          },
        });
      }),
      appearance: new EllipsoidSurfaceAppearance({
        material: Material.fromType('Color'),
      }),
      asynchronous: false,
    });

    scene.primitives.add(primitive);

    return () => {
      if (!scene.isDestroyed()) {
        scene.primitives.remove(primitive);
      }
    };
  }, [scene, waypoints]);

  return null;
}
*/