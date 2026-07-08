const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });
const mongoose = require('mongoose');

const Order = require('../src/domains/orders/order.model');
const OrderService = require('../src/domains/orders/service.model');
const ServiceFile = require('../src/domains/orders/serviceFile.model');
const ServiceActivityLog = require('../src/domains/orders/serviceLog.model');

async function verify() {
  const uri = process.env.MONGO_URI;
  await mongoose.connect(uri);
  console.log('Connected to Atlas DB');

  try {
    const orders = await Order.find({});
    console.log(`\nFound ${orders.length} orders in database.\n`);

    for (const order of orders) {
      console.log(`Order: ${order.orderNumber} (ID: ${order._id})`);
      console.log(`Status: ${order.status}`);
      console.log(`Grand Total: ₹${order.grandTotal}`);
      console.log(`Line Items Count: ${order.lineItems ? order.lineItems.length : 0}`);
      
      if (order.lineItems) {
        order.lineItems.forEach((item, index) => {
          console.log(`  [Service ${index + 1}] Description: "${item.description}"`);
          console.log(`    Amount: ₹${item.amount}`);
          console.log(`    Status: ${item.designerStatus}`);
          console.log(`    Assigned Designer: ${item.assignedDesigner || 'None'}`);
          console.log(`    Design Files count: ${item.designFiles ? item.designFiles.length : 0}`);
          if (item.designFiles && item.designFiles.length > 0) {
            item.designFiles.forEach(f => {
              console.log(`      File: ${f.filename} (Version: ${f.version}, Url: ${f.url}, Locked: ${f.isLocked})`);
            });
          }
          console.log(`    Activity Logs count: ${item.activityLogs ? item.activityLogs.length : 0}`);
          if (item.activityLogs && item.activityLogs.length > 0) {
            item.activityLogs.forEach(l => {
              console.log(`      Log: ${l.event} - ${l.detail} (by: ${l.byRole})`);
            });
          }
        });
      }
      console.log('-----------------------------------------------------\n');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

verify();
