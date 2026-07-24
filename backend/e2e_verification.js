const mongoose = require('mongoose');
const customerMatchingService = require('c:/Users/prade/Desktop/gms/backend/src/services/customerMatching.service');
const LeadServiceClass = require('c:/Users/prade/Desktop/gms/backend/src/domains/telecrm/services/lead.service');
const Order = require('c:/Users/prade/Desktop/gms/backend/src/domains/orders/order.model');
const Prospect = require('c:/Users/prade/Desktop/gms/backend/src/domains/sales/prospects/prospect.model');
const Client = require('c:/Users/prade/Desktop/gms/backend/src/domains/sales/client.model');
const Lead = require('c:/Users/prade/Desktop/gms/backend/src/domains/telecrm/models/lead.model');

async function runVerification() {
  console.log("Starting End-to-End Backend Verification...\n");
  
  // 1. Database Connection (mock or actual)
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gms_crm_test');
  console.log("✅ Connected to Database");

  // Clean DB for tests
  await Prospect.deleteMany({});
  await Client.deleteMany({});
  await Lead.deleteMany({});
  await Order.deleteMany({});

  const actorId = new mongoose.Types.ObjectId();

  console.log("\n--- Testing Customer Management ---");
  // Test 1: Ensure Unique Customer creates a new Prospect
  const newCustomerData = {
    name: 'John Doe',
    phone: '9876543210',
    email: 'john@example.com',
    company: 'Doe Enterprises',
    gstin: '27AABCU9603R1Z1'
  };
  
  const match1 = await customerMatchingService.ensureUniqueCustomer(newCustomerData, actorId);
  console.log(`Test 1 (New Customer): isNew=${match1.isNew}, reason=${match1.reason}`);
  if (match1.isNew && match1.prospect) {
    console.log("✅ New Prospect auto-created successfully.");
  } else {
    console.error("❌ Failed to create new prospect.");
  }

  // Test 2: Ensure Unique Customer matches existing Prospect via Mobile
  const existingCustomerData = {
    name: 'John Doe Jr.',
    phone: '9876543210',
    company: 'Doe Enterprises'
  };
  
  const match2 = await customerMatchingService.ensureUniqueCustomer(existingCustomerData, actorId);
  console.log(`Test 2 (Existing Customer via Phone): isNew=${match2.isNew}, reason=${match2.reason}`);
  if (!match2.isNew && match2.prospect._id.equals(match1.prospect._id)) {
    console.log("✅ Existing Prospect linked successfully. No duplicate created.");
  } else {
    console.error("❌ Failed to link existing prospect.");
  }
  
  // Test 3: Ensure Unique Customer matches existing via GST
  const existingCustomerData2 = {
    name: 'Johnny Doe',
    phone: '9999999999',
    gstin: '27AABCU9603R1Z1'
  };
  
  const match3 = await customerMatchingService.ensureUniqueCustomer(existingCustomerData2, actorId);
  console.log(`Test 3 (Existing Customer via GST): isNew=${match3.isNew}, reason=${match3.reason}`);
  if (!match3.isNew && match3.prospect._id.equals(match1.prospect._id)) {
    console.log("✅ Existing Prospect linked successfully via GST.");
  } else {
    console.error("❌ Failed to link existing prospect via GST.");
  }

  console.log("\n--- Testing TeleCRM Conversions ---");
  // Create a lead
  const leadService = new LeadServiceClass();
  // Mock generateLeadNumber since it uses the model
  leadService.generateLeadNumber = async () => 'LD-9999';
  const lead = await leadService.createLead({
    contactPerson: 'Jane Smith',
    phone: '8888888888',
    email: 'jane@example.com',
    companyName: 'Smith Co'
  }, { _id: actorId, name: 'Agent Smith' });
  console.log(`Lead Created: ${lead.leadNumber} (${lead.phone})`);
  
  // Convert to prospect
  const conversionResult = await leadService.convertToProspect(lead._id, { _id: actorId, name: 'Agent Smith' });
  if (conversionResult.success) {
    console.log("✅ TeleCRM Convert to Prospect works.");
    console.log(`Linked to Prospect ID: ${conversionResult.prospect._id}`);
  } else {
    console.error("❌ Convert to Prospect failed.");
  }

  console.log("\nAll Backend Tests Completed.");
  process.exit(0);
}

runVerification().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
