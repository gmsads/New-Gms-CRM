const Template = require('../../domains/sales/quotations/template.model');

exports.getTemplate = async (req, res) => {
  try {
    let template = await Template.findOne({ isDefault: true });
    if (!template) {
      // Create default
      template = new Template({
        name: 'Standard Template',
        isDefault: true,
        companyName: 'GMS CRM Ltd.',
        address: '123 Business Avenue, Tech Park',
        gstNumber: '27AABCU9603R1ZX',
        panNumber: 'AABCU9603R',
        regNumber: 'REG-2024-GMS-881',
        bankDetails: {
          bankName: 'HDFC Bank',
          accountNumber: '50200012345678',
          ifscCode: 'HDFC0001234',
          branch: 'Main Branch'
        },
        taxSettings: {
          enableGst: true,
          defaultGstRate: 18,
          gstSlabs: [
            { rate: 0, active: true, description: 'Exempted' },
            { rate: 5, active: true, description: 'GST 5%' },
            { rate: 12, active: true, description: 'GST 12%' },
            { rate: 18, active: true, description: 'GST 18%' },
            { rate: 28, active: true, description: 'GST 28%' }
          ]
        },
        documentNumbering: {
          quotation: { prefix: 'QT-', startNumber: 1000 },
          invoice: { prefix: 'INV-', startNumber: 1000 },
          order: { prefix: 'ORD-', startNumber: 1000 },
          receipt: { prefix: 'REC-', startNumber: 1000 },
          purchaseOrder: { prefix: 'PO-', startNumber: 1000 },
          deliveryChallan: { prefix: 'DC-', startNumber: 1000 }
        },
        termsAndConditions: [
          'Payment: 50% advance, 30% after Production Completed 10% before delivery',
          'Validity: 15 days from quotation date'
        ],
        footerText: 'Thank you for your business!'
      });
      await template.save();
    }
    res.json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const existing = await Template.findOne({ isDefault: true });
    
    // Manual deep merge logic for documentNumbering and taxSettings
    const updatePayload = { ...req.body, updatedBy: req.user._id };
    
    if (existing) {
      if (req.body.documentNumbering) {
        updatePayload.documentNumbering = { ...existing.documentNumbering, ...req.body.documentNumbering };
      }
      if (req.body.taxSettings) {
        updatePayload.taxSettings = { ...existing.taxSettings, ...req.body.taxSettings };
      }
    }

    const template = await Template.findOneAndUpdate(
      { isDefault: true },
      updatePayload,
      { new: true, upsert: true }
    );
    res.json({ success: true, data: template });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
