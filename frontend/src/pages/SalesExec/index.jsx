import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Target, CheckCircle, Clock, IndianRupee, Package, TrendingUp, AlertTriangle, PhoneCall, Calendar as CalendarIcon, Plus, UserPlus } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ProspectTable } from './components/ProspectTable';
import { OrderList, PaymentUploadModal, PhoneSearchModal, ProspectDetailsModal, CreateProspectModal, QuotationModal, UpdateStatusModal, ScheduleAppointmentModal, OrderSearchModal, OrderClientDetailsModal, CreateOrderModal } from './components/Panels';
import { prospectApi, orderApi, appointmentApi } from '../../services/api';

const useProspectFlow = (user, onSaved) => {
  const [showPhoneSearch, setShowPhoneSearch] = useState(false);
  const [showProspectDetails, setShowProspectDetails] = useState(null);
  const [showCreateProspect, setShowCreateProspect] = useState(null);
  const [showQuotation, setShowQuotation] = useState(null);
  const [showUpdateStatus, setShowUpdateStatus] = useState(null);
  const [showScheduleAppointment, setShowScheduleAppointment] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const handlePhoneSearch = async (phone) => {
    setShowPhoneSearch(false);
    try {
      const res = await prospectApi.searchPhone(phone, user?.token);
      if (res.found && res.data) {
        setShowProspectDetails(res.data);
      } else {
        setShowCreateProspect(phone);
      }
    } catch (err) {
      setToastMsg('Error searching phone');
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

      if (typeof showCreateProspect === 'object' && showCreateProspect._id) {
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
      setToastMsg('Failed to save prospect');
      setTimeout(() => setToastMsg(null), 3000);
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
          phone={typeof showCreateProspect === 'string' && showCreateProspect !== 'new' ? showCreateProspect : ''} 
          executiveName={user?.name || user?.username || 'Executive'}
          initialData={typeof showCreateProspect === 'object' ? showCreateProspect : null}
          onBack={() => setShowCreateProspect(null)} 
          onClose={() => setShowCreateProspect(null)}
          onSubmit={handleProspectSubmit} 
        />
      )}
      {showQuotation && (
        <QuotationModal 
          prospect={showQuotation} 
          onClose={() => setShowQuotation(null)} 
          onSubmit={async (data) => {
            try {
              await prospectApi.update(data.prospect._id || data.prospect.id, { 
                whatsappActions: [...(data.prospect.whatsappActions || []), { action: 'Quotation', sentAt: new Date() }] 
              }, user?.token);
              setToastMsg('Quotation sent via WhatsApp!');
              setTimeout(() => setToastMsg(null), 3000);
              setShowQuotation(null);
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
              } else if (data.status === 'Sale Closed') {
                payload.lastInteractionNote = `Sale Closed - Order ID: ${data.orderId}`;
                note = `Sale Closed - Order ID: ${data.orderId}`;
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
  const [toastMsg, setToastMsg] = useState(null);

  const handleOrderSearch = async (query) => {
    setShowOrderSearch(false);
    try {
      const res = await orderApi.searchClient(query, user?.token);
      if (res && res.found && res.data) {
        setShowOrderClientDetails(res.data);
      } else {
        const isPhone = /^\d+$/.test(query);
        setShowCreateOrder(isPhone ? { phone: query } : { company: query });
      }
    } catch (err) {
      const isPhone = /^\d+$/.test(query);
      setShowCreateOrder(isPhone ? { phone: query } : { company: query });
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
      setToastMsg('Failed to create order');
      setTimeout(() => setToastMsg(null), 3000);
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
    </>
  );

  return { setShowOrderSearch, renderOrderModals, setToastMsg };
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
  const navigate = useNavigate();
  const { setShowPhoneSearch, renderModals } = useProspectFlow(user);
  const { setShowOrderSearch, renderOrderModals } = useOrderFlow(user);

  // Mock Target Data (Would come from API based on Admin assignment)
  const targetData = {
    assigned: 0,
    completed: 0,
    ordersCompletedThisMonth: 0,
    pendingPaymentsAmount: 0,
    pendingPaymentsCount: 0,
    followups: 0,
    appointments: 0
  };

  const progressPercent = targetData.assigned > 0 ? Math.min(100, Math.round((targetData.completed / targetData.assigned) * 100)) : 0;

  // Chart Data
  const salesAnalysisData = [
    { name: 'Active Sales', value: 0, color: '#3b82f6' },
    { name: 'Cancelled', value: 0, color: '#1e293b' },
    { name: 'Pending', value: 0, color: '#f97316' },
    { name: 'Delivered', value: 0, color: '#e2e8f0' },
  ];

  const salesActivityData = [
    { name: 'Sun', value: 4 },
    { name: 'Mon', value: 2.5 },
    { name: 'Tue', value: 6 },
    { name: 'Wed', value: 4.2 },
    { name: 'Thu', value: 8 },
    { name: 'Fri', value: 5.8 },
    { name: 'Sat', value: 2 },
  ];

  const clientOverviewData = [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ── Header Actions ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back! Here's your sales overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowPhoneSearch(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-white border shadow-sm text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            <UserPlus className="h-4 w-4 text-blue-600" /> Create Prospect
          </button>
          <button 
            onClick={() => setShowOrderSearch(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            <Plus className="h-4 w-4" /> Create Order
          </button>
        </div>
      </div>

      {/* ── Targets & KPIs ─────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Revenue Target (Takes 2 cols) */}
        <div className="rounded-2xl border bg-white shadow-sm p-6 lg:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 opacity-50" />
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" /> Monthly Target
              </p>
              <div className="flex items-end gap-3 mt-2">
                <h3 className="text-4xl font-black tracking-tight text-blue-900">₹{targetData.completed.toLocaleString()}</h3>
                <span className="text-lg font-bold text-muted-foreground mb-1">/ ₹{targetData.assigned.toLocaleString()}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-bold">
                <TrendingUp className="h-4 w-4" /> {progressPercent}% Achieved
              </span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative h-4 w-full rounded-full bg-muted overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)' }}
            />
          </div>
          <p className="text-sm font-medium text-muted-foreground mt-3">
            ₹{(targetData.assigned - targetData.completed).toLocaleString()} remaining to hit target.
          </p>
        </div>

        {/* Orders Completed */}
        <KpiCard 
          title="Orders Completed" 
          value={targetData.ordersCompletedThisMonth} 
          subtext="Total fulfilled this month"
          icon={Package} 
          color="bg-purple-100 text-purple-600" 
        />

        {/* NEW: Follow-ups */}
        <KpiCard 
          title="Pending Follow-ups" 
          value={targetData.followups} 
          subtext="Requires action today"
          icon={PhoneCall} 
          color="bg-blue-100 text-blue-600" 
          onClick={() => navigate('/followups')}
        />

        {/* NEW: Appointments */}
        <KpiCard 
          title="Upcoming Appointments" 
          value={targetData.appointments} 
          subtext="Scheduled for this week"
          icon={CalendarIcon} 
          color="bg-indigo-100 text-indigo-600" 
          onClick={() => navigate('/appointments')}
        />

        {/* Pending Payments Alert */}
        <KpiCard 
          title="Pending Payments" 
          value={`₹${targetData.pendingPaymentsAmount.toLocaleString()}`} 
          subtext={`${targetData.pendingPaymentsCount} orders waiting for settlement`}
          icon={AlertTriangle} 
          color="bg-amber-100 text-amber-600" 
          onClick={() => navigate('/orders')}
        />
      </div>

      {/* ── Charts Grid ────────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sales Analysis (Donut) */}
        <div className="rounded-2xl border bg-white shadow-sm p-5 lg:col-span-1 flex flex-col">
          <h3 className="font-bold text-lg mb-4 text-slate-800">Sales Analysis</h3>
          <div className="h-[200px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={salesAnalysisData} innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                  {salesAnalysisData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 shrink-0">
            {salesAnalysisData.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <div className="h-3 w-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>

        {/* Client Overview Chart + Summary */}
        <div className="rounded-2xl border bg-white shadow-sm p-5 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-slate-800">Client Overview - Apr 2026</h3>
            <span className="font-bold text-blue-700 text-sm">Total Amount: ₹0</span>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 flex-1">
            {/* Chart */}
            <div className="flex-1 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientOverviewData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(value) => [`${value} orders`, 'Orders']} />
                  <Bar dataKey="orders" radius={[2, 2, 0, 0]} barSize={40}>
                    {clientOverviewData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Summary */}
            <div className="w-full md:w-56 shrink-0 flex flex-col justify-center">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="font-bold text-blue-700 text-sm">Total Clients</span>
                <span className="font-black text-blue-700 text-lg">0</span>
              </div>
              <div className="space-y-3 pt-3">
                {clientOverviewData.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">No client orders yet</div>
                ) : (
                  clientOverviewData.map((client, idx) => (
                    <div key={idx} className="flex justify-between text-sm font-semibold text-slate-700">
                      <span className="text-xs truncate" title={client.name}>{client.name}:</span>
                      <span className="text-blue-500 text-xs text-right w-12">{client.orders}</span>
                      <span className="text-emerald-600 text-xs text-right w-16">₹{client.amount?.toLocaleString('en-IN') || 0}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Active Orders Summary ────────────────────────────────────── */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b flex justify-between items-center bg-muted/20">
          <div>
            <h3 className="font-bold text-lg">Recent Order List</h3>
            <p className="text-sm text-muted-foreground">Track order services, installments, and payment settlements.</p>
          </div>
          <button 
            onClick={() => navigate('/orders')} 
            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            View All Orders →
          </button>
        </div>
        <div className="p-0">
          <OrderList orders={[]} onCreateOrder={() => setShowOrderSearch(true)} onUploadPayment={() => {}} compact={true} />
        </div>
      </div>

      {renderModals()}
      {renderOrderModals()}
    </div>
  );
};

// ── Wrappers for Pages ──────────────────────────────────────────────────────────
export { SalesExecDashboard };

export const SalesProspects = () => {
  const { user } = useAuth();
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

  const { renderOrderModals, setShowOrderSearch } = useOrderFlow(user, fetchProspects);

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
        onCreateOrder={(p) => setShowOrderSearch(p.phone || true)} 
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

  const { setShowOrderSearch, renderOrderModals } = useOrderFlow(user, fetchOrders);

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
      <OrderList orders={orders} onCreateOrder={() => setShowOrderSearch(true)} onUploadPayment={() => alert('Opening Payment Upload...')} />
      {renderOrderModals()}
    </div>
  );
};

export const SalesPayments = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Payment Collections</h1>
        <p className="text-muted-foreground">Track advance payments, installments, and final settlements with proofs.</p>
      </div>
      <div className="rounded-2xl border bg-white shadow-sm p-8 text-center text-muted-foreground">
        <IndianRupee className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p>Full Payment Ledger will be rendered here. You can upload Cash/UPI/Bank proofs.</p>
      </div>
    </div>
  );
};

// ── Follow-ups View ────────────────────────────────────────────────────────
export const SalesFollowups = () => {
  const { user } = useAuth();
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
          onCreateOrder={() => setShowPhoneSearch('order')} 
          onUploadPayment={() => alert('Opening Payment Upload...')} 
        />
      )}
      {renderModals()}
    </div>
  );
};

// ── Appointments View ────────────────────────────────────────────────────────
export const SalesAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  
  React.useEffect(() => {
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
                    <span className="text-sm font-semibold text-indigo-900">{apt.assignedTo.name} ({apt.assignedTo.role.replace('_', ' ')})</span>
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
                    <p className="text-xs text-muted-foreground italic">Waiting for update...</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
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
