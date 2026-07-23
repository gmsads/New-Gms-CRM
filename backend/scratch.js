require('dotenv').config();
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/gms');
  console.log("Connected to MongoDB.");

  const User = require('./src/domains/users/user.model');
  const Lead = require('./src/domains/telecrm/models/lead.model');

  const sirisha = await User.findOne({ email: 'sirisha@example.com' }) || await User.findOne({ username: 'EMP-0018' });
  if (!sirisha) {
    console.log("Could not find Sirisha.");
    process.exit(1);
  }

  console.log(`Found user: ${sirisha.name} (${sirisha._id})`);

  const matchUser = { $in: [sirisha._id] };

  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const prevPending = await Lead.countDocuments({
    assignedEmployee: matchUser,
    assignedDate: { $lt: start },
    $or: [
      { currentStatus: { $nin: ['Converted', 'Lost', 'Not Interested'] } },
      { updatedAt: { $gte: start, $lte: end } }
    ],
    isDeleted: { $ne: true }
  });

  const assignedLeads = await Lead.countDocuments({ assignedEmployee: matchUser, $expr: { $ne: ['$assignedEmployee', '$createdBy'] }, isDeleted: { $ne: true }, assignedDate: { $gte: start, $lte: end } });
  
  const allAssigned = await Lead.countDocuments({ assignedEmployee: matchUser });

  console.log(`Previous Pending Leads for today: ${prevPending}`);
  console.log(`Assigned Leads (today): ${assignedLeads}`);
  console.log(`Total Leads ever assigned: ${allAssigned}`);

  process.exit(0);
}

test();
