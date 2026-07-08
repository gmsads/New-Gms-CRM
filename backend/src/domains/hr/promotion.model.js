const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    promotedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    previousRole: { type: String, required: true },
    newRole: { type: String, required: true },
    
    previousHierarchyLevel: { type: Number },
    newHierarchyLevel: { type: Number },
    
    previousReportingManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    newReportingManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    previousDepartment: { type: String },
    newDepartment: { type: String },

    previousTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    newTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },

    reason: { type: String, required: true },
    effectiveDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Promotion', promotionSchema);
