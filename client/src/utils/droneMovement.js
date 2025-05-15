//calculate the step-by-step path between waypoints

// src/utils/droneMovement.js

export function moveToward(current, target, stepSize = 0.0001) {
    const [curLat, curLng] = current;
    const [targetLat, targetLng] = target;
  
    const dLat = targetLat - curLat;
    const dLng = targetLng - curLng;
  
    const distance = Math.sqrt(dLat * dLat + dLng * dLng);
  
    // If we're close enough, snap to the target
    if (distance < stepSize) {
      return target;
    }
  
    // Calculate next step toward the target
    const ratio = stepSize / distance;
  
    const nextLat = curLat + dLat * ratio;
    const nextLng = curLng + dLng * ratio;
  
    return [nextLat, nextLng];
  }
  