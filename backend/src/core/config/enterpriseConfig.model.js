const mongoose = require('mongoose');

const enterpriseConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  description: { type: String },
  isFeatureFlag: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('EnterpriseConfig', enterpriseConfigSchema);
