const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.development' });
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Order = require('./src/domains/orders/order.model');
  const d = await Order.find({ deadline: { $exists: true, $ne: null } }).lean();
  console.log('Orders with deadline:', d.length);
  
  const o = await Order.findOne({ orderNumber: 'ORD-2026-0011' }).lean();
  console.log(Object.keys(o).filter(k => String(k).toLowerCase().includes('date') || String(k).toLowerCase().includes('time') || String(k).toLowerCase().includes('deadline')));
  process.exit(0);
});
