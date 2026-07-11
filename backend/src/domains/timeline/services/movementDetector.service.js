/**
 * MovementDetector Service
 * Calculates geographic distances (Haversine formula), velocity, and heading deltas.
 * Classifies raw GPS points into MOVING vs STATIONARY without modifying existing GPS logic.
 */

class MovementDetector {
  /**
   * Calculate distance between two coordinates in Kilometers using Haversine formula
   */
  calculateDistanceKm(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
    if (lat1 === lat2 && lon1 === lon2) return 0;

    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;
    return Number(distanceKm.toFixed(4));
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Calculate speed in km/h based on distance and time difference
   */
  calculateSpeedKmH(distanceKm, timeDeltaSeconds) {
    if (!timeDeltaSeconds || timeDeltaSeconds <= 0) return 0;
    const hours = timeDeltaSeconds / 3600;
    const speed = distanceKm / hours;
    return Number(speed.toFixed(2));
  }

  /**
   * Calculate compass bearing / heading (0 - 360 degrees) between two points
   */
  calculateHeading(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
    const dLon = this.deg2rad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(this.deg2rad(lat2));
    const x =
      Math.cos(this.deg2rad(lat1)) * Math.sin(this.deg2rad(lat2)) -
      Math.sin(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.cos(dLon);
    let brng = Math.atan2(y, x);
    brng = (brng * (180 / Math.PI) + 360) % 360;
    return Number(brng.toFixed(1));
  }

  /**
   * Analyze movement between previous known location and current ping
   */
  analyzeMovement(prevLocation, currentPing) {
    if (!prevLocation || !prevLocation.latitude || !prevLocation.longitude) {
      return {
        distanceKm: 0,
        speedKmH: currentPing.speed ? (currentPing.speed * 3.6) : 0, // m/s to km/h if available
        heading: currentPing.heading || 0,
        isMoving: false
      };
    }

    const distanceKm = this.calculateDistanceKm(
      prevLocation.latitude,
      prevLocation.longitude,
      Number(currentPing.latitude),
      Number(currentPing.longitude)
    );

    const prevTime = new Date(prevLocation.timestamp || Date.now()).getTime();
    const currTime = new Date(currentPing.timestamp || Date.now()).getTime();
    const timeDeltaSeconds = Math.max(1, (currTime - prevTime) / 1000);

    let speedKmH = this.calculateSpeedKmH(distanceKm, timeDeltaSeconds);
    if (currentPing.speed && currentPing.speed > 0) {
      speedKmH = currentPing.speed * 3.6; // use device reported speed if accurate
    }

    const heading = this.calculateHeading(
      prevLocation.latitude,
      prevLocation.longitude,
      Number(currentPing.latitude),
      Number(currentPing.longitude)
    );

    // Movement threshold: speed > 2.5 km/h or moved > 40 meters
    const isMoving = speedKmH >= 2.5 || distanceKm >= 0.040;

    return {
      distanceKm,
      speedKmH: Number(speedKmH.toFixed(2)),
      heading,
      isMoving,
      timeDeltaSeconds
    };
  }
}

module.exports = new MovementDetector();
