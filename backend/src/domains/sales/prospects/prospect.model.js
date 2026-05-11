const mongoose = require('mongoose');

const prospectSchema = new mongoose.Schema(
  {
    // Basic Info
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true },
    company: { type: String, trim: true },

    // Source tracking
    source: {
      type: String,
      enum: ['India mart', 'Just dial', 'Google ads', 'Referral', 'Website', 'Meta (Facebook/Instagram)', 'Walk-in', 'Other'],
      default: 'Other',
    },

    // Sales pipeline stage
    stage: {
      type: String,
      enum: ['Lead', 'Prospect', 'Follow-up', 'Appointment', 'Proposal', 'Negotiation', 'Won', 'Lost'],
      default: 'Lead',
    },

    // Priority / temperature
    priority: { type: String, enum: ['Hot', 'Warm', 'Cold', 'Expected in next month'], default: 'Cold' },

    // Status / Lifecycle
    status: {
      type: String,
      enum: ['In-progress', 'Canceled', 'Sale Closed'],
      default: 'In-progress'
    },
    cancelReason: { type: String },

    // Client/Prospect Type (drives quotation pricing)
    clientType: { 
      type: String, 
      enum: ['Retail', 'Retail Agent', 'Renewal', 'Renewal Agent', 'Corporate', 'Agent'], 
      default: 'Retail' 
    },

    // Requirements gathered during call
    requirement: {
      service: { type: String },
      type: { type: String, enum: ['Boards', 'Banners', 'Digital Marketing', 'Hoarding', 'Standees', 'Brochures', 'Social Media', 'Video Ads', 'Other'], default: 'Other' },
      quantity: { type: Number },
      location: { type: String },
      timeline: { type: String },
      budget: { type: String },
      hasDesign: { type: Boolean, default: false },
      notes: { type: String },
    },

    // Interaction metadata
    lastInteraction: { type: Date },
    lastInteractionNote: { type: String },
    interactions: [{
      type: { type: String, default: 'Other' },
      date: { type: Date, default: Date.now },
      notes: { type: String }
    }],
    nextFollowUpDate: { type: Date },
    nextAction: {
      type: String,
      enum: ['Call Back', 'Send Brochure', 'Send Quotation', 'Schedule Meeting', 'Follow Up', 'None'],
      default: 'Call Back',
    },

    // Assignment
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // WhatsApp actions sent
    whatsappActions: [{
      action: { type: String, enum: ['Brochure', 'Quotation', 'Appointment', 'OrderConfirmation', 'Verification'] },
      sentAt: { type: Date, default: Date.now },
    }],

    // Linked objects
    relatedClient: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    tags: [{ type: String }],
    probability: { type: Number, min: 0, max: 100, default: 30 }, // % chance of conversion
  },
  { timestamps: true }
);

prospectSchema.index({ assignedTo: 1, stage: 1 });


module.exports = mongoose.model('Prospect', prospectSchema);
