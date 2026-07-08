/**
 * domainEvents.js
 * Central registry of standard domain events emitted by business modules across GMS CRM.
 */

module.exports = {
  ORDER_CREATED:         'ORDER_CREATED',
  ORDER_APPROVED:        'ORDER_APPROVED',
  ORDER_COMPLETED:       'ORDER_COMPLETED',
  ORDER_CANCELLED:       'ORDER_CANCELLED',
  DELIVERY_DATE_UPDATED: 'DELIVERY_DATE_UPDATED',
  PAYMENT_RECEIVED:      'PAYMENT_RECEIVED',
  PAYMENT_VERIFIED:      'PAYMENT_VERIFIED',
  PAYMENT_FAILED:        'PAYMENT_FAILED'
};
