/**
 * RouteAnalyzer Service
 * Analyzes continuous travel segments, sums polyline distances, and generates heatmap/playback data.
 */

const LocationSegment = require('../models/locationSegment.model');
const StopHistory = require('../models/stopHistory.model');
const movementDetector = require('./movementDetector.service');

class RouteAnalyzer {
  /**
   * Sum total distance across all travel segments for a session
   */
  async calculateSessionTotalDistance(sessionId) {
    if (!sessionId) return 0;
    const segments = await LocationSegment.find({ sessionId }).select('distanceKm').lean();
    let totalKm = 0;
    for (const seg of segments) {
      if (seg.distanceKm && seg.distanceKm > 0) {
        totalKm += seg.distanceKm;
      }
    }
    return Number(totalKm.toFixed(2));
  }

  /**
   * Generate route playback timeline dataset with timestamps, speed, and stop markers
   */
  async getRoutePlaybackData({ userId, dateString, sessionId }) {
    const query = sessionId ? { sessionId } : { userId, dateString };

    const segments = await LocationSegment.find(query)
      .sort({ startTime: 1 })
      .lean();

    const stops = await StopHistory.find(query)
      .sort({ arrivalTime: 1 })
      .lean();

    const pathPoints = [];
    let totalDistanceKm = 0;

    for (const seg of segments) {
      if (seg.path && Array.isArray(seg.path)) {
        for (const pt of seg.path) {
          pathPoints.push({
            latitude: pt.latitude,
            longitude: pt.longitude,
            timestamp: pt.timestamp,
            speed: pt.speed || 0,
            heading: pt.heading || 0,
            segmentType: seg.segmentType
          });
        }
      }
      if (seg.distanceKm) totalDistanceKm += seg.distanceKm;
    }

    const startPoint = pathPoints.length > 0 ? pathPoints[0] : null;
    const endPoint = pathPoints.length > 0 ? pathPoints[pathPoints.length - 1] : null;

    // Generate heatmap ready array: [[lat, lng, intensity]]
    const heatmapData = pathPoints.map(pt => [
      pt.latitude,
      pt.longitude,
      pt.speed && pt.speed > 0 ? 0.4 : 0.8 // higher intensity where stationary or slow
    ]);

    return {
      startPoint,
      endPoint,
      pathPoints,
      stops,
      totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
      heatmapData
    };
  }
}

module.exports = new RouteAnalyzer();
