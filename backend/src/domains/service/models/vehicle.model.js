const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true, unique: true },
  driverName: { type: String, required: true },
  status: {
    type: String,
    enum: ['Available', 'In Transit', 'Maintenance', 'Unavailable'],
    default: 'Available'
  },
  assignedService: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
