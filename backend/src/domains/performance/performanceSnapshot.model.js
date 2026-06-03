const mongoose = require('mongoose');

const performanceSnapshotSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    required: true
  },
  department: {
    type: String
  },
  branch: {
    type: String
  },
  snapshotDate: {
    type: Date,
    required: true,
    index: true
  },
  periodType: {
    type: String,
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'],
    required: true
  },
  ips: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B', 'C', 'D', 'F'],
    required: true
  },
  metrics: [{
    kpiId: { type: mongoose.Schema.Types.ObjectId, ref: 'KpiConfig' },
    kpiName: { type: String },
    actualValue: { type: Number },
    targetValue: { type: Number },
    score: { type: Number }, // Raw score for this KPI
    weightedScore: { type: Number } // Score * weightage
  }],
  // Store raw aggregated data for drill-down without recalculating
  rawContext: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

// Compound index for fast querying by employee and date
performanceSnapshotSchema.index({ employee: 1, snapshotDate: -1, periodType: 1 });

module.exports = mongoose.model('PerformanceSnapshot', performanceSnapshotSchema);
