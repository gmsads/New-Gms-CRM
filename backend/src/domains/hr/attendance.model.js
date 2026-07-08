const mongoose = require('mongoose');

const editLogSchema = new mongoose.Schema({
  editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  editedAt: { type: Date, default: Date.now },
  previousStatus: { type: String },
  newStatus: { type: String },
  previousLoginTime: { type: String },
  previousLogoutTime: { type: String },
  reason: { type: String, required: true },
  approvedByAdmin: { type: Boolean, default: false },   // required if edit is >2 days old
  adminApprovalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Approval' },
}, { _id: true });

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'LEAVE', 'HOLIDAY', 'HALF_DAY', 'WORK_FROM_HOME'],
      required: true,
    },

    // ── Time tracking ──────────────────────────────────────
    loginTime: { type: String },   // "09:15"
    logoutTime: { type: String },  // "18:30"
    workHours: { type: Number },   // computed decimal hours

    // ── Metadata ───────────────────────────────────────────
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    department: { type: String },

    // ── Edit audit ────────────────────────────────────────
    // MAX 2 edits per record. 3rd edit is blocked.
    editLog: [editLogSchema],
    editCount: { type: Number, default: 0 },

    // ── Old-date edit (>2 days) requires Admin approval ───
    pendingAdminApproval: { type: Boolean, default: false },
    adminApprovalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Approval' },

    notes: { type: String },
  },
  { timestamps: true }
);

// Unique: one record per employee per date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1, department: 1 });
attendanceSchema.index({ employee: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
