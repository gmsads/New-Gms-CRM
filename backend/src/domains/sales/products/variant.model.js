const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true, trim: true }, // e.g. "4x4", "Medium"
  unit: { type: String, default: 'Sqft' },
  
  pricing: {
    retail: { type: Number, default: 0 },
    renewal: { type: Number, default: 0 },
    corporate: { type: Number, default: 0 },
    agent: { type: Number, default: 0 },
    corporateRenewal: { type: Number, default: 0 },
    agentRenewal: { type: Number, default: 0 }
  },
  
  baseCost: { type: Number, default: 0 },
  minSellingPrice: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 0 }, // percentage
  
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
}, { timestamps: true });

module.exports = mongoose.model('ProductVariant', variantSchema);
