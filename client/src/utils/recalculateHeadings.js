import { calculateHeading } from "./headingUtils"

export function recalculateHeadings(waypoints, targets) {
  return waypoints.map((wp, i, arr) => {
    if (wp.focusTargetId) {
      const target = targets.find((t) => t.id === wp.focusTargetId)
      if (target) {
        return {
          ...wp,
          heading: calculateHeading(wp.lat, wp.lng, target.lat, target.lng),
        }
      }
    }

    const next = arr[i + 1]
    if (next) {
      return {
        ...wp,
        heading: calculateHeading(wp.lat, wp.lng, next.lat, next.lng),
      }
    }

    return { ...wp, heading: null }
  })
}
