const mongoose = require('mongoose');

const teleAuditSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userRole: { type: String },
    
    action: { type: String, required: true }, // e.g. CALL_DISPOSITION, LEAD_ASSIGN, LEAD_REASSIGN, QA_REVIEW, CONFIG_UPDATE, EXPORT_REPORT
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null }, // LeadId or CallId or ConfigId
    targetModel: { type: String, default: 'Lead' },
    
    oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
    
    ip: { type: String, default: '127.0.0.1' },
    device: { type: String, default: 'Mobile/Web' },
    timestamp: { type: Date, default: Date.now }
  },
  { 
    timestamps: false,
    // Prevent modification or deletion at schema level
    statics: {
      appendAudit: async function(logData) {
        return await this.create({
          ...logData,
          timestamp: new Date()
        });
      }
    }
  }
);

teleAuditSchema.index({ userId: 1, timestamp: -1 });
teleAuditSchema.index({ targetId: 1, timestamp: -1 });
teleAuditSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.models.TeleAudit || mongoose.model('TeleAudit', teleAuditSchema);
