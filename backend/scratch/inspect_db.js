const mongoose = require('mongoose');
const Order = require('../src/domains/orders/order.model');
const User = require('../src/domains/users/user.model');

async function inspect() {
  const MONGO_URI = 'mongodb+srv://prasadd313:Prasad123@cluster0.bv44x16.mongodb.net/gms_crm?retryWrites=true&w=majority&appName=Cluster0';
  await mongoose.connect(MONGO_URI);
  console.log('Connected to Atlas DB');

  try {
    const order = await Order.findOne({ orderNumber: 'ORD-2026-0001' })
      .populate('designAssignedTo', 'name email role')
      .populate('salesExec', 'name email')
      .populate('operationsManager', 'name email');
    console.log(JSON.stringify(order, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

inspect();
