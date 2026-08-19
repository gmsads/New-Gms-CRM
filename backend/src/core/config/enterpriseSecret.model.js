const mongoose = require('mongoose');

const enterpriseSecretSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }, // Should be encrypted in a real-world scenario
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('EnterpriseSecret', enterpriseSecretSchema);
