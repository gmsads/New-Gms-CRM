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
      enum: ['Exotel', 'Knowlarity', 'MyOperator', 'Ozonetel', 'Airtel IQ', 'Mock Provider'],
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
    convertedToProspect: { type: Boolean, default: false }
  },
  { timestamps: true }
);

leadCallSchema.index({ leadId: 1, createdAt: -1 });
leadCallSchema.index({ callerId: 1, createdAt: -1 });
leadCallSchema.index({ callStatus: 1 });

module.exports = mongoose.models.LeadCall || mongoose.model('LeadCall', leadCallSchema);
