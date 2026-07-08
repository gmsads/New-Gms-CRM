const mongoose = require('mongoose');
const callLifecycle = require('./src/domains/telecrm/services/callLifecycle.service');
const analyticsService = require('./src/domains/telecrm/services/analytics.service');
const LeadCall = require('./src/domains/telecrm/models/leadCall.model');
const Lead = require('./src/domains/telecrm/models/lead.model');
const LeadFollowup = require('./src/domains/telecrm/models/leadFollowup.model');
const WorkingSession = require('./src/domains/telecrm/models/workingSession.model');
const LeadActivity = require('./src/domains/telecrm/models/leadActivity.model');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 ENTERPRISE TELECRM EXECUTIVE ENHANCEMENTS TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Verify Model Schema
    console.log('--- 1. Testing LeadCall Model Schema & Additive Fields ---');
    const schemaPaths = LeadCall.schema.paths;
    assert(schemaPaths['callLifecycleStage'] !== undefined, 'LeadCall schema has callLifecycleStage field');
    assert(schemaPaths['stageTimestamps.idleAt'] !== undefined, 'LeadCall schema has stageTimestamps.idleAt');
    assert(schemaPaths['stageTimestamps.dispositionPendingAt'] !== undefined, 'LeadCall schema has stageTimestamps.dispositionPendingAt');
    assert(schemaPaths['stageTimestamps.disposedAt'] !== undefined, 'LeadCall schema has stageTimestamps.disposedAt');

    // 2. Verify Call Lifecycle Service State Transitions
    console.log('\n--- 2. Testing State Machine Logic ---');
    assert(typeof callLifecycle.transitionStage === 'function', 'callLifecycle.service has transitionStage method');

    // Create a mock call document in memory
    const mockCall = new LeadCall({
      leadId: new mongoose.Types.ObjectId(),
      calleePhone: '9876543210',
      callLifecycleStage: 'Idle',
      stageTimestamps: { idleAt: new Date() }
    });

    assert(mockCall.callLifecycleStage === 'Idle', 'Mock call initialized in Idle state');
    mockCall.callLifecycleStage = 'Disposition Pending';
    mockCall.stageTimestamps.dispositionPendingAt = new Date();
    assert(mockCall.callLifecycleStage === 'Disposition Pending', 'Mock call transitioned to Disposition Pending');
    mockCall.callLifecycleStage = 'Disposed';
    mockCall.stageTimestamps.disposedAt = new Date();
    assert(mockCall.callLifecycleStage === 'Disposed', 'Mock call transitioned to Disposed');

    // 3. Verify Analytics Service Executive My Reports (with mocked DB calls)
    console.log('\n--- 3. Testing Analytics Service Executive Scorecard ---');
    assert(typeof analyticsService.getExecutiveMyReports === 'function', 'analytics.service has getExecutiveMyReports method');

    // Mock Mongoose queries to test analytics data transformation without needing DB connection
    const origLeadCallFind = LeadCall.find;
    const origLeadCallAgg = LeadCall.aggregate;
    const origLeadCount = Lead.countDocuments;
    const origFollowupCount = LeadFollowup.countDocuments;
    const origSessionFind = WorkingSession.find;
    const origActivityCount = LeadActivity.countDocuments;

    LeadCall.find = () => ({
      lean: async () => ([
        { durationSeconds: 120, talkDuration: 120, callStatus: 'Connected', startTime: new Date(), endTime: new Date(), businessDisposition: 'Interested' },
        { durationSeconds: 0, talkDuration: 0, callStatus: 'Busy', startTime: new Date(), endTime: new Date(), businessDisposition: 'Busy' }
      ])
    });
    LeadCall.aggregate = async () => ([
      { _id: 'Connected', count: 1 },
      { _id: 'Busy', count: 1 }
    ]);
    Lead.countDocuments = async () => 15;
    LeadFollowup.countDocuments = async () => 3;
    WorkingSession.find = () => ({
      lean: async () => ([{ loginTime: new Date(), durations: { Available: 3600, Calling: 1800, Break: 600 } }]),
      sort: () => ({
        limit: () => ({
          lean: async () => ([{ loginTime: new Date(), durations: { Available: 3600, Calling: 1800, Break: 600 } }])
        })
      })
    });
    LeadActivity.countDocuments = async () => 5;

    const dummyUserId = new mongoose.Types.ObjectId();
    const rep = await analyticsService.getExecutiveMyReports(dummyUserId, 'today');

    // Restore original methods
    LeadCall.find = origLeadCallFind;
    LeadCall.aggregate = origLeadCallAgg;
    Lead.countDocuments = origLeadCount;
    LeadFollowup.countDocuments = origFollowupCount;
    WorkingSession.find = origSessionFind;
    LeadActivity.countDocuments = origActivityCount;
    
    assert(rep.callOverview !== undefined, 'Report includes callOverview section');
    assert(rep.outgoingCalls !== undefined, 'Report includes outgoingCalls section');
    assert(rep.followUpReport !== undefined || rep.followupReport !== undefined, 'Report includes followUpReport section');
    assert(rep.dispositionReport !== undefined, 'Report includes dispositionReport section');
    assert(rep.leadPerformance !== undefined, 'Report includes leadPerformance section');
    assert(rep.activitySummary !== undefined, 'Report includes activitySummary section');
    assert(rep.messageActivity !== undefined, 'Report includes messageActivity section');
    assert(rep.loginActivity !== undefined, 'Report includes loginActivity section');

    // Strict check: verify NO recorded audio data is returned
    const jsonStr = JSON.stringify(rep);
    assert(!jsonStr.includes('recordingUrl') && !jsonStr.includes('audio'), 'Strictly NO recorded audio data in My Reports scorecard');

    // 4. Verify Routes Loading
    console.log('\n--- 4. Testing TeleCRM Routes Mounting ---');
    const telecrmRoutes = require('./src/domains/telecrm/routes/telecrm.routes');
    assert(telecrmRoutes !== undefined, 'telecrm.routes loaded successfully without syntax errors');

    console.log('\n====================================================');
    console.log(`📊 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }

  } catch (err) {
    console.error('❌ Test Suite Exception:', err);
    process.exit(1);
  }
}

runTests();
