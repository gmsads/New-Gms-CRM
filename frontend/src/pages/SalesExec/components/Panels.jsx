import React, { useState } from 'react';
import {
  Calendar, CheckCircle, Clock, MapPin, ShieldCheck,
  Plus, X, Upload, Printer, IndianRupee, AlertCircle, FileText, MessageCircle
} from 'lucide-react';
import { requirementTypes } from '../data/mockData';


import { useAuth } from '../../../context/AuthContext';
import { appointmentApi } from '../../../services/api';

// ─── Appointment Hub ──────────────────────────────────────────────────────────
export const AppointmentHub = ({ appointments = [], onSchedule }) => (
  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
    <div className="flex items-center justify-between p-5 border-b">
      <div>
        <h3 className="font-bold text-base">📅 Appointment Hub</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{appointments.length} upcoming meetings</p>
      </div>
      <button onClick={onSchedule}
        className="h-8 px-3 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5"
        style={{ background: '#7c3aed' }}>
        <Plus className="h-3.5 w-3.5" /> Schedule
      </button>
    </div>
    {appointments.length === 0 ? (
      <div className="p-8 text-center text-muted-foreground text-sm">
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
        No appointments scheduled
      </div>
    ) : (
      <div className="divide-y divide-border">
        {appointments.map((apt, i) => (
          <div key={apt._id || i} className="flex items-start gap-4 p-4 hover:bg-purple-50/30 transition-colors">
            <div className="h-10 w-10 rounded-xl flex flex-col items-center justify-center shrink-0 text-white font-bold text-xs" style={{ background: '#7c3aed' }}>
              <span>{apt.date === 'Today' ? 'NOW' : (apt.date || '').replace('Apr ', '')}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{apt.client || apt.prospect?.name}</span>
                {apt.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5">
                    <ShieldCheck className="h-3 w-3" /> Manager Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{apt.company || apt.prospect?.company}</p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{apt.time}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{apt.location}</span>
              </div>
              <span className="inline-block mt-1.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-semibold px-2 py-0.5">{apt.purpose}</span>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button className="h-7 px-2 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors">Confirm</button>
              <button className="h-7 px-2 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors">Reschedule</button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ─── Order List ───────────────────────────────────────────────────────────────
export const OrderList = ({ orders = [], onCreateOrder, onUploadPayment, compact }) => {
  const statusColors = { Confirmed: 'bg-blue-100 text-blue-700', 'In Production': 'bg-amber-100 text-amber-700', 'Design Review': 'bg-purple-100 text-purple-700', Completed: 'bg-green-100 text-green-700' };
  const paymentColors = { Partial: 'bg-orange-100 text-orange-700', Paid: 'bg-green-100 text-green-700', Pending: 'bg-red-100 text-red-700' };

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All Months');
  const months = ['All Months', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const filteredOrders = orders.filter(o => {
    const matchSearch = !search || [o.orderNumber, o.id, o.clientSnapshot?.name, o.client].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    const matchPayment = paymentFilter === 'All' || o.paymentStatus === paymentFilter;
    let matchMonth = true;
    if (monthFilter !== 'All Months') {
      const oMonth = new Date(o.createdAt || o.date || new Date()).toLocaleString('default', { month: 'long' });
      matchMonth = oMonth === monthFilter;
    }
    return matchSearch && matchStatus && matchPayment && matchMonth;
  });

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      {!compact && (
        <div className="rounded-xl border bg-white shadow-sm p-4">
          <div className="flex gap-4 mb-4">
            <div className="flex flex-col gap-1 w-48">
              <label className="text-sm font-medium text-slate-700">Year:</label>
              <select className="h-10 rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]">
                <option>All Years</option>
                <option>2026</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 w-48">
              <label className="text-sm font-medium text-slate-700">Month:</label>
              <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="h-10 rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]">
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1 w-48">
              <label className="text-sm font-medium text-slate-700">Status:</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]">
                <option value="All">All Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In Production">In Production</option>
                <option value="Design Review">Design Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 w-48">
              <label className="text-sm font-medium text-slate-700">Payment:</label>
              <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className="h-10 rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]">
                <option value="All">All Payments</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by order ID, client name..."
              className="h-12 w-full rounded-full border border-slate-300 px-6 text-sm outline-none focus:border-[#003366]"
            />
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-2 h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:opacity-90" style={{ background: '#4caf50' }}>
              <FileText className="h-4 w-4" /> Export to Excel
            </button>
            <button className="flex items-center gap-2 h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:opacity-90" style={{ background: '#00acc1' }}>
              <Printer className="h-4 w-4" /> Print Report
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h3 className="font-bold text-base">🧾 My Orders</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{filteredOrders.length} active orders</p>
          </div>
        </div>
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
            No orders match your filters
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredOrders.map((order, i) => (
              <div key={order._id || order.id || i} className="p-4 hover:bg-green-50/20 transition-colors">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono font-bold text-sm text-blue-700">{order.orderNumber || order.id}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>{order.status}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${paymentColors[order.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>{order.paymentStatus} Payment</span>
                    </div>
                    <p className="font-semibold text-sm">{order.clientSnapshot?.name || order.client}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">Total: <span className="font-bold text-foreground">₹{order.grandTotal?.toLocaleString('en-IN') || order.amount}</span></span>
                      <span className="text-xs text-muted-foreground">Paid: <span className="font-semibold">₹{order.totalPaid?.toLocaleString('en-IN') || order.advance}</span></span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <div className={`rounded-xl px-3 py-1.5 text-center ${order.designStatus === 'Approved' || order.designStatus === 'Completed' ? 'bg-green-100 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Design</p>
                      <p className={`text-xs font-bold mt-0.5 ${order.designStatus === 'Approved' ? 'text-green-700' : 'text-amber-700'}`}>
                        {order.designStatus === 'Approved' ? '✅ Ready for Print' : '🎨 ' + (order.designStatus || 'Pending')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => onUploadPayment?.(order)} className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors">
                    <Upload className="h-3 w-3" /> Upload Payment
                  </button>
                  <button className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors">
                    <FileText className="h-3 w-3" /> View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Activity Timeline ────────────────────────────────────────────────────────
export const ActivityTimeline = ({ events = [] }) => (
  <div className="rounded-2xl border bg-white shadow-sm p-5">
    <h3 className="font-bold text-base mb-4">⏱ Activity Timeline</h3>
    {events.length === 0 ? (
      <div className="text-center text-muted-foreground text-sm py-6">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
        No recent activity
      </div>
    ) : (
      <div className="space-y-5">
        {events.map((group, gi) => (
          <div key={gi}>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">{group.label}</p>
            <div className="space-y-3 pl-2 border-l-2 border-blue-100">
              {group.events.map((ev, i) => (
                <div key={i} className="flex gap-3 relative">
                  <div className="absolute -left-[17px] top-0.5 h-4 w-4 rounded-full bg-white border-2 border-blue-300 flex items-center justify-center text-[9px]">{ev.icon}</div>
                  <div className="pl-2">
                    <p className="text-sm font-medium">{ev.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{ev.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);


// ─── Schedule Appointment Modal ────────────────────────────────────────────────
export const ScheduleAppointmentModal = ({ prospect, onClose, onSaved }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    venue: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await appointmentApi.create({
        prospectId: prospect._id || prospect.id,
        date: formData.date,
        time: formData.time,
        venue: formData.venue
      }, user.token);
      if (res.success) {
        onSaved?.();
        onClose();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border bg-card shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b shrink-0" style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)' }}>
          <div>
            <h2 className="text-white font-bold text-lg">📅 Schedule Appointment</h2>
            <p className="text-indigo-200 text-xs mt-0.5">Assign meeting for {prospect?.company}</p>
          </div>
          <button onClick={onClose} className="text-indigo-200 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Executive Name</label>
            <input value={user?.name || ''} readOnly className="h-9 w-full rounded-lg border border-input bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Business Name</label>
              <input value={prospect?.company || ''} readOnly className="h-9 w-full rounded-lg border border-input bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Contact Person</label>
              <input value={prospect?.name || ''} readOnly className="h-9 w-full rounded-lg border border-input bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone Number</label>
            <input value={prospect?.phone || ''} readOnly className="h-9 w-full rounded-lg border border-input bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
              <input required type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Time (e.g. 10:30 AM)</label>
              <input required type="text" placeholder="10:30 AM" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Venue / Address</label>
            <textarea required rows={3} placeholder="Enter full address or meeting link..." value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} className="w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus:border-indigo-500 resize-none" />
          </div>

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="h-9 flex-1 rounded-lg border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="h-9 flex-1 rounded-lg text-white text-sm font-medium flex justify-center items-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-70" style={{ background: '#4f46e5' }}>
              {loading ? 'Scheduling...' : 'Schedule Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// ─── Order Search Modal ───────────────────────────────────────────────────────
export const OrderSearchModal = ({ onClose, onSearch }) => {
  const [query, setQuery] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-xl border bg-white shadow-2xl overflow-hidden p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-slate-900">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-center mb-8 text-slate-900">Search Client</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-800 mb-2 block">Enter Mobile Number or Business Name:</label>
            <input 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
              placeholder="Mobile number or Business name" 
              className="h-10 w-full rounded border border-slate-300 bg-background px-3 text-sm outline-none focus:border-[#003366]" 
            />
          </div>
          <button
            onClick={() => onSearch(query)}
            className="w-full h-10 rounded text-white font-semibold text-sm transition-colors hover:opacity-90"
            style={{ background: '#003366' }}
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Order Client Details Modal ───────────────────────────────────────────────
export const OrderClientDetailsModal = ({ client, onBack, onCreateOrder, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-xl border bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col p-8 relative">
        <button onClick={onClose || onBack} className="absolute top-4 right-4 text-muted-foreground hover:text-slate-900">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-900">Client Details</h2>
        <div className="overflow-y-auto flex-1 space-y-4 pr-2">
          {/* Read only fields with light grey background */}
          {[
            { label: 'Business Name', value: client.company || client.businessName },
            { label: 'Contact Person', value: client.name || client.contactPerson },
            { label: 'Phone Number', value: client.phone },
            { label: 'Location', value: client.location },
            { label: 'Client Type', value: client.clientType },
          ].map((field, i) => (
            <div key={i}>
              <label className="text-xs font-bold text-slate-800 mb-1 block">{field.label}</label>
              <div className="w-full rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 min-h-[36px]">
                {field.value || '-'}
              </div>
            </div>
          ))}
        </div>
        <div className="pt-6 flex justify-center gap-4 shrink-0">
          <button onClick={onBack} className="h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:bg-green-600" style={{ background: '#4caf50' }}>
            Back to Search
          </button>
          <button onClick={() => onCreateOrder(client)} className="h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:bg-blue-600" style={{ background: '#2196f3' }}>
            Create New Order
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Create Order Modal ───────────────────────────────────────────────────────
export const CreateOrderModal = ({ client, executiveName, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    executiveName: executiveName || '',
    orderDate: new Date().toISOString().split('T')[0],
    orderType: client?.clientType || 'retail',
    gstNumber: '',
    company: client?.company || client?.businessName || '',
    name: client?.name || client?.contactPerson || '',
    phone: client?.phone || '',
    location: client?.location || client?.requirement?.location || '',
    source: client?.source || client?.leadFrom || '',
    birthDate: '',
    anniversaryDate: '',
    designStatus: 'Design Provided',
  });

  const [items, setItems] = useState([{ desc: '', isCustom: false, customDesc: '', qty: 1, cost: 0, deliveryDate: '' }]);
  const [advance, setAdvance] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const addItem = () => setItems(prev => [...prev, { desc: '', isCustom: false, customDesc: '', qty: 1, cost: 0, deliveryDate: '' }]);
  const removeItem = i => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i, k, v) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item));

  const subtotal = items.reduce((s, item) => s + (item.qty * Number(item.cost || 0)), 0);
  const advancePct = subtotal > 0 ? (Number(advance) / subtotal) * 100 : 0;
  const advanceLow = subtotal > 0 && advancePct < 50 && advance !== '';

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFormSubmit = () => {
    onSubmit({
      ...formData,
      items,
      payment: {
        subtotal,
        advance: Number(advance),
        paymentMethod,
        requiresApproval: advanceLow
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-4xl rounded-2xl border bg-card shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b shrink-0" style={{ background: 'linear-gradient(135deg, #064e3b, #065f46)' }}>
          <div>
            <h2 className="text-white font-bold text-lg">🧾 Create New Order</h2>
            {client && <p className="text-emerald-200 text-xs mt-0.5">Creating for {client.company || client.name}</p>}
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-6 bg-slate-50">
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">1. Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Executive Name</label>
                <input name="executiveName" value={formData.executiveName} readOnly className="h-9 w-full rounded border bg-slate-100 px-3 text-sm outline-none text-slate-600 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Order Date</label>
                <input type="date" name="orderDate" value={formData.orderDate} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Order Type *</label>
                <select name="orderType" value={formData.orderType} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-green-500">
                  <option value="">Select Type...</option>
                  {['renewal', 'renewal-agent', 'retail', 'retail-agent', 'agent', 'corporate', 'corporate-renewal', 'website', 'walk-in'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">2. Client Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Business Name *</label>
                <input name="company" value={formData.company} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Contact Person *</label>
                <input name="name" value={formData.name} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Contact Number *</label>
                <input name="phone" value={formData.phone} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Location *</label>
                <input name="location" value={formData.location} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Lead Source</label>
                <input name="source" value={formData.source} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">GST Number (Optional)</label>
                <input name="gstNumber" value={formData.gstNumber} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Birth Date (Optional)</label>
                <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Anniversary Date (Opt)</label>
                <input type="date" name="anniversaryDate" value={formData.anniversaryDate} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Design Status</label>
                <select name="designStatus" value={formData.designStatus} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-green-500">
                  <option value="Design Provided">Design Provided</option>
                  <option value="Need Design">Need Design</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="font-bold text-slate-800">3. Order Requirements</h3>
              <button onClick={addItem} className="text-xs font-bold text-white bg-green-600 px-3 py-1.5 rounded-lg hover:bg-green-700 transition flex items-center gap-1"><Plus className="h-3.5 w-3.5" />Add Item</button>
            </div>
            
            <div className="space-y-4">
              {items.map((item, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4 relative">
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="absolute top-2 right-2 h-7 w-7 rounded bg-red-100 hover:bg-red-200 flex items-center justify-center shrink-0"><X className="h-3 w-3 text-red-600" /></button>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="col-span-1 sm:col-span-2">
                      <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Requirement</label>
                      <select value={item.desc} onChange={e => updateItem(i, 'desc', e.target.value)} className="h-9 w-full rounded border border-slate-300 bg-white px-3 text-sm outline-none">
                        <option value="">Select product...</option>
                        {requirementTypes.map(r => <option key={r}>{r}</option>)}
                      </select>
                      <div className="mt-2 flex items-center gap-2">
                        <input type="checkbox" id={`custom-${i}`} checked={item.isCustom} onChange={e => updateItem(i, 'isCustom', e.target.checked)} className="rounded cursor-pointer" />
                        <label htmlFor={`custom-${i}`} className="text-xs font-bold text-slate-700 cursor-pointer">Customization Required</label>
                      </div>
                      {item.isCustom && (
                        <div className="mt-2">
                          <input value={item.customDesc} onChange={e => updateItem(i, 'customDesc', e.target.value)} placeholder="Describe customization..." className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs outline-none" />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Quantity</label>
                      <input type="number" value={item.qty} onChange={e => updateItem(i, 'qty', +e.target.value)} className="h-9 w-full rounded border border-slate-300 bg-white px-3 text-sm outline-none" min="1" />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Cost (₹)</label>
                      <input type="number" value={item.cost} onChange={e => updateItem(i, 'cost', +e.target.value)} disabled={!item.isCustom} className={`h-9 w-full rounded border px-3 text-sm outline-none ${!item.isCustom ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white border-slate-300'}`} placeholder={item.isCustom ? "Enter cost" : "Fixed cost"} />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Delivery Date</label>
                      <input type="date" value={item.deliveryDate} onChange={e => updateItem(i, 'deliveryDate', e.target.value)} className="h-9 w-full rounded border border-slate-300 bg-white px-3 text-sm outline-none" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl border bg-green-50 p-4 flex justify-between items-center shadow-sm">
              <span className="text-sm font-bold text-slate-700">Subtotal Amount</span>
              <span className="font-black text-xl text-green-700">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">4. Payment & Instalments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Advance Payment Received (₹) *</label>
                <input type="number" value={advance} onChange={e => setAdvance(e.target.value)} placeholder={`Minimum 50% (₹${(subtotal * 0.5).toLocaleString('en-IN')})`} className={`h-10 w-full rounded-lg border bg-slate-50 px-3 text-sm outline-none transition-colors ${advanceLow ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-green-500'}`} />
                {advanceLow && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="font-medium">Advance is below 50% ({advancePct.toFixed(0)}%). CRM Notification will be sent to Sales Manager for approval. Order will be marked 'Pending Approval'.</span>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Payment Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-green-500 bg-slate-50">
                  <option value="Cash">Cash</option>
                  <option value="PhonePe">PhonePe / UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
                <p className="mt-2 text-[10px] text-muted-foreground">Instalment tracking will be created automatically for the remaining balance of ₹{(subtotal - Number(advance || 0)).toLocaleString('en-IN')}.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t shrink-0 flex gap-4 bg-white">
          <button onClick={onClose} className="h-11 px-8 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button
            onClick={handleFormSubmit}
            className="flex-1 h-11 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2 shadow-sm"
            style={{ background: advanceLow ? '#dc2626' : '#059669' }}
          >
            {advanceLow ? '⚠ Request Manager Approval' : '✅ Submit & Create Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Payment Upload Modal ─────────────────────────────────────────────────────
export const PaymentUploadModal = ({ order, onClose }) => {
  const [method, setMethod] = useState('UPI');
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b" style={{ background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)' }}>
          <div>
            <h2 className="text-white font-bold">💰 Upload Payment Proof</h2>
            {order && <p className="text-blue-200 text-xs mt-0.5">{order.id} · {order.client}</p>}
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Method */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {['Cash', 'UPI', 'Bank Transfer'].map(m => (
                <button key={m} onClick={() => setMethod(m)} className={`h-9 rounded-lg border text-sm font-medium transition-all ${method === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-border hover:border-blue-300'}`}>{m}</button>
              ))}
            </div>
          </div>
          {/* Amount */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount Received *</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold text-sm">₹</span>
              <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="h-9 w-full rounded-lg border border-input bg-background pl-7 pr-3 text-sm outline-none focus:border-blue-500" />
            </div>
          </div>
          {/* Upload */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Proof (Mandatory)</label>
            <label className={`flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${file ? 'border-green-400 bg-green-50' : 'border-border hover:border-blue-400 hover:bg-blue-50/50'}`}>
              <input type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files[0])} />
              {file ? (
                <>
                  <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                  <p className="text-xs font-medium text-green-700">{file.name}</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">Upload GPay screenshot / receipt</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG up to 5MB</p>
                </>
              )}
            </label>
          </div>
          {/* Info */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Payment proof is mandatory. Manager / Admin will verify before marking as received.</span>
          </div>
          {/* Submit */}
            <button
            disabled={!file || !amount}
            className="w-full h-10 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)' }}
          >
            Submit Payment Proof
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Phone Search Modal ───────────────────────────────────────────────────────
export const PhoneSearchModal = ({ onClose, onSearch }) => {
  const [phone, setPhone] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-xl border bg-white shadow-2xl overflow-hidden p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-slate-900">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-center mb-8 text-slate-900">Search</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-800 mb-2 block">Enter Phone Number:</label>
            <input 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="10 digit phone number" 
              className="h-10 w-full rounded border border-slate-300 bg-background px-3 text-sm outline-none focus:border-[#003366]" 
              maxLength={10}
            />
          </div>
          <button
            onClick={() => onSearch(phone)}
            className="w-full h-10 rounded text-white font-semibold text-sm transition-colors hover:opacity-90"
            style={{ background: '#003366' }}
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Prospect Details Modal ───────────────────────────────────────────────────
export const ProspectDetailsModal = ({ prospect, onBack, onCreateNew, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-xl border bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col p-8 relative">
        <button onClick={onClose || onBack} className="absolute top-4 right-4 text-muted-foreground hover:text-slate-900">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-900">Prospect Details</h2>
        <div className="overflow-y-auto flex-1 space-y-4 pr-2">
          {/* Read only fields with light grey background */}
          {[
            { label: 'Executive Name', value: prospect.executiveName },
            { label: 'Business Name', value: prospect.businessName },
            { label: 'Contact Person', value: prospect.contactPerson },
            { label: 'Phone Number', value: prospect.phoneNumber },
            { label: 'Location', value: prospect.location },
            { label: 'Prospect Type', value: prospect.prospectType },
            { label: 'WhatsApp Status', value: prospect.whatsappStatus },
            { label: 'Lead From', value: prospect.leadFrom },
            { label: 'Follow-up Date', value: prospect.followUpDate },
            { label: 'Requirement Description', value: prospect.requirementDescription }
          ].map((field, i) => (
            <div key={i}>
              <label className="text-xs font-bold text-slate-800 mb-1 block">{field.label}</label>
              <div className="w-full rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 min-h-[36px]">
                {field.value}
              </div>
            </div>
          ))}
        </div>
        <div className="pt-6 flex justify-center gap-4 shrink-0">
          <button onClick={onBack} className="h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:bg-green-600" style={{ background: '#4caf50' }}>
            Back to Dashboard
          </button>
          <button onClick={onCreateNew} className="h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:bg-blue-600" style={{ background: '#2196f3' }}>
            Create New Prospect
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Create/Edit Prospect Modal ────────────────────────────────────────────────
export const CreateProspectModal = ({ phone, executiveName, onBack, onSubmit, onClose, initialData = null }) => {
  const [formData, setFormData] = useState({
    executiveName: initialData?.assignedTo?.name || executiveName || '',
    name: initialData?.name || '',
    company: initialData?.company || '',
    phone: initialData?.phone || phone || '',
    location: initialData?.requirement?.location || '',
    source: initialData?.source || '',
    priority: initialData?.priority || '',
    nextFollowUpDate: initialData?.nextFollowUpDate ? new Date(initialData.nextFollowUpDate).toISOString().split('T')[0] : '',
    notes: initialData?.requirement?.notes || (typeof initialData?.requirement === 'string' ? initialData.requirement : ''),
    clientType: initialData?.clientType || 'Retail',
    budget: initialData?.requirement?.budget || '',
  });

  const predefinedProducts = ['Boards', 'Banners', 'Digital Marketing', 'Hoarding', 'Standees', 'Brochures', 'Social Media', 'Flex Printing', 'Glow Sign Board', 'Video Ads', 'Acp Board', 'Acrylic Board', 'LED Signage'];
  const [products, setProducts] = useState(initialData?.requirement?.service ? initialData.requirement.service.split(', ').filter(Boolean) : []);
  const [customProduct, setCustomProduct] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const removeProduct = (prod) => {
    setProducts(products.filter(p => p !== prod));
  };

  const addCustomProduct = (e, val) => {
    e?.preventDefault();
    const toAdd = val || customProduct.trim();
    if (toAdd && !products.includes(toAdd)) {
      setProducts([...products, toAdd]);
    }
    setCustomProduct('');
    setShowSuggestions(false);
  };

  const filteredProducts = predefinedProducts.filter(p => p.toLowerCase().includes(customProduct.toLowerCase()) && !products.includes(p));

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-xl border bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col p-8 relative">
        <button onClick={onClose || onBack} className="absolute top-4 right-4 text-muted-foreground hover:text-slate-900">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-900">{initialData ? 'Edit Prospect' : 'Create New Prospect'}</h2>
        <div className="overflow-y-auto flex-1 space-y-4 pr-2">
          <div><label className="text-xs font-bold text-slate-800 mb-1 block">Executive Name</label><input name="executiveName" value={formData.executiveName} readOnly className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none bg-slate-50" /></div>
          <div><label className="text-xs font-bold text-slate-800 mb-1 block">Business Name *</label><input name="company" value={formData.company} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]" /></div>
          <div><label className="text-xs font-bold text-slate-800 mb-1 block">Contact Person *</label><input name="name" value={formData.name} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]" /></div>
          <div><label className="text-xs font-bold text-slate-800 mb-1 block">Phone Number *</label><input name="phone" value={formData.phone} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]" /></div>
          <div><label className="text-xs font-bold text-slate-800 mb-1 block">Location *</label><input name="location" value={formData.location} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]" /></div>
          <div><label className="text-xs font-bold text-slate-800 mb-1 block">Lead From *</label>
            <select name="source" value={formData.source} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]">
              <option value="">Select Lead Source</option>
              <option>India mart</option><option>Just dial</option><option>Google ads</option><option>Referral</option><option>Website</option><option>Meta (Facebook/Instagram)</option><option>Walk-in</option><option>Other</option>
            </select>
          </div>
          <div><label className="text-xs font-bold text-slate-800 mb-1 block">Prospect Type (Temperature) *</label>
            <select name="priority" value={formData.priority} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]">
              <option value="">Select Type</option>
              <option>Hot</option><option>Cold</option><option>Expected in next month</option>
            </select>
          </div>
          <div><label className="text-xs font-bold text-slate-800 mb-1 block">Client Type (For Pricing) *</label>
            <select name="clientType" value={formData.clientType} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]">
              <option value="Retail">Retail</option>
              <option value="Retail Agent">Retail Agent</option>
              <option value="Renewal">Renewal</option>
              <option value="Renewal Agent">Renewal Agent</option>
              <option value="Corporate">Corporate</option>
              <option value="Agent">Agent</option>
            </select>
          </div>
          <div><label className="text-xs font-bold text-slate-800 mb-1 block">Budget</label><input name="budget" value={formData.budget} onChange={handleChange} placeholder="e.g. 5000" className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]" /></div>
          <div><label className="text-xs font-bold text-slate-800 mb-1 block">Follow-up Date *</label><input type="date" name="nextFollowUpDate" value={formData.nextFollowUpDate} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]" /></div>
          
          <div>
            <label className="text-xs font-bold text-slate-800 mb-2 block">Products / Services Needed *</label>
            
            {/* Selected Products Tags */}
            {products.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {products.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => removeProduct(p)}
                    className="px-3 py-1 rounded-full text-xs font-semibold border transition-colors bg-blue-600 text-white border-blue-600 shadow-sm flex items-center gap-1"
                  >
                    {p} <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}
            
            {/* Autocomplete Input */}
            <div className="relative">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={customProduct} 
                  onChange={(e) => {
                    setCustomProduct(e.target.value);
                    setShowSuggestions(true);
                  }} 
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomProduct(e)}
                  placeholder="Type product name to search or add..." 
                  className="h-9 flex-1 rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]" 
                />
                <button type="button" onClick={addCustomProduct} className="h-9 px-4 rounded bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors">Add</button>
              </div>
              
              {/* Suggestions Dropdown */}
              {showSuggestions && customProduct.trim() && (
                <div className="absolute top-full left-0 right-20 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(p => (
                      <div 
                        key={p} 
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-slate-700 font-medium"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addCustomProduct(e, p);
                        }}
                      >
                        {p}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground italic">
                      Press "Add" to create custom product
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div><label className="text-xs font-bold text-slate-800 mb-1 block">Additional Requirement Notes</label><textarea name="notes" value={formData.notes} onChange={handleChange} className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#003366] min-h-[60px]" placeholder="Specific details or dimensions..." /></div>
        </div>
        <div className="pt-6 flex justify-between shrink-0">
          <button onClick={onBack} className="h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:opacity-90" style={{ background: '#003366' }}>
            Cancel
          </button>
          <button onClick={() => onSubmit({ ...formData, products })} className="h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:opacity-90" style={{ background: '#003366' }}>
            {initialData ? 'Update Prospect' : 'Submit Prospect'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Quotation Modal ────────────────────────────────────────────────────────
export const QuotationModal = ({ prospect, onClose, onSubmit }) => {
  const [items, setItems] = useState([{ product: '', qty: 1, unitPrice: 0 }]);
  
  // Dummy pricing matrix based on client type
  const getPrice = (product, clientType) => {
    const basePrice = { 'Boards': 500, 'Banners': 200, 'Digital Marketing': 5000, 'Hoarding': 10000, 'Standees': 1500, 'Brochures': 100, 'Social Media': 3000 }[product] || 0;
    const multipliers = { 'Retail': 1, 'Retail Agent': 0.9, 'Renewal': 0.85, 'Renewal Agent': 0.8, 'Corporate': 0.75, 'Agent': 0.7 };
    return basePrice * (multipliers[clientType] || 1);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === 'product') {
      newItems[index].unitPrice = getPrice(value, prospect?.clientType || 'Retail');
    }
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { product: '', qty: 1, unitPrice: 0 }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const total = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-xl border bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-slate-900"><X className="h-5 w-5" /></button>
        <h2 className="text-2xl font-bold mb-4 text-slate-900">Send Quotation</h2>
        
        <div className="overflow-y-auto flex-1 space-y-4 pr-2">
          {/* Pre-filled info */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border">
            <div><p className="text-xs text-muted-foreground">Client Name</p><p className="font-semibold text-sm">{prospect?.name}</p></div>
            <div><p className="text-xs text-muted-foreground">Business</p><p className="font-semibold text-sm">{prospect?.company}</p></div>
            <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-semibold text-sm">{prospect?.phone}</p></div>
            <div><p className="text-xs text-muted-foreground">Client Type</p><p className="font-semibold text-blue-600 text-sm">{prospect?.clientType || 'Retail'}</p></div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-800">Products/Services</label>
              <button onClick={addItem} className="text-xs text-blue-600 font-semibold flex items-center gap-1"><Plus className="h-3 w-3"/> Add Item</button>
            </div>
            
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 mb-2 items-end">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground block mb-0.5">Select Product</label>
                  <select value={item.product} onChange={(e) => updateItem(i, 'product', e.target.value)} className="h-9 w-full rounded border border-slate-300 px-2 text-sm outline-none">
                    <option value="">Choose...</option>
                    {['Boards', 'Banners', 'Digital Marketing', 'Hoarding', 'Standees', 'Brochures', 'Social Media'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="w-20">
                  <label className="text-[10px] text-muted-foreground block mb-0.5">Qty</label>
                  <input type="number" value={item.qty} onChange={(e) => updateItem(i, 'qty', +e.target.value)} className="h-9 w-full rounded border border-slate-300 px-2 text-sm outline-none" min="1" />
                </div>
                <div className="w-24">
                  <label className="text-[10px] text-muted-foreground block mb-0.5">Unit Price (₹)</label>
                  <input type="number" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', +e.target.value)} className="h-9 w-full rounded border border-slate-300 px-2 text-sm outline-none bg-slate-50" />
                </div>
                <div className="w-24">
                  <label className="text-[10px] text-muted-foreground block mb-0.5">Total</label>
                  <div className="h-9 w-full rounded border border-slate-100 bg-slate-100 px-2 text-sm flex items-center justify-end font-semibold text-slate-700">
                    ₹{item.qty * item.unitPrice}
                  </div>
                </div>
                {items.length > 1 && (
                  <button onClick={() => removeItem(i)} className="h-9 w-9 rounded border border-red-200 bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end pt-2 border-t">
            <p className="text-lg font-bold text-slate-900">Total Estimate: <span className="text-blue-700">₹{total.toLocaleString()}</span></p>
          </div>
        </div>

        <div className="pt-4 flex justify-between shrink-0">
          <button onClick={onClose} className="h-10 px-6 rounded text-slate-600 font-semibold text-sm border hover:bg-slate-50">Cancel</button>
          <button onClick={() => onSubmit({ prospect, items, total })} className="h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:opacity-90 flex items-center gap-2" style={{ background: '#25d366' }}>
            <MessageCircle className="h-4 w-4" /> Send via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Update Status Modal ────────────────────────────────────────────────────────
export const UpdateStatusModal = ({ prospect, newStatus, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    status: newStatus || prospect?.status || 'In-progress',
    date: prospect?.nextFollowUpDate ? new Date(prospect.nextFollowUpDate).toISOString().split('T')[0] : '',
    remark: prospect?.lastInteractionNote || '',
    reason: prospect?.cancelReason || '',
    orderId: ''
  });

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-xl border bg-white shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-slate-900"><X className="h-5 w-5" /></button>
          <h2 className="text-xl font-bold mb-1 text-slate-900">
            {formData.status === 'In-progress' ? 'Schedule Next Follow-up' : 
             formData.status === 'Canceled' ? 'Cancel Prospect' : 
             'Close Sale'}
          </h2>
          <p className="text-sm text-slate-500 mb-5">
            {formData.status === 'In-progress' ? "Let's keep the momentum going. When should we reach out next?" : 
             formData.status === 'Canceled' ? "Sorry to hear that. What was the main reason they didn't proceed?" : 
             "Awesome news! Let's get this order officially recorded."}
          </p>
          
          <div className="space-y-5">
            {formData.status === 'In-progress' && (
              <>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">When should we contact them? *</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-shadow" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">What was discussed? *</label>
                  <textarea value={formData.remark} onChange={(e) => setFormData({...formData, remark: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-shadow min-h-[90px]" placeholder="Briefly describe the conversation..." />
                </div>
              </>
            )}
            
            {formData.status === 'Canceled' && (
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Cancellation Reason *</label>
                <textarea value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-shadow min-h-[90px]" placeholder="e.g. Budget too low, chose competitor..." />
              </div>
            )}
            
            {formData.status === 'Sale Closed' && (
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Link to Order ID *</label>
                <input type="text" value={formData.orderId} onChange={(e) => setFormData({...formData, orderId: e.target.value})} className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-shadow" placeholder="e.g. ORD-12345" />
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
          <button onClick={onClose} className="h-9 px-4 rounded text-slate-600 font-semibold text-sm border bg-white hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} className="h-9 px-6 rounded text-white font-semibold text-sm transition-colors hover:opacity-90 bg-blue-600">
            Save Update
          </button>
        </div>
      </div>
    </div>
  );
};
