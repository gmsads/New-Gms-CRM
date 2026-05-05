const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Done'],
      default: 'To Do',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    category: { type: String },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dueDate: { type: Date },
    relatedClient: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    relatedCampaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
