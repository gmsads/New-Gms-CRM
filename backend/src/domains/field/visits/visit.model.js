const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    type: { type: String }, // Removed strict enum to allow flexible values

    site: { type: String },
    location: { type: String },
    
    // New fields from frontend
    businessName: { type: String },
    clientName: { type: String },
    phone: { type: String },
    purpose: { type: String },
    remark: { type: String },
    followUpDate: { type: Date },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    relatedClient: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },

    scheduledDate: { type: Date },
    scheduledTimeSlot: { type: String }, 

    status: {
      type: String, // Removed strict enum
      default: 'Scheduled',
    },

    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },

    // Check-in / Check-out
    checkIn: {
      time: { type: Date },
      gpsLat: { type: Number },
      gpsLng: { type: Number },
      photo: { type: String }, // URL
    },
    checkOut: {
      time: { type: Date },
      gpsLat: { type: Number },
      gpsLng: { type: Number },
      photo: { type: String },
    },

    notes: { type: String },
    completionNotes: { type: String },
    mediaUploads: [{ type: String }], // Array of URLs

    // Created by manager/admin
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

visitSchema.index({ assignedTo: 1, scheduledDate: 1 });

module.exports = mongoose.model('Visit', visitSchema);
