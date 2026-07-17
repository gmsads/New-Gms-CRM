const mongoose = require('mongoose');
const Order = require('./src/domains/orders/order.model');
const dotenv = require('dotenv');

dotenv.config();

async function checkOrders() {
  await mongoose.connect(process.env.MONGODB_URI);
  const orders = await Order.find({ verificationStatus: 'Pending' }).select('_id orderNumber status verificationStatus');
  console.log(orders);
  process.exit(0);
}

checkOrders();
