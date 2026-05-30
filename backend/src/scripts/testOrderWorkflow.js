const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env.development' });
const Order = require('../domains/orders/order.model');
const User = require('../domains/users/user.model');
const orderWorkflow = require('../workflows/order.workflow');

async function runTest() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gms');
    console.log('Connected to DB');

    // 1. Get an admin user
    const admin = await User.findOne({ role: 'ADMIN' });
    if (!admin) throw new Error('No admin user found');

    // 2. Create a dummy order
    const order = new Order({
      orderNumber: 'TEST-' + Date.now(),
      clientSnapshot: { name: 'Test Client', phone: '1234567890' },
      status: 'Draft',
      salesExec: admin._id,
      grandTotal: 1000,
      deliveryDate: new Date(Date.now() + 86400000),
      lineItems: [
        {
          description: 'Test Service 1',
          quantity: 1,
          unitPrice: 1000,
          amount: 1000,
          designRequired: true
        }
      ]
    });
    await order.save();
    console.log(`Created Order: ${order.orderNumber}`);

    // 3. Confirm Order -> pushes to Confirmed
    await orderWorkflow.confirmOrder(order._id, admin);
    const verifiedOrder = await Order.findById(order._id);
    console.log(`Verified Order. Status: ${verifiedOrder.status}, DesignStatus: ${verifiedOrder.designStatus}`);

    // 4. Complete Design -> pushes to Production
    verifiedOrder.lineItems[0].designWorkflow = { status: 'Completed' };
    await verifiedOrder.save();
    await orderWorkflow.updateOrderStatus(order._id, 'In_Production', admin, {}, { ipAddress: '127.0.0.1' });
    const prodOrder = await Order.findById(order._id);
    console.log(`Pushed to Production. Status: ${prodOrder.status}, OpsManager: ${prodOrder.operationsManager}`);

    // 5. Complete Production -> should push to Service
    prodOrder.lineItems[0].productionWorkflow = { status: 'Completed', handoverStatus: 'Ready For Service' };
    await prodOrder.save();
    
    // Simulate production.controller.js logic
    const allProdCompleted = prodOrder.lineItems.every(li => 
      !li.productionWorkflow || ['Ready For Service', 'Production Completed', 'Completed'].includes(li.productionWorkflow.status) || li.productionWorkflow.handoverStatus === 'Handed Over'
    );

    if (allProdCompleted && prodOrder.status === 'In_Production') {
      console.log('All production line items completed, attempting auto-transition to Ready_To_Deliver...');
      await orderWorkflow.updateOrderStatus(order._id, 'Ready_To_Deliver', admin, {}, { ipAddress: '127.0.0.1' });
    }

    const serviceOrder = await Order.findById(order._id);
    console.log(`Pushed to Service. Status: ${serviceOrder.status}, ServiceManager: ${serviceOrder.serviceManager}`);
    console.log(`Line item 0 service workflow:`, serviceOrder.lineItems[0].serviceWorkflow);

    // 6. Complete Service -> pushes to Delivered
    serviceOrder.lineItems[0].serviceWorkflow = { status: 'Completed' };
    await serviceOrder.save();
    await orderWorkflow.updateOrderStatus(order._id, 'Delivered', admin, {}, { ipAddress: '127.0.0.1' });
    
    // 7. Complete Order
    await orderWorkflow.updateOrderStatus(order._id, 'Completed', admin, { clientReview: 'Great', clientRating: 5 }, { ipAddress: '127.0.0.1' });
    
    const finalOrder = await Order.findById(order._id);
    console.log(`Final Order Status: ${finalOrder.status}`);

    console.log('\n--- Timeline Events ---');
    finalOrder.timeline.forEach(t => {
      console.log(`- ${t.title}: ${t.description}`);
    });

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    mongoose.disconnect();
  }
}

runTest();
