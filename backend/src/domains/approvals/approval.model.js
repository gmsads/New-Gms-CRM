const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
  order: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true 
  },
  orderNumber: { type: String },
  requestedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  clientName:  { type: String },
  grandTotal:  { type: Number },
  advancePaid: { type: Number },
  advancePct:  { type: Number },
  
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },

  escalationRole: {
    type: String,
    enum: ['ADMIN', 'BRANCH_HEAD', 'MD_CEO', 'SALES_MANAGER', 'NONE'],
    default: 'NONE'
  },
  
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  
  notes: { type: String }
}, { timestamps: true });

// Ensure we can easily search by order
approvalSchema.index({ order: 1 });
approvalSchema.index({ status: 1 });

module.exports = mongoose.model('OrderApproval', approvalSchema);
