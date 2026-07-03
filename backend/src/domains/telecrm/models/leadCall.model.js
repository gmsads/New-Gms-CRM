const mongoose = require('mongoose');

const leadCallSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    callerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    callerName: { type: String },
    
    calleePhone: { type: String, required: true },
    companyName: { type: String },
    
    provider: {
      type: String,
      enum: ['Exotel', 'Knowlarity', 'MyOperator', 'Ozonetel', 'Airtel IQ', 'Twilio', 'Android Companion', 'Mock Provider'],
      default: 'Mock Provider'
    },
    providerCallId: { type: String },
    
    callStatus: {
      type: String,
      enum: [
        'Connected', 'Busy', 'Call Waiting', 'No Answer', 
        'Not Reachable', 'Switched Off', 'Wrong Number', 
        'Rejected', 'Failed', 'Missed', 'Voicemail'
      ],
      default: 'Connected'
    },
    
    durationSeconds: { type: Number, default: 0 },
    recordingUrl: { type: String, default: null },
    
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    
    remarks: { type: String, trim: true },
    
    // Disposition Checkboxes
    interested: { type: Boolean, default: false },
    needMeeting: { type: Boolean, default: false },
    needQuotation: { type: Boolean, default: false },
    convertedToProspect: { type: Boolean, default: false },

    // Enterprise Lifecycle & Metrics (Additive)
    ringStart: { type: Date },
    connectedTime: { type: Date },
    talkDuration: { type: Number, default: 0 },
    ringDuration: { type: Number, default: 0 },
    acwSeconds: { type: Number, default: 0 },
    direction: { type: String, enum: ['Inbound', 'Outbound'], default: 'Outbound' },
    device: { type: String, default: 'Web/Mobile App' },
    networkType: { type: String, default: '4G/WiFi' },
    callCost: { type: Number, default: 0 },
    providerConfirmed: { type: Boolean, default: false },
    businessDisposition: { type: String, trim: true },

    // Enterprise Additive Lifecycle Tracking & Recording Metadata
    callLifecycleStage: {
      type: String,
      enum: ['Initiated', 'Ringing', 'Connected', 'Busy', 'No Answer', 'Failed', 'Cancelled', 'Missed', 'Completed'],
      default: 'Initiated'
    },
    stageTimestamps: {
      initiatedAt: { type: Date, default: Date.now },
      ringingAt: { type: Date },
      connectedAt: { type: Date },
      busyAt: { type: Date },
      noAnswerAt: { type: Date },
      failedAt: { type: Date },
      cancelledAt: { type: Date },
      missedAt: { type: Date },
      completedAt: { type: Date }
    },
    callStartTime: { type: Date },
    callConnectTime: { type: Date },
    callEndTime: { type: Date },
    totalDuration: { type: Number, default: 0 },
    uploadTime: { type: Date },
    uploadStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED'],
      default: 'SUCCESS'
    },
    recordingSize: { type: Number, default: 0 },
    recordingFormat: { type: String, default: 'mp3' },
    storageProvider: { type: String, default: 'LOCAL' },
    checksum: { type: String }
  },
  { timestamps: true }
);

leadCallSchema.index({ leadId: 1, createdAt: -1 });
leadCallSchema.index({ callerId: 1, createdAt: -1 });
leadCallSchema.index({ callStatus: 1 });
leadCallSchema.index({ callLifecycleStage: 1 });
leadCallSchema.index({ providerCallId: 1 });

module.exports = mongoose.models.LeadCall || mongoose.model('LeadCall', leadCallSchema);
