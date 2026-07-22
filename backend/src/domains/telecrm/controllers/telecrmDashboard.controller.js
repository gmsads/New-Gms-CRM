const dashboardService = require('../services/telecrmDashboard.service');

class TelecrmDashboardController {
  async getKpis(req, res, next) {
    try {
      const filters = req.query;
      const data = await dashboardService.getKpis(filters, req.user);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getExecutives(req, res, next) {
    try {
      const filters = req.query;
      const data = await dashboardService.getExecutivePerformance(filters);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getCharts(req, res, next) {
    try {
      const filters = req.query;
      const data = await dashboardService.getCharts(filters);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getSources(req, res, next) {
    try {
      const filters = req.query;
      const data = await dashboardService.getSourceAnalysis(filters);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getTimeline(req, res, next) {
    try {
      const filters = req.query;
      const data = await dashboardService.getTimeline(filters, parseInt(req.query.limit, 10) || 20);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TelecrmDashboardController();
