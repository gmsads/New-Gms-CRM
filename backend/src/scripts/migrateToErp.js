const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.development') });
const mongoose = require('mongoose');

// Register models
const Order = require('../domains/orders/order.model');
const OrderService = require('../domains/orders/service.model');
const ServiceFile = require('../domains/orders/serviceFile.model');
const ServiceActivityLog = require('../domains/orders/serviceLog.model');

async function migrate() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set in env configuration.');
    process.exit(1);
  }

  console.log(`Connecting to: ${uri}`);
  await mongoose.connect(uri);
  console.log('Connected to database.');

  try {
    // Access orders raw from mongodb to inspect exactly what's in the collection without population
    const ordersCollection = mongoose.connection.db.collection('orders');
    const rawOrders = await ordersCollection.find({}).toArray();

    console.log(`Retrieved ${rawOrders.length} raw orders from the database.`);

    let migrationCount = 0;

    for (const rawOrder of rawOrders) {
      // Check if lineItems contains objects (legacy structure) or ObjectIds (new structure)
      const needsMigration = rawOrder.lineItems && rawOrder.lineItems.length > 0 && typeof rawOrder.lineItems[0] === 'object';
      
      if (!needsMigration) {
        console.log(`Order ${rawOrder.orderNumber || rawOrder._id} does not need migration (already normalized or empty).`);
        continue;
      }

      console.log(`Migrating Order ${rawOrder.orderNumber || rawOrder._id}...`);
      const serviceIds = [];

      for (const legacyItem of rawOrder.lineItems) {
        // 1. Process files
        const designFilesIds = [];
        const demoFilesIds = [];
        const approvalFilesIds = [];

        // Helper to migrate files
        const migrateFiles = async (legacyFiles) => {
          const ids = [];
          if (legacyFiles && Array.isArray(legacyFiles)) {
            for (const file of legacyFiles) {
              const sf = new ServiceFile({
                url: file.url,
                filename: file.filename || 'Uploaded File',
                version: file.version || 1,
                isLocked: file.isLocked || ['Approved', 'Delivered', 'Completed'].includes(legacyItem.designerStatus),
                uploadedBy: file.uploadedBy,
                uploadedAt: file.uploadedAt || new Date(),
                metadata: file.metadata || {},
                permissions: file.permissions || []
              });
              await sf.save();
              ids.push(sf._id);
            }
          }
          return ids;
        };

        const designIds = await migrateFiles(legacyItem.designFiles);
        const demoIds = await migrateFiles(legacyItem.demoFiles);
        const approvalIds = await migrateFiles(legacyItem.approvalFiles);

        // 2. Process activity logs
        const logIds = [];
        if (legacyItem.activityLogs && Array.isArray(legacyItem.activityLogs)) {
          for (const log of legacyItem.activityLogs) {
            const sl = new ServiceActivityLog({
              event: log.event || 'Activity Log',
              detail: log.detail || '',
              by: log.by,
              byRole: log.byRole,
              at: log.at || new Date()
            });
            await sl.save();
            logIds.push(sl._id);
          }
        }

        // 3. Create OrderService document
        const serviceDoc = new OrderService({
          orderId: rawOrder._id,
          description: legacyItem.description || '',
          quantity: legacyItem.quantity || 1,
          unit: legacyItem.unit || 'pcs',
          unitPrice: legacyItem.unitPrice || 0,
          discount: legacyItem.discount || 0,
          gstRate: legacyItem.gstRate || 18,
          amount: legacyItem.amount,
          assignedDesigner: legacyItem.assignedDesigner,
          designerStatus: legacyItem.designerStatus || 'Pending',
          revisionCount: legacyItem.revisionCount || 0,
          deadline: legacyItem.deadline,
          priority: legacyItem.priority || 'Medium',
          designFiles: designIds,
          demoFiles: demoIds,
          approvalFiles: approvalIds,
          designRemarks: legacyItem.designRemarks || '',
          activityLogs: logIds,
          permissions: legacyItem.permissions || [],
          designFileUrl: legacyItem.designFileUrl,
          operationStatus: legacyItem.operationStatus || 'operation update pending',
          operationFileUrl: legacyItem.operationFileUrl,
          serviceStatus: legacyItem.serviceStatus || 'service update pending',
          serviceFileUrl: legacyItem.serviceFileUrl,
          dependsOnService: legacyItem.dependsOnService
        });

        await serviceDoc.save();
        serviceIds.push(serviceDoc._id);
      }

      // 4. Update the order document in database with the new array of service ids
      await ordersCollection.updateOne(
        { _id: rawOrder._id },
        { $set: { lineItems: serviceIds } }
      );

      console.log(`Successfully migrated Order ${rawOrder.orderNumber || rawOrder._id} with ${serviceIds.length} line items.`);
      migrationCount++;
    }

    console.log(`Migration completed successfully! Total migrated orders: ${migrationCount}`);
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

migrate();
