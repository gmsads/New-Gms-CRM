const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true },
    company: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, required: true },
    alternateMobile: { type: String },
    
    // Extended Address Fields
    address: { type: String },
    billingAddress: {
      line1: String,
      line2: String,
      landmark: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    },
    shippingAddress: {
      line1: String,
      line2: String,
      landmark: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    },
    shippingSameAsBilling: { type: Boolean, default: true },

    // Tax Information
    gstNumber: { type: String, trim: true },
    panNumber: { type: String, trim: true },

    status: {
      type: String,
      enum: ['Lead', 'Onboarding', 'Active', 'Churned'],
      default: 'Lead',
    },
    totalSpend: { type: Number, default: 0 },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  { timestamps: true }
);

const softDeletePlugin = require('../../utils/softDelete.plugin');
clientSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('Client', clientSchema);
