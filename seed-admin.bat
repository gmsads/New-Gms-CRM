@echo off
title GMS - Create First Admin User
color 0A
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║   GMS CRM - Seeding Admin User             ║
echo  ╚══════════════════════════════════════════════╝
echo.
cd /d c:\Users\prade\Desktop\gms\backend

echo Connecting to MongoDB Atlas...
echo.

node -e "
require('dotenv').config({ path: '.env.development' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to Atlas!');
    const User = require('./src/domains/users/user.model');
    
    // Check if any admin exists
    const existing = await User.findOne({ role: 'ADMIN' });
    if (existing) {
      console.log('');
      console.log('  Admin already exists!');
      console.log('  Employee ID : ' + existing.username);
      console.log('  Password    : GMS@1234  (if not changed)');
      console.log('  Email       : ' + existing.email);
      console.log('');
      process.exit(0);
    }
    
    // Create admin
    const admin = new User({
      name: 'Admin User',
      email: 'admin@gms.com',
      phone: '9999999999',
      role: 'ADMIN',
      department: 'Management',
      status: 'ACTIVE',
      password: 'GMS@1234',
      mustChangePassword: false,
    });
    await admin.save();
    
    console.log('');
    console.log('  ✅ Admin created successfully!');
    console.log('  Employee ID : ' + admin.username);
    console.log('  Password    : GMS@1234');
    console.log('  Email       : admin@gms.com');
    console.log('');
    console.log('  Login at: http://localhost:5173');
    console.log('');
    process.exit(0);
  })
  .catch(e => {
    console.error('ERROR: ' + e.message);
    console.log('Make sure the backend is running first!');
    process.exit(1);
  });
"

echo.
pause
