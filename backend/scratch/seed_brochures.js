const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('../src/domains/sales/brochures/category.model');

const categories = [
  { name: 'Sign Boards', description: 'Premium outdoor and indoor signage solutions' },
  { name: 'Flex Printing', description: 'High-quality large format printing' },
  { name: 'LED Boards', description: 'Energy-efficient illuminated boards' },
  { name: 'Digital Marketing', description: 'Social media and SEO service packages' },
  { name: 'Branding Services', description: 'Complete brand identity and design' },
  { name: 'Vehicle Advertising', description: 'Wrapping and mobile branding' }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gms_crm');
    console.log('Connected to MongoDB');
    
    await Category.deleteMany({});
    await Category.insertMany(categories);
    
    console.log('Successfully seeded Brochure Categories');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding:', err);
    process.exit(1);
  }
}

seed();
