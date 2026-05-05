const mongoose = require('mongoose');

const fieldReportSchema = new mongoose.Schema(
  {
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportDate: { type: Date, required: true },

    // Summary of the day
    sitesVisited: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    distanceCovered: { type: Number }, // in km

    // Visit references
    visits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Visit' }],

    // Detailed report
    summary: { type: String, required: true },
    challenges: { type: String },
    nextDayPlan: { type: String },

    // Media
    photos: [{ type: String }], // URLs

    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Reviewed'],
      default: 'Submitted',
    },

    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewNotes: { type: String },
  },
  { timestamps: true }
);

fieldReportSchema.index({ submittedBy: 1, reportDate: -1 });

module.exports = mongoose.model('FieldReport', fieldReportSchema);
