const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, optimisticConcurrency: true }
);

categorySchema.index({ name: 1 });
categorySchema.index({ parentCategory: 1 });

const softDeletePlugin = require('../../utils/softDelete.plugin');
categorySchema.plugin(softDeletePlugin);

module.exports = mongoose.model('ProductCategory', categorySchema);
