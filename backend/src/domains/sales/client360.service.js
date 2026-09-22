const mongoose = require('mongoose');
const Client = require('../sales/client.model');
const Prospect = require('../sales/prospects/prospect.model');
const Followup = require('../sales/followups/followup.model');
const Appointment = require('../sales/appointments/appointment.model');
const Order = require('../orders/order.model');
const Payment = require('../payments/payment.model');
const { normalizePhone, normalizeCompanyName } = require('../../utils/normalization');

class Client360Service {
  
  /**
   * Internal helper to find all relevant businesses for a given normalized phone number.
   * Disambiguates by normalized company name if provided.
   */
  async resolveBusinesses(phone, companyFilter = null) {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) throw new Error('Invalid or missing phone number');

    // Extract the core 10 digits for a highly permissive regex search
    // This allows matching '+91 9876543210', '9876543210', '919876543210' etc.
    const coreDigits = normalizedPhone.length >= 10 ? normalizedPhone.slice(-10) : normalizedPhone;
    const phoneRegex = new RegExp(coreDigits);

    const businessMap = new Map(); // normalizedName -> { profile, type }

    const addBusiness = (companyName, record, type) => {
      const normName = normalizeCompanyName(companyName) || 'unknown business';
      if (!businessMap.has(normName)) {
        businessMap.set(normName, { profile: record, type });
      }
    };

    // 1. Check Clients
    const clients = await Client.find({ phone: phoneRegex }).lean();
    clients.forEach(c => addBusiness(c.company || c.name, c, 'Client'));

    // 2. Check Prospects
    const prospects = await Prospect.find({ phone: phoneRegex }).lean();
    prospects.forEach(p => addBusiness(p.company || p.name, p, 'Prospect'));

    // 3. Check Orders (Direct Orders might have no prospect/client)
    const orders = await Order.find({ 'clientSnapshot.phone': phoneRegex }).lean();
    orders.forEach(o => addBusiness(o.clientSnapshot?.company || o.clientSnapshot?.name, o.clientSnapshot, 'DirectOrder'));

    // 4. Check Payments (Orphaned payments or direct payments)
    const payments = await Payment.find({ 'clientSnapshot.phone': phoneRegex }).lean();
    payments.forEach(p => addBusiness(p.clientSnapshot?.company || p.clientSnapshot?.name, p.clientSnapshot, 'DirectPayment'));

    let businesses = Array.from(businessMap.values());

    // If a specific company is requested, filter down to it
    if (companyFilter) {
      const normTarget = normalizeCompanyName(companyFilter);
      businesses = businesses.filter(b => normalizeCompanyName(b.profile.company || b.profile.name) === normTarget);
    }

    return businesses;
  }

  /**
   * Helper to fetch Orders based on phone and optional company name
   */
  async getOrdersByPhoneAndCompany(phone, companyFilter) {
    const normalizedPhone = normalizePhone(phone);
    const normTarget = normalizeCompanyName(companyFilter);
    
    // In MongoDB, we might have multiple formats. We'll search for the phone.
    const coreDigits = normalizedPhone.length >= 10 ? normalizedPhone.slice(-10) : normalizedPhone;
    const phoneRegex = new RegExp(coreDigits);
    
    // We must find orders linked to this phone.
    // They can be linked via:
    // 1. clientSnapshot.phone (Directly on order)
    // 2. client.phone (via populate)
    // 3. prospect.phone (via populate)
    // For performance, we first find matching Clients and Prospects.
    
    const clientIds = (await Client.find({ phone: phoneRegex }, '_id')).map(c => c._id);
    const prospectIds = (await Prospect.find({ phone: phoneRegex }, '_id')).map(p => p._id);
    
    const orders = await Order.find({
      $or: [
        { 'clientSnapshot.phone': phoneRegex },
        { client: { $in: clientIds } },
        { prospect: { $in: prospectIds } }
      ],
      isDeleted: { $ne: true }
    })
    .populate('client')
    .populate('prospect')
    .lean();

    // Filter by company name if required
    if (normTarget) {
      return orders.filter(o => {
        const company = o.clientSnapshot?.company || o.clientSnapshot?.name || o.client?.company || o.prospect?.company;
        return normalizeCompanyName(company) === normTarget;
      });
    }

    return orders;
  }

  /**
   * Get the unified ledger/financial summary for a mobile number
   */
  async getLedgerSummaryByMobile(phone, companyFilter = null) {
    const businesses = await this.resolveBusinesses(phone);

    if (!companyFilter && businesses.length > 1) {
      return {
        requiresBusinessSelection: true,
        businesses: businesses.map(b => ({
          company: b.profile.company || b.profile.name,
          type: b.type
        }))
      };
    }

    const targetBusiness = companyFilter 
      ? businesses.find(b => normalizeCompanyName(b.profile.company || b.profile.name) === normalizeCompanyName(companyFilter))
      : businesses[0];

    if (!targetBusiness) {
      const err = new Error('No matching business found for this mobile number.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const activeCompanyFilter = companyFilter || (targetBusiness.profile.company || targetBusiness.profile.name);

    // 1. Get all orders for this specific business
    const orders = await this.getOrdersByPhoneAndCompany(phone, activeCompanyFilter);
    const orderIds = orders.map(o => o._id);
    
    // 2. Get payments for these specific orders
    const payments = await Payment.find({ order: { $in: orderIds }, isDeleted: { $ne: true } }).lean();

    let totalOrderValue = 0;
    const totalOrders = orders.length;

    orders.forEach(o => {
      totalOrderValue += (o.totalAmount || o.grandTotal || 0);
    });

    let totalPaid = 0;
    payments.forEach(p => {
      if (['Completed', 'Approved', 'Success'].includes(p.status)) {
        totalPaid += (p.amount || 0);
      }
    });

    const outstanding = totalOrderValue - totalPaid;

    return {
      requiresBusinessSelection: false,
      client: targetBusiness.profile, // Can be a Client, Prospect, or just a Snapshot
      clientType: targetBusiness.type,
      summary: {
        totalOrders,
        totalOrderValue,
        totalPaid,
        totalPending: outstanding > 0 ? outstanding : 0,
        outstanding
      }
    };
  }

  async getProspectsByMobile(phone, companyFilter, query = {}) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const normalizedPhone = normalizePhone(phone);
    const coreDigits = normalizedPhone.length >= 10 ? normalizedPhone.slice(-10) : normalizedPhone;
    const phoneRegex = new RegExp(coreDigits);
    
    let filter = { phone: phoneRegex, isDeleted: { $ne: true } };
    
    const allProspects = await Prospect.find(filter).populate('assignedTo', 'name email').sort({ createdDate: -1 }).lean();
    
    let filtered = allProspects;
    if (companyFilter) {
      const normTarget = normalizeCompanyName(companyFilter);
      filtered = allProspects.filter(p => normalizeCompanyName(p.company || p.name) === normTarget);
    }

    const data = filtered.slice(skip, skip + parseInt(limit));
    return { data, total: filtered.length, page: parseInt(page), limit: parseInt(limit) };
  }

  async getFollowupsByMobile(phone, companyFilter, query = {}) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const normalizedPhone = normalizePhone(phone);
    const coreDigits = normalizedPhone.length >= 10 ? normalizedPhone.slice(-10) : normalizedPhone;
    const phoneRegex = new RegExp(coreDigits);

    const clientIds = (await Client.find({ phone: phoneRegex }, '_id')).map(c => c._id);
    const prospectIds = (await Prospect.find({ phone: phoneRegex }, '_id')).map(p => p._id);
    
    const followups = await Followup.find({
      $or: [ { client: { $in: clientIds } }, { prospect: { $in: prospectIds } } ],
      isDeleted: { $ne: true }
    })
    .populate('client')
    .populate('prospect')
    .populate('createdBy', 'name')
    .sort({ date: -1 })
    .lean();

    let filtered = followups;
    if (companyFilter) {
      const normTarget = normalizeCompanyName(companyFilter);
      filtered = followups.filter(f => {
        const company = f.client?.company || f.client?.name || f.prospect?.company || f.prospect?.name;
        return normalizeCompanyName(company) === normTarget;
      });
    }

    const data = filtered.slice(skip, skip + parseInt(limit));
    return { data, total: filtered.length, page: parseInt(page), limit: parseInt(limit) };
  }

  async getAppointmentsByMobile(phone, companyFilter, query = {}) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const normalizedPhone = normalizePhone(phone);
    const coreDigits = normalizedPhone.length >= 10 ? normalizedPhone.slice(-10) : normalizedPhone;
    const phoneRegex = new RegExp(coreDigits);

    const prospectIds = (await Prospect.find({ phone: phoneRegex }, '_id')).map(p => p._id);
    
    const appointments = await Appointment.find({
      prospect: { $in: prospectIds },
      isDeleted: { $ne: true }
    })
    .populate('prospect')
    .populate('createdBy assignedTo', 'name')
    .sort({ date: -1 })
    .lean();

    let filtered = appointments;
    if (companyFilter) {
      const normTarget = normalizeCompanyName(companyFilter);
      filtered = appointments.filter(a => normalizeCompanyName(a.prospect?.company || a.prospect?.name) === normTarget);
    }

    const data = filtered.slice(skip, skip + parseInt(limit));
    return { data, total: filtered.length, page: parseInt(page), limit: parseInt(limit) };
  }

  async getOrdersByMobile(phone, companyFilter, query = {}) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const orders = await this.getOrdersByPhoneAndCompany(phone, companyFilter);
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Manually fetch populates since we used getOrdersByPhoneAndCompany
    // which didn't populate createdBy or salesExecutive
    const OrderModel = mongoose.model('Order');
    await OrderModel.populate(orders, { path: 'createdBy salesExecutive', select: 'name' });

    const data = orders.slice(skip, skip + parseInt(limit));
    return { data, total: orders.length, page: parseInt(page), limit: parseInt(limit) };
  }

  async getPaymentsByMobile(phone, companyFilter, query = {}) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const orders = await this.getOrdersByPhoneAndCompany(phone, companyFilter);
    const orderIds = orders.map(o => o._id);

    const payments = await Payment.find({ order: { $in: orderIds }, isDeleted: { $ne: true } })
      .populate('createdBy verifiedBy', 'name')
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean();

    const data = payments.slice(skip, skip + parseInt(limit));
    return { data, total: payments.length, page: parseInt(page), limit: parseInt(limit) };
  }

  async getTimelineByMobile(phone, companyFilter, query = {}) {
    const { page = 1, limit = 20 } = query;
    
    const prospectsPage = await this.getProspectsByMobile(phone, companyFilter, { page: 1, limit: 1000 });
    const followupsPage = await this.getFollowupsByMobile(phone, companyFilter, { page: 1, limit: 1000 });
    const appointmentsPage = await this.getAppointmentsByMobile(phone, companyFilter, { page: 1, limit: 1000 });
    const ordersPage = await this.getOrdersByMobile(phone, companyFilter, { page: 1, limit: 1000 });
    const paymentsPage = await this.getPaymentsByMobile(phone, companyFilter, { page: 1, limit: 1000 });

    let timelineEvents = [];

    prospectsPage.data.forEach(p => timelineEvents.push({
      _id: p._id, type: 'PROSPECT_CREATED', date: p.createdDate || p.createdAt,
      title: 'Prospect Created', description: `Source: ${p.source} | Stage: ${p.stage}`, user: p.createdBy?.name || 'System'
    }));

    followupsPage.data.forEach(f => timelineEvents.push({
      _id: f._id, type: 'FOLLOWUP', date: f.date || f.createdAt,
      title: `Follow-up: ${f.type || 'Interaction'}`, description: f.notes || f.outcome || '', user: f.createdBy?.name || 'System'
    }));

    appointmentsPage.data.forEach(a => timelineEvents.push({
      _id: a._id, type: 'APPOINTMENT', date: a.createdAt,
      title: `Appointment Created`, description: `Status: ${a.status} | Venue: ${a.venue}`, user: a.createdBy?.name || 'System'
    }));

    ordersPage.data.forEach(o => timelineEvents.push({
      _id: o._id, type: 'ORDER_CREATED', date: o.createdAt,
      title: `Order Created (${o.orderNumber || o._id})`, description: `Amount: ₹${o.totalAmount || o.grandTotal || 0} | Status: ${o.status}`, user: o.createdBy?.name || 'System'
    }));

    paymentsPage.data.forEach(p => timelineEvents.push({
      _id: p._id, type: 'PAYMENT_RECEIVED', date: p.paymentDate || p.createdAt,
      title: `Payment Received`, description: `Amount: ₹${p.amount} | Status: ${p.status} | Method: ${p.method}`, user: p.createdBy?.name || 'System'
    }));

    timelineEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

    const skip = (page - 1) * limit;
    const paginatedEvents = timelineEvents.slice(skip, skip + parseInt(limit));

    return { data: paginatedEvents, total: timelineEvents.length, page: parseInt(page), limit: parseInt(limit) };
  }

  async getDocumentsByMobile(phone, companyFilter, query = {}) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    
    let allDocs = [];

    const paymentsPage = await this.getPaymentsByMobile(phone, companyFilter, { page: 1, limit: 1000 });
    paymentsPage.data.forEach(p => {
      if (p.proofUrl) {
        allDocs.push({ type: 'Payment Receipt', url: p.proofUrl, name: `Receipt_${p.paymentNumber || p._id}`, date: p.createdAt });
      }
    });

    const ordersPage = await this.getOrdersByMobile(phone, companyFilter, { page: 1, limit: 1000 });
    ordersPage.data.forEach(o => {
      if (o.attachments && Array.isArray(o.attachments)) {
        o.attachments.forEach(att => {
          allDocs.push({ type: 'Order Attachment', url: att.url || att, name: att.name || 'Attachment', date: o.createdAt });
        });
      }
    });

    allDocs.sort((a, b) => new Date(b.date) - new Date(a.date));
    const paginatedDocs = allDocs.slice(skip, skip + parseInt(limit));

    return { data: paginatedDocs, total: allDocs.length, page: parseInt(page), limit: parseInt(limit) };
  }
}

module.exports = new Client360Service();
