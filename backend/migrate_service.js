const mongoose = require('mongoose');
const Order = require('./src/domains/orders/order.model');
const { assignRoundRobin } = require('./src/domains/hr/assignment.service');
require('dotenv').config({ path: '.env.development' });

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const orders = await Order.find({ status: 'Ready_To_Deliver', serviceManager: { $exists: false } });
  console.log('Migrating', orders.length, 'orders to assign service manager...');
  for (let o of orders) {
    try {
      const adminUser = await mongoose.model('User').findOne({ role: 'ADMIN' });
      const adminId = adminUser ? adminUser._id : null;
      
      const assignment = await assignRoundRobin('SERVICE_MANAGER', o._id, null, o.salesExec || adminId);
      o.serviceManager = assignment.assignedTo;
      o.lineItems.forEach(item => {
        if (!item.serviceWorkflow) item.serviceWorkflow = {};
        item.serviceWorkflow.serviceManagerId = assignment.assignedTo;
        if (!item.serviceWorkflow.status) item.serviceWorkflow.status = 'Pending Service';
      });
      await o.save();
      console.log('Assigned service manager for', o.orderNumber);
    } catch(err) {
      console.error('Failed to assign for', o.orderNumber, err.message);
    }
  }
  process.exit(0);
});
