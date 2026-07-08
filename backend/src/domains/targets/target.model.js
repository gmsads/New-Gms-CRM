const mongoose = require('mongoose');

const targetHistorySchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g., 'CREATED', 'UPDATED', 'PROGRESS_UPDATED'
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
  notes: { type: String },
  previousValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const targetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  branch: {
    type: String, // Or ObjectId if branch is a ref
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  targetType: {
    type: String,
    enum: [
      'Revenue Target', 
      'Conversion Target', 
      'Collection Target', 
      'Calls Target', 
      'Appointments Target', 
      'Quotations Target', 
      'Client Visits Target', 
      'Team Performance Target', 
      'Follow-Up Target'
    ],
    required: true,
  },
  category: {
    type: String,
    enum: ['Activity', 'Performance', 'Strategic'],
    required: true,
  },
  difficultyLevel: {
    type: String,
    enum: ['Fresher', 'Junior', 'Mid-Level', 'Senior', 'Manager'],
    required: true,
  },
  period: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'Yearly'],
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  targetValue: {
    type: Number,
    required: true,
    min: 0,
  },
  achievedValue: {
    type: Number,
    default: 0,
    min: 0,
  },
  weightage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  notes: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Achieved', 'Overachieved', 'Missed', 'Expired'],
    default: 'Pending',
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  history: [targetHistorySchema],
}, { timestamps: true });

// Virtual for progress percentage
targetSchema.virtual('progressPercent').get(function() {
  if (this.targetValue === 0) return 0;
  return Math.min(100, Math.round((this.achievedValue / this.targetValue) * 100));
});

// Virtual for achievement score
targetSchema.virtual('achievementScore').get(function() {
  if (this.targetValue === 0) return 0;
  const ratio = this.achievedValue / this.targetValue;
  return Number(((ratio * this.weightage)).toFixed(2));
});

// Ensure virtuals are included in JSON/Object conversions
targetSchema.set('toJSON', { virtuals: true });
targetSchema.set('toObject', { virtuals: true });

// Pre-save hook to auto-update status based on achievedValue and dates
targetSchema.pre('save', function() {
  const now = new Date();
  
  if (this.achievedValue >= this.targetValue && this.targetValue > 0) {
    if (this.achievedValue > this.targetValue) {
      this.status = 'Overachieved';
    } else {
      this.status = 'Achieved';
    }
  } else if (this.endDate < now && this.status !== 'Achieved' && this.status !== 'Overachieved') {
    if (this.achievedValue > 0) {
      this.status = 'Missed';
    } else {
      this.status = 'Expired';
    }
  } else if (this.achievedValue > 0 && this.achievedValue < this.targetValue && this.status === 'Pending') {
    this.status = 'In Progress';
  }
});

module.exports = mongoose.model('Target', targetSchema);
