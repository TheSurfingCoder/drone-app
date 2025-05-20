export function calculateHeading(lat1, lng1, lat2, lng2) {
    const dLon = ((lng2 - lng1) * Math.PI) / 180
    const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180)
    const x =
      Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
      Math.sin((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.cos(dLon)
    const heading = (Math.atan2(y, x) * 180) / Math.PI
    return (heading + 360) % 360
  }
  