const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { 
      type: String, 
      enum: ['STOCK_IN', 'STOCK_OUT', 'RESERVED', 'UNRESERVED', 'ADJUSTMENT', 'RETURNED'],
      required: true
    },
    quantity: { type: Number, required: true }, // positive or negative
    previousStock: { type: Number },
    newStock: { type: Number },
    
    referenceType: { type: String, enum: ['ORDER', 'QUOTATION', 'MANUAL_ADJUSTMENT', 'PURCHASE'] },
    referenceId: { type: mongoose.Schema.Types.ObjectId }, // e.g. Order ID
    
    notes: { type: String },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

inventoryMovementSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
