const mongoose = require('mongoose');

const vendorAssignmentSchema = new mongoose.Schema({
  // Link to Core Workflow
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  clientName: { type: String }, // Denormalized for quick access if no order
  campaignName: { type: String, required: true },
  
  // Link to Vendor
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  vendorCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorCategory' },
  
  // Execution Details
  area: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  workType: { type: String }, // e.g., 'Installation', 'Distribution'
  priority: { 
    type: String, 
    enum: ['High', 'Medium', 'Low'], 
    default: 'Medium' 
  },
  
  // Financial
  budget: { type: Number, default: 0 },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'In Progress', 'Completed', 'Delayed', 'Cancelled'],
    default: 'Pending'
  },
  
  // Proofs
  proofUrls: [{ type: String }],
  
  // Audit
  notes: { type: String },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  completedAt: { type: Date }
}, { timestamps: true });

const softDeletePlugin = require('../../utils/softDelete.plugin');
vendorAssignmentSchema.plugin(softDeletePlugin);

// Prevent overlapping dates for the same vendor
vendorAssignmentSchema.index({ vendor: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('VendorAssignment', vendorAssignmentSchema);
