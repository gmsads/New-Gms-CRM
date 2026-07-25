const Template = require('../domains/sales/quotations/template.model');

/**
 * Enterprise Organization Settings Migration
 * Copies legacy bankDetails into the new bankAccounts array
 * if the array is empty, ensuring backward compatibility.
 */
exports.runMigrations = async () => {
  try {
    const template = await Template.findOne({ isDefault: true });
    
    if (template) {
      // 1. Bank Accounts Migration
      const hasBankDetails = template.bankDetails && template.bankDetails.accountNumber;
      const hasNoBankAccounts = !template.bankAccounts || template.bankAccounts.length === 0;

      if (hasBankDetails && hasNoBankAccounts) {
        console.log('[Migration] Migrating legacy bankDetails to bankAccounts...');
        template.bankAccounts = [{
          accountName: template.bankDetails.accountName || template.companyName,
          bankName: template.bankDetails.bankName,
          branch: template.bankDetails.branch,
          accountNumber: template.bankDetails.accountNumber,
          ifsc: template.bankDetails.ifscCode,
          upiId: template.qrCode?.upiId || '',
          qrCodeUrl: '',
          active: true,
          isDefault: true
        }];
        
        await template.save();
        console.log('[Migration] Bank details successfully migrated to Enterprise array.');
      }
    }
  } catch (err) {
    console.error('⚠️ [Migration] Error running migrations:', err.message);
  }
};
