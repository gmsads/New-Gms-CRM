/**
 * eventBusWorker.js
 * Consumes domain events from eventBusQueue and drives the SOLID Communication Center pipeline:
 * PolicyResolver -> TemplateMapper -> PayloadBuilder -> QueuePublisher.
 */

const { eventBusQueue, useBullMQ, connection } = require('../queues/communicationQueue');
const policyResolver = require('../../domains/notifications/services/policyResolver.service');
const templateMapper = require('../../domains/notifications/services/templateMapper.service');
const payloadBuilder = require('../../domains/notifications/services/payloadBuilder.service');
const queuePublisher = require('../../domains/notifications/services/queuePublisher.service');
const executionPlanner = require('../../domains/notifications/services/executionPlanner.service');
const CommunicationAuditLog = require('../../domains/notifications/models/communicationAuditLog.model');

const processDomainEvent = async (job) => {
  const { eventId, correlationId, eventName, payload, tenantId } = job.data;
  console.log(`[EventBusWorker] Processing event ${eventName} (ID: ${eventId})`);

  try {
    // 1. Resolve Policy & Target Channels
    const policy = await policyResolver.resolve(eventName, payload);
    if (!policy.allowed) {
      console.log(`[EventBusWorker] Event ${eventName} skipped by PolicyResolver: ${policy.reason}`);
      await CommunicationAuditLog.create({
        notificationId: `SKIP-${eventId}`,
        correlationId,
        attemptNumber: 1,
        action: 'POLICY_SKIPPED',
        errorMessage: policy.reason
      });
      return;
    }

    // 2. For each allowed channel, map and publish
    for (const channel of policy.channels) {
      if (channel === 'WHATSAPP') {
        let phase5A_published = false;

        if (process.env.ENABLE_ECC_PHASE_5A === 'true' && policy.plan) {
          try {
            // 2.2. Generate Execution Plan from Native Policy Plan
            const executionPlan = executionPlanner.createExecutionPlan({
              plan: policy.plan,
              context: {
                eventId,
                correlationId,
                tenantId,
                branchId: payload?.branchId || null
              }
            });

            let successfulSteps = 0;

            // 2.3. Map and Execute Plan Steps
            for (const step of executionPlan.steps) {
              if (step.channel !== 'WHATSAPP') continue; // Phase 5A Supported Channel Boundary

              try {
                const mapped = templateMapper.map(eventName, payload);
                const formattedPayload = payloadBuilder.build(policy, mapped);

                await queuePublisher.publish({
                  eventId: step.context.eventId || eventId,
                  correlationId: step.context.correlationId || correlationId,
                  eventName: eventName,
                  channel: step.channel,
                  provider: step.provider,
                  payload: formattedPayload,
                  title: mapped.title,
                  summary: mapped.summary,
                  customerId: payload?.clientSnapshot?._id || payload?.prospect?._id || payload?.client?._id,
                  orderId: payload?.orderId || (eventName.includes('ORDER') ? payload._id : payload?.order?._id),
                  paymentId: eventName.includes('PAYMENT') ? payload._id : undefined,
                  tenantId: step.context.tenantId || tenantId
                });

                successfulSteps++;
              } catch (stepErr) {
                console.error(`[EventBusWorker] Phase 5A step execution failed for ${eventName}:`, stepErr.message);
                await CommunicationAuditLog.create({
                  notificationId: `ERR-${step.context.eventId || eventId}`,
                  correlationId: step.context.correlationId || correlationId,
                  attemptNumber: 1,
                  action: 'STEP_EXECUTION_ERROR',
                  errorMessage: stepErr.message
                });
              }
            }

            // Mark successful publication to prevent duplicate legacy fallback
            if (successfulSteps > 0) {
              phase5A_published = true;
            }
          } catch (phase5aErr) {
            console.error(`[EventBusWorker] Phase 5A planner failed for ${eventName}:`, phase5aErr.message);
          }
        }

        // 2.4. Legacy Fallback
        if (!phase5A_published) {
          try {
            const mapped = templateMapper.map(eventName, payload);
            const formattedPayload = payloadBuilder.build(policy, mapped);

            await queuePublisher.publish({
              eventId,
              correlationId,
              eventName,
              channel,
              provider: 'META_CLOUD_API',
              payload: formattedPayload,
              title: mapped.title,
              summary: mapped.summary,
              customerId: payload?.clientSnapshot?._id || payload?.prospect?._id || payload?.client?._id,
              orderId: payload?.orderId || (eventName.includes('ORDER') ? payload._id : payload?.order?._id),
              paymentId: eventName.includes('PAYMENT') ? payload._id : undefined,
              tenantId
            });
          } catch (mapErr) {
            console.error(`[EventBusWorker] Template mapping error for ${eventName}:`, mapErr.message);
            await CommunicationAuditLog.create({
              notificationId: `ERR-${eventId}`,
              correlationId,
              attemptNumber: 1,
              action: 'MAPPING_ERROR',
              errorMessage: mapErr.message
            });
          }
        }
      }
    }
  } catch (err) {
    console.error(`[EventBusWorker] Pipeline failure processing ${eventName}:`, err);
    throw err;
  }
};

let workerInstance = null;

const startEventBusWorker = () => {
  if (useBullMQ && connection) {
    const { Worker } = require('bullmq');
    workerInstance = new Worker('eventBusQueue', processDomainEvent, { connection });
    workerInstance.on('completed', job => console.log(`[EventBusWorker] Job ${job.id} completed.`));
    workerInstance.on('failed', (job, err) => console.error(`[EventBusWorker] Job ${job?.id} failed:`, err.message));
  } else {
    eventBusQueue.registerWorker(processDomainEvent);
    console.log('[EventBusWorker] Registered async processor on FallbackQueue.');
  }
};

module.exports = { startEventBusWorker, processDomainEvent };
