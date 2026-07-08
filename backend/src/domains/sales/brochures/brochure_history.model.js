const mongoose = require('mongoose');

const brochureHistorySchema = new mongoose.Schema(
  {
    brochure: { type: mongoose.Schema.Types.ObjectId, ref: 'Brochure', required: true },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clientPhone: { type: String, required: true },
    clientName: { type: String },
    sentAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['Sent', 'Delivered', 'Failed'], default: 'Sent' },
    platform: { type: String, default: 'WhatsApp' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BrochureHistory', brochureHistorySchema);
