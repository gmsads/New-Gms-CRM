const mongoose = require('mongoose');
const User = require('./src/domains/users/user.model');
require('dotenv').config({ path: '.env.development' });

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gms_crm');
  let user = await User.findOne();
  if (!user) {
    user = await User.create({ name: 'Test User', email: 'test1@example.com', phone: '0000000001', password: 'password' });
  }
  
  const req = {
    body: { name: 'Updated Name', phone: '1111111112' }
  };
  
  const allowedUpdates = ['name', 'phone', 'department'];
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined && req.body[field] !== user[field]) {
      console.log(`Updating ${field} from ${user[field]} to ${req.body[field]}`);
      user[field] = req.body[field];
    }
  });
  
  await user.save();
  const updatedUser = await User.findById(user._id);
  console.log('Saved user name:', updatedUser.name);
  console.log('Saved user phone:', updatedUser.phone);
  process.exit(0);
}
test().catch(console.error);
