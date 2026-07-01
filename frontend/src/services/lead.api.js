import api from './api';

/**
 * lead.api.js — Frontend API service for Enterprise Lead Management
 */
export const leadApi = {
  list: (params, token) => api.get(`/telecrm/leads?${new URLSearchParams(params)}`, token),
  createManual: (data, token) => api.post('/telecrm/leads', data, token),
  distributePoolLeads: (payload, token) => api.post('/telecrm/leads/distribute', payload, token),
  convert: (id, token) => api.post(`/telecrm/leads/${id}/convert`, {}, token),
  getDashboard: (token) => api.get('/telecrm/dashboard', token),
  
  // Bulk Import
  previewImport: (rows, token) => api.post('/telecrm/import/preview', { rows }, token),
  commitImport: (payload, token) => api.post('/telecrm/import/commit', payload, token),
  
  // On-Demand
  assignOnDemand: (batchSize, campaignId, token) => api.post('/telecrm/on-demand', { batchSize, campaignId }, token),
  
  // Telephony & Disposition
  initiateCall: (calleePhone, leadId, token) => api.post('/telecrm/calls/initiate', { calleePhone, leadId }, token),
  saveCallDisposition: (data, token) => api.post('/telecrm/calls/popup', data, token),
  getCallHistory: (params, token) => api.get(`/telecrm/calls/history?${new URLSearchParams(params)}`, token),
  
  // Campaigns
  listCampaigns: (token) => api.get('/telecrm/campaigns', token),
  createCampaign: (data, token) => api.post('/telecrm/campaigns', data, token),
  saveRules: (id, rules, token) => api.post(`/telecrm/campaigns/${id}/rules`, { rules }, token),
  
  // Reports
  getReports: (type, token) => api.get(`/telecrm/reports/${type}`, token),

  // Additive Enterprise APIs
  getLiveWallboard: (token) => api.get('/telecrm/live-status', token),
  updateLiveStatus: (status, token) => api.post('/telecrm/live-status', { status }, token),
  getConfig: (token) => api.get('/telecrm/config', token),
  saveConfig: (data, token) => api.put('/telecrm/config', data, token),
  submitQaReview: (callId, data, token) => api.post(`/telecrm/qa/${callId}`, data, token),
  listQaReviews: (params, token) => api.get(`/telecrm/qa?${new URLSearchParams(params)}`, token),
  getEodReport: (params, token) => api.get(`/telecrm/eod-report?${new URLSearchParams(params)}`, token),
  getAuditTrail: (params, token) => api.get(`/telecrm/audit?${new URLSearchParams(params)}`, token),
  listFraudAlerts: (token) => api.get('/telecrm/fraud-alerts', token),
  getCeoFunnel: (token) => api.get('/telecrm/ceo-funnel', token),
  getScorecard: (params, token) => api.get(`/telecrm/scorecard?${new URLSearchParams(params)}`, token),
  runBulkActions: (data, token) => api.post('/telecrm/bulk-actions', data, token),
};

export default leadApi;
