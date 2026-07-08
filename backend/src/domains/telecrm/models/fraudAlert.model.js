const mongoose = require('mongoose');

const fraudAlertSchema = new mongoose.Schema(
  {
    executiveId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    executiveName: { type: String, required: true },
    
    alertType: {
      type: String,
      enum: [
        'SHORT_CALL_BURST',          // Repeated calls under 3 seconds
        'FAKE_DISPOSITION',          // High rate of 'Interested' or 'Meeting' without corresponding duration/notes
        'UNRECORDED_CONNECT',        // Connected call marked without valid recording URL
        'EXCESSIVE_WRONG_NUMBERS',   // Too many wrong numbers marked within short span
        'LONG_IDLE_PERIOD',          // Executive in Calling status but inactive > 45 mins
        'REPEATED_MANUAL_EDITS',     // Repeated edits to lead timeline/phone numbers
        'NO_FIRST_CALL_SLA'          // Assigned lead untouched beyond SLA limit
      ],
      required: true
    },
    
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    details: { type: String, required: true },
    relatedCallId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeadCall', default: null },
    relatedLeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
    
    status: { type: String, enum: ['OPEN', 'REVIEWED', 'DISMISSED'], default: 'OPEN' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewNotes: { type: String }
  },
  { timestamps: true }
);

fraudAlertSchema.index({ executiveId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.models.FraudAlert || mongoose.model('FraudAlert', fraudAlertSchema);
