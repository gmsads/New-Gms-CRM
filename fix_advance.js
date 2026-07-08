const mongoose = require('mongoose');
const Order = require('./backend/src/domains/orders/order.model');
const OrderApproval = require('./backend/src/domains/approvals/approval.model');

mongoose.connect('mongodb://127.0.0.1:27017/gms').then(async () => {
  console.log('Connected. Finding pending approvals...');
  
  const pendingApprovals = await OrderApproval.find({}).populate('order');
  console.log(`Found ${pendingApprovals.length} total approvals.`);

  for (const app of pendingApprovals) {
    if (app.order) {
      // Find the pending payment in the order
      const activePayments = app.order.paymentRecords.filter(p => p.status === 'Verified' || p.status === 'Pending');
      const actualAdvance = activePayments.reduce((s, p) => s + p.amount, 0);
      
      if (actualAdvance > 0 && app.advancePaid !== actualAdvance) {
        console.log(`Fixing approval ${app._id} for Order ${app.order.orderNumber}. Old Advance: ${app.advancePaid}, New Advance: ${actualAdvance}`);
        
        // Update approval
        app.advancePaid = actualAdvance;
        app.advancePct = (actualAdvance / app.grandTotal) * 100;
        await app.save();

        // Update order advancePaid
        app.order.advancePaid = actualAdvance;
        await app.order.save();
      }
    }
  }

  console.log('Done.');
  process.exit(0);
}).catch(console.error);
