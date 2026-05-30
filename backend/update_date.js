const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.development' });
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Order = require('./src/domains/orders/order.model');
  const d = new Date();
  d.setDate(d.getDate() + 3); // Delivery in 3 days
  await Order.updateOne({ orderNumber: 'ORD-2026-0001' }, { $set: { deliveryDate: d } });
  console.log('Updated delivery date');
  process.exit(0);
});
