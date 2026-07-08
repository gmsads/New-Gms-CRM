const mongoose = require('mongoose');

const clientTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  key: { type: String, required: true, unique: true },
  multiplier: { type: Number, required: true, default: 1.0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const softDeletePlugin = require('../../utils/softDelete.plugin');
clientTypeSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('ClientType', clientTypeSchema);
