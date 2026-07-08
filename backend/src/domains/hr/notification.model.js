const mongoose = require('mongoose');

/**
 * Notification Model — Unified in-app alerts for HR/Admin/Sales workflow events.
 */
const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: [
        'APPROVAL_REQUESTED',
        'APPROVAL_GRANTED',
        'APPROVAL_REJECTED',
        'APPROVAL_REVISED',
        'LEAVE_SUBMITTED',
        'LEAVE_APPROVED',
        'LEAVE_REJECTED',
        'DOCUMENT_UPLOADED',
        'DOCUMENT_VERIFIED',
        'ATTENDANCE_EDITED',
        'SUSPICIOUS_ACTIVITY',
        'PROBATION_DUE',
        'SALARY_CHANGE_REQUESTED',
        'Appointment',
        'Order',
        'Payment',
        'System'
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String }, // Used by sales system
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    relatedEntity: {
      entityType: { type: String, enum: ['Approval', 'Leave', 'Document', 'Attendance', 'User', 'Appointment', 'Order', 'Payment'] },
      entityId: { type: mongoose.Schema.Types.ObjectId },
    },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
