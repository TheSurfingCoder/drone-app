import { Cartesian3 } from 'cesium';

export function calculatePitch(from, to) {
  if (!from || !to) return 0;
  if (!from.elevatedPosition || !to.elevatedPosition) return 0;

  const fromCart = from.elevatedPosition;
  const toCart = to.elevatedPosition;

  const dx = toCart.x - fromCart.x;
  const dy = toCart.y - fromCart.y;
  const dz = (to.groundHeight + to.height) - (from.groundHeight + from.height)

  const horizontalDistance = Math.sqrt(dx * dx + dy * dy);
  const totalDistance = Math.sqrt(horizontalDistance * horizontalDistance + dz * dz);

  if (totalDistance === 0) return 0;

  console.log("📐 Calculating pitch:", {
    from: fromCart.z,
    to: toCart.z,
    dz: dz
  });
  

  const radians = Math.asin(dz / totalDistance);

  console.log("🎯 Pitch Calculation Debug", {
  from: {
    lat: from.lat,
    lng: from.lng,
    height: from.height,
    groundHeight: from.groundHeight,
    total: from.groundHeight + from.height
  },
  to: {
    lat: to.lat,
    lng: to.lng,
    height: to.height,
    groundHeight: to.groundHeight,
    total: to.groundHeight + to.height
  },
  dz: (to.groundHeight + to.height) - (from.groundHeight + from.height)
});
console.log("🎯 Final pitch (deg):", radians * (180 / Math.PI));


  return radians * (180 / Math.PI); // ✅ Flip sign
}


  
