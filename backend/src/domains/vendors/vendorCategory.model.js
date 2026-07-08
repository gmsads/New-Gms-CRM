const mongoose = require('mongoose');

const vendorCategorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  description: { 
    type: String 
  },
  isSystemDefault: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { timestamps: true });

const softDeletePlugin = require('../../utils/softDelete.plugin');
vendorCategorySchema.plugin(softDeletePlugin);

module.exports = mongoose.model('VendorCategory', vendorCategorySchema);
