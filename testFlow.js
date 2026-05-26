const path = require('path');
require('./backend/node_modules/dotenv').config({ path: path.join(__dirname, 'backend/.env.development') });
const mongoose = require('./backend/node_modules/mongoose');
const User = require('./backend/src/domains/users/user.model');
const Prospect = require('./backend/src/domains/sales/prospects/prospect.model');
const Order = require('./backend/src/domains/orders/order.model');
const orderWorkflow = require('./backend/src/workflows/order.workflow');
const prospectWorkflow = require('./backend/src/services/workflows/prospectWorkflow.service');
const { updateOrderStatus } = require('./backend/src/workflows/order.workflow');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  try {
    const adminUser = await User.findOne({ role: 'ADMIN' });
    if (!adminUser) throw new Error("No admin user found");

    const reqContext = { ipAddress: '127.0.0.1', userAgent: 'test' };

    // 1. Create a Prospect
    const prospect = await prospectWorkflow.createProspect({
      name: 'Test Prospect ' + Date.now(),
      phone: '99999999' + Math.floor(Math.random()*10),
      company: 'Test Company',
      assignedTo: adminUser._id,
      priority: 'Hot'
    }, adminUser._id, reqContext);
    
    console.log('Created Prospect:', prospect._id, prospect.status, prospect.stage);

    // 2. Create an Order linked to Prospect
    const orderData = {
      client: undefined,
      clientSnapshot: {
        name: prospect.name,
        company: prospect.company,
        phone: prospect.phone
      },
      prospect: prospect._id,
      salesExec: adminUser._id,
      grandTotal: 1000,
      totalPaid: 1000,
      advance: 1000,
      paymentStatus: 'Paid',
      paymentMethod: 'UPI',
      lineItems: [
        {
          description: 'Test Item 1',
          quantity: 1,
          unitPrice: 1000,
          amount: 1000,
          designerStatus: 'Pending',
          operationStatus: 'operation update pending',
          serviceStatus: 'service update pending'
        }
      ]
    };

    const newOrder = new Order(orderData);
    await newOrder.save();
    console.log('Created Order:', newOrder._id, newOrder.status);

    // 3. Confirm the order (simulating order.controller logic)
    const confirmedOrder = await orderWorkflow.confirmOrder(newOrder._id, adminUser, reqContext);
    console.log('Order Confirmed:', confirmedOrder.status);

    // Check Prospect status after confirm
    const prospectAfterConfirm = await Prospect.findById(prospect._id);
    console.log('Prospect after confirm:', prospectAfterConfirm.status, prospectAfterConfirm.stage, prospectAfterConfirm.linkedOrderId);

    // 4. Update Line Items manually (simulating frontend UpdateLineItemModal)
    // The user manually updates serviceStatus to 'completed'
    confirmedOrder.lineItems[0].serviceStatus = 'completed';
    await confirmedOrder.save();
    console.log('Line item updated to completed.');

    // Simulating my new order.controller logic for updateLineItem:
    const allCompleted = confirmedOrder.lineItems.every(li => li.serviceStatus === 'completed');
    if (allCompleted && confirmedOrder.status !== 'Completed') {
      console.log('All line items completed, triggering order workflow completion...');
      await updateOrderStatus(confirmedOrder._id, 'Completed', adminUser, {}, reqContext);
    }

    // Check Prospect status after line item completion
    const prospectAfterComplete = await Prospect.findById(prospect._id);
    console.log('Prospect after line item completion:', prospectAfterComplete.status, prospectAfterComplete.stage, prospectAfterComplete.linkedOrderId);
    
    // Check order status
    const orderAfterComplete = await Order.findById(confirmedOrder._id);
    console.log('Final Order Status:', orderAfterComplete.status);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

test();
