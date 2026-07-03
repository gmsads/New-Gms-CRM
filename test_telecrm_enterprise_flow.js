/**
 * Verification Test Script: Enterprise TeleCRM Calling & Recording Enhancements
 */
const path = require('path');
const assert = require('assert');

console.log('=== Starting Enterprise TeleCRM Verification ===\n');

try {
  console.log('[1/7] Testing Model Imports...');
  const LeadCall = require('./backend/src/domains/telecrm/models/leadCall.model');
  const CompanionDevice = require('./backend/src/domains/telecrm/models/companionDevice.model');
  assert(LeadCall, 'LeadCall model loaded');
  assert(CompanionDevice, 'CompanionDevice model loaded');
  console.log('✔ Models loaded successfully.\n');

  console.log('[2/7] Testing TelephonyAdaptersService Normalization...');
  const telephonyAdapters = require('./backend/src/domains/telecrm/services/telephonyAdapters.service');
  const exotelNorm = telephonyAdapters.normalizeWebhook('EXOTEL', {
    CallSid: 'EXO-12345',
    Status: 'completed',
    RecordingDuration: '45',
    RecordingUrl: 'https://exotel.com/rec/123.mp3',
    To: '9876543210'
  });
  assert.strictEqual(exotelNorm.providerCallId, 'EXO-12345');
  assert.strictEqual(exotelNorm.status, 'Completed');
  assert.strictEqual(exotelNorm.durationSeconds, 45);
  console.log('✔ Exotel webhook normalized correctly:', exotelNorm);

  const airtelNorm = telephonyAdapters.normalizeWebhook('AIRTEL IQ', {
    correlationId: 'AIR-999',
    callState: 'busy',
    talkDuration: '0',
    callee: '+919876543210'
  });
  assert.strictEqual(airtelNorm.status, 'Busy');
  console.log('✔ Airtel IQ webhook normalized correctly:', airtelNorm, '\n');

  console.log('[3/7] Testing RecordingStorageService Checksum & Abstraction...');
  const recordingStorage = require('./backend/src/domains/telecrm/services/recordingStorage.service');
  const sampleBuffer = Buffer.from('mock audio file content for telecrm recording test');
  const sha = recordingStorage.calculateChecksum(sampleBuffer);
  assert(sha && sha.length === 64, 'SHA256 checksum generated');
  console.log('✔ Checksum calculated:', sha);

  console.log('[4/7] Testing Additive Services Initialization...');
  const callLifecycle = require('./backend/src/domains/telecrm/services/callLifecycle.service');
  const companionService = require('./backend/src/domains/telecrm/services/companion.service');
  const telephonyAnalytics = require('./backend/src/domains/telecrm/services/telephonyAnalytics.service');
  assert(callLifecycle && companionService && telephonyAnalytics);
  console.log('✔ Services initialized cleanly.\n');

  console.log('[5/7] Testing Dedicated Controllers Initialization...');
  const telephonyEnterpriseCtrl = require('./backend/src/domains/telecrm/controllers/telephonyEnterprise.controller');
  const companionCtrl = require('./backend/src/domains/telecrm/controllers/companion.controller');
  assert(telephonyEnterpriseCtrl.handleProviderWebhook);
  assert(companionCtrl.uploadRecording);
  console.log('✔ Dedicated controllers initialized cleanly.\n');

  console.log('[6/7] Testing Route Mounting...');
  const telecrmRoutes = require('./backend/src/domains/telecrm/routes/telecrm.routes');
  assert(telecrmRoutes, 'telecrm routes exported cleanly');
  console.log('✔ TeleCRM routes mounted without errors.\n');

  console.log('[7/7] Testing Queue Manager Extension...');
  const queueManager = require('./backend/src/services/queues/queueManager');
  assert(queueManager.telephonyQueue !== undefined, 'telephonyQueue exported');
  assert(queueManager.recordingQueue !== undefined, 'recordingQueue exported');
  console.log('✔ Queue manager extended cleanly.\n');

  console.log('🎉 ALL 7 ENTERPRISE TELECRM VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  process.exit(0);
} catch (err) {
  console.error('❌ VERIFICATION FAILED:', err);
  process.exit(1);
}
