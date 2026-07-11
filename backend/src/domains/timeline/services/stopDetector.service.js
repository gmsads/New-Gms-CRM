/**
 * StopDetector Service
 * Automatically detects when an employee stops, stays for > X minutes, and resumes movement.
 * Calculates exact arrival time, departure time, and duration without manual check-in.
 */

const StopHistory = require('../models/stopHistory.model');
const movementDetector = require('./movementDetector.service');

class StopDetector {
  /**
   * Check if the employee is currently in an ongoing stop or has initiated a new stop.
   * Stationary threshold: < 50 meters radius (0.050 km) for >= 5 minutes (300 seconds).
   */
  async processStopDetection({ sessionId, userId, currentPing, prevLocation, isMoving, dateString }) {
    if (!sessionId || !userId || !currentPing) return null;

    // Check if there is an open stop (departureTime is null) for this session
    const openStop = await StopHistory.findOne({
      sessionId,
      departureTime: null
    }).sort({ arrivalTime: -1 });

    const currentLat = Number(currentPing.latitude);
    const currentLng = Number(currentPing.longitude);
    const currentTime = new Date(currentPing.timestamp || Date.now());

    if (openStop) {
      // Employee currently has an active stop. Check if they have departed (> 60m from stop center AND moving)
      const distFromStopKm = movementDetector.calculateDistanceKm(
        openStop.coords.latitude,
        openStop.coords.longitude,
        currentLat,
        currentLng
      );

      if (distFromStopKm >= 0.060 && isMoving) {
        // Employee has resumed movement and departed the stop!
        const arrivalMs = new Date(openStop.arrivalTime).getTime();
        const departureMs = currentTime.getTime();
        const durationMinutes = Math.max(1, Math.round((departureMs - arrivalMs) / 60000));

        openStop.departureTime = currentTime;
        openStop.durationMinutes = durationMinutes;
        await openStop.save();

        return {
          action: 'DEPARTED_STOP',
          stop: openStop,
          durationMinutes
        };
      } else {
        // Still at the stop, update duration dynamically
        const arrivalMs = new Date(openStop.arrivalTime).getTime();
        const durationMinutes = Math.max(0, Math.round((currentTime.getTime() - arrivalMs) / 60000));
        if (openStop.durationMinutes !== durationMinutes) {
          openStop.durationMinutes = durationMinutes;
          await openStop.save();
        }
        return {
          action: 'ONGOING_STOP',
          stop: openStop,
          durationMinutes
        };
      }
    } else {
      // No open stop right now. Check if employee is stationary (not moving) compared to prevLocation
      if (!isMoving && prevLocation && prevLocation.latitude) {
        const distFromPrevKm = movementDetector.calculateDistanceKm(
          prevLocation.latitude,
          prevLocation.longitude,
          currentLat,
          currentLng
        );

        // If distance from previous known stationary spot is very small (< 40 meters)
        if (distFromPrevKm <= 0.040) {
          const prevTime = new Date(prevLocation.timestamp || currentTime).getTime();
          const stationarySeconds = Math.max(0, (currentTime.getTime() - prevTime) / 1000);

          // If stationary duration >= 4.5 minutes (270 seconds), auto-create a StopHistory entry!
          if (stationarySeconds >= 270) {
            const newStop = await StopHistory.create({
              sessionId,
              userId,
              arrivalTime: new Date(prevLocation.timestamp || currentTime),
              coords: {
                latitude: currentLat,
                longitude: currentLng
              },
              address: currentPing.locationName || `${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`,
              dateString: dateString || currentTime.toISOString().split('T')[0]
            });

            return {
              action: 'NEW_STOP_DETECTED',
              stop: newStop,
              durationMinutes: Math.round(stationarySeconds / 60)
            };
          }
        }
      }
    }

    return null;
  }
}

module.exports = new StopDetector();
