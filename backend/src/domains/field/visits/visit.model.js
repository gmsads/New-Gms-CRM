const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['Installation', 'Survey', 'Maintenance', 'Shoot', 'Client Visit', 'Inspection', 'Delivery'],
      required: true,
    },

    site: { type: String, required: true },
    location: { type: String, required: true },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    relatedClient: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },

    scheduledDate: { type: Date, required: true },
    scheduledTimeSlot: { type: String }, // e.g. "10:00 AM - 12:00 PM"

    status: {
      type: String,
      enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Rescheduled'],
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
