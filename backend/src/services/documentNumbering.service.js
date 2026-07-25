const Counter = require('../models/counter.model');
const Template = require('../domains/sales/quotations/template.model');

/**
 * Generates a sequential document number using atomic increments.
 * Format: PREFIX-YYYY-000001
 * 
 * @param {string} type - 'quotation', 'invoice', 'order', 'receipt', 'purchaseOrder', 'deliveryChallan'
 * @returns {Promise<string>} The generated document number
 */
exports.generateNextNumber = async (type) => {
  // 1. Get Settings for Prefix and Start Number
  const template = await Template.findOne({ isDefault: true });
  let prefix = '';
  let startNumber = 1000;

  if (template && template.documentNumbering && template.documentNumbering[type]) {
    prefix = template.documentNumbering[type].prefix || '';
    startNumber = template.documentNumbering[type].startNumber || 1000;
  }

  // 2. Safely atomic increment or create counter
  const counter = await Counter.findOneAndUpdate(
    { id: type },
    { $setOnInsert: { seq: startNumber - 1 } },
    { new: true, upsert: true }
  );

  // If this is the first time, the document was just inserted with startNumber - 1.
  // We need to increment it to get the startNumber.
  const updatedCounter = await Counter.findOneAndUpdate(
    { id: type },
    { $inc: { seq: 1 } },
    { new: true }
  );

  const seq = updatedCounter.seq;

  // 3. Format Number (PREFIX-YYYY-000001)
  const currentYear = new Date().getFullYear();
  const paddedSeq = String(seq).padStart(6, '0');

  return `${prefix}${currentYear}-${paddedSeq}`;
};
