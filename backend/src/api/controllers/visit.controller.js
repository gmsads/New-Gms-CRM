const Visit = require('../../domains/field/visits/visit.model');
const LocationPing = require('../../domains/field/visits/locationPing.model');
const User = require('../../domains/users/user.model');

exports.list = async (req, res) => {
  try {
    const { assignedTo, status, date } = req.query;
    const filter = {};
    if (assignedTo) filter.assignedTo = assignedTo;
    if (status && status !== 'All') filter.status = status;
    if (date) {
      const d = new Date(date);
      filter.scheduledDate = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    }
    const visits = await Visit.find(filter)
      .populate('assignedTo', 'name role email phone department')
      .populate('relatedClient', 'name')
      .sort({ scheduledDate: 1 })
      .lean();
    res.json({ success: true, data: visits });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const visit = new Visit(req.body);
    await visit.save();
    res.status(201).json({ success: true, data: visit });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const { gpsLat, gpsLng, photo, locationName, userId } = req.body;
    const visit = await Visit.findByIdAndUpdate(
      req.params.id,
      { status: 'In Progress', checkIn: { time: new Date(), gpsLat, gpsLng, photo } },
      { new: true }
    );
    if (!visit) return res.status(404).json({ success: false, message: 'Not found' });

    // Record a LocationPing for live map tracking
    if (gpsLat && gpsLng) {
      try {
        await LocationPing.create({
          userId: visit.assignedTo || userId || (req.user ? req.user._id : null),
          latitude: gpsLat,
          longitude: gpsLng,
          timestamp: new Date(),
          status: 'At Client Site (Checked In)',
          locationName: locationName || visit.location || visit.businessName || 'Client Location',
          visitId: visit._id
        });
      } catch (pingErr) {
        console.error('Error creating checkIn ping:', pingErr.message);
      }
    }

    res.json({ success: true, data: visit });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const { gpsLat, gpsLng, photo, completionNotes, mediaUploads, locationName, userId } = req.body;
    const visit = await Visit.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Completed',
        checkOut: { time: new Date(), gpsLat, gpsLng, photo },
        completionNotes,
        ...(mediaUploads && { mediaUploads }),
      },
      { new: true }
    );
    if (!visit) return res.status(404).json({ success: false, message: 'Not found' });

    // Record a LocationPing for check-out
    if (gpsLat && gpsLng) {
      try {
        await LocationPing.create({
          userId: visit.assignedTo || userId || (req.user ? req.user._id : null),
          latitude: gpsLat,
          longitude: gpsLng,
          timestamp: new Date(),
          status: 'Checked Out from Client Site',
          locationName: locationName || visit.location || visit.businessName || 'Client Location',
          visitId: visit._id
        });
      } catch (pingErr) {
        console.error('Error creating checkOut ping:', pingErr.message);
      }
    }

    res.json({ success: true, data: visit });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const visit = await Visit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!visit) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: visit });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── Location Ping / Live Route Tracking ─────────────────────────────────────

exports.recordLocationPing = async (req, res) => {
  try {
    const { userId, latitude, longitude, accuracy, status, locationName, visitId, batteryLevel } = req.body;
    const finalUserId = userId || (req.user ? req.user._id : null);
    if (!finalUserId || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'userId, latitude, and longitude are required' });
    }

    const ping = await LocationPing.create({
      userId: finalUserId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: accuracy ? Number(accuracy) : null,
      timestamp: new Date(),
      status: status || 'Active',
      locationName: locationName || `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`,
      visitId: visitId || null,
      batteryLevel: batteryLevel ? Number(batteryLevel) : null
    });

    res.status(201).json({ success: true, data: ping });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getLocationPings = async (req, res) => {
  try {
    const { userId, date, dateFrom, dateTo } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;

    if (dateFrom && dateTo) {
      filter.timestamp = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
    } else if (date) {
      const d = new Date(date);
      filter.timestamp = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    }

    const pings = await LocationPing.find(filter)
      .populate('visitId', 'title purpose businessName clientName status')
      .sort({ timestamp: 1 })
      .lean();

    res.json({ success: true, data: pings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Daily Visit Reports & Live Route Timeline (For Admin & Executive) ───────

exports.getDailyReports = async (req, res) => {
  try {
    const { year, month, executive, specificDate, search } = req.query;

    // 1. Build Date Range
    let startDate = null;
    let endDate = null;

    if (specificDate && specificDate !== 'All Dates' && specificDate.trim() !== '') {
      // Parse yyyy-mm-dd or dd-mm-yyyy
      let d = null;
      if (specificDate.includes('-')) {
        const parts = specificDate.split('-');
        if (parts[0].length === 4) {
          // yyyy-mm-dd
          d = new Date(parts[0], parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        } else {
          // dd-mm-yyyy
          d = new Date(parts[2], parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
      } else {
        d = new Date(specificDate);
      }
      if (!isNaN(d.getTime())) {
        startDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        endDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      }
    }

    if (!startDate && (!year || year === 'All Years') && (!month || month === 'All Months')) {
      // Default to today if no date specified
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (!startDate) {
      // Handle Month/Year filters when specificDate is not set
      const currentYear = (year && year !== 'All Years') ? parseInt(year, 10) : new Date().getFullYear();
      let monthIndex = -1;
      if (month && month !== 'All Months') {
        const monthsMap = {
          'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
          'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11,
          '01': 0, '02': 1, '03': 2, '04': 3, '05': 4, '06': 5, '07': 6, '08': 7, '09': 8, '10': 9, '11': 10, '12': 11,
          '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8
        };
        monthIndex = monthsMap[month.toString().toLowerCase()] ?? -1;
      }

      if (monthIndex >= 0) {
        startDate = new Date(currentYear, monthIndex, 1, 0, 0, 0, 0);
        endDate = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59, 999);
      } else if (year && year !== 'All Years') {
        startDate = new Date(currentYear, 0, 1, 0, 0, 0, 0);
        endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
      } else {
        // Fallback today
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      }
    }

    // 2. Fetch Users
    const userQuery = { isActive: { $ne: false } };
    if (executive && executive !== 'All Executives' && executive !== 'all') {
      userQuery._id = executive;
    } else {
      // Include field executives and sales managers (sales executives are in-house tele team and do calls only)
      userQuery.role = {
        $in: [
          'FIELD_EXEC', 'SALES_MANAGER', 'SR_SALES_MANAGER', 'OPERATION_MANAGER'
        ]
      };
    }

    let users = await User.find(userQuery)
      .select('name email role phone department profilePicture')
      .lean();

    // 3. Fetch Visits & Pings for each user inside date range
    const visitFilter = {
      scheduledDate: { $gte: startDate, $lte: endDate }
    };
    if (executive && executive !== 'All Executives' && executive !== 'all') {
      visitFilter.assignedTo = executive;
    }

    const allVisits = await Visit.find(visitFilter)
      .populate('assignedTo', 'name email role phone department')
      .sort({ scheduledDate: 1 })
      .lean();

    const pingFilter = {
      timestamp: { $gte: startDate, $lte: endDate }
    };
    if (executive && executive !== 'All Executives' && executive !== 'all') {
      pingFilter.userId = executive;
    }
    const allPings = await LocationPing.find(pingFilter)
      .sort({ timestamp: 1 })
      .lean();

    // 4. Assemble Report Per Employee
    const reports = users.map(user => {
      const uIdStr = user._id.toString();
      const userVisits = allVisits.filter(v => v.assignedTo && v.assignedTo._id && v.assignedTo._id.toString() === uIdStr);
      const userPings = allPings.filter(p => p.userId && p.userId.toString() === uIdStr);

      const totalVisitsAssigned = userVisits.length;
      const completedCount = userVisits.filter(v => v.status === 'Completed').length;
      const inProgressCount = userVisits.filter(v => v.status === 'In Progress').length;
      const pendingCount = userVisits.filter(v => ['Pending', 'Scheduled'].includes(v.status)).length;

      // Calculate time spent at client sites vs elsewhere
      let clientSiteSpentMinutes = 0;
      userVisits.forEach(v => {
        if (v.checkIn && v.checkIn.time && v.checkOut && v.checkOut.time) {
          const diffMs = new Date(v.checkOut.time) - new Date(v.checkIn.time);
          if (diffMs > 0) clientSiteSpentMinutes += Math.round(diffMs / 60000);
        } else if (v.checkIn && v.checkIn.time && v.status === 'In Progress') {
          const diffMs = Date.now() - new Date(v.checkIn.time);
          if (diffMs > 0) clientSiteSpentMinutes += Math.round(diffMs / 60000);
        }
      });

      // Calculate duration from pings labeled 'At Client Site'
      userPings.forEach((p, idx) => {
        if (p.status && p.status.toLowerCase().includes('client site') && idx < userPings.length - 1) {
          const nextP = userPings[idx + 1];
          const diffMs = new Date(nextP.timestamp) - new Date(p.timestamp);
          // If less than 2 hours gap between consecutive pings, count as onsite time if not already counted
          if (diffMs > 0 && diffMs < 7200000 && userVisits.length === 0) {
            clientSiteSpentMinutes += Math.round(diffMs / 60000);
          }
        }
      });

      // Total tracked shift duration from first ping/visit to last ping/visit
      let totalShiftMinutes = 0;
      const timestamps = [
        ...userVisits.map(v => v.checkIn?.time).filter(Boolean),
        ...userVisits.map(v => v.checkOut?.time).filter(Boolean),
        ...userPings.map(p => p.timestamp).filter(Boolean)
      ].map(t => new Date(t).getTime()).sort((a, b) => a - b);

      if (timestamps.length >= 2) {
        totalShiftMinutes = Math.round((timestamps[timestamps.length - 1] - timestamps[0]) / 60000);
      } else if (timestamps.length === 1 && userVisits.length > 0) {
        totalShiftMinutes = clientSiteSpentMinutes;
      }

      const travelOrOtherMinutes = Math.max(0, totalShiftMinutes - clientSiteSpentMinutes);

      // Build unified Live Route Timeline (combining pings + visit checkIn/checkOut points)
      const timelineMap = new Map();

      userPings.forEach(p => {
        timelineMap.set(new Date(p.timestamp).getTime() + Math.random(), {
          id: p._id,
          timestamp: p.timestamp,
          latitude: p.latitude,
          longitude: p.longitude,
          locationName: p.locationName || `Lat ${p.latitude.toFixed(4)}, Lng ${p.longitude.toFixed(4)}`,
          status: p.status || 'En Route',
          activityType: 'Location Ping',
          accuracy: p.accuracy
        });
      });

      userVisits.forEach(v => {
        if (v.checkIn && v.checkIn.time && v.checkIn.gpsLat && v.checkIn.gpsLng) {
          timelineMap.set(new Date(v.checkIn.time).getTime(), {
            id: `checkin-${v._id}`,
            timestamp: v.checkIn.time,
            latitude: v.checkIn.gpsLat,
            longitude: v.checkIn.gpsLng,
            locationName: v.location || v.businessName || v.clientName || `Lat ${v.checkIn.gpsLat.toFixed(4)}`,
            status: 'Checked In at Client Site',
            activityType: 'Check-In',
            visitTitle: v.purpose || v.title,
            businessName: v.businessName || v.clientName,
            photo: v.checkIn.photo
          });
        }
        if (v.checkOut && v.checkOut.time && v.checkOut.gpsLat && v.checkOut.gpsLng) {
          timelineMap.set(new Date(v.checkOut.time).getTime(), {
            id: `checkout-${v._id}`,
            timestamp: v.checkOut.time,
            latitude: v.checkOut.gpsLat,
            longitude: v.checkOut.gpsLng,
            locationName: v.location || v.businessName || v.clientName || `Lat ${v.checkOut.gpsLat.toFixed(4)}`,
            status: 'Checked Out from Client Site',
            activityType: 'Check-Out',
            visitTitle: v.purpose || v.title,
            businessName: v.businessName || v.clientName,
            photo: v.checkOut.photo,
            completionNotes: v.completionNotes
          });
        }
      });

      const liveRouteTimeline = Array.from(timelineMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(entry => entry[1]);

      return {
        employee: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone || 'N/A',
          department: user.department || 'Field & Sales Operations'
        },
        stats: {
          totalVisitsAssigned,
          completedCount,
          inProgressCount,
          pendingCount,
          clientSiteSpentMinutes,
          travelOrOtherMinutes,
          totalShiftMinutes
        },
        visits: userVisits,
        liveRouteTimeline
      };
    });

    // 5. Apply Search Filter if any
    let finalReports = reports;
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      finalReports = reports.filter(r => {
        const matchName = r.employee.name?.toLowerCase().includes(q);
        const matchEmail = r.employee.email?.toLowerCase().includes(q);
        const matchRole = r.employee.role?.toLowerCase().includes(q);
        const matchDept = r.employee.department?.toLowerCase().includes(q);
        const matchPhone = r.employee.phone?.toLowerCase().includes(q);
        const matchVisit = r.visits.some(v =>
          v.businessName?.toLowerCase().includes(q) ||
          v.clientName?.toLowerCase().includes(q) ||
          v.purpose?.toLowerCase().includes(q) ||
          v.location?.toLowerCase().includes(q)
        );
        return matchName || matchEmail || matchRole || matchDept || matchPhone || matchVisit;
      });
    }

    // Sort so executives with visits or pings appear on top by default
    finalReports.sort((a, b) => {
      const aActivity = a.stats.totalVisitsAssigned + a.liveRouteTimeline.length;
      const bActivity = b.stats.totalVisitsAssigned + b.liveRouteTimeline.length;
      return bActivity - aActivity;
    });

    res.json({
      success: true,
      dateRange: { startDate, endDate },
      count: finalReports.length,
      data: finalReports
    });
  } catch (err) {
    console.error('getDailyReports error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
