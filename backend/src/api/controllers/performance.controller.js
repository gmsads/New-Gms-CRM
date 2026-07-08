const KpiConfig = require('../../domains/performance/kpiConfig.model');
const IncentiveRule = require('../../domains/performance/incentiveRule.model');
const PerformanceSnapshot = require('../../domains/performance/performanceSnapshot.model');
const PerformanceReview = require('../../domains/performance/performanceReview.model');

// --- KPI Configuration CRUD ---

exports.createKpiConfig = async (req, res, next) => {
  try {
    const kpi = new KpiConfig({
      ...req.body,
      createdBy: req.user._id
    });
    await kpi.save();
    res.status(201).json({ success: true, data: kpi });
  } catch (error) {
    next(error);
  }
};

exports.getKpiConfigs = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.isActive) filter.isActive = req.query.isActive === 'true';

    const kpis = await KpiConfig.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: kpis.length, data: kpis });
  } catch (error) {
    next(error);
  }
};

exports.updateKpiConfig = async (req, res, next) => {
  try {
    const kpi = await KpiConfig.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!kpi) return res.status(404).json({ success: false, message: 'KPI Config not found' });
    res.json({ success: true, data: kpi });
  } catch (error) {
    next(error);
  }
};

exports.deleteKpiConfig = async (req, res, next) => {
  try {
    const kpi = await KpiConfig.findByIdAndDelete(req.params.id);
    if (!kpi) return res.status(404).json({ success: false, message: 'KPI Config not found' });
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// --- Incentive Rule CRUD ---

exports.createIncentiveRule = async (req, res, next) => {
  try {
    const rule = new IncentiveRule({
      ...req.body,
      createdBy: req.user._id
    });
    await rule.save();
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

exports.getIncentiveRules = async (req, res, next) => {
  try {
    const rules = await IncentiveRule.find().sort({ createdAt: -1 });
    res.json({ success: true, count: rules.length, data: rules });
  } catch (error) {
    next(error);
  }
};

exports.updateIncentiveRule = async (req, res, next) => {
  try {
    const rule = await IncentiveRule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!rule) return res.status(404).json({ success: false, message: 'Incentive Rule not found' });
    res.json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

exports.deleteIncentiveRule = async (req, res, next) => {
  try {
    const rule = await IncentiveRule.findByIdAndDelete(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: 'Incentive Rule not found' });
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// --- Performance Engines ---
const performanceService = require('../services/performance.service');

exports.getIndividualPerformance = async (req, res, next) => {
  try {
    const userId = req.query.employeeId || req.user._id;
    const periodStart = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().setDate(1));
    const periodEnd = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const data = await performanceService.calculateIPS(userId, periodStart, periodEnd);
    res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

exports.getTeamPerformance = async (req, res, next) => {
  try {
    const managerId = req.query.managerId || req.user._id;
    const periodStart = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().setDate(1));
    const periodEnd = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const data = await performanceService.calculateTPS(managerId, periodStart, periodEnd);
    res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

exports.getBottlenecks = async (req, res, next) => {
  try {
    const data = await performanceService.detectBottlenecks();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getAiInsights = async (req, res, next) => {
  try {
    const userId = req.query.employeeId || req.user._id;
    const data = await performanceService.generateInsights(userId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getEmployeeHealth = async (req, res, next) => {
  try {
    const userId = req.query.employeeId || req.user._id;
    const data = await performanceService.calculateEmployeeHealth(userId);
    res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};
