const client360Service = require('../../domains/sales/client360.service');

// Wrapper for error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

exports.getLedgerSummaryByMobile = asyncHandler(async (req, res) => {
  const { phone } = req.params;
  const { company } = req.query;
  const result = await client360Service.getLedgerSummaryByMobile(phone, company);
  res.status(200).json({ success: true, data: result });
});

exports.getProspectsByMobile = asyncHandler(async (req, res) => {
  const { phone } = req.params;
  const { company } = req.query;
  const result = await client360Service.getProspectsByMobile(phone, company, req.query);
  res.status(200).json({ success: true, ...result });
});

exports.getFollowupsByMobile = asyncHandler(async (req, res) => {
  const { phone } = req.params;
  const { company } = req.query;
  const result = await client360Service.getFollowupsByMobile(phone, company, req.query);
  res.status(200).json({ success: true, ...result });
});

exports.getAppointmentsByMobile = asyncHandler(async (req, res) => {
  const { phone } = req.params;
  const { company } = req.query;
  const result = await client360Service.getAppointmentsByMobile(phone, company, req.query);
  res.status(200).json({ success: true, ...result });
});

exports.getOrdersByMobile = asyncHandler(async (req, res) => {
  const { phone } = req.params;
  const { company } = req.query;
  const result = await client360Service.getOrdersByMobile(phone, company, req.query);
  res.status(200).json({ success: true, ...result });
});

exports.getPaymentsByMobile = asyncHandler(async (req, res) => {
  const { phone } = req.params;
  const { company } = req.query;
  const result = await client360Service.getPaymentsByMobile(phone, company, req.query);
  res.status(200).json({ success: true, ...result });
});

exports.getTimelineByMobile = asyncHandler(async (req, res) => {
  const { phone } = req.params;
  const { company } = req.query;
  const result = await client360Service.getTimelineByMobile(phone, company, req.query);
  res.status(200).json({ success: true, ...result });
});

exports.getDocumentsByMobile = asyncHandler(async (req, res) => {
  const { phone } = req.params;
  const { company } = req.query;
  const result = await client360Service.getDocumentsByMobile(phone, company, req.query);
  res.status(200).json({ success: true, ...result });
});
