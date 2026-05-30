const mongoose = require('mongoose');

const designAssetSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: {
    type: String,
    enum: [
      'Logos',
      'Fonts',
      'Templates',
      'Mockups',
      'Brand Kits',
      'PSD Files',
      'AI Files',
      'Reference Designs',
      'Approved Design Archives',
      'Other'
    ],
    required: true
  },
  fileUrl: { type: String, required: true },
  fileType: { type: String }, // e.g., 'image/png', 'application/pdf'
  fileSize: { type: Number }, // in bytes
  tags: [{ type: String }],
  brand: { type: String },
  dimensions: { type: String }, // e.g., '1920x1080'
  searchableKeywords: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isGlobal: { type: Boolean, default: false }, // If true, visible to everyone. If false, might be restricted.
}, { timestamps: true });

// Text index for search
designAssetSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  brand: 'text',
  searchableKeywords: 'text'
});

module.exports = mongoose.model('DesignAsset', designAssetSchema);
