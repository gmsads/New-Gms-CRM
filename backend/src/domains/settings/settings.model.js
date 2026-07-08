const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true, default: 'GLOBAL' },
  roles: [{ type: String }],
  departments: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
