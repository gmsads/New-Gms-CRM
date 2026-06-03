const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/gms');
    console.log('Connected to DB');
    const User = require('./src/domains/users/user.model');
    const user = await User.findOne({ status: 'ACTIVE' });
    if (!user) {
      console.log('No active user found');
      process.exit(1);
    }
    
    console.log(`Using user: ${user.name} (${user.role})`);
    const token = jwt.sign({ id: user._id, role: user.role }, 'fallback_secret', { expiresIn: '1d' });
    
    console.log('Making request with token...');
    const res = await fetch('http://localhost:5000/api/leaves', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        leaveType: 'SICK',
        fromDate: '2026-06-10',
        toDate: '2026-06-12',
        reason: 'Testing the leave endpoint'
      })
    });
    
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${text}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
