const mongoose = require('mongoose');
const CommunicationRegistry = require('../models/communicationRegistry.model');

const enterpriseDefaults = [
  { eventName: 'ORDER_CREATED', channels: ['WHATSAPP', 'EMAIL'], providerPriority: ['META'], priority: 'HIGH', description: 'Triggered when a new order is placed.' },
  { eventName: 'ORDER_APPROVED', channels: ['WHATSAPP'], providerPriority: ['META'], priority: 'HIGH', description: 'Triggered when an order is approved by management.' },
  { eventName: 'PAYMENT_RECEIVED', channels: ['WHATSAPP', 'EMAIL'], providerPriority: ['META'], priority: 'CRITICAL', description: 'Triggered when a payment is received.' },
  { eventName: 'PAYMENT_VERIFIED', channels: ['WHATSAPP'], providerPriority: ['META'], priority: 'HIGH', description: 'Triggered when finance verifies a payment.' },
  { eventName: 'DESIGN_APPROVED', channels: ['WHATSAPP'], providerPriority: ['META'], priority: 'MEDIUM', description: 'Triggered when client approves design.' },
  { eventName: 'PRODUCTION_STARTED', channels: ['WHATSAPP'], providerPriority: ['META'], priority: 'MEDIUM', description: 'Triggered when order enters production.' },
  { eventName: 'PRODUCTION_COMPLETED', channels: ['WHATSAPP'], providerPriority: ['META'], priority: 'HIGH', description: 'Triggered when production finishes.' },
  { eventName: 'SERVICE_STARTED', channels: ['WHATSAPP'], providerPriority: ['META'], priority: 'MEDIUM', description: 'Triggered when service team begins work.' },
  { eventName: 'SERVICE_COMPLETED', channels: ['WHATSAPP'], providerPriority: ['META'], priority: 'HIGH', description: 'Triggered when service completes.' },
  { eventName: 'LEAD_CREATED', channels: ['WHATSAPP'], providerPriority: ['META'], priority: 'LOW', description: 'Triggered when a lead is captured.' },
  { eventName: 'LEAD_ASSIGNED', channels: ['WHATSAPP'], providerPriority: ['META'], priority: 'MEDIUM', description: 'Triggered when a lead is assigned.' },
  { eventName: 'LEAD_IMPORTED', channels: ['WHATSAPP'], providerPriority: ['META'], priority: 'LOW', description: 'Triggered during bulk lead import.' },
  { eventName: 'CUSTOMER_CREATED', channels: ['WHATSAPP', 'EMAIL'], providerPriority: ['META'], priority: 'MEDIUM', description: 'Triggered when a new customer is onboarded.' }
];

async function seedRegistry() {
  console.log('[RegistrySeeder] Starting Enterprise Communication Registry Seed...');
  if (mongoose.connection.readyState !== 1) {
    console.warn('[RegistrySeeder] MongoDB not connected, skipping seed.');
    return;
  }
  
  try {
    for (const rule of enterpriseDefaults) {
      const existing = await CommunicationRegistry.findOne({ eventName: rule.eventName, isActive: true });
      if (!existing) {
        await CommunicationRegistry.create(rule);
        console.log(`[RegistrySeeder] Seeded rule: ${rule.eventName}`);
      } else {
        console.log(`[RegistrySeeder] Rule ${rule.eventName} already exists.`);
      }
    }
    console.log('[RegistrySeeder] Seed completed successfully.');
  } catch (error) {
    console.error('[RegistrySeeder] Error seeding registry:', error.message);
  }
}

module.exports = { seedRegistry };
