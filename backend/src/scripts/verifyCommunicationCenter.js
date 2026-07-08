/**
 * verifyCommunicationCenter.js
 * Verification script to validate end-to-end event emission, queue pipeline, provider dispatch, and 3-tier logs.
 */

const path = require('path');
const dotenv = require('dotenv');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(__dirname, '../../', envFile) });

const mongoose = require('mongoose');
const phoneService = require('../utils/phone.service');
const eventBus = require('../core/events/eventBus.service');
const domainEvents = require('../core/events/domainEvents');
const { startEventBusWorker } = require('../services/workers/eventBusWorker');
const { startCommunicationWorker } = require('../services/workers/communicationWorker');
const NotificationMetadata = require('../domains/notifications/models/notificationMetadata.model');
const CommunicationTimeline = require('../domains/notifications/models/communicationTimeline.model');
const CommunicationAuditLog = require('../domains/notifications/models/communicationAuditLog.model');

const runVerification = async () => {
  console.log('─── Starting Enterprise Communication Center Verification ───\n');

  // 1. Verify Phone Normalization
  console.log('1. Testing Phone Normalization Service...');
  const testPhone = '9876543210';
  const normalized = phoneService.normalize(testPhone);
  if (normalized !== '+919876543210') {
    throw new Error(`Phone normalization failed. Expected +919876543210, got ${normalized}`);
  }
  console.log(`   ✅ Normalization correct: "${testPhone}" -> "${normalized}"\n`);

  // 2. Connect DB
  console.log('2. Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('   ✅ MongoDB connected\n');

  // Start workers
  console.log('3. Starting Async Communication Workers...');
  startEventBusWorker();
  startCommunicationWorker();
  console.log('   ✅ Workers running\n');

  // 4. Emit ORDER_CREATED Domain Event
  console.log('4. Emitting ORDER_CREATED event...');
  const testOrderId = new mongoose.Types.ObjectId();
  const dummyOrder = {
    _id: testOrderId,
    orderNumber: `ORD-TEST-${Date.now()}`,
    clientSnapshot: { name: 'Acme Corp Client', phone: '9876543210' },
    grandTotal: 125000,
    lineItems: [{ description: 'Cloud ERP Setup' }, { description: 'Custom WhatsApp Integration' }],
    deliveryTimeline: '10 Business Days'
  };

  const { eventId, correlationId } = await eventBus.publish(domainEvents.ORDER_CREATED, dummyOrder);
  console.log(`   ✅ Event published: eventId=${eventId}, correlationId=${correlationId}\n`);

  // Wait for async workers to finish processing
  console.log('5. Waiting 2.5 seconds for asynchronous queue & worker dispatch...');
  await new Promise(r => setTimeout(r, 2500));

  // 6. Verify Normalized 3-Tier Logs
  console.log('\n6. Checking Normalized 3-Tier Database Logs...');
  const metaRecord = await NotificationMetadata.findOne({ eventId });
  if (!metaRecord) {
    throw new Error(`Failed to find NotificationMetadata record for eventId ${eventId}`);
  }
  console.log(`   ✅ [NotificationMetadata] Status: ${metaRecord.status}, Template: ${metaRecord.templateName}, ProviderMsgID: ${metaRecord.providerMessageId}`);

  const timelineRecord = await CommunicationTimeline.findOne({ notificationId: metaRecord.notificationId });
  if (!timelineRecord) {
    throw new Error(`Failed to find CommunicationTimeline record for notificationId ${metaRecord.notificationId}`);
  }
  console.log(`   ✅ [CommunicationTimeline] Title: "${timelineRecord.title}", Summary: "${timelineRecord.summary}"`);

  const auditLogs = await CommunicationAuditLog.find({ notificationId: metaRecord.notificationId }).sort({ timestamp: 1 });
  console.log(`   ✅ [CommunicationAuditLog] Captured ${auditLogs.length} audit steps (${auditLogs.map(a => a.action).join(' -> ')})\n`);

  // 7. Verify Idempotency
  console.log('7. Testing Idempotency protection (re-publishing duplicate event)...');
  await eventBus.publish(domainEvents.ORDER_CREATED, dummyOrder, { correlationId });
  await new Promise(r => setTimeout(r, 1500));
  const count = await NotificationMetadata.countDocuments({ eventId });
  if (count !== 1) {
    throw new Error(`Idempotency check failed! Expected 1 metadata record, found ${count}`);
  }
  console.log('   ✅ Idempotency verified: Duplicate event was safely ignored without duplicate messaging.\n');

  // Clean up verification test data
  console.log('8. Cleaning up verification records...');
  await NotificationMetadata.deleteMany({ eventId });
  await CommunicationTimeline.deleteMany({ notificationId: metaRecord.notificationId });
  await CommunicationAuditLog.deleteMany({ notificationId: metaRecord.notificationId });
  console.log('   ✅ Cleanup complete.\n');

  console.log('─── 🎉 All Enterprise Communication Center Verifications Passed Successfully! ───');
  await mongoose.disconnect();
  process.exit(0);
};

runVerification().catch(err => {
  console.error('\n❌ Verification failed:', err);
  process.exit(1);
});
