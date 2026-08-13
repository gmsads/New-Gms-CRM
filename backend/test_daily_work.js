require('dotenv').config({ path: 'C:/Users/prade/Desktop/gms/backend/.env' });
const mongoose = require('mongoose');
const { getEnterpriseDailyWork } = require('C:/Users/prade/Desktop/gms/backend/src/api/services/dailyWork.service');

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gms_crm');
  
  const dates = ['2026-08-13', '2026-08-12', '2026-08-10'];
  
  for (const date of dates) {
    console.log(`\n--- Testing Date: ${date} ---`);
    const start = Date.now();
    try {
      const data = await getEnterpriseDailyWork(date);
      const time = Date.now() - start;
      console.log(`Response Time: ${time}ms`);
      console.log(`Departments: ${data.departments.length}`);
      console.log(`Total Employees: ${data.summary.totalEmployees}`);
      console.log(`Employees with Activity: ${data.summary.employeesWithActivity}`);
      console.log(`Completed Work: ${data.summary.completedWork}`);
      console.log(`In Progress Work: ${data.summary.inProgressWork}`);
    } catch (e) {
      console.error(`Error for ${date}:`, e.message);
    }
  }
  
  mongoose.disconnect();
}

test();
