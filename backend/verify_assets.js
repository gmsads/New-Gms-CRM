const mongoose = require('mongoose');
const Order = require('./src/domains/orders/order.model');
const DesignAsset = require('./src/domains/design/asset.model');

require('dotenv').config({ path: '.env.development' });

async function check() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://pramodh:pramodh123@gms.bv44x16.mongodb.net/test');
  
  const orders = await Order.find({
    'lineItems.designerWorkflow.currentStatus': { $in: ['Completed', 'Client-Design Approved'] }
  });
  console.log('Orders with completed line items:', orders.length);
  
  if (orders.length > 0) {
    console.log(JSON.stringify(orders[0].lineItems.map(l => l.designerWorkflow), null, 2));
    console.log(JSON.stringify(orders[0].lineItems.map(l => l.serviceFiles), null, 2));
  }
  
  process.exit(0);
}

check().catch(console.error);
