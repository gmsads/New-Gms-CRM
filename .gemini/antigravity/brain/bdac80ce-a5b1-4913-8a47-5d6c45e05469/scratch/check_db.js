const mongoose = require('mongoose');
const Prospect = require('./backend/src/domains/sales/prospects/prospect.model');
const Order = require('./backend/src/domains/orders/order.model');

async function check() {
  await mongoose.connect('mongodb://localhost:27017/gms_crm');
  console.log('Connected to DB');
  
  const prospects = await Prospect.find().limit(5).lean();
  console.log('PROSPECTS SAMPLE:', JSON.stringify(prospects, null, 2));

  const orders = await Order.find().limit(5).lean();
  console.log('ORDERS SAMPLE:', JSON.stringify(orders, null, 2));

  process.exit();
}

check().catch(err => { console.error(err); process.exit(1); });
