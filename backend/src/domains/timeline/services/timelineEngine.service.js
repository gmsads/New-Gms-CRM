/**
 * TimelineEngine Service
 * Central event subscriber and orchestrator.
 * Consumes raw LocationPing events silently in the background from any source (visit ping, PWA ping, or auth)
 * and generates TimelineEvents and LocationSegments without interfering with existing visit/GPS logic.
 */

const WorkdaySession = require('../models/workdaySession.model');
const TimelineEvent = require('../models/timelineEvent.model');
const LocationSegment = require('../models/locationSegment.model');
const workdaySessionService = require('./workdaySession.service');
const movementDetector = require('./movementDetector.service');
const stopDetector = require('./stopDetector.service');
const locationIntelligence = require('./locationIntelligence.service');
const workdaySummaryService = require('./workdaySummary.service');

class TimelineEngine {
  /**
   * Process incoming LocationPing asynchronously
   */
  async processLocationPing(pingDoc) {
    if (!pingDoc || !pingDoc.userId || !pingDoc.latitude || !pingDoc.longitude) return;

    try {
      const userId = pingDoc.userId;
      const timestamp = new Date(pingDoc.timestamp || Date.now());
      const dateString = timestamp.toISOString().split('T')[0];

      // 1. Get or auto-initialize active workday session if employee is logged in and working
      let session = await workdaySessionService.getActiveSession(userId);
      if (!session) {
        // If ping came in but session not explicitly created today, auto-create one
        session = await workdaySessionService.onEmployeeLogin({
          _id: userId,
          role: pingDoc.role || 'FIELD_EXEC'
        });
        if (!session) return;
      }

      const sessionId = session._id;

      // 2. Analyze movement relative to last recorded location in session
      const prevLocation = session.lastLocation;
      const movement = movementDetector.analyzeMovement(prevLocation, pingDoc);

      // 3. Update lastLocation on session
      session.lastLocation = {
        latitude: pingDoc.latitude,
        longitude: pingDoc.longitude,
        address: pingDoc.locationName || `${Number(pingDoc.latitude).toFixed(4)}, ${Number(pingDoc.longitude).toFixed(4)}`,
        timestamp,
        speed: movement.speedKmH,
        heading: movement.heading,
        accuracy: pingDoc.accuracy || 0
      };
      if (pingDoc.batteryLevel) session.batteryAtEnd = pingDoc.batteryLevel;
      await session.save();

      // 4. Run Stop Detection
      const stopResult = await stopDetector.processStopDetection({
        sessionId,
        userId,
        currentPing: pingDoc,
        prevLocation,
        isMoving: movement.isMoving,
        dateString
      });

      // 5. Categorize location using LocationIntelligence
      const locationIntel = await locationIntelligence.categorizeAndResolveLocation({
        userId,
        latitude: pingDoc.latitude,
        longitude: pingDoc.longitude,
        addressHint: pingDoc.locationName,
        dateString
      });

      // 6. Handle Stop vs Movement events
      if (stopResult && stopResult.action === 'NEW_STOP_DETECTED') {
        const stopObj = stopResult.stop;
        stopObj.category = locationIntel.category;
        stopObj.businessName = locationIntel.businessName;
        stopObj.address = locationIntel.address;
        stopObj.isVerifiedClientSite = locationIntel.isVerifiedClientSite;
        if (locationIntel.matchedVisitId) stopObj.matchedVisitId = locationIntel.matchedVisitId;
        await stopObj.save();

        // Create human-readable ARRIVED_STOP timeline event
        await TimelineEvent.create({
          sessionId,
          userId,
          timestamp,
          eventType: 'ARRIVED_STOP',
          title: `Arrived at ${locationIntel.businessName || 'Location'}`,
          description: `Category: ${locationIntel.category}${locationIntel.isVerifiedClientSite ? ' (Verified Client Site)' : ''}`,
          location: {
            latitude: pingDoc.latitude,
            longitude: pingDoc.longitude,
            address: locationIntel.address,
            businessName: locationIntel.businessName,
            category: locationIntel.category
          },
          metadata: {
            speed: movement.speedKmH,
            stopId: stopObj._id
          },
          dateString
        });
      } else if (stopResult && stopResult.action === 'DEPARTED_STOP') {
        const stopObj = stopResult.stop;
        // Create DEPARTED_STOP timeline event
        await TimelineEvent.create({
          sessionId,
          userId,
          timestamp,
          eventType: 'DEPARTED_STOP',
          title: `Left ${stopObj.businessName || 'Location'}`,
          description: `Stayed ${stopResult.durationMinutes} minutes (${stopObj.category})`,
          durationMinutes: stopResult.durationMinutes,
          location: {
            latitude: pingDoc.latitude,
            longitude: pingDoc.longitude,
            address: stopObj.address,
            businessName: stopObj.businessName,
            category: stopObj.category
          },
          metadata: {
            speed: movement.speedKmH,
            stopId: stopObj._id
          },
          dateString
        });

        // Also log START_TRAVEL
        await TimelineEvent.create({
          sessionId,
          userId,
          timestamp,
          eventType: 'START_TRAVEL',
          title: 'Traveling En Route',
          description: `Departed from ${stopObj.businessName}. Speed: ${movement.speedKmH} km/h`,
          location: {
            latitude: pingDoc.latitude,
            longitude: pingDoc.longitude,
            category: 'Transit'
          },
          metadata: { speed: movement.speedKmH, heading: movement.heading },
          dateString
        });
      } else if (movement.isMoving && movement.distanceKm > 0.050) {
        // Find or update open TRAVEL segment
        let openSegment = await LocationSegment.findOne({ sessionId, endTime: null, segmentType: 'TRAVEL' });
        if (!openSegment) {
          openSegment = await LocationSegment.create({
            sessionId,
            userId,
            startTime: timestamp,
            segmentType: 'TRAVEL',
            category: 'Travel Time',
            startCoords: { latitude: prevLocation?.latitude || pingDoc.latitude, longitude: prevLocation?.longitude || pingDoc.longitude },
            dateString,
            path: []
          });
        }

        openSegment.path.push({
          latitude: pingDoc.latitude,
          longitude: pingDoc.longitude,
          timestamp,
          speed: movement.speedKmH,
          heading: movement.heading,
          accuracy: pingDoc.accuracy || 0
        });
        openSegment.distanceKm = Number((openSegment.distanceKm + movement.distanceKm).toFixed(3));
        openSegment.durationMinutes = Math.max(1, Math.round((timestamp.getTime() - openSegment.startTime.getTime()) / 60000));
        await openSegment.save();
      } else if (!movement.isMoving) {
        // Find open TRAVEL segment and close it if employee stopped
        const openSegment = await LocationSegment.findOne({ sessionId, endTime: null, segmentType: 'TRAVEL' });
        if (openSegment) {
          openSegment.endTime = timestamp;
          openSegment.endCoords = { latitude: pingDoc.latitude, longitude: pingDoc.longitude };
          await openSegment.save();
        }

        // Create or update STOP/IDLE segment
        let stopSegment = await LocationSegment.findOne({ sessionId, endTime: null, segmentType: { $in: ['STOP', 'IDLE'] } });
        if (!stopSegment) {
          const segCategory = locationIntel.category === 'Client Office' ? 'Client Time' :
                              locationIntel.category === 'Office' ? 'Office Time' :
                              locationIntel.category === 'Restaurant' ? 'Break Time' : 'Idle Time';
          stopSegment = await LocationSegment.create({
            sessionId,
            userId,
            startTime: timestamp,
            segmentType: segCategory === 'Idle Time' ? 'IDLE' : 'STOP',
            category: segCategory,
            startCoords: { latitude: pingDoc.latitude, longitude: pingDoc.longitude },
            dateString,
            path: []
          });
        }
        stopSegment.durationMinutes = Math.max(1, Math.round((timestamp.getTime() - stopSegment.startTime.getTime()) / 60000));
        await stopSegment.save();
      }

      // 7. Periodically trigger workday summary recalculation (every ~10 pings or 10 minutes)
      if (Math.random() < 0.15) {
        await workdaySummaryService.generateOrUpdateSummary({ userId, dateString, sessionId });
      }

    } catch (err) {
      console.error('TimelineEngine processing error:', err);
    }
  }
}

module.exports = new TimelineEngine();
