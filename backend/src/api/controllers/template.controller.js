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
        bankDetails: {
          bankName: 'HDFC Bank',
          accountNumber: '50200012345678',
          ifscCode: 'HDFC0001234',
          branch: 'Main Branch'
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
    const template = await Template.findOneAndUpdate(
      { isDefault: true },
      { ...req.body, updatedBy: req.user._id },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: template });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
