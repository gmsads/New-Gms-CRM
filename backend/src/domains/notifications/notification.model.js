const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { 
    type: String, 
    enum: ['Appointment', 'Order', 'Payment', 'System'], 
    default: 'System' 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String }, // e.g., "/appointments"
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
