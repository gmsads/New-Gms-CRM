const fs = require('fs');
const path = require('path');
const recordingStorage = require('../services/recordingStorage.service');
const telephonyAnalytics = require('../services/telephonyAnalytics.service');
const queueManager = require('../../../services/queues/queueManager');
const LeadCall = require('../models/leadCall.model');

/**
 * TelephonyEnterpriseController
 * Dedicated additive controller for enterprise webhook intake, streaming, download, and analytics.
 */
class TelephonyEnterpriseController {
  /**
   * Public / Idempotent Webhook Intake for Cloud Telephony Providers
   */
  async handleProviderWebhook(req, res) {
    try {
      const provider = req.params.provider || req.query.provider || 'EXOTEL';
      const payload = req.body || req.query || {};

      // Push to background telephony queue if queue available
      if (queueManager.telephonyQueue) {
        await queueManager.telephonyQueue.add('processWebhook', { provider, payload });
        return res.status(202).json({ success: true, message: 'Webhook received and queued for background processing.' });
      }

      // Synchronous fallback if queue disabled
      const telephonyAdapters = require('../services/telephonyAdapters.service');
      const callLifecycle = require('../services/callLifecycle.service');
      const normalized = telephonyAdapters.normalizeWebhook(provider, payload);
      
      let call = null;
      if (normalized.providerCallId) {
        call = await LeadCall.findOne({ providerCallId: normalized.providerCallId });
      }
      if (!call && normalized.calleePhone) {
        const cleanPhone = normalized.calleePhone.replace(/\D/g, '').slice(-10);
        call = await LeadCall.findOne({ calleePhone: { $regex: cleanPhone } }).sort({ createdAt: -1 });
      }
      if (call) {
        await callLifecycle.transitionStage({
          callId: call._id,
          newStage: normalized.status || 'Completed',
          timestamp: new Date(),
          metadata: {
            recordingUrl: normalized.recordingUrl,
            durationSeconds: normalized.durationSeconds,
            talkDuration: normalized.durationSeconds
          }
        });
      }

      return res.status(200).json({ success: true, message: 'Webhook processed.' });
    } catch (err) {
      console.error('[TelephonyEnterpriseController] Webhook Error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Stream Recording Audio with HTTP Range Requests support
   */
  async streamRecording(req, res) {
    try {
      const callId = req.params.id;
      const call = await LeadCall.findById(callId);
      if (!call || !call.recordingUrl) {
        return res.status(404).json({ success: false, message: 'Recording not found for this call.' });
      }

      const streamInfo = await recordingStorage.getRecordingStreamInfo(call.recordingUrl);
      if (streamInfo.type === 'REMOTE') {
        return res.redirect(302, streamInfo.url);
      }

      const filePath = streamInfo.path;
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'Local audio file not found.' });
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'audio/mpeg',
        };
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'audio/mpeg',
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
      }
    } catch (err) {
      console.error('[TelephonyEnterpriseController] Stream Error:', err);
      return res.status(500).json({ success: false, message: 'Failed to stream audio.' });
    }
  }

  /**
   * Secure Permission-Checked Recording Download
   */
  async downloadRecording(req, res) {
    try {
      const allowedRoles = ['ADMIN', 'MD_CEO', 'SALES_MANAGER'];
      const hasRole = req.user && allowedRoles.includes(req.user.role);
      const hasPerm = req.user && req.user.permissions?.some(p => p.key === 'REPORTS_ACCESS');
      if (!hasRole && !hasPerm) {
        return res.status(403).json({ success: false, message: 'Permission denied to download call recordings.' });
      }

      const callId = req.params.id;
      const call = await LeadCall.findById(callId);
      if (!call || !call.recordingUrl) {
        return res.status(404).json({ success: false, message: 'Recording not found.' });
      }

      const streamInfo = await recordingStorage.getRecordingStreamInfo(call.recordingUrl);
      if (streamInfo.type === 'REMOTE') {
        return res.redirect(302, streamInfo.url);
      }

      return res.download(streamInfo.path, `call_${callId}.mp3`);
    } catch (err) {
      console.error('[TelephonyEnterpriseController] Download Error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Aggregated Telephony KPIs
   */
  async getCallingKpis(req, res) {
    try {
      const { callerId, startDate, endDate } = req.query;
      const kpis = await telephonyAnalytics.getAggregatedMetrics({ callerId, startDate, endDate });
      return res.status(200).json({ success: true, data: kpis });
    } catch (err) {
      console.error('[TelephonyEnterpriseController] KPIs Error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new TelephonyEnterpriseController();
