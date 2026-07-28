const mongoose = require('mongoose');
const Lead = require('./src/domains/telecrm/models/lead.model');
require('./src/domains/users/user.model'); // Require User model so it is registered!

async function test() {
  try {
    await mongoose.connect('mongodb://localhost:27017/gms');
    
    // Check populated
    const popLeads = await Lead.find({ assignedEmployee: { $ne: null } })
      .populate('assignedEmployee', 'name email')
      .limit(1)
      .lean();
      
    console.log(JSON.stringify(popLeads, null, 2));
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

test();
