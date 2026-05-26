const mongoose = require('mongoose');

// ─── Line Item ────────────────────────────────────────────────────────────────
const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity:    { type: Number, required: true, min: 1 },
  unit:        { type: String, default: 'pcs' },
  unitPrice:   { type: Number, required: true, min: 0 },
  discount:    { type: Number, default: 0, min: 0, max: 100 }, // %
  gstRate:     { type: Number, default: 18, min: 0 },           // %
  amount:      { type: Number },                                 // computed
  designerStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Demo Shared to Client', 'Client Approved Design', 'Design Completed', 'Design Provided - Approved', 'Design Provided - Not Clear'],
    default: 'Pending'
  },
  designFileUrl: { type: String },
  operationStatus: {
    type: String,
    enum: ['operation update pending', 'reached to operation', 'work-in progress', 'completed'],
    default: 'operation update pending'
  },
  operationFileUrl: { type: String },
  serviceStatus: {
    type: String,
    enum: ['service update pending', 'reached to service', 'work-in progress', 'completed', 'payment pending'],
    default: 'service update pending'
  },
  serviceFileUrl: { type: String }
}, { _id: true });


// ─── Payment Record (embedded) ────────────────────────────────────────────────
const paymentRecordSchema = new mongoose.Schema({
  amount:       { type: Number, required: true },
  method:       { type: String, enum: ['Cash', 'UPI', 'PhonePe', 'GPay', 'Bank Transfer', 'Cheque', 'Other'], required: true },
  proofUrl:     { type: String },          // uploaded screenshot/receipt
  receivedAt:   { type: Date, default: Date.now },
  receivedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt:   { type: Date },
  paymentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  status:       { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
  rejectionNote:{ type: String },
}, { _id: true, timestamps: true });

// ─── Order Schema ─────────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema({
  // ── Identity
  orderNumber: { type: String, unique: true }, // ORD-2026-0001

  // ── Linked Records
  prospect:    { type: mongoose.Schema.Types.ObjectId, ref: 'Prospect' },
  client:      { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  quotation:   { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },

  // ── Client snapshot (denormalized for history)
  clientSnapshot: {
    name:    String,
    phone:   String,
    company: String,
    email:   String,
  },

  // ── Line Items & Financials
  lineItems:     [lineItemSchema],
  subtotal:      { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  totalGST:      { type: Number, default: 0 },
  grandTotal:    { type: Number, default: 0 },

  // ── Payment tracking
  totalPaid:     { type: Number, default: 0 },
  balanceDue:    { type: Number, default: 0 },
  paymentRecords:[paymentRecordSchema],

  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Partial', 'Paid', 'Refunded'],
    default: 'Unpaid',
  },

  // ── Advance enforcement
  advanceRequired:    { type: Number, default: 0 }, // calculated (50% of grand total)
  advancePaid:        { type: Number, default: 0 },
  advanceApproved:    { type: Boolean, default: false }, // admin override for low advance
  advanceApprovedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // ── Order status (pipeline)
  status: {
    type: String,
    enum: [
      'Draft',           // being filled by sales exec
      'Pending_Approval',// advance < 50%, waiting admin
      'Confirmed',       // order locked, advance ok
      'Design_Pending',  // design required, not started
      'Design_InProgress',
      'Design_Review',   // demo shared with client
      'Design_Approved', // client approved design
      'In_Production',   // ops executing
      'Ready_To_Deliver',
      'Delivered',
      'Completed',       // payment full + client review done
      'Cancelled',
    ],
    default: 'Draft',
  },

  // ── Design workflow
  designRequired: { type: Boolean, default: false },
  designStatus: {
    type: String,
    enum: ['Not_Required', 'Pending', 'In_Progress', 'Demo_Shared', 'Approved', 'Completed'],
    default: 'Not_Required',
  },
  designFileUrl:    { type: String },   // client-provided design
  designRequestedAt:{ type: Date },
  designAssignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  designApprovedAt: { type: Date },
  designNotes:      { type: String },
  
  // ── Verification
  verificationStatus: {
    type: String,
    enum: ['None', 'Pending', 'Verified'],
    default: 'None',
  },
  verifiedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedByName: { type: String },
  verifiedByRole: { type: String },
  verifiedAt:     { type: Date },

  // ── Delivery
  deliveryTimeline: { type: String },
  deliveryAddress:  { type: String },
  deliveredAt:      { type: Date },
  deliveryProofUrl: { type: String },

  // ── Staff assignment
  salesExec:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  salesManager:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  operationsManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  operationsExec:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // ── WhatsApp notifications sent
  notificationsSent: [{
    type:   { type: String, enum: ['OrderConfirmation', 'DesignUpdate', 'PaymentReceipt', 'DeliveryUpdate'] },
    sentAt: { type: Date, default: Date.now },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],

  // ── Client feedback
  clientReview:  { type: String },
  clientRating:  { type: Number, min: 1, max: 5 },
  reviewedAt:    { type: Date },

  // ── Activity timeline (immutable event log)
  timeline: [{
    event:     { type: String, required: true },
    detail:    { type: String },
    by:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    byRole:    { type: String },
    at:        { type: Date, default: Date.now },
  }],

  notes:      { type: String },
  cancelledAt:{ type: Date },
  cancelReason:{ type: String },

}, { timestamps: true, optimisticConcurrency: true });

const softDeletePlugin = require('../../utils/softDelete.plugin');
orderSchema.plugin(softDeletePlugin);

// ─── Indexes ──────────────────────────────────────────────────────────────────
orderSchema.index({ salesExec: 1, status: 1 });
orderSchema.index({ 'clientSnapshot.phone': 1 });
orderSchema.index({ createdAt: -1 });

// ─── Auto-generate order number ───────────────────────────────────────────────
orderSchema.pre('save', async function () {
  if (this.isNew && !this.orderNumber) {
    const count = await this.constructor.countDocuments();
    const year  = new Date().getFullYear();
    this.orderNumber = `ORD-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  // Compute line item amounts
  let subtotal = 0, totalDiscount = 0, totalGST = 0;
  this.lineItems.forEach(item => {
    const base       = item.quantity * item.unitPrice;
    const disc       = base * (item.discount / 100);
    const afterDisc  = base - disc;
    const gst        = afterDisc * (item.gstRate / 100);
    item.amount      = afterDisc + gst;
    subtotal        += afterDisc;
    totalDiscount   += disc;
    totalGST        += gst;
  });

  this.subtotal      = parseFloat(subtotal.toFixed(2));
  this.totalDiscount = parseFloat(totalDiscount.toFixed(2));
  this.totalGST      = parseFloat(totalGST.toFixed(2));
  this.grandTotal    = parseFloat((subtotal + totalGST).toFixed(2));

  this.advanceRequired = parseFloat((this.grandTotal * 0.5).toFixed(2));

  // Recompute totals from payment records (only verified payments)
  const verified    = this.paymentRecords.filter(p => p.status === 'Verified');
  this.totalPaid    = verified.reduce((s, p) => s + p.amount, 0);
  
  // Advance paid should strictly be verified payments now, per user request
  this.advancePaid  = this.totalPaid; // Because all verified payments contribute to totalPaid
  
  this.balanceDue   = parseFloat(Math.max(0, this.grandTotal - this.totalPaid).toFixed(2));

  if (this.totalPaid >= this.grandTotal)        this.paymentStatus = 'Paid';
  else if (this.totalPaid > 0)                  this.paymentStatus = 'Partial';
  else                                          this.paymentStatus = 'Unpaid';
});

// ─── Instance method: push timeline event ────────────────────────────────────
orderSchema.methods.addTimelineEvent = function (event, detail, user) {
  this.timeline.push({
    event,
    detail,
    by:     user?._id,
    byRole: user?.role,
    at:     new Date(),
  });
};

module.exports = mongoose.model('Order', orderSchema);
