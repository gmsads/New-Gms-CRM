/**
 * templateMapper.service.js
 * Automatically maps business entities (Orders, Payments) to approved Meta message template variables.
 */

class TemplateMapperService {
  /**
   * Maps domain event payload to template name, version, category, and variable array.
   * @param {string} eventName 
   * @param {Object} payload 
   * @param {string} [language='en_US'] 
   * @returns {{ templateName: string, templateVersion: string, category: string, priority: string, variables: Array<string>, title: string, summary: string }}
   */
  map(eventName, payload = {}, language = 'en_US') {
    const customerName = payload?.clientSnapshot?.name || payload?.client?.name || payload?.prospect?.name || 'Valued Client';

    if (eventName === 'ORDER_CREATED') {
      const orderNumber = payload.orderNumber || payload._id || 'N/A';
      const grandTotal = payload.grandTotal ? `₹${Number(payload.grandTotal).toLocaleString('en-IN')}` : '₹0';
      
      // Summarize requirements / line items
      let summaryText = 'Custom CRM Service/Product Order';
      if (Array.isArray(payload.lineItems) && payload.lineItems.length > 0) {
        const itemNames = payload.lineItems.map(li => li.description || li.productName || 'Item').slice(0, 3);
        summaryText = itemNames.join(', ') + (payload.lineItems.length > 3 ? ` (+${payload.lineItems.length - 3} more)` : '');
      }

      // Delivery date formatting
      let deliveryText = payload.deliveryTimeline || 'Standard Timeline';
      if (payload.deliveryDate) {
        deliveryText = new Date(payload.deliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }

      return {
        templateName: 'order_created_confirmation',
        templateVersion: 'v1.0',
        category: 'UTILITY',
        priority: 'MEDIUM',
        variables: [
          customerName,   // {{1}} Customer Name
          orderNumber,    // {{2}} Order Number
          summaryText,    // {{3}} Order Requirements Summary
          grandTotal,     // {{4}} Total Price
          deliveryText    // {{5}} Delivery Date
        ],
        title: `Order Confirmed: #${orderNumber}`,
        summary: `Order #${orderNumber} created with total amount ${grandTotal}. Expected delivery: ${deliveryText}.`
      };
    }

    if (eventName === 'PAYMENT_VERIFIED' || eventName === 'PAYMENT_RECEIVED') {
      const order = payload.order || {};
      const orderNumber = order.orderNumber || payload.orderId || 'N/A';
      const paidAmount = payload.amount ? `₹${Number(payload.amount).toLocaleString('en-IN')}` : '₹0';
      const grandTotal = order.grandTotal ? `₹${Number(order.grandTotal).toLocaleString('en-IN')}` : '₹0';
      
      // Calculate total paid and balance
      let totalPaidNum = 0;
      if (Array.isArray(order.paymentRecords)) {
        totalPaidNum = order.paymentRecords
          .filter(p => p.status === 'Verified')
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      } else if (order.totalPaid) {
        totalPaidNum = Number(order.totalPaid);
      } else {
        totalPaidNum = Number(payload.amount) || 0;
      }
      const totalPaidStr = `₹${totalPaidNum.toLocaleString('en-IN')}`;
      const balanceNum = Math.max(0, (Number(order.grandTotal) || 0) - totalPaidNum);
      const balanceStr = `₹${balanceNum.toLocaleString('en-IN')}`;

      let summaryText = 'Order Installment / Advance Payment';
      if (Array.isArray(order.lineItems) && order.lineItems.length > 0) {
        summaryText = order.lineItems.map(li => li.description || 'Item').slice(0, 2).join(', ');
      }

      return {
        templateName: 'order_payment_received',
        templateVersion: 'v1.0',
        category: 'UTILITY',
        priority: 'HIGH',
        variables: [
          customerName,   // {{1}} Customer Name
          paidAmount,     // {{2}} Paid Amount
          orderNumber,    // {{3}} Order Number
          summaryText,    // {{4}} Requirements Summary
          grandTotal,     // {{5}} Grand Total
          totalPaidStr,   // {{6}} Total Paid So Far
          balanceStr      // {{7}} Remaining Balance
        ],
        title: `Payment Received: ${paidAmount}`,
        summary: `Received payment of ${paidAmount} for Order #${orderNumber}. Remaining balance: ${balanceStr}.`
      };
    }

    if (eventName === 'DELIVERY_DATE_UPDATED') {
      const orderNumber = payload.orderNumber || payload._id || 'N/A';
      
      const formatOrStr = (val) => {
        if (!val) return 'Standard Timeline';
        const d = new Date(val);
        return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      };

      const oldDate = formatOrStr(payload.oldDeliveryDate || payload.oldTimeline);
      const newDate = formatOrStr(payload.newDeliveryDate || payload.newTimeline || payload.deliveryDate);
      const notes = payload.reason || payload.notes || 'Revised per production schedule optimization.';

      return {
        templateName: 'order_delivery_date_updated',
        templateVersion: 'v1.0',
        category: 'UTILITY',
        priority: 'HIGH',
        variables: [
          customerName,   // {{1}} Customer Name
          orderNumber,    // {{2}} Order Number
          oldDate,        // {{3}} Previous Date
          newDate,        // {{4}} New Date
          notes           // {{5}} Reason / Notes
        ],
        title: `Delivery Date Updated: #${orderNumber}`,
        summary: `Delivery schedule revised for Order #${orderNumber} from ${oldDate} to ${newDate}.`
      };
    }

    throw new Error(`Event "${eventName}" does not have a mapped WhatsApp template configuration.`);
  }
}

module.exports = new TemplateMapperService();
