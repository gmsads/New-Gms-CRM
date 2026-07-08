const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }, // If generic tasks
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Or null if system assigned
    roleType: { type: String, enum: ['DESIGNER', 'OPERATION_MANAGER', 'OPERATION_EXEC', 'SALES_EXEC', 'SERVICE_MANAGER'] },
    status: { type: String, enum: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REASSIGNED'], default: 'ASSIGNED' },
    reassignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reassignedReason: { type: String },
    assignedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
