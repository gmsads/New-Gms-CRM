import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Target, CheckCircle, Clock, IndianRupee, Package, TrendingUp, AlertTriangle, PhoneCall, Calendar as CalendarIcon, Plus, UserPlus, RefreshCw, ShieldCheck } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ProspectTable } from './components/ProspectTable';
import { OrderList, PaymentUploadModal, OrderDetailsModal, PhoneSearchModal, ProspectDetailsModal, CreateProspectModal, UpdateStatusModal, ScheduleAppointmentModal, OrderSearchModal, OrderClientDetailsModal, CreateOrderModal, AssignAppointmentModal, UpdateAppointmentRemarkModal } from './components/Panels';
import QuotationBuilder from './components/QuotationBuilder';
import { prospectApi, orderApi, appointmentApi, paymentApi, approvalApi } from '../../services/api';

const useProspectFlow = (user, onSaved) => {
  const [showPhoneSearch, setShowPhoneSearch] = useState(false);
  const [showProspectDetails, setShowProspectDetails] = useState(null);
  const [showCreateProspect, setShowCreateProspect] = useState(null);
  const [showQuotation, setShowQuotation] = useState(null);
  const [showUpdateStatus, setShowUpdateStatus] = useState(null);
  const [showScheduleAppointment, setShowScheduleAppointment] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const handlePhoneSearch = async (searchParams) => {
    setShowPhoneSearch(false);
    try {
      const res = await prospectApi.searchPhone(searchParams, user?.token);
      if (res.found && res.data) {
        setShowProspectDetails(res.data);
      } else {
        setShowCreateProspect({ phone: searchParams.phone, company: searchParams.company });
      }
    } catch (err) {
      setToastMsg('Error searching prospect');
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleProspectSubmit = async (formData) => {
    try {
      const payload = {
        name: formData.name,
        company: formData.company,
        phone: formData.phone,
        source: formData.source,
        priority: formData.priority,
        clientType: formData.clientType,
        requirement: { service: formData.products ? formData.products.join(', ') : '', notes: formData.notes, location: formData.location, budget: formData.budget },
        nextFollowUpDate: formData.nextFollowUpDate || undefined,
      };

      if (showCreateProspect?._id) {
        await prospectApi.update(showCreateProspect._id, payload, user?.token);
        setToastMsg('Prospect updated successfully!');
      } else {
        await prospectApi.create(payload, user?.token);
        setToastMsg('Prospect submitted successfully!');
      }
      setShowCreateProspect(null);
      setTimeout(() => setToastMsg(null), 3000);
      if (onSaved) onSaved();
    } catch (err) {
      setToastMsg(err.message || 'Failed to save prospect');
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const renderModals = () => (
    <>
      {toastMsg && (
        <div className="fixed top-4 right-4 z-[100] flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}
      {showPhoneSearch && <PhoneSearchModal onClose={() => setShowPhoneSearch(false)} onSearch={handlePhoneSearch} />}
      {showProspectDetails && (
        <ProspectDetailsModal 
          prospect={{
            executiveName: showProspectDetails.assignedTo?.name || 'Executive',
            businessName: showProspectDetails.company,
            contactPerson: showProspectDetails.name,
            phoneNumber: showProspectDetails.phone,
            location: showProspectDetails.requirement?.location,
            prospectType: showProspectDetails.priority,
            whatsappStatus: showProspectDetails.whatsappActions?.length ? 'Sent' : 'Not Sent',
            leadFrom: showProspectDetails.source,
            followUpDate: showProspectDetails.nextFollowUpDate ? new Date(showProspectDetails.nextFollowUpDate).toLocaleDateString() : 'N/A',
            requirementDescription: showProspectDetails.requirement?.notes
          }} 
          onBack={() => setShowProspectDetails(null)} 
          onClose={() => setShowProspectDetails(null)} 
          onCreateNew={() => { setShowProspectDetails(null); setShowCreateProspect('new'); }} 
        />
      )}
      {showCreateProspect && (
        <CreateProspectModal 
          phone={typeof showCreateProspect === 'string' && showCreateProspect !== 'new' ? showCreateProspect : (showCreateProspect?.phone || '')} 
          executiveName={user?.name || user?.username || 'Executive'}
          initialData={showCreateProspect?._id ? showCreateProspect : null}
          onBack={() => setShowCreateProspect(null)} 
          onClose={() => setShowCreateProspect(null)}
          onSubmit={handleProspectSubmit} 
        />
      )}
      {showQuotation && (
        <QuotationBuilder 
          prospect={showQuotation} 
          onClose={() => setShowQuotation(null)} 
          onSave={async (savedQuotation) => {
            try {
              await prospectApi.update(showQuotation._id || showQuotation.id, { 
                whatsappActions: [...(showQuotation.whatsappActions || []), { action: 'Quotation', sentAt: new Date() }] 
              }, user?.token);
              setToastMsg(savedQuotation?.status === 'Sent' ? 'Quotation sent via WhatsApp!' : 'Quotation saved successfully!');
              setTimeout(() => setToastMsg(null), 3000);
              if (onSaved) onSaved();
            } catch(err) {
              console.error(err);
            }
          }} 
        />
      )}
      {showUpdateStatus && (
        <UpdateStatusModal 
          prospect={showUpdateStatus.prospect}
          newStatus={showUpdateStatus.newStatus}
          onClose={() => setShowUpdateStatus(null)}
          onSubmit={async (data) => {
            try {
              const payload = { status: data.status };
              let note = '';
              if (data.status === 'In-progress') {
                if (data.date) payload.nextFollowUpDate = new Date(data.date);
                if (data.remark) {
                  payload.lastInteractionNote = data.remark;
                  payload.lastInteraction = new Date();
                  note = data.remark;
                }
              } else if (data.status === 'Canceled') {
                payload.cancelReason = data.reason;
                payload.lastInteractionNote = `Canceled: ${data.reason}`;
                note = `Canceled: ${data.reason}`;
              } else if (data.status === 'Sale Closed' || data.status === 'Order Confirmed') {
                const orderText = data.orderId ? ` - Order ID: ${data.orderId}` : '';
                payload.lastInteractionNote = `${data.status}${orderText}`;
                note = `${data.status}${orderText}`;
              }

              // Append to interactions history
              payload.interactions = [...(showUpdateStatus.prospect.interactions || []), {
                type: 'Other',
                date: new Date(),
                notes: note || `Status updated to ${data.status}`
              }];

              await prospectApi.update(showUpdateStatus.prospect._id || showUpdateStatus.prospect.id, payload, user?.token);
              setToastMsg(`Successfully updated to ${data.status}`);
              setTimeout(() => setToastMsg(null), 3000);
              setShowUpdateStatus(null);
              if (onSaved) onSaved();
            } catch(err) {
              console.error(err);
              setToastMsg('Failed to update status');
              setTimeout(() => setToastMsg(null), 3000);
            }
          }}
        />
      )}
      {showScheduleAppointment && (
        <ScheduleAppointmentModal 
          prospect={showScheduleAppointment} 
          onClose={() => setShowScheduleAppointment(null)} 
          onSaved={() => {
            setToastMsg('Appointment scheduled successfully!');
            setTimeout(() => setToastMsg(null), 3000);
            if (onSaved) onSaved();
          }} 
        />
      )}
    </>
  );

  return { setShowPhoneSearch, setShowCreateProspect, setShowQuotation, setShowUpdateStatus, showScheduleAppointment, setShowScheduleAppointment, renderModals, setToastMsg };
};

const useOrderFlow = (user, onSaved) => {
  const [showOrderSearch, setShowOrderSearch] = useState(false);
  const [showOrderClientDetails, setShowOrderClientDetails] = useState(null);
  const [showCreateOrder, setShowCreateOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const handleOrderSearch = async (searchParams) => {
    setShowOrderSearch(false);
    try {
      const res = await orderApi.searchClient(searchParams, user?.token);
      if (res && res.found && res.data) {
        setShowOrderClientDetails(res.data);
      } else {
        setShowCreateOrder(searchParams);
      }
    } catch (err) {
      setShowCreateOrder(searchParams);
    }
  };

  const handleOrderSubmit = async (formData) => {
    try {
      await orderApi.create(formData, user?.token);
      setToastMsg('Order created successfully!');
      setShowCreateOrder(null);
      setTimeout(() => setToastMsg(null), 3000);
      if (onSaved) onSaved();
    } catch (err) {
      console.error('[ORDER_SUBMIT_ERROR]', err);
      setToastMsg(err.message || 'Failed to create order');
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const renderOrderModals = () => (
    <>
      {toastMsg && (
        <div className="fixed top-4 right-4 z-[100] flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}
      {showOrderSearch && <OrderSearchModal onClose={() => setShowOrderSearch(false)} onSearch={handleOrderSearch} />}
      {showOrderClientDetails && (
        <OrderClientDetailsModal 
          client={showOrderClientDetails} 
          onBack={() => { setShowOrderClientDetails(null); setShowOrderSearch(true); }} 
          onClose={() => setShowOrderClientDetails(null)} 
          onCreateOrder={(c) => { setShowOrderClientDetails(null); setShowCreateOrder(c); }} 
        />
      )}
      {showCreateOrder && (
        <CreateOrderModal 
          client={showCreateOrder} 
          executiveName={user?.name || user?.username || 'Executive'}
          onClose={() => setShowCreateOrder(null)}
          onSubmit={handleOrderSubmit} 
        />
      )}
      {selectedOrder && (
        <OrderDetailsModal 
          orderId={selectedOrder._id || selectedOrder.id} 
          onClose={() => setSelectedOrder(null)} 
          onPaymentUpload={(o) => { setSelectedOrder(null); setPaymentOrder(o); }}
        />
      )}
      {paymentOrder && (
        <PaymentUploadModal 
          order={paymentOrder} 
          onClose={() => setPaymentOrder(null)} 
          onSaved={() => {
            setToastMsg('Payment proof uploaded!');
            setTimeout(() => setToastMsg(null), 3000);
            if (onSaved) onSaved();
          }}
        />
      )}
    </>
  );

  return { setShowOrderSearch, setShowCreateOrder, setSelectedOrder, setPaymentOrder, renderOrderModals, setToastMsg };
};

// ── KPI Card Component ─────────────────────────────────────────────────────────
const KpiCard = ({ title, value, subtext, icon: Icon, color, onClick }) => (
  <div 
    onClick={onClick}
    className={`rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md ${onClick ? 'cursor-pointer hover:border-blue-300' : ''}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <h3 className="mt-2 text-3xl font-bold tracking-tight">{value}</h3>
      </div>
      {Icon && (
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}>
          <Icon className="h-7 w-7" />
        </div>
      )}
    </div>
    {subtext && <p className="mt-4 text-sm font-medium text-muted-foreground">{subtext}</p>}
  </div>
);

// ── Main Dashboard View ────────────────────────────────────────────────────────
const SalesExecDashboard = () => {
  const { user } = useAuth();
  if (!user) return null;
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    target: { assigned: 0, completed: 0 },
    ordersCompleted: 0,
    monthlyTotal: 0,
    monthlyCompleted: 0,
    pendingFollowups: 0,
    appointments: 0,
    pendingPayments: { amount: 0, count: 0 },
    analysis: [
      { name: 'Active Sales', value: 0, color: '#3b82f6' },
      { name: 'Cancelled', value: 0, color: '#1e293b' },
      { name: 'Pending', value: 0, color: '#f97316' },
      { name: 'Delivered', value: 0, color: '#e2e8f0' },
    ],
    clientOverview: [],
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  const [approvalCount, setApprovalCount] = useState(0);
  const [approvalDetails, setApprovalDetails] = useState({ 
    pending: 0, 
    rejected: 0, 
    orders: [], 
    payments: [] 
  });
  const [activeApprovalTab, setActiveApprovalTab] = useState('Orders');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const safeFetch = async (promise, fallback = { data: [] }) => {
        try { return await promise; }
        catch (e) { console.error('Dashboard partial fetch error:', e); return fallback; }
      };

      const [orderStats, prospectStats, appointments, orders, approvals, approvalList, paymentList] = await Promise.all([
        safeFetch(orderApi.stats(user.token), { data: {} }),
        safeFetch(prospectApi.stats(user.token), { data: {} }),
        safeFetch(appointmentApi.list(user.token)),
        safeFetch(orderApi.list({}, user.token)),
        safeFetch(approvalApi.stats(user.token), { details: {}, pendingCount: 0 }),
        safeFetch(approvalApi.list({ status: 'Pending,Rejected' }, user.token)),
        safeFetch(paymentApi.list({ status: 'Pending,Rejected' }, user.token))
      ]);

      if (approvals.success) {
        const { details, pendingCount } = approvals;
        setApprovalCount(pendingCount);
        setApprovalDetails({
          pending: (details.orders || 0) + (details.payments || 0),
          rejected: (details.rejectedOrders || 0) + (details.rejectedPayments || 0),
          orders: approvalList?.data || [],
          payments: paymentList?.data || []
        });
      }

      const oStats = orderStats.data || {};
      const pStats = prospectStats.data || {};
      const apps = appointments.data || [];
      const ords = orders.data || [];

      // Calculate pending payments
      const pendingOrders = ords.filter(o => o.paymentStatus !== 'Paid' && o.status !== 'Cancelled');
      const pendingAmount = pendingOrders.reduce((sum, o) => sum + (o.grandTotal - o.totalPaid), 0);

      // Client overview (top 5 by order count)
      const clientMap = {};
      ords.forEach(o => {
        const name = o.clientSnapshot?.company || o.clientSnapshot?.name || 'Unknown';
        if (!clientMap[name]) clientMap[name] = { name, orders: 0, amount: 0, fill: '#3b82f6' };
        clientMap[name].orders += 1;
        clientMap[name].amount += o.grandTotal;
      });
      const clientOverview = Object.values(clientMap)
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5);

      setStats({
        target: { assigned: Number(oStats.monthlyTarget || 0), completed: Number(oStats.totalRevenue || 0) },
        ordersCompleted: oStats.completed || 0,
        monthlyTotal: oStats.monthlyTotal || 0,
        monthlyCompleted: oStats.monthlyCompleted || 0,
        pendingFollowups: pStats.pendingFollowups || 0,
        appointments: apps.filter(a => a.status !== 'Canceled').length,
        pendingPayments: { amount: pendingAmount, count: pendingOrders.length },
        analysis: [
          { name: 'Confirmed', value: oStats.confirmed || 0, color: '#3b82f6' },
          { name: 'Cancelled', value: oStats.cancelled || 0, color: '#ef4444' },
          { name: 'In Prod', value: oStats.inProduction || 0, color: '#f97316' },
          { name: 'Completed', value: oStats.completed || 0, color: '#10b981' },
        ],
        clientOverview,
        recentOrders: ords.slice(0, 5)
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const { setShowPhoneSearch, renderModals, setShowCreateProspect } = useProspectFlow(user, fetchDashboardData);
  const { setShowOrderSearch, setSelectedOrder, setPaymentOrder, renderOrderModals } = useOrderFlow(user, fetchDashboardData);

  React.useEffect(() => {
    if (user?.token) fetchDashboardData();
  }, [user?.token]);

  const progressPercent = stats.target.assigned > 0 ? Math.min(100, Math.round((stats.target.completed / stats.target.assigned) * 100)) : 0;
  const remainingTarget = Math.max(0, stats.target.assigned - stats.target.completed);

  if (loading) return (
    <div className="flex h-[400px] items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      
      {/* ── Dashboard Hero: Revenue Command Center ────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-2xl">
        {/* Decorative Background Elements */}
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-blue-600/20 blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-indigo-600/10 blur-[100px]" />
        
        <div className="relative z-10 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-blue-400">Monthly Performance Pulse</h2>
              <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
                Keep Pushing, <span className="text-blue-400">{user?.name?.split(' ')[0] || 'Sales Exec'}!</span>
              </h1>
              <p className="mt-4 text-lg text-slate-400 max-w-md">
                You've achieved <span className="text-white font-bold">{progressPercent}%</span> of your revenue target. 
                Focus on high-priority follow-ups to close the gap.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setShowPhoneSearch(true)}
                className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 font-bold transition-all hover:bg-blue-500 hover:shadow-lg active:scale-95"
              >
                <UserPlus className="h-5 w-5" />
                <span>New Prospect</span>
              </button>
              <button 
                onClick={() => navigate('/orders')}
                className="flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3.5 font-bold backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
              >
                <Package className="h-5 w-5" />
                <span>View Orders</span>
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white/5 p-8 backdrop-blur-xl border border-white/10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Current Revenue</p>
                <h3 className="text-4xl font-black text-white mt-1">₹{stats.target.completed.toLocaleString()}</h3>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <Target className="h-8 w-8 text-blue-400" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-300">Monthly Target: ₹{stats.target.assigned.toLocaleString()}</span>
                <span className="text-blue-400">{progressPercent}%</span>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(37,99,235,0.5)]" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                Remaining: ₹{remainingTarget.toLocaleString()} to reach milestone
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Key Metrics Dashboard ────────────────────────────────────────── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Orders Completed" 
          value={stats.monthlyCompleted} 
          total={stats.monthlyTotal}
          subtext="Closed this month"
          icon={CheckCircle} 
          trend="+4 today"
          color="emerald"
          onClick={() => navigate('/followups?tab=orders')}
        />
        <MetricCard 
          title="Pending Follow-ups" 
          value={stats.pendingFollowups} 
          subtext="Action required"
          icon={PhoneCall} 
          trend="Urgent"
          color="amber"
          onClick={() => navigate('/followups')}
        />
        <MetricCard 
          title="Upcoming Appointments" 
          value={stats.appointments} 
          subtext="Scheduled meetings"
          icon={CalendarIcon} 
          trend="Next 7 days"
          color="indigo"
          onClick={() => navigate('/appointments')}
        />
        <MetricCard 
          title="Governance Approvals" 
          value={approvalCount} 
          subtext={`${approvalDetails.pending} Awaiting Manager · ${approvalDetails.rejected} Need Action`}
          icon={ShieldCheck} 
          trend={approvalDetails.rejected > 0 ? "Action Required" : "Awaiting Manager"}
          color={approvalDetails.rejected > 0 ? "rose" : "blue"}
          onClick={() => navigate('/approvals')}
        />
      </div>
      
      {/* ── Governance Tasks & Priority Alerts ────────────────────────────── */}
      <div className="rounded-[2.5rem] border bg-white p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Governance Hub</h3>
            <p className="text-sm font-semibold text-slate-500">Track approvals for your orders and payments.</p>
          </div>
          
          <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
            {['Orders', 'Payments'].map((tab) => {
              const count = tab === 'Orders' 
                ? approvalDetails.orders.filter(i => i.status === 'Pending').length 
                : approvalDetails.payments.filter(i => i.status === 'Pending').length;
              const rejectedCount = tab === 'Orders'
                ? approvalDetails.orders.filter(i => i.status === 'Rejected').length
                : approvalDetails.payments.filter(i => i.status === 'Rejected').length;

              return (
                <button 
                  key={tab} 
                  onClick={() => setActiveApprovalTab(tab)}
                  className={`relative px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeApprovalTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {tab}
                  {(count > 0 || rejectedCount > 0) && (
                    <span className={`ml-2 px-1.5 py-0.5 text-[10px] rounded-full ${rejectedCount > 0 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {count + rejectedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          {activeApprovalTab === 'Orders' ? (
            approvalDetails.orders.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed rounded-3xl bg-slate-50/50">
                <ShieldCheck className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No order approvals</p>
              </div>
            ) : (
              approvalDetails.orders.map((item) => (
                <div 
                  key={item._id} 
                  className={`group bg-white border rounded-3xl p-6 shadow-sm transition-all flex flex-wrap lg:flex-nowrap gap-6 items-center ${item.status === 'Rejected' ? 'border-red-100 bg-red-50/30' : ''}`}
                >
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-[10px] font-black text-blue-500 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-tighter">
                        {item.orderNumber}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className={`h-2 w-2 rounded-full ${item.status === 'Approved' ? 'bg-green-500' : item.status === 'Pending' ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${item.status === 'Approved' ? 'text-green-600' : item.status === 'Pending' ? 'text-red-600' : 'text-slate-500'}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-black text-slate-900 text-xl tracking-tight">{item.clientName}</h3>
                    {item.status === 'Rejected' && (
                      <p className="text-xs text-red-600 mt-2 font-bold bg-red-100/50 px-3 py-1 rounded-lg w-fit italic">
                        " {item.rejectionReason || 'Info correction required.'} "
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-8 px-6 border-x border-slate-100 h-12">
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Total</p>
                      <p className="font-black text-slate-900">₹{item.grandTotal?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Advance</p>
                      <p className="font-black text-blue-600">₹{item.advancePaid?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="ml-auto flex items-center gap-4">
                    <div className="px-4 py-2 bg-slate-50 border rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {item.status === 'Pending' ? 'Awaiting Manager' : 'Processed'}
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            approvalDetails.payments.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed rounded-3xl bg-slate-50/50">
                <IndianRupee className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No payment records</p>
              </div>
            ) : (
              approvalDetails.payments.map((p) => (
                <div 
                  key={p._id} 
                  className={`group bg-white border rounded-3xl p-6 shadow-sm transition-all flex flex-wrap lg:flex-nowrap gap-6 items-center ${p.status === 'Rejected' ? 'border-red-100 bg-red-50/30' : ''}`}
                >
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-[10px] font-black text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg uppercase tracking-tighter">
                        {p.paymentNumber}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className={`h-2 w-2 rounded-full ${p.status === 'Verified' ? 'bg-green-500' : p.status === 'Pending' ? 'bg-amber-400 animate-pulse' : 'bg-red-500'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${p.status === 'Verified' ? 'text-green-600' : p.status === 'Pending' ? 'text-amber-600' : 'text-red-600'}`}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-black text-slate-900 text-xl tracking-tight">{p.order?.clientSnapshot?.name || 'Client'}</h3>
                    {p.status === 'Rejected' && (
                      <p className="text-xs text-red-600 mt-2 font-bold bg-red-100/50 px-3 py-1 rounded-lg w-fit italic">
                        " {p.rejectionNote || 'Payment proof verification failed.'} "
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-8 px-6 border-x border-slate-100 h-12">
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Amount</p>
                      <p className="font-black text-emerald-600">₹{p.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Order</p>
                      <p className="font-black text-slate-900">#{p.order?.orderNumber}</p>
                    </div>
                  </div>

                  <div className="ml-auto">
                    <div className="px-4 py-2 bg-slate-50 border rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {p.status === 'Pending' ? 'Awaiting Verification' : `Payment ${p.status}`}
                    </div>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* ── Intelligence & Insights ──────────────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Funnel Intelligence */}
        <div className="lg:col-span-2 rounded-[2rem] border bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900">Sales Funnel Efficiency</h3>
              <p className="text-sm font-semibold text-slate-500">How your attributed orders are moving through the stages.</p>
            </div>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.analysis}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {stats.analysis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4">
              {stats.analysis.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-bold text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-lg font-black text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Client Rankings */}
        <div className="rounded-[2rem] border bg-white p-8 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-1">Top Clients</h3>
          <p className="text-sm font-semibold text-slate-500 mb-8">Highest contribution by volume.</p>
          
          <div className="space-y-6">
            {stats.clientOverview.map((client, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{client.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(client.orders / (stats.monthlyTotal || 1)) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{client.orders} orders</span>
                  </div>
                </div>
              </div>
            ))}
            {stats.clientOverview.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm font-bold text-slate-400 uppercase">No client data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Active Pipeline Table ────────────────────────────────────────── */}
      <div className="rounded-[2rem] border bg-white shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900">Recent Order Activity</h3>
            <p className="text-sm font-semibold text-slate-500">Real-time status of your latest orders.</p>
          </div>
          <button 
            onClick={() => navigate('/orders')}
            className="rounded-xl px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Manage Pipeline →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-8 py-5">Order ID</th>
                <th className="px-8 py-5">Client Name</th>
                <th className="px-8 py-5">Value</th>
                <th className="px-8 py-5">Execution Status</th>
                <th className="px-8 py-5 text-right">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recentOrders.map((order) => (
                <tr 
                  key={order._id} 
                  onClick={() => setSelectedOrder(order)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-8 py-6 font-mono font-bold text-blue-600">#{order.orderNumber}</td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-slate-900">{order.clientSnapshot?.name}</p>
                    <p className="text-xs font-semibold text-slate-500">{order.clientSnapshot?.company}</p>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-900">₹{order.grandTotal.toLocaleString()}</td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                      order.status === 'Confirmed' ? 'bg-blue-50 text-blue-600' :
                      order.status === 'In_Production' ? 'bg-orange-50 text-orange-600' :
                      order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${
                        order.status === 'Confirmed' ? 'bg-blue-600' :
                        order.status === 'In_Production' ? 'bg-orange-600' :
                        order.status === 'Completed' ? 'bg-emerald-600' :
                        'bg-slate-400'
                      }`} />
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col items-end">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div 
                          className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" 
                          style={{ width: `${Math.min(100, Math.round((order.totalPaid / order.grandTotal) * 100))}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 mt-2">₹{order.totalPaid.toLocaleString()} secured</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {renderModals()}
      {renderOrderModals()}
    </div>
  );
};

// ── Shared Metric Card Component ───────────────────────────────────────────
const MetricCard = ({ title, value, total, subtext, icon: Icon, color, trend, onClick }) => {
  const themes = {
    blue:    "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber:   "bg-amber-50 text-amber-600 border-amber-100",
    rose:    "bg-rose-50 text-rose-600 border-rose-100",
    indigo:  "bg-indigo-50 text-indigo-600 border-indigo-100",
  };

  return (
    <div 
      onClick={onClick}
      className={`group relative rounded-[2rem] border bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${themes[color] || themes.blue} border shadow-inner`}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${themes[color] || themes.blue}`}>
            {trend}
          </span>
        )}
      </div>
      
      <div className="mt-6">
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black text-slate-900">{value}</h3>
          {total !== undefined && <span className="text-lg font-bold text-slate-400">/ {total}</span>}
        </div>
        <p className="mt-1 text-sm font-bold text-slate-500 uppercase tracking-tighter">{title}</p>
        <p className="mt-4 text-xs font-semibold text-slate-400">{subtext}</p>
      </div>
      
      {/* Decorative Arrow on hover */}
      {onClick && (
        <div className="absolute bottom-6 right-6 h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:bg-blue-50">
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </div>
      )}
    </div>
  );
};

// ── Wrappers for Pages ──────────────────────────────────────────────────────────
export { SalesExecDashboard };

export const SalesProspects = () => {
  const { user } = useAuth();
  if (!user) return null;
  const [prospects, setProspects] = useState([]);
  
  const fetchProspects = async () => {
    try {
      const res = await prospectApi.list({}, user?.token);
      if (res.success) setProspects(res.data);
    } catch (err) {
      console.error('Error fetching prospects', err);
    }
  };

  React.useEffect(() => {
    fetchProspects();
  }, []);

  const { 
    setShowPhoneSearch, 
    setShowCreateProspect, 
    setShowQuotation, 
    setShowUpdateStatus, 
    setShowScheduleAppointment,
    renderModals, 
    setToastMsg 
  } = useProspectFlow(user, fetchProspects);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this lead?')) {
      try {
        await prospectApi.delete(id, user?.token);
        setToastMsg('Lead removed successfully!');
        setTimeout(() => setToastMsg(null), 3000);
        fetchProspects();
      } catch (err) {
        setToastMsg('Failed to remove lead');
        setTimeout(() => setToastMsg(null), 3000);
      }
    }
  };

  const handleBrochure = async (prospect) => {
    try {
      await prospectApi.update(prospect._id || prospect.id, { 
        whatsappActions: [...(prospect.whatsappActions || []), { action: 'Brochure', sentAt: new Date() }] 
      }, user?.token);
      setToastMsg(`Brochure sent to ${prospect.name} via WhatsApp!`);
      setTimeout(() => setToastMsg(null), 3000);
      fetchProspects();
    } catch(err) {
      console.error(err);
    }
  };

  const handleAppointment = (prospect) => {
    setShowScheduleAppointment(prospect);
  };

  const handleUpdateStage = async (id, newValue, field = 'status', prospect = null) => {
    if (field === 'status' && prospect) {
      setShowUpdateStatus({ prospect, newStatus: newValue });
    }
  };

  const handleAddRemark = async (prospect) => {
    setShowUpdateStatus({ prospect, newStatus: prospect.status || 'In-progress' });
  };

  const { renderOrderModals, setShowOrderSearch, setShowCreateOrder } = useOrderFlow(user, fetchProspects);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Prospective Clients</h1>
          <p className="text-muted-foreground">Manage your complete lead pipeline</p>
        </div>
        <button 
          onClick={() => setShowPhoneSearch(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 shadow-sm shrink-0"
          style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
        >
          <UserPlus className="h-4 w-4" /> Create Prospect
        </button>
      </div>
      <ProspectTable 
        prospects={prospects} 
        onWhatsApp={() => alert('Opening WhatsApp...')} 
        onInteract={() => alert('Opening Interaction Guide...')} 
        onCreateOrder={(p) => setShowCreateOrder({ phone: p.phone, company: p.company, contactPerson: p.name, location: p.requirement?.location })} 
        onEdit={(p) => setShowCreateProspect(p)}
        onDelete={handleDelete}
        onBrochure={handleBrochure}
        onQuotation={(p) => setShowQuotation(p)}
        onAppointment={handleAppointment}
        onUpdateStage={handleUpdateStage}
        onAddRemark={handleAddRemark}
      />
      {renderModals()}
      {renderOrderModals()}
    </div>
  );
};

export const SalesOrders = () => {
  const { user } = useAuth();
  if (!user) return null;
  const [orders, setOrders] = useState([]);
  
  const fetchOrders = async () => {
    try {
      const res = await orderApi.list({}, user?.token);
      if (res.success) setOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => { fetchOrders(); }, []);

  const { setShowOrderSearch, setSelectedOrder, setPaymentOrder, renderOrderModals } = useOrderFlow(user, fetchOrders);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>
          <p className="text-muted-foreground">Manage order status, services, overall cost, and track pending payment settlements.</p>
        </div>
        <button 
          onClick={() => setShowOrderSearch(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 shadow-sm shrink-0"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
        >
          <Plus className="h-4 w-4" /> Create Order
        </button>
      </div>
      <OrderList 
        orders={orders} 
        onCreateOrder={() => setShowOrderSearch(true)} 
        onUploadPayment={(o) => setPaymentOrder(o)} 
        onViewDetails={(o) => setSelectedOrder(o)}
        onLineItemUpdated={fetchOrders}
      />
      {renderOrderModals()}
    </div>
  );
};

export const SalesPayments = () => {
  const { user } = useAuth();
  if (!user) return null;
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await paymentApi.list({}, user.token);
      if (res.success) setPayments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchPayments(); }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Payment Collections</h1>
          <p className="text-muted-foreground">Track advance payments, installments, and final settlements with proofs.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3 flex flex-col items-end shadow-sm">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total Collected</span>
            <span className="text-xl font-black text-blue-600">₹{payments.reduce((s,p) => s + (p.status === 'Verified' ? p.amount : 0), 0).toLocaleString()}</span>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3 flex flex-col items-end shadow-sm">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Awaiting Verification</span>
            <span className="text-xl font-black text-amber-600">₹{payments.reduce((s,p) => s + (p.status === 'Pending' ? p.amount : 0), 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center text-muted-foreground">Loading payment ledger...</div>
      ) : payments.length === 0 ? (
        <div className="rounded-2xl border bg-white shadow-sm p-12 text-center text-muted-foreground">
          <IndianRupee className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-bold">No payments recorded yet.</p>
          <p className="text-sm">Payments uploaded via orders will appear here.</p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                <th className="px-6 py-4 text-left">Payment ID</th>
                <th className="px-6 py-4 text-left">Order</th>
                <th className="px-6 py-4 text-left">Client</th>
                <th className="px-6 py-4 text-left">Amount</th>
                <th className="px-6 py-4 text-left">Method</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map(p => (
                <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5 font-mono font-bold text-slate-400">{p.paymentNumber}</td>
                  <td className="px-6 py-5 font-bold text-blue-600">#{p.order?.orderNumber}</td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-slate-900">{p.order?.clientSnapshot?.name}</p>
                    <p className="text-[10px] text-slate-500">{p.order?.clientSnapshot?.company}</p>
                  </td>
                  <td className="px-6 py-5 font-black text-slate-900">₹{p.amount.toLocaleString()}</td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase">{p.method}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full ${p.status === 'Verified' ? 'bg-green-500' : p.status === 'Pending' ? 'bg-amber-400' : 'bg-red-500'}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${p.status === 'Verified' ? 'text-green-600' : p.status === 'Pending' ? 'text-amber-600' : 'text-red-600'}`}>
                        {p.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-500 font-medium">
                    {new Date(p.collectedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Follow-ups View ────────────────────────────────────────────────────────
export const SalesFollowups = () => {
  const { user } = useAuth();
  if (!user) return null;
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'prospects';
  const [prospects, setProspects] = useState([]);
  const [orders, setOrders] = useState([]);

  const fetchProspects = async () => {
    try {
      const res = await prospectApi.list({}, user?.token);
      if (res.success) {
        setProspects(res.data.filter(p => p.status === 'In-progress' && p.nextFollowUpDate));
      }
    } catch(err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await orderApi.list({}, user?.token);
      if (res.success) {
        setOrders(res.data);
      }
    } catch(err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    fetchProspects();
    fetchOrders();
  }, []);

  const { 
    setShowPhoneSearch, 
    setShowCreateProspect, 
    setShowQuotation, 
    setShowUpdateStatus, 
    setShowScheduleAppointment,
    renderModals, 
    setToastMsg 
  } = useProspectFlow(user, fetchProspects);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this lead?')) {
      try {
        await prospectApi.delete(id, user?.token);
        setToastMsg('Lead removed successfully!');
        setTimeout(() => setToastMsg(null), 3000);
        fetchProspects();
      } catch (err) {
        setToastMsg('Failed to remove lead');
        setTimeout(() => setToastMsg(null), 3000);
      }
    }
  };

  const handleBrochure = async (prospect) => {
    try {
      await prospectApi.update(prospect._id || prospect.id, { 
        whatsappActions: [...(prospect.whatsappActions || []), { action: 'Brochure', sentAt: new Date() }] 
      }, user?.token);
      setToastMsg(`Brochure sent to ${prospect.name} via WhatsApp!`);
      setTimeout(() => setToastMsg(null), 3000);
      fetchProspects();
    } catch(err) { console.error(err); }
  };

  const handleAppointment = (prospect) => {
    setShowScheduleAppointment(prospect);
  };

  const handleUpdateStage = async (id, newValue, field = 'status', prospect = null) => {
    if (field === 'status' && prospect) {
      setShowUpdateStatus({ prospect, newStatus: newValue });
    }
  };

  const handleAddRemark = async (prospect) => {
    setShowUpdateStatus({ prospect, newStatus: prospect.status || 'In-progress' });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          {activeTab === 'prospects' ? (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-blue-900">Prospect Follow-ups</h1>
              <p className="text-muted-foreground">Let's turn these leads into loyal clients! Reach out, build trust, and keep the momentum going. 🚀</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-blue-900">Order Follow-ups</h1>
              <p className="text-muted-foreground">Ensure smooth execution, provide updates, and secure those pending payments. Finish strong! 🏆</p>
            </>
          )}
        </div>
      </div>

      {activeTab === 'prospects' ? (
        <ProspectTable 
          prospects={prospects} 
          sortByFollowUp={true}
          onWhatsApp={() => alert('Opening WhatsApp...')} 
          onInteract={() => alert('Opening Interaction...')} 
          onCreateOrder={(p) => alert('Cannot create order directly from follow-up tab without initializing useOrderFlow yet. Please use My Orders.')} 
          onEdit={(p) => setShowCreateProspect(p)}
          onDelete={handleDelete}
          onBrochure={handleBrochure}
          onQuotation={(p) => setShowQuotation(p)}
          onAppointment={handleAppointment}
          onUpdateStage={handleUpdateStage}
          onAddRemark={handleAddRemark}
        />
      ) : (
        <OrderList 
          orders={orders} 
          hideCompleted={true}
          onCreateOrder={() => setShowPhoneSearch('order')} 
          onUploadPayment={() => alert('Opening Payment Upload...')} 
          onLineItemUpdated={fetchOrders}
        />
      )}
      {renderModals()}
    </div>
  );
};

// ── Appointments View ────────────────────────────────────────────────────────
export const SalesAppointments = () => {
  const { user } = useAuth();
  if (!user) return null;
  const [appointments, setAppointments] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(null);
  const [showRemarkModal, setShowRemarkModal] = useState(null);
  const [toast, setToast] = useState(null);
  
  const fetchAppointments = async () => {
    try {
      const res = await appointmentApi.list(user?.token);
      if (res.success) {
        setAppointments(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    fetchAppointments();
  }, [user]);

  const pendingCount = appointments.filter(a => !a.remark).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-blue-900 flex items-center gap-3">
            Upcoming Appointments
            <span className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full">{pendingCount} Pending</span>
          </h1>
          <p className="text-muted-foreground">Manage your scheduled meetings and track field executive remarks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appointments.map(apt => (
          <div key={apt._id} className="rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-start">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Business Name</span>
                <h3 className="font-bold text-base text-slate-800">{apt.businessName}</h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${apt.remark ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {apt.remark ? 'Updated' : apt.status}
              </span>
            </div>
            <div className="p-4 space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">Contact Person</p>
                  <p className="text-sm font-semibold">{apt.contactPerson}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">Phone</p>
                  <p className="text-sm font-semibold">{apt.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                <div>
                  <p className="text-[10px] font-bold uppercase text-blue-600/70 mb-0.5">Date</p>
                  <p className="text-sm font-bold text-blue-900">{new Date(apt.date).toLocaleDateString('en-GB')}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-blue-600/70 mb-0.5">Time</p>
                  <p className="text-sm font-bold text-blue-900">{apt.time}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">Venue/Address</p>
                <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border">{apt.venue}</p>
              </div>
            </div>
            
            <div className="p-4 border-t bg-slate-50 space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">Assigned To</p>
                {apt.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                      {apt.assignedTo.name.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold text-indigo-900">{apt.assignedTo.name} ({(apt.assignedTo.role || 'Exec').replace('_', ' ')})</span>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">Pending Assignment</span>
                )}
              </div>
              
              {apt.assignedTo && (
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">Executive Remark</p>
                  {apt.remark ? (
                    <div className="bg-green-50 text-green-800 text-sm p-3 rounded-lg border border-green-200 italic">
                      "{apt.remark}"
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-muted-foreground italic">Waiting for update...</p>
                      {user._id === apt.assignedTo._id && (
                        <button 
                          onClick={() => setShowRemarkModal(apt)}
                          className="w-full h-8 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm"
                        >
                          Update Visit Remark
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!apt.assignedTo && (['ADMIN', 'SALES_MANAGER', 'MD_CEO'].includes(user.role)) && (
                <button 
                  onClick={() => setShowAssignModal(apt)}
                  className="w-full h-9 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-blue-600 transition-all shadow-md mt-2"
                >
                  Assign Field Executive
                </button>
              )}
            </div>
          </div>
        ))}
        
        {showAssignModal && (
          <AssignAppointmentModal 
            appointment={showAssignModal} 
            onClose={() => setShowAssignModal(null)} 
            onAssigned={() => {
              setToast('Personnel assigned successfully!');
              fetchAppointments();
              setTimeout(() => setToast(null), 3000);
            }} 
          />
        )}

        {showRemarkModal && (
          <UpdateAppointmentRemarkModal 
            appointment={showRemarkModal} 
            onClose={() => setShowRemarkModal(null)} 
            onSaved={() => {
              setToast('Visit remark updated successfully!');
              fetchAppointments();
              setTimeout(() => setToast(null), 3000);
            }} 
          />
        )}

        {toast && (
          <div className="fixed top-4 right-4 z-[100] bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-sm font-bold">{toast}</span>
          </div>
        )}
        {appointments.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-white border border-dashed rounded-2xl">
            <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium text-slate-700">No appointments scheduled</p>
            <p className="text-sm mt-1">Schedule an appointment from the prospects table.</p>
          </div>
        )}
      </div>
    </div>
  );
};
