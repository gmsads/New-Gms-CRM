/**
 * migrate_design_status.js
 * Run manually to migrate existing line items from legacy `designerStatus` to `designerWorkflow`
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Order = require('./src/domains/orders/order.model');

// Map legacy statuses to new statuses based on workflow type
const STATUS_MAP = {
  'Pending': { type: 'DESIGN_CREATED', status: 'Assigned' },
  'In Progress': { type: 'DESIGN_CREATED', status: 'In Progress' },
  'Demo Shared to Client': { type: 'DESIGN_CREATED', status: 'Demo Shared' },
  'Client Approved Design': { type: 'DESIGN_CREATED', status: 'Client Approved' },
  'Design Completed': { type: 'DESIGN_CREATED', status: 'Completed' },
  'Design Provided - Approved': { type: 'CLIENT_UPLOADED', status: 'Approved For Printing' },
  'Design Provided - Not Clear': { type: 'CLIENT_UPLOADED', status: 'Rejected - Quality Issue' }
};

const run = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gms_crm';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const orders = await Order.find({ 'lineItems.designerStatus': { $exists: true } });
    console.log(`Found ${orders.length} orders to potentially migrate.`);

    let modifiedCount = 0;

    for (const order of orders) {
      let isModified = false;

      for (const item of order.lineItems) {
        if (item.designerStatus && !item.designerWorkflow?.statusHistory?.length) {
          // It has legacy status and hasn't been migrated
          const mapped = STATUS_MAP[item.designerStatus] || { type: 'DESIGN_CREATED', status: 'Assigned' };
          
          item.designerWorkflow = {
            workflowType: mapped.type,
            currentStatus: mapped.status,
            statusHistory: [{
              status: mapped.status,
              changedAt: new Date(),
              note: `Migrated from legacy status: ${item.designerStatus}`
            }],
            assignedDesigners: order.designAssignedTo ? [{
              userId: order.designAssignedTo,
              assignedAt: order.designRequestedAt || new Date(),
              role: 'PRIMARY'
            }] : [],
            revisionCount: 0
          };

          // Migrate design file url if exists
          if (item.designFileUrl) {
            item.serviceFiles.push({
              type: mapped.type === 'CLIENT_UPLOADED' ? 'CLIENT_UPLOAD' : 'FINAL',
              fileUrl: item.designFileUrl,
              uploadedAt: new Date(),
              version: 1,
              notes: 'Migrated legacy file'
            });
          }

          // We'll leave item.designerStatus so we don't break frontend before it's deployed, 
          // but we won't rely on it for the new designer board.

          isModified = true;
        }
      }

      if (isModified) {
        // Bypass validation just in case other fields fail
        await Order.updateOne({ _id: order._id }, { $set: { lineItems: order.lineItems } });
        modifiedCount++;
      }
    }

    console.log(`Successfully migrated lineItems for ${modifiedCount} orders.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

run();
