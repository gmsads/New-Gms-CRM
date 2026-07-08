require('dotenv').config({ path: '.env.development' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Order = require('./src/domains/orders/order.model');
  
  const filter = { 
    'lineItems': { $exists: true, $not: { $size: 0 } },
    status: { $nin: ['Draft', 'Pending_Approval', 'Cancelled'] }
  };
  
  const orders = await Order.find(filter).lean();
    
  console.log(JSON.stringify(orders.map(o => ({
    orderNumber: o.orderNumber,
    lineItems: o.lineItems.map(li => ({
      designerWorkflow: li.designerWorkflow
    }))
  })), null, 2));
  
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
