const mongoose = require('mongoose');

// ── Pricing Rule Sub-Schema ──────────────────────────────────────────────────
const slabSchema = new mongoose.Schema({
  minQty: { type: Number, required: true },
  maxQty: { type: Number, required: true },
  price:  { type: Number, required: true },
}, { _id: false });

const sizePriceSchema = new mongoose.Schema({
  sizeLabel: { type: String, required: true }, // e.g., '12x9'
  price:     { type: Number, required: true },
  minPrice:  { type: Number },
}, { _id: false });

const rentalPriceSchema = new mongoose.Schema({
  daily:           { type: Number },
  weekly:          { type: Number },
  monthly:         { type: Number },
  yearly:          { type: Number },
  customDays:      { type: Number },
  customPrice:     { type: Number },
  securityDeposit: { type: Number, default: 0 },
}, { _id: false });

const pricingRuleSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['FIXED_PRICE', 'PER_SFT', 'SIZE_BASED', 'QUANTITY_BASED', 'RENTAL_BASED', 'CUSTOM_DYNAMIC'],
    required: true,
  },
  // Fixed Price fields
  sellingPrice: { type: Number },
  
  // Per SFT fields
  ratePerSft:   { type: Number },
  minArea:      { type: Number },
  
  // Array structures for size/quantity slabs
  sizePrices:   [sizePriceSchema],
  quantitySlabs:[slabSchema],
  
  // Rental fields
  rentalRates:  rentalPriceSchema,
  
  // Global pricing constraints
  minimumSellingPrice: { type: Number },
  minimumMargin:       { type: Number }, // percentage e.g., 20
  taxPercentage:       { type: Number, default: 18 },
  installationCharge:  { type: Number, default: 0 },
  totalBasePrice:      { type: Number, default: 0 }
}, { _id: false });

// ── Main Product Schema ──────────────────────────────────────────────────────
const productSchema = new mongoose.Schema(
  {
    productCode: { type: String, unique: true }, // GMS-PROD-0001
    productName: { type: String, required: true, trim: true },
    
    category:    { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', required: true },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory' },
    
    sku:         { type: String, unique: true, sparse: true },
    description: { type: String },
    unit:        { type: String, default: 'pcs' }, // pcs, sft, sqmt, month
    tags:        [{ type: String }],
    
    status: {
      type: String,
      enum: ['Active', 'Draft', 'Archived', 'Out_of_Stock'],
      default: 'Draft',
    },
    
    // Media
    thumbnail:     { type: String },
    galleryImages: [{ type: String }],
    
    // Specifications (JSON/Map for dynamic attrs like material, finish, thickness)
    specifications: { type: Map, of: String },
    
    // Flags
    isRental:             { type: Boolean, default: false },
    requiresInstallation: { type: Boolean, default: false },
    
    // Financial Intelligence Engines
    pricingRules:  pricingRuleSchema,
    clientTypePricing: { type: Map, of: Number, default: {} },
    costBreakdown: { type: Map, of: Number, default: {} },
    totalBaseCost: { type: Number, default: 0 },
    
    // Inventory
    minimumOrderQuantity: { type: Number, default: 1 },
    stockQuantity:    { type: Number, default: 0 },
    reservedQuantity: { type: Number, default: 0 },
    lowStockAlert:    { type: Number, default: 5 },

    // Tracking
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, optimisticConcurrency: true }
);

// Indexes
// productSchema.index({ productCode: 1 }); // Removed: duplicate of unique: true in schema
productSchema.index({ productName: 'text', sku: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ 'pricingRules.type': 1 });
productSchema.index({ status: 1 });

// Soft Delete
const softDeletePlugin = require('../../utils/softDelete.plugin');
productSchema.plugin(softDeletePlugin);

// Pre-save hook to auto-calculate base cost and generate productCode
productSchema.pre('save', async function (next) {
  if (!this.sku || this.sku.trim() === '' || this.sku === null) {
    this.sku = undefined;
  }

  if (this.costBreakdown) {
    let sum = 0;
    if (this.costBreakdown instanceof Map) {
      for (const value of this.costBreakdown.values()) {
        sum += Number(value) || 0;
      }
    } else if (typeof this.costBreakdown === 'object') {
      for (const key in this.costBreakdown) {
        sum += Number(this.costBreakdown[key]) || 0;
      }
    }
    this.totalBaseCost = sum;
  }

  if (this.isNew && !this.productCode) {
    const timeSuffix = Date.now().toString().slice(-5);
    const randSuffix = Math.floor(100 + Math.random() * 900);
    this.productCode = `GMS-PROD-${timeSuffix}${randSuffix}`;
  }

  // Calculate totalBasePrice
  if (this.pricingRules) {
    const rules = this.pricingRules;
    const taxFactor = 1 + (Number(rules.taxPercentage) || 0) / 100;
    const installation = Number(rules.installationCharge) || 0;
    let basePrice = 0;

    switch (rules.type) {
      case 'FIXED_PRICE':
        basePrice = Number(rules.sellingPrice) || 0;
        break;
      case 'PER_SFT':
        basePrice = (Number(rules.ratePerSft) || 0) * (Number(rules.minArea) || 0);
        break;
      case 'SIZE_BASED':
        basePrice = (rules.sizePrices && rules.sizePrices.length > 0) ? Number(rules.sizePrices[0].price) || 0 : 0;
        break;
      case 'QUANTITY_BASED':
        basePrice = (rules.quantitySlabs && rules.quantitySlabs.length > 0) ? Number(rules.quantitySlabs[0].price) || 0 : 0;
        break;
      case 'RENTAL_BASED':
        if (rules.rentalRates) {
          basePrice = Number(rules.rentalRates.daily) || Number(rules.rentalRates.customPrice) || Number(rules.rentalRates.weekly) || Number(rules.rentalRates.monthly) || Number(rules.rentalRates.yearly) || 0;
        }
        break;
      default:
        basePrice = 0;
    }
    this.pricingRules.totalBasePrice = (basePrice * taxFactor) + installation;
  }
  
  if (typeof next === 'function') next();
});

productSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  const update = this.getUpdate();
  if (!update) return typeof next === 'function' ? next() : undefined;

  const target = update.$set || update;

  // Handle Cost Breakdown sum
  const cb = target.costBreakdown || update.costBreakdown;
  if (cb) {
    let sum = 0;
    if (cb instanceof Map) {
      for (const value of cb.values()) {
        sum += Number(value) || 0;
      }
    } else if (typeof cb === 'object') {
      for (const key in cb) {
        sum += Number(cb[key]) || 0;
      }
    }
    if (update.$set) {
      update.$set.totalBaseCost = sum;
    } else {
      update.totalBaseCost = sum;
    }
  }

  // Handle Total Base Price calculation on update
  const rules = target.pricingRules || update.pricingRules;
  if (rules && typeof rules === 'object') {
    const taxFactor = 1 + (Number(rules.taxPercentage) || 0) / 100;
    const installation = Number(rules.installationCharge) || 0;
    let basePrice = 0;

    switch (rules.type) {
      case 'FIXED_PRICE':
        basePrice = Number(rules.sellingPrice) || 0;
        break;
      case 'PER_SFT':
        basePrice = (Number(rules.ratePerSft) || 0) * (Number(rules.minArea) || 0);
        break;
      case 'SIZE_BASED':
        basePrice = (rules.sizePrices && rules.sizePrices.length > 0) ? Number(rules.sizePrices[0].price) || 0 : 0;
        break;
      case 'QUANTITY_BASED':
        basePrice = (rules.quantitySlabs && rules.quantitySlabs.length > 0) ? Number(rules.quantitySlabs[0].price) || 0 : 0;
        break;
      case 'RENTAL_BASED':
        if (rules.rentalRates) {
          basePrice = Number(rules.rentalRates.daily) || Number(rules.rentalRates.customPrice) || Number(rules.rentalRates.weekly) || Number(rules.rentalRates.monthly) || Number(rules.rentalRates.yearly) || 0;
        }
        break;
      default:
        basePrice = 0;
    }
    rules.totalBasePrice = (basePrice * taxFactor) + installation;
  } else if (target['pricingRules.type'] || update['pricingRules.type']) {
    const dotTarget = update.$set ? update.$set : update;
    const type = dotTarget['pricingRules.type'];
    const taxFactor = 1 + (Number(dotTarget['pricingRules.taxPercentage']) || 0) / 100;
    const installation = Number(dotTarget['pricingRules.installationCharge']) || 0;
    let basePrice = 0;
    if (type === 'FIXED_PRICE') basePrice = Number(dotTarget['pricingRules.sellingPrice']) || 0;
    dotTarget['pricingRules.totalBasePrice'] = (basePrice * taxFactor) + installation;
  }

  if (typeof next === 'function') next();
});

module.exports = mongoose.model('Product', productSchema);
