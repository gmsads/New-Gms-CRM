const mongoose = require('mongoose');

const followupSchema = new mongoose.Schema(
  {
    prospect: { type: mongoose.Schema.Types.ObjectId, ref: 'Prospect', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },

    type: {
      type: String,
      enum: ['Call', 'WhatsApp', 'Email', 'Meeting', 'Site Visit', 'Demo'],
      required: true,
    },

    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Missed', 'Rescheduled'],
      default: 'Scheduled',
    },

    scheduledAt: { type: Date, required: true },
    completedAt: { type: Date },

    outcome: {
      type: String,
      enum: ['Interested', 'Not Interested', 'Call Back Later', 'Quotation Requested', 'Meeting Scheduled', 'Order Placed', 'Closed Lost', 'No Response'],
    },

    notes: { type: String },
    nextFollowUpDate: { type: Date },
    nextAction: { type: String },

    // Which stage did we move to after this follow-up
    stageUpdated: { type: String },

    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

followupSchema.index({ prospect: 1, scheduledAt: -1 });

const softDeletePlugin = require('../../../utils/softDelete.plugin');
followupSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('Followup', followupSchema);
