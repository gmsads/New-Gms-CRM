const Quotation = require('../../domains/sales/quotations/quotation.model');
const Template = require('../../domains/sales/quotations/template.model');
const Prospect = require('../../domains/sales/prospects/prospect.model');
const auditWorkflow = require('./auditWorkflow.service');

class QuotationWorkflowService {
  async createQuotation(data, creatorId, reqContext = {}) {
    const quoteData = { ...data, executive: creatorId };
    
    // Auto-generate ID: GMS-QT-YYYY-0001
    const count = await Quotation.countDocuments();
    quoteData.quotationId = `GMS-QT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    
    // Recompute values for security
    let computedSubtotal = 0;
    if (quoteData.items && Array.isArray(quoteData.items)) {
      quoteData.items.forEach(item => {
        item.totalCost = item.quantity * item.unitCost;
        computedSubtotal += item.totalCost;
      });
    }
    
    const computedAdditionalCharges = quoteData.additionalCharges?.reduce((sum, c) => sum + c.amount, 0) || 0;
    const totalBeforeDiscount = computedSubtotal + computedAdditionalCharges;

    let computedDiscountAmount = 0;
    if (quoteData.discount) {
      if (quoteData.discount.type === 'PERCENT') {
        computedDiscountAmount = (totalBeforeDiscount * (quoteData.discount.value || 0)) / 100;
      } else {
        computedDiscountAmount = Number(quoteData.discount.value || 0);
      }
      quoteData.discount.amount = computedDiscountAmount;
    }

    const computedTaxableAmount = totalBeforeDiscount - computedDiscountAmount;
    const computedGstAmount = 0; // Tax is 0 as per requirements
    const computedFinalTotal = computedTaxableAmount + computedGstAmount;

    // Validate payload against server calculation
    if (quoteData.totalAmount !== undefined && Math.abs(quoteData.totalAmount - computedFinalTotal) > 5.0) {
      throw new Error('Quotation calculations mismatch. Payload verification failed.');
    }

    quoteData.subtotal = computedSubtotal;
    quoteData.totalAmount = computedFinalTotal;
    quoteData.tax = { enabled: false, rate: 0, cgst: 0, sgst: 0, amount: 0 };

    // Check if approval is required
    const hasCustomPrice = quoteData.items?.some(i => i.isCustomPrice);
    const hasDiscount = quoteData.discount && quoteData.discount.amount > 0;
    if (hasCustomPrice || hasDiscount) {
      quoteData.requiresApproval = true;
      if (quoteData.status !== 'Draft') {
        quoteData.status = 'Draft'; // Force draft if requires approval
      }
    }
    
    // Attach current template
    const template = await Template.findOne({ isDefault: true });
    if (template) {
      quoteData.templateSnapshot = template.toObject();
    }

    // Set audit fields
    quoteData.createdBy = creatorId;
    quoteData.lastModifiedAt = new Date();
    quoteData.activityLogs = [{
      action: 'Created',
      performedBy: creatorId,
      timestamp: new Date(),
      notes: `Quotation created with status: ${quoteData.status || 'Draft'}`
    }];
    
    const quotation = new Quotation(quoteData);
    await quotation.save();

    // Side Effect: Update Prospect indicator
    if (quotation.prospect) {
      await Prospect.findByIdAndUpdate(quotation.prospect, {
        quotationSent: true,
        lastInteraction: new Date(),
        $push: { 
          interactions: { 
            type: 'Quotation', 
            date: new Date(), 
            notes: `Generated Quotation: ${quoteData.quotationId}` 
          } 
        }
      });
    }

    await auditWorkflow.log({
      action: 'QUOTATION_CREATED',
      performedBy: creatorId,
      targetModel: 'Quotation',
      targetId: quotation._id,
      newValue: quotation,
      ipAddress: reqContext.ipAddress,
      userAgent: reqContext.userAgent,
      device: reqContext.device
    });

    return quotation;
  }

  async updateQuotation(id, data, actorId, reqContext = {}) {
    const oldQuotation = await Quotation.findById(id).lean();
    if (!oldQuotation) throw new Error('Quotation not found');

    // Recompute subtotal
    let computedSubtotal = 0;
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach(item => {
        item.totalCost = item.quantity * item.unitCost;
        computedSubtotal += item.totalCost;
      });
      data.subtotal = computedSubtotal;
    } else {
      data.subtotal = oldQuotation.subtotal;
    }

    const computedAdditionalCharges = data.additionalCharges?.reduce((sum, c) => sum + c.amount, 0) || oldQuotation.additionalCharges?.reduce((sum, c) => sum + c.amount, 0) || 0;
    const totalBeforeDiscount = data.subtotal + computedAdditionalCharges;

    let computedDiscountAmount = 0;
    if (data.discount) {
      if (data.discount.type === 'PERCENT') {
        computedDiscountAmount = (totalBeforeDiscount * (data.discount.value || 0)) / 100;
      } else {
        computedDiscountAmount = Number(data.discount.value || 0);
      }
      data.discount.amount = computedDiscountAmount;
    } else if (oldQuotation.discount) {
      if (oldQuotation.discount.type === 'PERCENT') {
        computedDiscountAmount = (totalBeforeDiscount * (oldQuotation.discount.value || 0)) / 100;
      } else {
        computedDiscountAmount = Number(oldQuotation.discount.value || 0);
      }
    }

    const computedTaxableAmount = totalBeforeDiscount - computedDiscountAmount;
    const computedFinalTotal = computedTaxableAmount; // Tax is 0

    data.totalAmount = computedFinalTotal;
    data.tax = { enabled: false, rate: 0, cgst: 0, sgst: 0, amount: 0 };
    data.updatedBy = actorId;
    data.lastModifiedAt = new Date();

    const quotation = await Quotation.findByIdAndUpdate(
      id,
      {
        ...data,
        $push: {
          activityLogs: {
            action: 'Updated',
            performedBy: actorId,
            timestamp: new Date(),
            notes: `Quotation details modified`
          }
        }
      },
      { new: true }
    ).lean();

    await auditWorkflow.trackUpdate('Quotation', id, actorId, oldQuotation, quotation, reqContext);
    return quotation;
  }

  async updateStatus(id, updateData, actorId, reqContext = {}) {
    const { status, sentVia } = updateData;
    const oldQuotation = await Quotation.findById(id).lean();
    if (!oldQuotation) throw new Error('Quotation not found');

    const update = { 
      status, 
      updatedBy: actorId,
      lastModifiedAt: new Date()
    };
    
    let logNotes = `Status updated to ${status}`;
    if (status === 'Sent') { 
      update.sentAt = new Date(); 
      update.sentBy = actorId;
      if (sentVia) update.sentVia = sentVia; 
      logNotes = `Quotation dispatched via ${sentVia || 'WhatsApp'}`;
    } else if (status === 'Converted to Order') {
      update.convertedToOrder = true;
      update.convertedAt = new Date();
      if (updateData.orderId) update.convertedOrderId = updateData.orderId;
      logNotes = `Quotation successfully converted to Order`;
    }

    const quotation = await Quotation.findByIdAndUpdate(
      id, 
      { 
        $set: update,
        $push: {
          activityLogs: {
            action: status,
            performedBy: actorId,
            timestamp: new Date(),
            notes: logNotes
          }
        }
      }, 
      { new: true }
    ).lean();

    await auditWorkflow.trackUpdate('Quotation', id, actorId, oldQuotation, quotation, reqContext);
    return quotation;
  }
}

module.exports = new QuotationWorkflowService();
