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
    const template = await Template.findOne({ isActive: true });
    if (template) {
      quoteData.templateSnapshot = template.toObject();
    }
    
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

    const quotation = await Quotation.findByIdAndUpdate(id, data, { new: true }).lean();

    await auditWorkflow.trackUpdate('Quotation', id, actorId, oldQuotation, quotation, reqContext);

    return quotation;
  }

  async updateStatus(id, updateData, actorId, reqContext = {}) {
    const { status, sentVia } = updateData;
    const oldQuotation = await Quotation.findById(id).lean();
    if (!oldQuotation) throw new Error('Quotation not found');

    const update = { status };
    if (status === 'Sent') { 
      update.sentAt = new Date(); 
      if (sentVia) update.sentVia = sentVia; 
    }

    const quotation = await Quotation.findByIdAndUpdate(id, update, { new: true }).lean();

    await auditWorkflow.trackUpdate('Quotation', id, actorId, oldQuotation, quotation, reqContext);

    return quotation;
  }
}

module.exports = new QuotationWorkflowService();
