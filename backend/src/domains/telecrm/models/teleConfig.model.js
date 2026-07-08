const mongoose = require('mongoose');

const teleConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'ENTERPRISE_DEFAULT' },
    
    // Automatic Retry Engine Config
    retryRules: {
      maxRetries: { type: Number, default: 3 },
      busyRetryHours: { type: Number, default: 2 },
      noAnswerNextDay: { type: Boolean, default: true },
      switchedOffNextDay: { type: Boolean, default: true },
      networkErrorRetryMinutes: { type: Number, default: 30 },
      wrongNumberManagerReview: { type: Boolean, default: true }
    },
    
    // SLA Compliance & Escalation Config
    slaRules: {
      firstCallMaxMinutes: { type: Number, default: 30 },
      reminderMinutes: { type: Number, default: 15 },
      managerEscalationMinutes: { type: Number, default: 60 },
      autoReassignMinutes: { type: Number, default: 180 },
      inactivityReassignDays: { type: Number, default: 2 }
    },
    
    // Working Hours & Business Calendar
    workingHours: {
      startHour: { type: String, default: '09:30' },
      endHour: { type: String, default: '18:30' },
      workDays: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
      holidays: [{ date: String, reason: String }]
    },
    
    // Configurable Dispositions
    dispositions: {
      type: [String],
      default: [
        'Interested', 'Highly Interested', 'Need Follow-up', 'Call Later', 
        'Meeting Scheduled', 'Need Quotation', 'Budget Issue', 'Decision Pending', 
        'Not Interested', 'Duplicate', 'Already Customer', 'Wrong Contact', 
        'Converted', 'Lost'
      ]
    },
    
    // Executive Targets
    defaultTargets: {
      dailyCalls: { type: Number, default: 60 },
      dailyTalkTimeMinutes: { type: Number, default: 150 },
      dailyConversions: { type: Number, default: 2 }
    },
    
    // Telephony Provider Health
    providerHealth: {
      status: { type: String, enum: ['HEALTHY', 'DEGRADED', 'DOWN'], default: 'HEALTHY' },
      lastChecked: { type: Date, default: Date.now },
      latencyMs: { type: Number, default: 45 }
    },
    
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.models.TeleConfig || mongoose.model('TeleConfig', teleConfigSchema);
