/**
 * WorkdaySummaryService
 * Classifies entire shift into exact categories (`Office Time`, `Travel Time`, `Client Time`, `Idle Time`, `Break Time`, `Unknown Time`)
 * and generates the `DailySummary` collection records.
 */

const DailySummary = require('../models/dailySummary.model');
const LocationSegment = require('../models/locationSegment.model');
const StopHistory = require('../models/stopHistory.model');
const WorkdaySession = require('../models/workdaySession.model');
const routeAnalyzer = require('./routeAnalyzer.service');

class WorkdaySummaryService {
  /**
   * Recalculate workday summary bucket metrics and update DailySummary collection
   */
  async generateOrUpdateSummary({ userId, dateString, sessionId }) {
    if (!userId || !dateString) return null;

    const query = sessionId ? { sessionId } : { userId, dateString };

    const session = await WorkdaySession.findOne(query).sort({ loginTime: -1 });
    const segments = await LocationSegment.find(query).lean();
    const stops = await StopHistory.find(query).lean();

    let officeMinutes = 0;
    let travelMinutes = 0;
    let clientMinutes = 0;
    let breakMinutes = 0;
    let idleMinutes = 0;
    let unknownMinutes = 0;

    // 1. Sum up segment durations by category
    for (const seg of segments) {
      const dur = seg.durationMinutes || 0;
      if (seg.segmentType === 'TRAVEL') {
        travelMinutes += dur;
      } else if (seg.segmentType === 'IDLE') {
        idleMinutes += dur;
      } else {
        // STOP segment
        switch (seg.category) {
          case 'Office Time':
            officeMinutes += dur;
            break;
          case 'Client Time':
            clientMinutes += dur;
            break;
          case 'Break Time':
            breakMinutes += dur;
            break;
          case 'Idle Time':
            idleMinutes += dur;
            break;
          default:
            unknownMinutes += dur;
            break;
        }
      }
    }

    // 2. Count stop categories
    const stopCategoriesCount = {
      clientOffice: 0,
      office: 0,
      restaurant: 0,
      petrolPump: 0,
      bank: 0,
      mall: 0,
      unknown: 0
    };

    for (const st of stops) {
      switch (st.category) {
        case 'Client Office':
          stopCategoriesCount.clientOffice++;
          break;
        case 'Office':
          stopCategoriesCount.office++;
          break;
        case 'Restaurant':
          stopCategoriesCount.restaurant++;
          break;
        case 'Petrol Pump':
          stopCategoriesCount.petrolPump++;
          break;
        case 'Bank':
          stopCategoriesCount.bank++;
          break;
        case 'Mall':
          stopCategoriesCount.mall++;
          break;
        default:
          stopCategoriesCount.unknown++;
          break;
      }
    }

    const totalWorkingMinutes = officeMinutes + travelMinutes + clientMinutes + breakMinutes + idleMinutes + unknownMinutes;
    const totalKm = await routeAnalyzer.calculateSessionTotalDistance(session ? session._id : null);

    const breakdownMinutes = {
      office: officeMinutes,
      travel: travelMinutes,
      client: clientMinutes,
      break: breakMinutes,
      idle: idleMinutes,
      unknown: unknownMinutes
    };

    // 3. Update session metrics if session exists
    if (session) {
      session.metrics = {
        totalWorkingMinutes,
        distanceTravelledKm: totalKm,
        numberOfStops: stops.length,
        officeMinutes,
        travelMinutes,
        clientMinutes,
        breakMinutes,
        idleMinutes,
        unknownMinutes
      };
      await session.save();
    }

    // 4. Update or create DailySummary
    const summary = await DailySummary.findOneAndUpdate(
      { userId, dateString },
      {
        $set: {
          sessionId: session ? session._id : null,
          loginTime: session ? session.loginTime : null,
          logoutTime: session ? session.logoutTime : null,
          totalWorkingMinutes,
          distanceTravelledKm: totalKm,
          numberOfStops: stops.length,
          breakdownMinutes,
          stopCategoriesCount,
          isComplete: session ? session.status === 'COMPLETED' : false
        }
      },
      { upsert: true, new: true }
    );

    return summary;
  }
}

module.exports = new WorkdaySummaryService();
