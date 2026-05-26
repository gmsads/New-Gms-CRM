const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  // Basic Details
  name: { type: String, required: true, trim: true },
  contactNumber: { type: String, required: true },
  alternateNumber: { type: String },
  email: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorCategory', required: true },
  branch: { type: String, default: 'HQ' },
  status: { 
    type: String, 
    enum: ['Active', 'Inactive', 'Suspended'], 
    default: 'Active' 
  },

  // Location Details
  baseLocation: { type: String, required: true },
  city: { type: String },
  workingAreas: [{ type: String }],
  address: { type: String },
  pincode: { type: String },

  // Service Details
  servicesOffered: [{ type: String }],
  teamSize: { type: Number, default: 1 },
  vehicleCount: { type: Number, default: 0 },
  workingCapacity: { type: String },
  availabilityStatus: {
    type: String,
    enum: ['Available', 'Busy', 'On Leave', 'In Campaign', 'Maintenance'],
    default: 'Available'
  },

  // Financial Details
  baseCost: { type: Number, default: 0 },
  costType: { 
    type: String, 
    enum: ['Per Day', 'Per Campaign', 'Per KM', 'Fixed'], 
    default: 'Per Day' 
  },
  gstNumber: { type: String },
  paymentTerms: { type: String },

  // Availability Details
  availabilityDate: { type: Date },
  availableDays: [{ type: String }], // e.g. ['Monday', 'Tuesday']
  availableTimeSlots: [{ type: String }],

  // Quality & Performance
  averageRating: { type: Number, min: 0, max: 5, default: 0 },
  performanceScore: { type: Number, default: 0 },
  notes: { type: String },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const softDeletePlugin = require('../../utils/softDelete.plugin');
vendorSchema.plugin(softDeletePlugin);

// Virtual for total assignment tracking (populated via controller logic)
vendorSchema.virtual('activeAssignments', {
  ref: 'VendorAssignment',
  localField: '_id',
  foreignField: 'vendor',
  match: { status: { $in: ['Pending', 'Assigned', 'In Progress'] } }
});

vendorSchema.set('toJSON', { virtuals: true });
vendorSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Vendor', vendorSchema);
