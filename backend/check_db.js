require('dotenv').config({ path: 'c:/Users/prade/Desktop/gms/backend/.env' });
const mongoose = require('mongoose');

async function check() {
  try {
    console.log("Connecting to:", process.env.MONGO_URI.split('@')[1] || process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    const anusha = await db.collection('users').findOne({ name: /Anusha/i });
    if (!anusha) {
      console.log("Anusha not found in DB.");
    } else {
      console.log(`Found Anusha: ${anusha._id} (Role: ${anusha.role})`);
      const leads = await db.collection('leads').find({ assignedEmployee: anusha._id }).toArray();
      console.log(`Total Leads assigned to Anusha: ${leads.length}`);
    }
    
    const sirisha = await db.collection('users').findOne({ name: /Sirisha/i });
    if (!sirisha) {
      console.log("Sirisha not found in DB.");
    } else {
      console.log(`Found Sirisha: ${sirisha._id} (Role: ${sirisha.role})`);
      const leads = await db.collection('leads').find({ assignedEmployee: sirisha._id }).toArray();
      console.log(`Total Leads assigned to Sirisha: ${leads.length}`);
    }
    
    // Check general assignments
    const allAssigned = await db.collection('leads').aggregate([
      { $match: { assignedEmployee: { $ne: null } } },
      { $group: { _id: "$assignedEmployee", count: { $sum: 1 } } }
    ]).toArray();
    
    console.log("\nAssigned Leads by Employee ID:");
    console.log(allAssigned);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
