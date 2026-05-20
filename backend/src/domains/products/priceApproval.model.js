const mongoose = require('mongoose');

const priceApprovalSchema = new mongoose.Schema(
  {
    quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Pricing context
    baseCost: { type: Number, required: true },
    minimumSellingPrice: { type: Number, required: true },
    requestedPrice: { type: Number, required: true },
    marginPercentage: { type: Number },
    
    reason: { type: String, required: true },
    
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

priceApprovalSchema.index({ status: 1 });
priceApprovalSchema.index({ requestedBy: 1 });

module.exports = mongoose.model('PriceApproval', priceApprovalSchema);
