const connectDB = require('./src/config/db');
const Order = require('./src/domains/orders/order.model');
require('dotenv').config({ path: '.env.development' });

connectDB().then(async () => {
  const orders = await Order.find({
    'lineItems.productionWorkflow.status': { $in: ['Production Completed', 'Ready For Service', 'Completed'] }
  });
  console.log('Orders with completed production items:', orders.length);
  orders.forEach(o => {
    console.log('\nOrder:', o.orderNumber, 'Status:', o.status);
    o.lineItems.forEach((li, idx) => {
      console.log('  Item', idx, li.description);
      console.log('    Prod Status:', li.productionWorkflow?.status);
      console.log('    Service Status:', li.serviceWorkflow?.status);
    });
  });
  process.exit(0);
});
