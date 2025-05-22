import { calculateHeading } from "./headingUtils";
import { calculatePitch } from "./calculatePitch"; // Or put next to headingUtils if you prefer

export function recalculateHeadings(waypoints, targets) {
  return waypoints.map((wp, i, arr) => {
    if (wp.focusTargetId) {
      const target = targets.find((t) => t.id === wp.focusTargetId);
      if (target) {
        return {
          ...wp,
          heading: calculateHeading(wp.lat, wp.lng, target.lat, target.lng),
          pitch: calculatePitch(wp, target),
        };
      }
    }

    const next = arr[i + 1];
    if (next) {
      return {
        ...wp,
        heading: calculateHeading(wp.lat, wp.lng, next.lat, next.lng),
        pitch: calculatePitch(wp, next),
      };
    }

    return { ...wp, heading: null, pitch: 0 };
  });
}
