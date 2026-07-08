const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    platform: {
      type: String,
      enum: ['Facebook Ads', 'Google Ads', 'LinkedIn Ads', 'YouTube', 'Instagram', 'Other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Paused', 'Completed'],
      default: 'Draft',
    },
    budget: { type: Number, required: true },
    spent: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Campaign', campaignSchema);
