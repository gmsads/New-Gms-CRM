import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { 
  Target, CheckCircle, Clock, IndianRupee, Package, 
  TrendingUp, Calendar as CalendarIcon, Plus, UserPlus, 
  ShieldCheck, PhoneCall, RefreshCw, X, Quote,
  ChevronRight, Search, Filter, FileText, Send, History, Eye, ExternalLink, MoreVertical,
  BarChart2 as BarChartIcon, MapPin, Phone, AlertCircle, MessageCircle, Users
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { 
  prospectApi, orderApi, appointmentApi, 
  paymentApi, approvalApi, brochureApi,
  quotationApi, leaveApi 
} from '../../../services/api';
import { 
  BrochureCard, 
  BrochureManager, 
  BrochureHistoryTable, 
  SendBrochureModal,
  BrochureSelectorModal
} from '../components/BrochureSystem';
import { QuotationTemplateSettings } from '../components/QuotationTemplateSettings';
import { QuotationAnalytics } from '../components/QuotationAnalytics';
import { ProspectTable } from '../components/ProspectTable';
import { 
  OrderList, PaymentUploadModal, OrderDetailsModal, 
  PhoneSearchModal, ProspectDetailsModal, CreateProspectModal, 
  UpdateStatusModal, ScheduleAppointmentModal, 
  OrderSearchModal, OrderClientDetailsModal, CreateOrderModal,
  AssignAppointmentModal, UpdateAppointmentRemarkModal,
  ViewQuotationModal
} from '../components/Panels';
import QuotationBuilder from '../../../pages/SalesExec/components/QuotationBuilder';
import { useProspectFlow, useOrderFlow } from '../hooks/useSalesFlows';

// ── Motivational Quote Component ───────────────────────────────────────────
const MotivationalQuote = () => {
  const quotes = [
    "Success is the sum of small efforts, repeated day-in and day-out.",
    "The only way to do great work is to love what you do.",
    "Don't watch the clock; do what it does. Keep going.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Action is the foundational key to all success."
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % quotes.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [quotes.length]);

  return (
    <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/50 animate-in fade-in slide-in-from-left duration-1000">
      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
        <Quote className="h-5 w-5 text-blue-500" />
      </div>
      <p className="text-sm font-bold text-slate-600 italic tracking-tight">
        "{quotes[index]}"
      </p>
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
      
      {onClick && (
        <div className="absolute bottom-6 right-6 h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:bg-blue-50">
          <ChevronRight className="h-4 w-4 text-blue-500" />
        </div>
      )}
    </div>
  );
};

// ── Modals Renderer Helper ──────────────────────────────────────────────────
const ModalsRenderer = ({ prospectFlow, orderFlow, user, hideVerification }) => (
  <>
    {prospectFlow.showPhoneSearch && <PhoneSearchModal onClose={() => prospectFlow.setShowPhoneSearch(false)} onSearch={prospectFlow.handlePhoneSearch} />}
    {prospectFlow.showProspectDetails && (
      <ProspectDetailsModal 
        prospect={prospectFlow.showProspectDetails} 
        onBack={() => { prospectFlow.setShowProspectDetails(null); prospectFlow.setShowPhoneSearch(false); }} 
        onCreateNew={() => { 
          prospectFlow.setShowCreateProspect({ 
            phone: prospectFlow.showProspectDetails.phone || prospectFlow.showProspectDetails.phoneNumber, 
            company: prospectFlow.showProspectDetails.company || prospectFlow.showProspectDetails.businessName 
          });
          prospectFlow.setShowProspectDetails(null);
        }}
        onClose={() => prospectFlow.setShowProspectDetails(null)}
      />
    )}
    {prospectFlow.showCreateProspect && (
      <CreateProspectModal 
        phone={prospectFlow.showCreateProspect?.phone || ''} 
        company={prospectFlow.showCreateProspect?.company || ''} 
        executiveName={user?.name}
        initialData={prospectFlow.showCreateProspect?._id ? prospectFlow.showCreateProspect : null}
        onBack={() => prospectFlow.setShowCreateProspect(null)} 
        onClose={() => prospectFlow.setShowCreateProspect(null)}
        onSubmit={prospectFlow.handleProspectSubmit} 
      />
    )}
    {prospectFlow.showQuotation && (
      <QuotationBuilder 
        prospect={prospectFlow.showQuotation} 
        onClose={() => prospectFlow.setShowQuotation(null)} 
        onSave={async (savedQuotation) => {
          try {
            await prospectApi.update(prospectFlow.showQuotation._id || prospectFlow.showQuotation.id, { 
              whatsappActions: [...(prospectFlow.showQuotation.whatsappActions || []), { action: 'Quotation', sentAt: new Date() }] 
            }, user?.token);
            prospectFlow.setToastMsg(savedQuotation?.status === 'Sent' ? 'Quotation sent via WhatsApp!' : 'Quotation saved successfully!');
            setTimeout(() => prospectFlow.setToastMsg(null), 3000);
            if (prospectFlow.onSaved) prospectFlow.onSaved();
          } catch(err) {
            console.error(err);
          }
        }} 
      />
    )}
    {prospectFlow.showScheduleAppointment && (
      <ScheduleAppointmentModal 
        prospect={prospectFlow.showScheduleAppointment} 
        onClose={() => prospectFlow.setShowScheduleAppointment(null)} 
        onSaved={() => {
          prospectFlow.setToastMsg('Appointment scheduled!');
          setTimeout(() => prospectFlow.setToastMsg(null), 3000);
        }} 
      />
    )}
    {prospectFlow.showUpdateStatus && (
      <UpdateStatusModal 
        prospect={prospectFlow.showUpdateStatus} 
        newStatus={prospectFlow.showUpdateStatus.newStatus}
        onClose={() => prospectFlow.setShowUpdateStatus(null)}
        onSubmit={prospectFlow.handleStatusSubmit}
      />
    )}


    {orderFlow.showOrderSearch && <OrderSearchModal onClose={() => orderFlow.setShowOrderSearch(false)} onSearch={orderFlow.handleOrderSearch} />}
    {orderFlow.showOrderClientDetails && (
      <OrderClientDetailsModal 
        client={orderFlow.showOrderClientDetails}
        onBack={() => { orderFlow.setShowOrderClientDetails(null); orderFlow.setShowOrderSearch(true); }}
        onCreateOrder={(c) => { orderFlow.setShowCreateOrder(c); orderFlow.setShowOrderClientDetails(null); }}
        onClose={() => orderFlow.setShowOrderClientDetails(null)}
      />
    )}
    {orderFlow.showCreateOrder && (
      <CreateOrderModal 
        client={orderFlow.showCreateOrder} 
        executiveName={user?.name}
        onClose={() => orderFlow.setShowCreateOrder(null)}
        onSubmit={orderFlow.handleOrderSubmit} 
      />
    )}
    {orderFlow.selectedOrder && (
      <OrderDetailsModal 
        orderId={orderFlow.selectedOrder._id || orderFlow.selectedOrder.id} 
        onClose={() => orderFlow.setSelectedOrder(null)}
        onPaymentUpload={(o) => { orderFlow.setSelectedOrder(null); orderFlow.setPaymentOrder(o); }}
        onVerificationSuccess={() => {
          orderFlow.setSelectedOrder(null);
          if (orderFlow.fetch) orderFlow.fetch();
        }}
        hideVerification={hideVerification}
      />
    )}
    {orderFlow.paymentOrder && (
      <PaymentUploadModal 
        order={orderFlow.paymentOrder} 
        onClose={() => orderFlow.setPaymentOrder(null)} 
        onSubmit={(data) => orderFlow.handlePaymentSubmit(data)}
      />
    )}
  </>
);

// ── Components ───────────────────────────────────────────────────────────────
const ExecDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  const [stats, setStats] = useState({
    target: { assigned: 500000, completed: 0 },
    monthlyCompleted: 0,
    monthlyTotal: 0,
    pendingFollowups: 0,
    appointments: 0,
    recentOrders: [],
    paymentAnalysis: [],
    orderTypeAnalysis: [],
    topBrochures: []
  });

  const [approvalCount, setApprovalCount] = useState(0);

  const [showUnifiedAlert, setShowUnifiedAlert] = useState(true);

  const fetchDashboardData = async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const p = ['SALES_MANAGER', 'SR_SALES_MANAGER'].includes(user?.role) ? { salesExec: user._id } : {};
      const [orderStats, prospectStats, appointments, orders, approvals, brochures, qtnRes] = await Promise.all([
        orderApi.stats(p, user.token).catch(() => ({ data: {} })),
        prospectApi.stats(p, user.token).catch(() => ({ data: {} })),
        appointmentApi.list(p, user.token).catch(() => ({ data: [] })),
        orderApi.list({ ...p, limit: 100 }, user.token).catch(() => ({ data: [] })),
        approvalApi.stats(user.token).catch(() => ({ pendingCount: 0 })),
        brochureApi.list({ ...p, limit: 4 }, user.token).catch(() => ({ data: [] })),
        quotationApi.list(p, user.token).catch(() => ({ data: [] }))
      ]);

      setApprovalCount(approvals.pendingCount || 0);

      const oStats = orderStats.data || {};
      const pStats = prospectStats.data || {};
      const ords = orders.data || [];

      let realTarget = null;
      try {
        const tRes = await targetApi.list({ status: 'Pending,In Progress', limit: 1 }, user.token);
        if (tRes?.success && tRes.data?.length > 0) {
          realTarget = tRes.data[0];
        }
      } catch (e) {
        console.error('Failed to fetch real target', e);
      }

      // Payment Analysis (Round Chart)
      const totalAmount = ords.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
      const totalPaid = ords.reduce((sum, o) => sum + (o.totalPaid || 0), 0);
      const totalPending = totalAmount - totalPaid;

      const paymentAnalysis = [
        { name: 'Received', value: totalPaid, color: '#10b981' },
        { name: 'Pending', value: totalPending, color: '#ef4444' }
      ];

      // Order Type Analysis (Bar Chart)
      const types = ['retail', 'renewal', 'corporate', 'corporate-renewal', 'agent', 'agent-renewal'];
      const orderTypeAnalysis = types.map(type => {
        const typeOrders = ords.filter(o => (o.orderType || '').toLowerCase() === type);
        return {
          name: type.charAt(0).toUpperCase() + type.slice(1),
          amount: typeOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0),
          orders: typeOrders.length
        };
      });

      const todayStr = new Date().toISOString().split('T')[0];
      const todayAppts = (appointments.data || []).filter(a => a.date && a.date.startsWith(todayStr) && a.status !== 'Completed').length;
      const todayOrders = ords.filter(o => o.paymentStatus === 'Pending' || o.status === 'Pending_Approval').length;
      const todayFollowups = pStats.pendingFollowups || 0; // Using pendingFollowups as proxy if todayFollowups not in stats

      setStats({
        realTarget,
        target: { assigned: oStats.monthlyTarget || 500000, completed: oStats.totalRevenue || 0 },
        monthlyCompleted: oStats.monthlyCompleted || 0,
        monthlyTotal: oStats.monthlyTotal || 0,
        pendingFollowups: pStats.pendingFollowups || 0,
        appointments: (appointments.data || []).filter(a => a.status !== 'Canceled').length,
        recentOrders: ords.slice(0, 5),
        quotationsCount: (qtnRes.data || []).length,
        paymentAnalysis,
        orderTypeAnalysis,
        topBrochures: brochures.data || [],
        unifiedAlert: {
          followups: todayFollowups,
          appointments: todayAppts,
          orderFollowups: todayOrders,
          total: todayFollowups + todayAppts + todayOrders
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const prospectFlow = useProspectFlow(user, fetchDashboardData);
  const orderFlow = useOrderFlow(user, fetchDashboardData);

  useEffect(() => { if (user?.token) fetchDashboardData(); }, [user?.token]);

  const progressPercent = stats.realTarget 
    ? (stats.realTarget.progressPercent || 0)
    : (stats.target.assigned > 0 ? Math.min(100, Math.round((stats.target.completed / stats.target.assigned) * 100)) : 0);
  
  const getProgressBarColor = (pct) => {
    if (pct < 40) return 'bg-rose-500';
    if (pct < 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getRoleBasedQuote = (role) => {
    const quotes = {
      'SALES_EXEC': "Every 'No' brings you closer to a 'Yes'. Keep pushing, top closer!",
      'SR_SALES_EXEC': "Your experience is your greatest asset. Lead by example and crush those targets!",
      'FIELD_EXEC': "The pavement you pound today paves the road to your success tomorrow.",
      'TELE_EXEC': "Your voice is your most powerful tool. Make every call count!",
      'SALES_MANAGER': "Great leaders inspire great results. Empower your team to victory!",
      'BRANCH_HEAD': "Vision and execution go hand in hand. Steer your branch to the top!"
    };
    return quotes[role] || "Success is the sum of small efforts, repeated day-in and day-out.";
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {showUnifiedAlert && stats.unifiedAlert?.total > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden transform animate-in zoom-in-95">
            <div className="bg-amber-500 p-6 text-white text-center relative">
              <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">TODAY'S PENDING ACTIVITIES</h2>
              <p className="font-medium text-amber-100 mt-1">You have {stats.unifiedAlert.total} activities due today!</p>
              <button onClick={() => setShowUnifiedAlert(false)} className="absolute top-4 right-4 text-amber-100 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4 bg-slate-50">
              {stats.unifiedAlert.followups > 0 && (
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:border-blue-300 transition-colors" onClick={() => { setShowUnifiedAlert(false); navigate('/followups'); }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center"><PhoneCall className="h-6 w-6 text-blue-600"/></div>
                    <div>
                      <h4 className="font-bold text-slate-800">Follow-Ups</h4>
                      <p className="text-xs text-slate-500 font-medium">Pending calls & emails</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-blue-600">{stats.unifiedAlert.followups}</span>
                </div>
              )}
              {stats.unifiedAlert.appointments > 0 && (
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => { setShowUnifiedAlert(false); navigate('/appointments'); }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center"><CalendarIcon className="h-6 w-6 text-indigo-600"/></div>
                    <div>
                      <h4 className="font-bold text-slate-800">Appointments</h4>
                      <p className="text-xs text-slate-500 font-medium">Scheduled meetings</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-indigo-600">{stats.unifiedAlert.appointments}</span>
                </div>
              )}
              {stats.unifiedAlert.orderFollowups > 0 && (
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:border-emerald-300 transition-colors" onClick={() => { setShowUnifiedAlert(false); navigate('/orders'); }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center"><Package className="h-6 w-6 text-emerald-600"/></div>
                    <div>
                      <h4 className="font-bold text-slate-800">Order Follow-Ups</h4>
                      <p className="text-xs text-slate-500 font-medium">Pending payments / approvals</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-emerald-600">{stats.unifiedAlert.orderFollowups}</span>
                </div>
              )}
            </div>
            <div className="p-4 bg-white border-t border-slate-100">
              <button onClick={() => setShowUnifiedAlert(false)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                Let's Get to Work!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Motivational Quote */}
      <MotivationalQuote />

      {/* Global Toast */}
      {(prospectFlow.toastMsg || orderFlow.toastMsg) && (
        <div className="fixed top-24 right-8 z-[100] bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-black shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-8 border border-white/10">
          <CheckCircle className="h-6 w-6 text-emerald-400" /> 
          <span className="tracking-tight">{prospectFlow.toastMsg || orderFlow.toastMsg}</span>
        </div>
      )}

      {/* Enhanced Target Card (Hero Section) */}
      <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-10 text-white shadow-2xl">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8">
            <div>
              <h3 className="text-3xl font-black tracking-tight mb-2">Keep Pushing, <span className="text-blue-400">{user?.name?.split(' ')[0]}!</span></h3>
              <p className="text-lg text-slate-400 font-medium tracking-tight italic">"{getRoleBasedQuote(user?.role)}"</p>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => prospectFlow.setShowPhoneSearch(true)} 
                className="flex-1 bg-blue-600 px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-xl shadow-blue-900/20"
              >
                <Plus className="h-5 w-5" /> New Prospect
              </button>
              <button 
                onClick={() => orderFlow.setShowOrderSearch(true)} 
                className="flex-1 bg-white/10 px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 backdrop-blur-md hover:bg-white/20 transition-all shadow-xl"
              >
                <Plus className="h-5 w-5" /> New Order
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all duration-700 group-hover:bg-blue-500/20" />
            
            <div className="flex justify-between items-center relative z-10">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">Current Assigned Target</span>
                {stats.realTarget && (
                  <h4 className="text-lg font-bold text-white mt-1">
                    {stats.realTarget.title} <span className="text-sm font-medium text-slate-400 ml-2 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">{stats.realTarget.period}</span>
                  </h4>
                )}
                {!stats.realTarget && <h4 className="text-lg font-bold text-white mt-1">Revenue Target</h4>}
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                <Target className="text-blue-400 h-6 w-6" />
              </div>
            </div>
            
            <div className="flex items-baseline gap-4 mt-8 relative z-10">
              <span className="text-7xl font-black tracking-tighter text-white drop-shadow-lg">
                {progressPercent}<span className="text-4xl text-slate-400">%</span>
              </span>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Achieved</span>
            </div>

            <div className="space-y-4 mt-8 relative z-10">
              <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden p-1 shadow-inner border border-slate-800">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(59,130,246,0.5)] ${getProgressBarColor(progressPercent)}`} 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-300">
                <span>
                  {stats.realTarget 
                    ? (stats.realTarget.targetType === 'Revenue Target' || stats.realTarget.targetType === 'Collection Target' ? '₹' : '') + stats.realTarget.achievedValue.toLocaleString('en-IN')
                    : `₹${stats.target.completed.toLocaleString('en-IN')}`} completed
                </span>
                <span className="text-slate-500">
                  Target: {stats.realTarget 
                    ? (stats.realTarget.targetType === 'Revenue Target' || stats.realTarget.targetType === 'Collection Target' ? '₹' : '') + stats.realTarget.targetValue.toLocaleString('en-IN')
                    : `₹${stats.target.assigned.toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Completed Orders" 
          value={stats.monthlyCompleted} 
          total={stats.monthlyTotal}
          icon={CheckCircle} 
          color="emerald" 
          subtext="Orders delivered this month"
          onClick={() => navigate('/orders')} 
        />
        <MetricCard 
          title="Pending Follow-ups" 
          value={stats.pendingFollowups} 
          icon={PhoneCall} 
          color="amber" 
          subtext="Calls due for today/past"
          onClick={() => navigate('/followups')} 
        />
        <MetricCard 
          title="Upcoming Appts" 
          value={stats.appointments} 
          icon={CalendarIcon} 
          color="indigo" 
          subtext="Scheduled site visits"
          onClick={() => navigate('/appointments')} 
        />
        <MetricCard 
          title="Quotations" 
          value={stats.quotationsCount || 0} 
          icon={Quote} 
          color="blue" 
          subtext="Quotations sent this month"
          onClick={() => navigate('/quotations')} 
        />
        <MetricCard 
          title="My Approvals" 
          value={approvalCount} 
          icon={ShieldCheck} 
          color="rose" 
          subtext="Pending verification"
          onClick={() => navigate('/approvals')} 
        />
      </div>

      {/* Quick Catalog Share Widget */}
      <div className="bg-white rounded-[2.5rem] border p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Send className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Quick Catalog Share</h3>
          </div>
          <button onClick={() => navigate('/brochures')} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
            Browse All <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.topBrochures?.length > 0 ? stats.topBrochures?.slice(0, 4).map(b => (
            <div key={b._id} className="group cursor-pointer" onClick={() => navigate('/brochures')}>
              <div className="aspect-[4/3] rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden relative mb-3">
                {b.thumbnailUrl ? <img src={b.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><FileText className="h-8 w-8 text-slate-300" /></div>}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-white text-slate-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Select</span>
                </div>
              </div>
              <p className="text-xs font-black text-slate-900 line-clamp-1">{b.title}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{b.category}</p>
            </div>
          )) : (
            <div className="col-span-full py-8 text-center text-slate-400 italic text-sm">No catalogs available.</div>
          )}
        </div>
      </div>

      {/* Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Analysis - Round Chart */}
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] border p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900">Payment Analysis</h3>
            <IndianRupee className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.paymentAnalysis}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.paymentAnalysis.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  formatter={(value) => `₹${value.toLocaleString()}`}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-4 border-t space-y-3">
             <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-500">Total Pipeline:</span>
                <span className="font-black text-slate-900">₹{(stats.paymentAnalysis.reduce((s, a) => s + a.value, 0)).toLocaleString()}</span>
             </div>
          </div>
        </div>

        {/* Client Overview - Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900">Client Overview by Order Type</h3>
            <BarChartIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.orderTypeAnalysis}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  formatter={(value) => `₹${value.toLocaleString()}`}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={40}>
                  {stats.orderTypeAnalysis.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 pt-4 border-t">
            {stats.orderTypeAnalysis.map((type, i) => (
              <div key={i} className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{type.name}</p>
                <p className="text-sm font-black text-slate-900 mt-1">₹{type.amount / 1000}k</p>
                <p className="text-[9px] font-bold text-blue-500">{type.orders} orders</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="rounded-[2.5rem] border bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black">Recent Order Activity</h3>
          <button onClick={() => navigate('/orders')} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
            View All <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] uppercase font-bold text-slate-400">
              <tr><th className="pb-4">Order ID</th><th className="pb-4">Client</th><th className="pb-4">Value</th><th className="pb-4">Status</th></tr>
            </thead>
            <tbody className="divide-y">
              {stats.recentOrders.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-slate-400 font-medium italic">No recent orders found</td></tr>
              ) : stats.recentOrders.map(o => (
                <tr key={o._id || o.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => orderFlow.setSelectedOrder(o)}>
                  <td className="py-4 font-mono font-bold text-blue-600 group-hover:translate-x-1 transition-transform">#{o.orderNumber}</td>
                  <td className="py-4 font-bold text-slate-700">{o.clientSnapshot?.name || o.client}</td>
                  <td className="py-4 font-black text-slate-900">₹{o.grandTotal?.toLocaleString() || o.amount?.toLocaleString()}</td>
                  <td className="py-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${o.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'}`}>{o.status?.replace('_', ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ModalsRenderer prospectFlow={prospectFlow} orderFlow={orderFlow} user={user} />
    </div>
  );
};

// ── Sub-Page Wrappers ────────────────────────────────────────────────────────
export const SalesProspects = ({ isTeamMode = false, globalFilters = {} }) => {
  const { user } = useAuth();
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => { 
    if (!user?.token) return;
    setLoading(true);
    try {
      let params = {};
      if (!isTeamMode && ['SALES_MANAGER', 'SR_SALES_MANAGER'].includes(user?.role)) {
        params.salesExec = user._id;
        params.assignedTo = user._id;
      }
      if (isTeamMode) {
        if (globalFilters.employee) params.salesExec = globalFilters.employee;
        if (globalFilters.search) params.search = globalFilters.search;
      }
      const res = await prospectApi.list(params, user.token); 
      if (res.success) setProspects(res.data || []); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [JSON.stringify(globalFilters)]);
  const pFlow = useProspectFlow(user, fetch);
  const oFlow = useOrderFlow(user, fetch);

  if (!user) return null;
  if (loading) return <div className="flex h-96 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Prospective Clients</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage your leads and sales pipeline</p>
        </div>
        {!isTeamMode && (
          <button onClick={() => pFlow.setShowPhoneSearch(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100">
            <Plus className="h-5 w-5" /> New Prospect
          </button>
        )}
      </div>
      <ProspectTable 
        prospects={prospects} 
        onEdit={pFlow.setShowCreateProspect} 
        onQuotation={pFlow.setShowQuotation} 
        onAppointment={pFlow.setShowScheduleAppointment} 
        onCreateOrder={oFlow.setShowCreateOrder}
        onUpdateStage={pFlow.handleUpdateStage}
        onDelete={pFlow.handleDeleteProspect}
      />
      <ModalsRenderer prospectFlow={pFlow} orderFlow={oFlow} user={user} />
    </div>
  );
};

export const SalesOrders = ({ isTeamMode = false, globalFilters = {} }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => { 
    if (!user?.token) return;
    setLoading(true);
    try {
      let params = {};
      if (!isTeamMode && ['SALES_MANAGER', 'SR_SALES_MANAGER'].includes(user?.role)) {
        params.salesExec = user._id;
        params.assignedTo = user._id;
      }
      if (isTeamMode) {
        if (globalFilters.employee) params.salesExec = globalFilters.employee;
        if (globalFilters.search) params.search = globalFilters.search;
      }
      const res = await orderApi.list(params, user.token); 
      if (res.success) setOrders(res.data); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [JSON.stringify(globalFilters)]);
  const oFlow = useOrderFlow(user, fetch);

  if (!user) return null;
  if (loading) return <div className="flex h-96 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Orders</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Track order status and payments</p>
        </div>
        {!isTeamMode && (
          <button onClick={() => oFlow.setShowOrderSearch(true)} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100">
            <Plus className="h-5 w-5" /> New Order
          </button>
        )}
      </div>
      <OrderList 
        orders={orders} 
        onUploadPayment={oFlow.setPaymentOrder} 
        onViewDetails={oFlow.setSelectedOrder} 
        onLineItemUpdated={fetch}
        hideVerification={isTeamMode}
      />
      <ModalsRenderer prospectFlow={{}} orderFlow={oFlow} user={user} hideVerification={isTeamMode} />
    </div>
  );
};

export const SalesPayments = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  if (!user) return null;

  useEffect(() => { 
    leaveApi.list({}, user.token).then(res => {
      if (res.success || res.leaves) setLeaves(res.leaves || res.data || []);
      setLoading(false);
    }); 
  }, []);

  if (loading) return <div className="flex h-96 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900">Leave Requests</h1>
      <div className="bg-white rounded-[2rem] border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-5 text-left">Type</th>
              <th className="p-5 text-left">From Date</th>
              <th className="p-5 text-left">To Date</th>
              <th className="p-5 text-left">Total Days</th>
              <th className="p-5 text-left">Reason</th>
              <th className="p-5 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leaves.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-slate-400 italic">No leave requests found</td></tr>
            ) : leaves.map(lv => (
              <tr key={lv._id} className="hover:bg-slate-50 transition-colors">
                <td className="p-5 font-bold text-slate-700">{lv.leaveType}</td>
                <td className="p-5 text-slate-600">{new Date(lv.fromDate).toLocaleDateString()}</td>
                <td className="p-5 text-slate-600">{new Date(lv.toDate).toLocaleDateString()}</td>
                <td className="p-5 font-black text-slate-950">{lv.totalDays}</td>
                <td className="p-5 text-slate-600 italic">"{lv.reason}"</td>
                <td className="p-5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    lv.status.includes('APPROVED') ? 'bg-green-100 text-green-700' :
                    lv.status.includes('REJECTED') ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {lv.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const SalesFollowups = ({ isTeamMode = false, globalFilters = {} }) => {
  const { user } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'prospects';

  const [prospects, setProspects] = useState([]);
  const [orders, setOrders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRemark, setShowRemark] = useState(null);

  if (!user) return null;

  const fetch = async () => { 
    setLoading(true);
    try {
      let params = {};
      if (!isTeamMode && ['SALES_MANAGER', 'SR_SALES_MANAGER'].includes(user?.role)) {
        params.salesExec = user._id;
        params.assignedTo = user._id;
      }
      if (isTeamMode) {
        if (globalFilters.employee) params.salesExec = globalFilters.employee;
        if (globalFilters.search) params.search = globalFilters.search;
      }

      const pRes = await prospectApi.list(params, user.token); 
      if (pRes.success) setProspects(pRes.data.filter(p => p.nextFollowUpDate && p.stage !== 'Won' && p.stage !== 'Lost' && p.status !== 'Canceled' && p.status !== 'Order Confirmed' && p.status !== 'Sale Confirmed')); 

      const oRes = await orderApi.list(params, user.token);
      if (oRes.success) setOrders(oRes.data);

      const aRes = await appointmentApi.list(params, user.token);
      if (aRes.success) {
        setAppointments(aRes.data.filter(a => a.status !== 'SALE_CONFIRMED' && a.status !== 'LOST' && a.status !== 'CANCELLED'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { fetch(); }, [JSON.stringify(globalFilters)]);
  const pFlow = useProspectFlow(user, fetch);
  const oFlow = useOrderFlow(user, fetch);

  if (loading) return <div className="flex h-96 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        {activeTab === 'prospects' ? (
          <>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Prospect Follow-ups</h1>
            <p className="text-slate-500 font-medium">Let's turn these leads into loyal clients! Reach out, build trust, and keep the momentum going. 🚀</p>
          </>
        ) : activeTab === 'orders' ? (
          <>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Order Follow-ups</h1>
            <p className="text-slate-500 font-medium">Ensure smooth execution, provide updates, and secure those pending payments. Finish strong! 🏆</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Appointment Follow-ups</h1>
            <p className="text-slate-500 font-medium">Track your scheduled meetings, manage updates, and nurture client visits. 📅</p>
          </>
        )}
      </div>

      {activeTab === 'prospects' ? (
        <ProspectTable 
          prospects={prospects} 
          sortByFollowUp={true}
          onEdit={pFlow.setShowCreateProspect} 
          onQuotation={pFlow.setShowQuotation} 
          onAppointment={pFlow.setShowScheduleAppointment}
          onCreateOrder={oFlow.setShowCreateOrder}
          onUpdateStage={pFlow.handleUpdateStage}
          onDelete={pFlow.handleDeleteProspect}
        />
      ) : activeTab === 'orders' ? (
        <OrderList 
          orders={orders} 
          hideCompleted={true}
          onCreateOrder={() => oFlow.setShowOrderSearch(true)} 
          onUploadPayment={oFlow.setPaymentOrder} 
          onViewDetails={oFlow.setSelectedOrder} 
          onLineItemUpdated={fetch}
        />
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b bg-slate-50">
                <tr>
                  {[
                    { name: 'Client' },
                    { name: 'Date & Time' },
                    { name: 'Venue & Type' },
                    { name: 'Assignee' },
                    { name: 'Next Follow-up' },
                    { name: 'Status' },
                    { name: 'Executive Remark' },
                    { name: 'Assignee Remark' },
                    { name: 'Actions' }
                  ].map(h => (
                    <th key={h.name} className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap bg-slate-50 border-b border-slate-200">
                      {h.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground text-sm">
                      No active appointment follow-ups.
                    </td>
                  </tr>
                ) : appointments.map((apt, idx) => {
                  let rowColor = "bg-white hover:bg-slate-50";
                  if (apt.nextFollowUpDate) {
                    const fDate = new Date(apt.nextFollowUpDate).setHours(0,0,0,0);
                    const today = new Date().setHours(0,0,0,0);
                    if (fDate < today) rowColor = "bg-red-50 hover:bg-red-100";
                    else if (fDate === today) rowColor = "bg-blue-50 hover:bg-blue-100";
                  }

                  return (
                    <tr key={apt._id || idx} className={`${rowColor} transition-colors group`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-slate-800 shrink-0">
                            {(apt.contactPerson || apt.prospect?.name || 'C').charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{apt.businessName || apt.prospect?.company || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{apt.contactPerson || apt.prospect?.name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground font-mono">{apt.phone || apt.prospect?.phone || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">
                        <p className="font-bold">{new Date(apt.date).toLocaleDateString()}</p>
                        <p className="text-slate-500 mt-0.5">{apt.time}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 max-w-[200px] truncate" title={apt.venue}>
                        <p className="font-medium truncate">{apt.venue}</p>
                        <span className="inline-block px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded text-[10px] font-semibold mt-1">{apt.meetingType || 'Office Meeting'}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-800 whitespace-nowrap">
                        {apt.assignedTo?.name || <span className="text-amber-600">Pending Allocation</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        <span className={`font-semibold ${apt.nextFollowUpDate && new Date(apt.nextFollowUpDate) <= new Date() ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                          {apt.nextFollowUpDate ? new Date(apt.nextFollowUpDate).toLocaleDateString() : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          apt.status === 'SALE_CONFIRMED' ? 'bg-green-100 text-green-700' :
                          apt.status === 'LOST' || apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          apt.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                          apt.status === 'FOLLOWUP_REQUIRED' ? 'bg-amber-100 text-amber-700' :
                          'bg-purple-50 text-purple-600'
                        }`}>
                          {apt.status === 'SALE_CONFIRMED' ? 'Sale Confirmed' :
                           apt.status === 'IN_PROGRESS' ? 'In Progress' :
                           apt.status === 'FOLLOWUP_REQUIRED' ? 'Follow-up Required' :
                           apt.status === 'CLIENT_NOT_AVAILABLE' ? 'Client N/A' :
                           apt.status === 'CANCELLED' ? 'Cancelled' :
                           apt.status.charAt(0) + apt.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-[150px] truncate" title={apt.executiveRemark || apt.remark || ''}>
                        {apt.executiveRemark || apt.remark || '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-[150px] truncate" title={apt.assigneeRemark || ''}>
                        {apt.assigneeRemark || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => window.location.href = `tel:${apt.phone || apt.prospect?.phone}`} className="h-7 w-7 rounded border border-blue-200 bg-blue-50 flex items-center justify-center transition-colors">
                            <Phone className="h-3.5 w-3.5 text-blue-700" />
                          </button>
                          <button onClick={() => window.open(`https://wa.me/${(apt.phone || apt.prospect?.phone || '').replace(/\D/g, '')}`, '_blank')} className="h-7 w-7 rounded border border-emerald-200 bg-emerald-50 flex items-center justify-center">
                            <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                          </button>
                          {apt.assignedTo?._id === user._id && (
                            <button 
                              onClick={() => setShowRemark(apt)} 
                              className="h-7 px-2 rounded border border-emerald-600 bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition-colors"
                            >
                              Update Remark
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <ModalsRenderer prospectFlow={pFlow} orderFlow={oFlow} user={user} />
      {showRemark && (
        <UpdateAppointmentRemarkModal 
          appointment={showRemark} 
          onClose={() => setShowRemark(null)} 
          onSaved={fetch} 
        />
      )}
    </div>
  );
};

export const SalesAppointments = ({ isTeamMode = false, globalFilters = {} }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(null);
  const [showRemark, setShowRemark] = useState(null);

  const fetch = async () => { 
    if (!user?.token) return;
    setLoading(true);
    try {
      let params = {};
      if (!isTeamMode && ['SALES_MANAGER', 'SR_SALES_MANAGER'].includes(user?.role)) {
        params.salesExec = user._id;
        params.assignedTo = user._id;
      }
      if (isTeamMode) {
        if (globalFilters.employee) params.salesExec = globalFilters.employee;
        if (globalFilters.search) params.search = globalFilters.search;
      }
      const res = await appointmentApi.list(params, user.token); 
      if (res.success) setAppointments(res.data || []); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [JSON.stringify(globalFilters)]);

  if (!user) return null;
  if (loading) return <div className="flex h-96 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900">Upcoming Appointments</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appointments.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300">
            <CalendarIcon className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-bold">No appointments scheduled</p>
          </div>
        ) : appointments.map(apt => (
          <div key={apt._id} className="bg-white border rounded-[2rem] p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg text-slate-900">{apt.businessName || apt.prospect?.company || apt.prospect?.name}</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                apt.status === 'SALE_CONFIRMED' ? 'bg-green-100 text-green-700' :
                apt.status === 'LOST' || apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                apt.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                apt.status === 'FOLLOWUP_REQUIRED' ? 'bg-amber-100 text-amber-700' :
                'bg-purple-50 text-purple-600'
              }`}>{
                apt.status === 'SALE_CONFIRMED' ? 'Sale Confirmed' :
                apt.status === 'IN_PROGRESS' ? 'In Progress' :
                apt.status === 'FOLLOWUP_REQUIRED' ? 'Follow-up Required' :
                apt.status === 'CLIENT_NOT_AVAILABLE' ? 'Client N/A' :
                apt.status === 'CANCELLED' ? 'Cancelled' :
                apt.status.charAt(0) + apt.status.slice(1).toLowerCase()
              }</span>
            </div>
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2 text-slate-500"><CalendarIcon className="h-4 w-4 shrink-0" /><span className="font-bold text-slate-700">{new Date(apt.date).toLocaleDateString()}</span> at <span className="font-bold text-slate-700">{apt.time}</span></div>
              <div className="flex items-center gap-2 text-slate-500"><UserPlus className="h-4 w-4 shrink-0" /><span className="font-bold text-slate-700 truncate">{apt.contactPerson || apt.prospect?.name}</span></div>
              <div className="flex items-center gap-2 text-slate-500"><Phone className="h-4 w-4 shrink-0" /><span className="font-bold text-slate-700">{apt.phone || apt.prospect?.phone}</span></div>
              <div className="flex items-start gap-2 text-slate-500"><MapPin className="h-4 w-4 shrink-0 mt-0.5" /><span className="font-bold text-slate-700 line-clamp-2">{apt.venue}</span></div>
              <div className="flex items-center gap-2 text-slate-500"><Clock className="h-4 w-4 shrink-0" /><span className="font-bold text-slate-700">{apt.meetingType || apt.purpose}</span></div>
              {apt.nextFollowUpDate && (
                <div className="flex items-center gap-2 text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-100"><CalendarIcon className="h-4 w-4 shrink-0 text-red-500" />Next Follow-up: <span>{new Date(apt.nextFollowUpDate).toLocaleDateString()}</span></div>
              )}
            </div>
            <div className="pt-4 border-t flex flex-col gap-3">
               <div className="flex items-center justify-between">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignee</span>
                 <span className="text-xs font-bold text-blue-600">{apt.assignedTo?.name || 'Pending Allocation'}</span>
               </div>
               
               <div className="space-y-1">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Executive Remark</span>
                 <div className="bg-slate-50 text-slate-700 text-xs p-2.5 rounded-xl border border-slate-100 italic">
                   "{apt.executiveRemark || apt.remark || '-'}"
                 </div>
               </div>

               {apt.assignedTo && (
                 <div className="space-y-1">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignee Remark</span>
                   {apt.assigneeRemark ? (
                     <div className="bg-green-50 text-green-800 text-xs p-2.5 rounded-xl border border-green-100 italic">
                       "{apt.assigneeRemark}"
                     </div>
                   ) : (
                     <p className="text-[11px] text-slate-400 italic">Waiting for assignee updates...</p>
                   )}
                 </div>
               )}

               <div className="flex gap-2">
                 {['ADMIN', 'SALES_MANAGER', 'MD_CEO'].includes(user.role) && !apt.assignedTo && (
                   <button onClick={() => setShowAssign(apt)} className="flex-1 bg-slate-900 text-white py-2 rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors">Assign</button>
                 )}
                 {apt.assignedTo?._id === user._id && (
                   <button onClick={() => setShowRemark(apt)} className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors">Update Remark</button>
                 )}
               </div>
            </div>
          </div>
        ))}
      </div>
      {showAssign && <AssignAppointmentModal appointment={showAssign} onClose={() => setShowAssign(null)} onAssigned={fetch} />}
      {showRemark && <UpdateAppointmentRemarkModal appointment={showRemark} onClose={() => setShowRemark(null)} onSaved={fetch} />}
    </div>
  );
};

export const SalesBrochures = () => {
  const { user } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialPhone = queryParams.get('phone') || '';
  const initialName = queryParams.get('name') || '';
  const initialProspectId = queryParams.get('prospectId') || '';
  const [brochures, setBrochures] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showSendModal, setShowSendModal] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // If we have an initial phone and name, we might want to auto-open the send modal 
    // for the first brochure or just let the user pick.
    // For better UX, let's keep the details and let user pick which brochure.
  }, [initialPhone, initialName]);

  if (!user) return null;
  const isAdmin = ['ADMIN', 'SALES_MANAGER', 'MD_CEO'].includes(user.role);

  const fetchData = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        brochureApi.list({ category: selectedCategory, search, ...(['SALES_MANAGER', 'SR_SALES_MANAGER'].includes(user?.role) ? { salesExec: user._id } : {}) }, user.token),
        brochureApi.categories(user.token)
      ]);
      if (bRes.success) setBrochures(bRes.data);
      if (cRes.success) setCategories(cRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedCategory, search]);

  const handleSent = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {toast && (
        <div className="fixed top-24 right-8 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-8">
          <CheckCircle className="h-5 w-5" /> {toast}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Sales Enablement</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Instant catalog sharing via WhatsApp</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('browse')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'browse' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Browse Catalogs
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Share History
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('manage')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'manage' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Management
            </button>
          )}
        </div>
      </div>

      {activeTab === 'browse' && (
        <>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search brochures by name..." 
                className="w-full h-14 pl-12 pr-4 bg-white border rounded-[1.5rem] text-sm font-bold shadow-sm focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="relative w-full md:w-64">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <select 
                className="w-full h-14 pl-12 pr-4 bg-white border rounded-[1.5rem] text-sm font-bold shadow-sm outline-none appearance-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex h-96 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>
          ) : brochures.length === 0 ? (
            <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-300">
               <FileText className="h-12 w-12 mx-auto text-slate-300 mb-4" />
               <p className="text-slate-500 font-black">No active catalogs found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {brochures.map(b => (
                <BrochureCard key={b._id} brochure={b} onSend={setShowSendModal} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'manage' && isAdmin && (
        <BrochureManager user={user} />
      )}

      {activeTab === 'history' && (
        <BrochureHistoryTable user={user} />
      )}

      {showSendModal && (
        <SendBrochureModal 
          brochure={showSendModal} 
          user={user} 
          initialData={{ 
            clientPhone: initialPhone, 
            clientName: initialName,
            prospectId: initialProspectId
          }}
          onClose={() => setShowSendModal(null)} 
          onSent={handleSent} 
        />
      )}
    </div>
  );
};

export const SalesQuotations = ({ isTeamMode = false, globalFilters = {} }) => {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history'); // history, analysis
  const [previewQuote, setPreviewQuote] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('All Employees');

  const isAdmin = ['ADMIN', 'SALES_MANAGER', 'MD_CEO'].includes(user?.role);

  const fetch = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      let params = {};
      if (!isTeamMode && ['SALES_MANAGER', 'SR_SALES_MANAGER'].includes(user?.role)) {
        params.salesExec = user._id;
        params.assignedTo = user._id;
      }
      if (isTeamMode) {
        if (globalFilters.employee) params.salesExec = globalFilters.employee;
        if (globalFilters.search) params.search = globalFilters.search;
      }
      const res = await quotationApi.list(params, user.token);
      setQuotations(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [JSON.stringify(globalFilters)]);

  if (!user) return null;

  const uniqueEmployees = Array.from(new Set(
    quotations.map(q => q.executive?.name)
              .filter(name => name)
  )).sort();

  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = (q.prospect?.company || q.prospect?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (q.executive?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus ? q.status === filterStatus : true;
    const matchesDate = filterDate ? new Date(q.createdAt).toLocaleDateString('en-CA') === filterDate : true; // en-CA gives YYYY-MM-DD
    const matchesEmployee = employeeFilter === 'All Employees' || q.executive?.name === employeeFilter;
    return matchesSearch && matchesStatus && matchesDate && matchesEmployee;
  });

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Quotation Registry</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage and audit all client estimates</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            All History
          </button>
          <button 
            onClick={() => setActiveTab('analysis')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'analysis' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Insights
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('template')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'template' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Template Settings
            </button>
          )}
        </div>
      </div>

      {activeTab !== 'template' && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-[2]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by client or executive name..." 
              className="w-full h-14 pl-12 pr-4 bg-white border rounded-[1.5rem] text-sm font-bold shadow-sm focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative flex-1">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <select 
              className="w-full h-14 pl-12 pr-4 bg-white border rounded-[1.5rem] text-sm font-bold shadow-sm outline-none appearance-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Viewed">Viewed</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Order-Created">Order-Created</option>
            </select>
          </div>
          {isAdmin && uniqueEmployees.length > 0 && (
            <div className="relative flex-1">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <select 
                className="w-full h-14 pl-12 pr-4 bg-white border rounded-[1.5rem] text-sm font-bold shadow-sm outline-none appearance-none"
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
              >
                <option value="All Employees">All Employees</option>
                {uniqueEmployees.map(emp => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex-1">
            <input 
              type="date" 
              className="w-full h-14 px-4 bg-white border rounded-[1.5rem] text-sm font-bold shadow-sm outline-none"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          {!isAdmin && (
            <Link to="/prospects" className="h-14 px-8 bg-blue-600 text-white rounded-[1.5rem] font-black text-sm flex items-center gap-2 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-200 whitespace-nowrap">
              <Plus className="h-5 w-5" /> New Quotation
            </Link>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex h-96 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : activeTab === 'history' ? (
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] border-b border-slate-100">
                  <th className="p-6 text-left">Quotation ID</th>
                  <th className="p-6 text-left">Client Entity</th>
                  <th className="p-6 text-left">Financials</th>
                  {isAdmin && <th className="p-6 text-left text-blue-600">Employee</th>}
                  <th className="p-6 text-left">Status</th>
                  <th className="p-6 text-left">Sent At</th>
                  <th className="p-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotations.length === 0 ? (
                  <tr><td colSpan={isAdmin ? 7 : 6} className="p-20 text-center text-slate-400 italic font-medium">No quotations found in the registry.</td></tr>
                ) : filteredQuotations.map(q => (
                  <tr key={q._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="font-mono font-black text-slate-400 text-xs">#{q.quotationId || q._id.slice(-6).toUpperCase()}</div>
                    </td>
                    <td className="p-6">
                      <div className="font-black text-slate-900">{q.prospect?.company || q.prospect?.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-0.5">{q.prospect?.phone}</div>
                    </td>
                    <td className="p-6">
                      <div className="font-black text-blue-600">₹{(q.totalAmount || 0).toLocaleString()}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-0.5">{q.items?.length || 0} items included</div>
                    </td>
                    {isAdmin && (
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                            {q.executive?.name?.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-700">{q.executive?.name || 'System'}</span>
                        </div>
                      </td>
                    )}
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${q.status === 'Sent' ? 'bg-blue-50 text-blue-600' : q.status === 'Viewed' ? 'bg-purple-50 text-purple-600' : q.status === 'Order-Created' ? 'bg-emerald-50 text-emerald-600' : q.status === 'Approved' ? 'bg-green-100 text-green-700' : q.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : q.requiresApproval && q.status === 'Draft' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                        {q.requiresApproval && q.status === 'Draft' ? 'Pending Approval' : q.status}
                      </span>
                    </td>
                    <td className="p-6 text-xs font-bold text-slate-400">
                      {new Date(q.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-6">
                      <button 
                        onClick={() => setPreviewQuote(q)}
                        className="mx-auto h-10 w-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'analysis' ? (
        <QuotationAnalytics quotations={quotations} />
      ) : activeTab === 'template' && isAdmin ? (
        <QuotationTemplateSettings />
      ) : (
        <div className="bg-white rounded-[3rem] border border-slate-100 p-20 text-center shadow-xl">
           <BarChartIcon className="h-16 w-16 mx-auto text-blue-100 mb-6" />
           <h3 className="text-xl font-black text-slate-900">Quotation Analytics</h3>
           <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">This module is aggregating performance data. Soon you will see conversion rates, average deal sizes, and executive performance metrics here.</p>
        </div>
      )}

      {previewQuote && (
        <ViewQuotationModal 
          quotation={previewQuote} 
          onClose={(updated) => {
            setPreviewQuote(null);
            if (updated === true) fetch();
          }} 
        />
      )}
    </div>
  );
};

export default ExecDashboard;
