const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/gms');
    console.log('Connected to DB');
    
    // Import User and Leave
    const User = require('./src/domains/users/user.model');
    const Leave = require('./src/domains/hr/leave.model');
    
    // Get a user
    const user = await User.findOne({ status: 'ACTIVE' });
    if (!user) throw new Error('No user');
    
    console.log('Creating leave...');
    const leave = await Leave.create({
      employee: user._id,
      leaveType: 'SICK',
      fromDate: new Date('2026-06-10'),
      toDate: new Date('2026-06-12'),
      reason: 'Testing direct create',
      leaveBalanceAtRequest: 10
    });
    console.log('Leave created successfully:', leave._id);
    
    process.exit(0);
  } catch (err) {
    console.error('ERROR OCCURRED:');
    console.error(err);
    process.exit(1);
  }
})();
