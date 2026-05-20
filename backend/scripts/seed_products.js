const mongoose = require('mongoose');
const Product = require('../src/domains/sales/products/product.model');
require('dotenv').config();

const products = [
  {
    name: 'LED Display Board',
    sku: 'LED-001',
    category: 'Sign Boards',
    unit: 'Sqft',
    pricing: {
      retail: 5000,
      agent: 4200,
      corporate: 4500,
      renewal: 4800,
      corporateRenewal: 4300,
      agentRenewal: 4000
    },
    minPrice: 3800
  },
  {
    name: 'Flex Banner Print',
    sku: 'FLX-001',
    category: 'Printing',
    unit: 'Sqft',
    pricing: {
      retail: 150,
      agent: 110,
      corporate: 130,
      renewal: 140,
      corporateRenewal: 125,
      agentRenewal: 105
    },
    minPrice: 95
  },
  {
    name: 'ACP 3D Letter Board',
    sku: 'ACP-001',
    category: 'Sign Boards',
    unit: 'Sqft',
    pricing: {
      retail: 1200,
      agent: 950,
      corporate: 1100,
      renewal: 1150,
      corporateRenewal: 1050,
      agentRenewal: 900
    },
    minPrice: 850
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gms-crm');
    console.log('Connected to DB');
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log('Products seeded!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
