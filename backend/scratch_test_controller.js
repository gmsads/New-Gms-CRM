require('dotenv').config({ path: '.env.development' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = require('./src/domains/users/user.model');
  const Order = require('./src/domains/orders/order.model');
  const designController = require('./src/api/controllers/design.controller');
  
  const pramod = await User.findOne({name: 'Pramod'}).lean();
  const rafi = await User.findOne({name: 'Rafi'}).lean();
  
  const testController = async (user) => {
    let responseData = null;
    const req = { query: {}, user: user };
    const res = {
      json: (data) => { responseData = data; },
      status: (code) => ({ json: (data) => { responseData = data; } })
    };
    
    await designController.getServices(req, res);
    return responseData;
  };

  const pRes = await testController(pramod);
  const rRes = await testController(rafi);
  
  console.log('Pramod:', JSON.stringify(pRes, null, 2));
  console.log('Rafi:', JSON.stringify(rRes, null, 2));
  
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
