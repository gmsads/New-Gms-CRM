const dailyWorkService = require('../services/dailyWork.service');

exports.getEnterpriseDailyWork = async (req, res) => {
  try {
    const { date, department } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter (YYYY-MM-DD) is required.' });
    }

    const data = await dailyWorkService.getEnterpriseDailyWork(date, department, req.user);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('[DAILY_WORK_REPORT_ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to generate enterprise daily work report.', error: error.message });
  }
};
