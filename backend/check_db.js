const mongoose = require('mongoose');

async function check() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/gms');
    const db = mongoose.connection.db;
    
    const sirisha = await db.collection('users').findOne({ role: { $in: ['SALES_EXEC', 'SR_SALES_EXEC', 'FIELD_EXEC'] }, name: /Sirisha/i });
    if (!sirisha) {
      console.log("Sirisha not found in DB.");
      process.exit(0);
    }
    console.log(`Found Sirisha: ${sirisha._id} (Role: ${sirisha.role})`);
    
    const leads = await db.collection('leads').find({ assignedEmployee: sirisha._id }).toArray();
    console.log(`\nTotal Leads assigned to Sirisha: ${leads.length}`);
    
    if (leads.length > 0) {
      console.log("\nSample Lead Data:");
      const l = leads[0];
      console.log(`- ID: ${l._id}`);
      console.log(`- Created At: ${l.createdAt}`);
      console.log(`- Assigned Date: ${l.assignedDate}`);
      console.log(`- Current Status: ${l.currentStatus}`);
      console.log(`- Is Deleted: ${l.isDeleted}`);
      
      const now = new Date();
      const start = new Date(now);
      start.setHours(0,0,0,0);
      const end = new Date(now);
      end.setHours(23,59,59,999);
      
      console.log(`\nToday boundaries: ${start.toISOString()} to ${end.toISOString()}`);
      
      let prevPending = 0;
      let assignedToday = 0;
      
      for (let lead of leads) {
        if (!lead.isDeleted) {
          if (lead.assignedDate >= start && lead.assignedDate <= end) {
            assignedToday++;
          }
          if (lead.assignedDate < start) {
            if (['Converted', 'Lost', 'Not Interested'].indexOf(lead.currentStatus) === -1 || (lead.updatedAt >= start && lead.updatedAt <= end)) {
              prevPending++;
            }
          }
        }
      }
      
      console.log(`\nSimulation based on fix:`);
      console.log(`- Assigned Today: ${assignedToday}`);
      console.log(`- Previous Pending: ${prevPending}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
