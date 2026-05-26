const mongoose = require('mongoose');
const Order = require('../src/domains/orders/order.model');
const User = require('../src/domains/users/user.model');
const statusTransitionService = require('../src/services/workflows/statusTransition.service');

async function test() {
  const MONGO_URI = 'mongodb+srv://prasadd313:Prasad123@cluster0.bv44x16.mongodb.net/gms_crm?retryWrites=true&w=majority&appName=Cluster0';
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');

  let testOpsManagerCreated = false;
  let testOrder = null;

  try {
    const adminUser = await User.findOne({ role: 'ADMIN' });
    if (!adminUser) throw new Error("No admin user found");
    console.log('Found Admin User:', adminUser.name);

    // Make sure we have at least one Operations Manager in DB for Round Robin
    let opsManager = await User.findOne({ role: 'OPERATION_MANAGER', status: 'ACTIVE' });
    if (!opsManager) {
      console.log('No active operations manager found, creating one...');
      opsManager = await User.create({
        name: 'Test Ops Manager',
        email: 'testops_unique_' + Date.now() + '@gms.com',
        phone: '99999' + Math.floor(10000 + Math.random() * 90000),
        role: 'OPERATION_MANAGER',
        password: 'password123',
        status: 'ACTIVE'
      });
      testOpsManagerCreated = true;
    }
    console.log('Found/Created Ops Manager:', opsManager.name);

    // 1. Create a confirmed order with design required = true
    const orderData = {
      orderNumber: 'ORD-TEST-' + Date.now().toString().slice(-4),
      clientSnapshot: {
        name: 'Test Client',
        company: 'Test Client Corp',
        phone: '1234567890'
      },
      salesExec: adminUser._id,
      grandTotal: 5000,
      totalPaid: 2500,
      advancePaid: 2500,
      status: 'Design_Pending',
      designRequired: true,
      designStatus: 'Pending',
      lineItems: [
        {
          description: 'Design Logo Service',
          quantity: 1,
          unitPrice: 2000,
          amount: 2000,
          designerStatus: 'Pending'
        },
        {
          description: 'Design Poster Service',
          quantity: 1,
          unitPrice: 3000,
          amount: 3000,
          designerStatus: 'Pending'
        }
      ]
    };

    testOrder = new Order(orderData);
    await testOrder.save();
    console.log('Created order:', testOrder.orderNumber, 'Status:', testOrder.status, 'designStatus:', testOrder.designStatus);

    // 2. Update line item 1 status to In_Progress using statusTransitionService
    let order = await statusTransitionService.transitionServiceStatus(
      testOrder._id,
      0,
      'In_Progress',
      adminUser,
      { remarks: 'Starting Logo design' }
    );
    console.log('After Item 1 In_Progress - Order Status:', order.status, 'designStatus:', order.designStatus);

    // 3. Update line item 1 status to Approved
    order = await statusTransitionService.transitionServiceStatus(
      testOrder._id,
      0,
      'Approved',
      adminUser,
      { remarks: 'Logo approved by client' }
    );
    console.log('After Item 1 Approved - Order Status:', order.status, 'designStatus:', order.designStatus);

    // 4. Update line item 2 status to Design_Not_Required
    order = await statusTransitionService.transitionServiceStatus(
      testOrder._id,
      1,
      'Design_Not_Required',
      adminUser,
      { remarks: 'Poster design no longer required' }
    );
    console.log('After Item 2 Design_Not_Required (All approved/not required) - Order Status:', order.status, 'designStatus:', order.designStatus);

    // Reload order from DB to check status recalculation & post hooks
    const reloaded = await Order.findById(testOrder._id).populate('operationsManager', 'name email role');
    console.log('Reloaded Order Status:', reloaded.status);
    console.log('Reloaded Order designStatus:', reloaded.designStatus);
    console.log('Assigned Operations Manager:', reloaded.operationsManager ? `${reloaded.operationsManager.name} (${reloaded.operationsManager.role})` : 'None');

    if (reloaded.status !== 'Design_Approved') {
      throw new Error(`Expected order status to be Design_Approved but got ${reloaded.status}`);
    }
    if (reloaded.designStatus !== 'Approved') {
      throw new Error(`Expected designStatus to be Approved but got ${reloaded.designStatus}`);
    }
    if (!reloaded.operationsManager) {
      throw new Error(`Expected operations manager to be assigned, but got none`);
    }

    console.log('ALL WORKFLOW TRANSITIONS AND OPERATIONS HANDOFF VERIFIED SUCCESSFULLY!');

  } catch (err) {
    console.error('VERIFICATION FAILED:', err);
  } finally {
    if (testOrder) {
      await Order.findByIdAndDelete(testOrder._id);
      console.log('Cleaned up test order.');
    }
    if (testOpsManagerCreated) {
      // Find and delete the test operations manager we created to keep DB clean
      const deletedOps = await User.findOneAndDelete({ email: { $regex: /^testops_unique_/ } });
      if (deletedOps) {
        console.log('Cleaned up test operations manager:', deletedOps.email);
      }
    }
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

test();
