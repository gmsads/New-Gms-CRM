const path = require('path');
require('../node_modules/dotenv').config({ path: path.join(__dirname, '../.env.development') });
const mongoose = require('../node_modules/mongoose');

const testSchema = new mongoose.Schema({
  name: String,
  lineItems: [{ type: mongoose.Schema.Types.Mixed, ref: 'OrderService' }],
  grandTotal: Number
});

testSchema.pre('save', async function() {
  const OrderService = mongoose.model('OrderService');
  
  // 1. Save line items
  for (let i = 0; i < this.lineItems.length; i++) {
    let item = this.lineItems[i];
    if (item && typeof item === 'object' && !(item instanceof mongoose.Types.ObjectId)) {
      if (!item.save) {
        const serviceDoc = new OrderService({ ...item, orderId: this._id });
        await serviceDoc.save();
        this.lineItems[i] = serviceDoc;
      } else {
        await item.save();
      }
    }
  }

  // 2. Perform calculations
  let total = 0;
  this.lineItems.forEach(item => {
    if (item && typeof item === 'object') {
      total += item.price || 0;
    }
  });
  this.grandTotal = total;

  // 3. Map to ObjectIds just before saving
  this.lineItems = this.lineItems.map(item => (item && item._id) ? item._id : item);
});

testSchema.post('save', async function(doc, next) {
  await doc.populate('lineItems');
  next();
});

const OrderServiceSchema = new mongoose.Schema({
  orderId: mongoose.Schema.Types.ObjectId,
  description: String,
  price: Number
});

const OrderService = mongoose.models.OrderService || mongoose.model('OrderService', OrderServiceSchema);
const TestOrder = mongoose.models.TestOrder || mongoose.model('TestOrder', testSchema);

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to Atlas DB');

  try {
    await TestOrder.deleteMany({});
    await OrderService.deleteMany({});

    const o = new TestOrder({
      name: 'Test',
      lineItems: [
        { description: 'Item 1', price: 1500 }
      ]
    });

    await o.save();
    console.log('Saved order populated post-save:', o);

    // Retrieve order from DB to verify raw values stored
    const raw = await mongoose.connection.db.collection('testorders').findOne({ _id: o._id });
    console.log('Raw database document:', raw);

    // Retrieve order populated
    const retrieved = await TestOrder.findOne({ _id: o._id }).populate('lineItems');
    console.log('Retrieved populated order:', retrieved);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
