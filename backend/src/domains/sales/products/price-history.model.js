const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
  variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  pricingSnapshot: {
    retail: Number,
    renewal: Number,
    corporate: Number,
    agent: Number,
    corporateRenewal: Number,
    agentRenewal: Number
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('PriceHistory', priceHistorySchema);
