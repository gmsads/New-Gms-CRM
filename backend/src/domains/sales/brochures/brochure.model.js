const mongoose = require('mongoose');

const brochureSchema = new mongoose.Schema(
  {
    brochureId: { type: String, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    category: { type: String, required: true },
    thumbnailUrl: { type: String },
    fileUrl: { type: String, required: true },
    language: { type: String, default: 'English' },
    version: { type: Number, default: 1 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    sendCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Brochure', brochureSchema);
