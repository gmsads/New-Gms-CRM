import React, { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { prospectApi, orderApi, appointmentApi, analyticsApi, paymentApi, targetApi } from '../services/api';
import { formatINRConcise } from '../utils/numberFormatters';
import { 
  Users, Package, CheckCircle, Clock, Calendar, Briefcase, TrendingUp, ShieldCheck,
  AlertCircle, Target, Filter, DollarSign, Activity, Award, ArrowUpRight, Sparkles, Layers, Inbox, BarChart2
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts';

const glassmorphismTooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.35)',
  padding: '12px 16px',
};

const tooltipLabelStyle = {
  fontWeight: 800,
  color: '#f8fafc',
  marginBottom: '4px',
  fontSize: '13px'
};

const tooltipItemStyle = {
  color: '#cbd5e1',
  fontWeight: 600,
  fontSize: '12px'
};

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const UnifiedDashboard = () => {
  const { user } = useAuth();

  const [rawProspects, setRawProspects] = useState([]);
  const [rawOrders, setRawOrders] = useState([]);
  const [rawAppointments, setRawAppointments] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [userTarget, setUserTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  // Date Filter States (Defaulting to 'year' so all 2026 real records load immediately)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // June is 5
  const [filterType, setFilterType] = useState('year'); // 'month' | 'year' | 'custom'
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchDashboardData = async () => {
    try {
      const [prospects, orders, appointments, analytics, targetsRes] = await Promise.all([
        prospectApi.list({}, user.token).catch(() => ({ data: [] })),
        orderApi.list({ limit: 500 }, user.token).catch(() => ({ data: [] })),
        appointmentApi.list(user.token).catch(() => ({ data: [] })),
        analyticsApi.getStats({}, user.token).catch(() => ({ data: {} })),
        targetApi.list({ limit: 10, employee: user._id }, user.token).catch(() => ({ data: [] }))
      ]);

      const pData = prospects.data || [];
      const oData = orders.data || [];
      const aData = appointments.data || [];
      const anData = analytics.data || {};
      
      const userTargets = targetsRes?.data || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const target = userTargets.find(t => {
        if (t.status !== 'Pending' && t.status !== 'In Progress') return false;
        if (t.endDate) {
          const endDate = new Date(t.endDate);
          endDate.setHours(23, 59, 59, 999);
          if (endDate < today) return false;
        }
        return true;
      }) || null;

      setRawProspects(pData);
      setRawOrders(oData);
      setRawAppointments(aData);
      setAnalyticsData(anData);
      setUserTarget(target);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute Period Label dynamically
  const periodLabel = useMemo(() => {
    if (filterType === 'year') {
      return `All Months ${selectedYear}`;
    }
    if (filterType === 'custom') {
      if (fromDate && toDate) {
        const fStr = new Date(fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const tStr = new Date(toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        return `${fStr} - ${tStr}`;
      }
      if (fromDate) return `From ${new Date(fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
      if (toDate) return `Until ${new Date(toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
      return "Custom Period";
    }
    return `${monthNames[selectedMonth]} ${selectedYear}`;
  }, [filterType, selectedMonth, selectedYear, fromDate, toDate]);

  // Check if a date falls within the selected period
  const isDateInPeriod = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    if (filterType === 'month') {
      return d.getMonth() === Number(selectedMonth) && d.getFullYear() === Number(selectedYear);
    }
    if (filterType === 'year') {
      return d.getFullYear() === Number(selectedYear);
    }
    if (filterType === 'custom') {
      if (!fromDate && !toDate) return true;
      const start = fromDate ? new Date(fromDate) : new Date('2000-01-01');
      start.setHours(0, 0, 0, 0);
      const end = toDate ? new Date(toDate) : new Date('2099-12-31');
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    }
    return true;
  };

  // Filter STRICTLY REAL Company Data by selected period
  const filteredOrders = useMemo(() => {
    return rawOrders.filter(o => isDateInPeriod(o.createdAt || o.date || o.orderDate));
  }, [rawOrders, filterType, selectedMonth, selectedYear, fromDate, toDate]);

  const filteredProspects = useMemo(() => {
    return rawProspects.filter(p => isDateInPeriod(p.createdAt || p.date || p.updatedAt));
  }, [rawProspects, filterType, selectedMonth, selectedYear, fromDate, toDate]);

  const filteredAppointments = useMemo(() => {
    return rawAppointments.filter(a => isDateInPeriod(a.date || a.createdAt || a.startTime));
  }, [rawAppointments, filterType, selectedMonth, selectedYear, fromDate, toDate]);

  // STRICT 100% REAL Summary Stats
  const summaryStats = useMemo(() => {
    const totalOrdersCount = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const pendingBalance = filteredOrders.reduce((sum, o) => sum + (o.balanceDue || 0), 0);
    const paidCollection = Math.max(0, totalRevenue - pendingBalance);
    const totalProspectsCount = filteredProspects.length;
    const totalAppointmentsCount = filteredAppointments.length;

    const collectionRate = totalRevenue > 0 ? Math.round((paidCollection / totalRevenue) * 100) : 0;
    const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

    return {
      totalOrdersCount,
      totalRevenue,
      paidCollection,
      pendingBalance,
      totalProspectsCount,
      totalAppointmentsCount,
      collectionRate,
      avgOrderValue
    };
  }, [filteredOrders, filteredProspects, filteredAppointments]);

  // 1. Payment Status Data (Strictly Real)
  const paymentData = useMemo(() => {
    const { paidCollection, pendingBalance } = summaryStats;
    if (paidCollection === 0 && pendingBalance === 0) {
      return [{ name: 'No Revenue', value: 1, color: '#e2e8f0', isEmpty: true }];
    }
    return [
      { name: 'Paid Collection', value: paidCollection, color: '#10b981' },
      { name: 'Pending Balance', value: pendingBalance, color: '#f43f5e' }
    ];
  }, [summaryStats]);

  // 2. Order Fulfillment Data (REMOVED CANCELED - Strictly Real)
  const orderFulfillmentData = useMemo(() => {
    const completed = filteredOrders.filter(o => ['Completed', 'Delivered'].includes(o.status)).length;
    const inProgress = filteredOrders.filter(o => ['Confirmed', 'In_Production', 'Ready_To_Deliver', 'Design_Approved', 'Design_InProgress'].includes(o.status)).length;
    const pending = filteredOrders.filter(o => ['Pending', 'New', 'Design_Pending', 'Draft'].includes(o.status) || !o.status).length;

    return [
      { name: 'Completed', value: completed, color: '#10b981' },
      { name: 'In Progress', value: inProgress, color: '#3b82f6' },
      { name: 'Pending', value: pending, color: '#f59e0b' }
    ];
  }, [filteredOrders]);

  // 3. Prospective Clients (REFERENCE IMAGE 3 - Strictly Real)
  const prospectiveClientsData = useMemo(() => {
    const hot = filteredProspects.filter(p => p.priority === 'Hot').length;
    const expected = filteredProspects.filter(p => p.priority === 'Expected in next month' || p.priority === 'Warm' || p.stage === 'Negotiation').length;
    const cold = filteredProspects.filter(p => p.priority === 'Cold' || p.stage === 'New' || !p.priority).length;

    if (hot === 0 && expected === 0 && cold === 0) {
      return [{ name: 'No Prospects', value: 1, color: '#e2e8f0', isEmpty: true }];
    }

    return [
      { name: 'HOT', value: hot, color: '#ef4444' },
      { name: 'EXPECTED', value: expected, color: '#f59e0b' },
      { name: 'COLD', value: cold, color: '#3b82f6' }
    ];
  }, [filteredProspects]);

  // 4. Client Overview (MATCHING EXACT REFERENCE IMAGE PROVIDED BY USER - Strictly Real)
  const clientOverviewData = useMemo(() => {
    const categories = ['Retail', 'Renewal', 'Corporate', 'Corporate-Renewal', 'Agent', 'Agent-Renewal'];
    const map = {};
    categories.forEach(cat => { map[cat] = { orders: 0, amount: 0 }; });

    filteredOrders.forEach(o => {
      let cat = (o.orderType || o.prospect?.clientType || 'retail').toLowerCase();
      let formatted = 'Retail';
      if (cat.includes('corporate') && cat.includes('renewal')) formatted = 'Corporate-Renewal';
      else if (cat.includes('agent') && cat.includes('renewal')) formatted = 'Agent-Renewal';
      else if (cat.includes('corporate')) formatted = 'Corporate';
      else if (cat.includes('agent')) formatted = 'Agent';
      else if (cat.includes('renewal')) formatted = 'Renewal';
      else formatted = 'Retail';

      if (map[formatted]) {
        map[formatted].orders += 1;
        map[formatted].amount += (o.grandTotal || 0);
      }
    });

    const chartData = categories.map(name => ({
      name,
      orders: map[name].orders,
      amount: map[name].amount
    }));

    const totalClientsCount = Object.values(map).reduce((sum, item) => sum + item.orders, 0);
    const totalAmountSum = Object.values(map).reduce((sum, item) => sum + item.amount, 0);

    return {
      totalClients: totalClientsCount,
      totalAmount: totalAmountSum,
      chartData,
      items: categories.map(name => ({ name, ...map[name] }))
    };
  }, [filteredOrders]);

  // 5. Service Status (Design Pending, Production Pending, Service Pending - Strictly Real)
  const serviceStatusData = useMemo(() => {
    const designPending = filteredOrders.filter(o => ['Design_Pending', 'Design_InProgress', 'Design_Review'].includes(o.status)).length;
    const productionPending = filteredOrders.filter(o => ['Confirmed', 'In_Production', 'Design_Approved'].includes(o.status)).length;
    const servicePending = filteredOrders.filter(o => ['Ready_To_Deliver', 'Pending', 'New'].includes(o.status) || !o.status).length;

    if (designPending === 0 && productionPending === 0 && servicePending === 0) {
      return [{ name: 'No Pending Services', value: 1, color: '#e2e8f0', isEmpty: true }];
    }

    return [
      { name: 'Design Pending', value: designPending, color: '#8b5cf6' },
      { name: 'Production Pending', value: productionPending, color: '#f59e0b' },
      { name: 'Service Pending', value: servicePending, color: '#06b6d4' }
    ];
  }, [filteredOrders]);

  // 6. Most Ordered Products (REFERENCE IMAGE 1 - Strictly Real lineItems/items)
  const productData = useMemo(() => {
    const productMap = {};
    filteredOrders.forEach(o => {
      const items = o.lineItems || o.items || [];
      if (Array.isArray(items) && items.length > 0) {
        items.forEach(item => {
          const name = item.description || item.productName || item.name || 'General Ad Service';
          productMap[name] = (productMap[name] || 0) + (item.quantity || 1);
        });
      }
    });

    return Object.keys(productMap)
      .map(name => ({ name, quantity: productMap[name] }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredOrders]);

  // 7. Appointments Status Data (Strictly Real)
  const appointmentsData = useMemo(() => {
    const completed = filteredAppointments.filter(a => a.status === 'COMPLETED' || a.status === 'Completed').length;
    const upcoming = filteredAppointments.filter(a => a.status === 'PENDING' || a.status === 'Upcoming' || !a.status).length;
    const canceled = filteredAppointments.filter(a => a.status === 'CANCELED' || a.status === 'Canceled').length;

    if (completed === 0 && upcoming === 0 && canceled === 0) {
      return [{ name: 'No Appointments', value: 1, color: '#e2e8f0', isEmpty: true }];
    }

    return [
      { name: 'Completed', value: completed, color: '#10b981' },
      { name: 'Upcoming', value: upcoming, color: '#6366f1' },
      { name: 'Canceled', value: canceled, color: '#ef4444' }
    ];
  }, [filteredAppointments]);

  const getRoleBasedQuote = (role) => {
    const quotes = {
      'SALES_EXEC': "Every 'No' brings you closer to a 'Yes'. Keep pushing, top closer!",
      'SR_SALES_EXEC': "Your experience is your greatest asset. Lead by example and crush those targets!",
      'FIELD_EXEC': "The pavement you pound today paves the road to your success tomorrow.",
      'TELE_EXEC': "Your voice is your most powerful tool. Make every call count!",
      'SALES_MANAGER': "Great leaders inspire great results. Empower your team to victory!",
      'BRANCH_HEAD': "Vision and execution go hand in hand. Steer your branch to the top!",
      'ADMIN': "Control the system, command the future. You hold the keys.",
      'MD_CEO': "Visionary leadership creates legendary companies. Keep steering the ship.",
      'HR': "People are the heartbeat of our company. Keep the pulse strong.",
      'OPERATION_MANAGER': "Seamless operations are the backbone of success. Keep the gears turning.",
      'DESIGNER': "Design is silent ambassador of your brand. Keep creating masterpieces.",
      'ACCOUNTS': "Numbers tell the story of our success. Keep the balance perfect."
    };
    return quotes[role] || "Success is the sum of small efforts, repeated day-in and day-out.";
  };

  const getPremiumProgressStyle = (pct) => {
    if (pct >= 100) return "bg-gradient-to-r from-emerald-400 to-green-500 shadow-[0_0_20px_rgba(16,185,129,0.7)]";
    if (pct >= 75) return "bg-gradient-to-r from-teal-400 to-emerald-500 shadow-[0_0_20px_rgba(45,212,191,0.6)]";
    if (pct >= 40) return "bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_20px_rgba(245,158,11,0.6)]";
    return "bg-gradient-to-r from-rose-500 to-red-500 shadow-[0_0_20px_rgba(225,29,72,0.6)]";
  };

  if (loading) return <div className="text-center p-20 text-slate-400 font-bold">Loading Unified Workspace...</div>;

  if (user?.role === 'DESIGNER') return <Navigate to="/design" replace />;
  if (user?.role === 'PRODUCTION_MANAGER') return <Navigate to="/production/manager" replace />;
  if (user?.role === 'PRODUCTION_EXEC') return <Navigate to="/production/executive" replace />;
  if (user?.role === 'SERVICE_MANAGER') return <Navigate to="/service/manager" replace />;
  if (user?.role === 'SERVICE_EXEC') return <Navigate to="/service/executive" replace />;

  const currentTargetProgress = userTarget?.targetValue > 0 
    ? Math.min(100, Math.round((userTarget.achievedValue / userTarget.targetValue) * 100)) 
    : 0;

  const hasAnyData = summaryStats.totalOrdersCount > 0 || summaryStats.totalProspectsCount > 0 || summaryStats.totalAppointmentsCount > 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700 pb-16 min-h-screen bg-slate-50/50 px-2 sm:px-4 lg:px-8 max-w-[1600px] mx-auto min-w-0">
      {/* Executive Welcome & Pulse Header (Mobile-First Layout) */}
      <div className="py-4 border-b border-slate-200/80 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6 min-w-0">
        <div className="min-w-0 w-full">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600 mb-1">
            <Sparkles className="h-4 w-4 animate-pulse shrink-0" />
            <span className="truncate">Executive Command Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 truncate">
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">{user.name}!</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1 italic break-words">
            "{getRoleBasedQuote(user.role)}"
          </p>
        </div>
        
        {/* Executive Quick Highlights Strip */}
        <div className="flex items-center justify-between sm:justify-start w-full lg:w-auto gap-4 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm shrink-0">
          <div className="px-3 border-r border-slate-100 text-center flex-1 sm:flex-initial">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Collection Rate</span>
            <span className="text-sm sm:text-base font-black text-emerald-600">{summaryStats.collectionRate}%</span>
          </div>
          <div className="px-3 text-center flex-1 sm:flex-initial">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Avg Order Value</span>
            <span className="text-sm sm:text-base font-black text-slate-800">{formatINRConcise(summaryStats.avgOrderValue)}</span>
          </div>
        </div>
      </div>

      {/* Target Progress Banner */}
      {userTarget && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-700 shadow-2xl relative overflow-hidden group min-w-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-700 group-hover:bg-blue-500/20 pointer-events-none" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10 min-w-0">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-blue-400 block">Current Assigned Target</span>
              <h4 className="text-lg sm:text-xl font-bold text-white mt-1 truncate">
                {userTarget.title} <span className="text-[10px] sm:text-xs font-bold text-slate-300 ml-2 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">{userTarget.period}</span>
              </h4>
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30 shrink-0">
              <Target className="text-blue-400 h-6 w-6 sm:h-7 sm:w-7" />
            </div>
          </div>
          <div className="flex items-baseline gap-3 sm:gap-4 mt-6 sm:mt-8 relative z-10">
            <span className="text-5xl sm:text-7xl font-black tracking-tighter text-white drop-shadow-lg">
              {currentTargetProgress}<span className="text-3xl sm:text-4xl text-slate-400">%</span>
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">Achieved</span>
          </div>
          <div className="space-y-3 sm:space-y-4 mt-6 sm:mt-8 relative z-10">
            <div className="h-4 sm:h-5 w-full bg-slate-950/80 rounded-full overflow-hidden p-1 shadow-inner border border-slate-800">
              <div className={`h-full rounded-full transition-all duration-1000 ease-out ${getPremiumProgressStyle(currentTargetProgress)}`} style={{ width: `${currentTargetProgress}%` }} />
            </div>
            <div className="flex flex-col sm:flex-row justify-between text-xs sm:text-sm font-bold text-slate-300 gap-1">
              <span>₹{userTarget.achievedValue.toLocaleString('en-IN')} completed</span>
              <span className="text-slate-400">Target: ₹{userTarget.targetValue.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Date & Period Command Bar (Mobile-First Responsive Container) */}
      <div className="bg-white p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.2rem] border border-slate-200/80 shadow-xl shadow-slate-200/40 space-y-4 min-w-0">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-slate-100 pb-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-200 shrink-0">
              <Filter className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">Period Filter Command</h3>
              <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Displaying: <span className="text-blue-600 font-black underline decoration-2 underline-offset-4">{periodLabel}</span></p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 w-full xl:w-auto">
            <button 
              onClick={() => setFilterType('month')}
              className={`py-2 px-2 sm:px-4 rounded-xl text-[11px] sm:text-xs font-black transition-all truncate text-center ${filterType === 'month' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Month
            </button>
            <button 
              onClick={() => setFilterType('year')}
              className={`py-2 px-2 sm:px-4 rounded-xl text-[11px] sm:text-xs font-black transition-all truncate text-center ${filterType === 'year' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All Year
            </button>
            <button 
              onClick={() => setFilterType('custom')}
              className={`py-2 px-2 sm:px-4 rounded-xl text-[11px] sm:text-xs font-black transition-all truncate text-center ${filterType === 'custom' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Custom
            </button>
          </div>
        </div>

        {/* Conditional Filter Controls (Grid fits mobile smoothly) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-2">
          {filterType === 'month' && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Select Month</label>
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full h-11 sm:h-12 px-3 sm:px-4 rounded-xl border border-slate-200 bg-slate-50/80 font-bold text-xs sm:text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                >
                  {monthNames.map((name, i) => (
                    <option key={name} value={i}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Select Year</label>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full h-11 sm:h-12 px-3 sm:px-4 rounded-xl border border-slate-200 bg-slate-50/80 font-bold text-xs sm:text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {filterType === 'year' && (
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Select Year</label>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full h-11 sm:h-12 px-3 sm:px-4 rounded-xl border border-slate-200 bg-slate-50/80 font-bold text-xs sm:text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>Entire Year {y}</option>
                ))}
              </select>
            </div>
          )}

          {filterType === 'custom' && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">From Date</label>
                <input 
                  type="date" 
                  value={fromDate} 
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full h-11 sm:h-12 px-3 sm:px-4 rounded-xl border border-slate-200 bg-slate-50/80 font-bold text-xs sm:text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">To Date</label>
                <input 
                  type="date" 
                  value={toDate} 
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full h-11 sm:h-12 px-3 sm:px-4 rounded-xl border border-slate-200 bg-slate-50/80 font-bold text-xs sm:text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {!hasAnyData ? (
        <div className="bg-white border border-slate-200/80 shadow-xl rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-16 text-center max-w-3xl mx-auto my-8 sm:my-12 space-y-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
            <Inbox className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800">No Records Found for {periodLabel}</h3>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 max-w-md mx-auto leading-relaxed">
            There are no live orders, prospects, or appointments recorded during this selected date range. Please select another month (e.g., May 2026) or select All Year 2026 to view active records.
          </p>
        </div>
      ) : (
        <>
          {/* World-Class Executive KPI Cards (Mobile-First Stacking & Zero Overflow) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 min-w-0">
            <div className="bg-white border border-slate-200/80 shadow-lg shadow-slate-200/30 rounded-[1.8rem] sm:rounded-[2rem] p-5 sm:p-6 hover:-translate-y-1 hover:shadow-xl transition-all relative overflow-hidden group min-w-0">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform pointer-events-none" />
              <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-black uppercase bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100 truncate max-w-[120px]">{periodLabel}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter relative z-10 truncate">{formatINRConcise(summaryStats.totalRevenue)}</h3>
              <p className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-widest mt-1 relative z-10 truncate">Total Revenue Generated</p>
            </div>

            <div className="bg-white border border-slate-200/80 shadow-lg shadow-slate-200/30 rounded-[1.8rem] sm:rounded-[2rem] p-5 sm:p-6 hover:-translate-y-1 hover:shadow-xl transition-all relative overflow-hidden group min-w-0">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform pointer-events-none" />
              <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100 truncate max-w-[120px]">{periodLabel}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter relative z-10 truncate">{formatINRConcise(summaryStats.paidCollection)}</h3>
              <p className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-widest mt-1 relative z-10 truncate">Verified Collection (Paid)</p>
            </div>

            <div className="bg-white border border-slate-200/80 shadow-lg shadow-slate-200/30 rounded-[1.8rem] sm:rounded-[2rem] p-5 sm:p-6 hover:-translate-y-1 hover:shadow-xl transition-all relative overflow-hidden group min-w-0">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform pointer-events-none" />
              <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-black uppercase bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full border border-rose-100 truncate max-w-[120px]">{periodLabel}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter relative z-10 truncate">{formatINRConcise(summaryStats.pendingBalance)}</h3>
              <p className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-widest mt-1 relative z-10 truncate">Outstanding Receivables</p>
            </div>

            <div className="bg-white border border-slate-200/80 shadow-lg shadow-slate-200/30 rounded-[1.8rem] sm:rounded-[2rem] p-5 sm:p-6 hover:-translate-y-1 hover:shadow-xl transition-all relative overflow-hidden group min-w-0">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform pointer-events-none" />
              <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-black uppercase bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-100 truncate max-w-[120px]">{periodLabel}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter relative z-10 truncate">{summaryStats.totalOrdersCount}</h3>
              <p className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-widest mt-1 relative z-10 truncate">Total Orders Processed</p>
            </div>
          </div>

          {/* The Requested Enterprise Charts Section (Zero Fluctuations & Mobile First Grid) */}
          <div className="space-y-6 pt-4 min-w-0">
            <div className="border-b border-slate-200/80 pb-4 flex items-center justify-between min-w-0">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2 sm:gap-3 truncate">
                  <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 shrink-0" />
                  <span className="truncate">Live Enterprise Analytics</span>
                </h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs mt-1 truncate">100% Real-time database visualisations filtered for: {periodLabel}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 min-w-0">
              
              {/* 1. Payment Status */}
              <div className="bg-white border border-slate-200/80 shadow-xl shadow-slate-200/40 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between hover:shadow-2xl transition-all duration-300 min-w-0">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mb-1 truncate">Payment Status - {periodLabel}</h3>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Paid vs Pending Revenue</p>
                </div>
                <div className="h-56 sm:h-60 w-full relative flex items-center justify-center min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      {!paymentData[0].isEmpty && <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} contentStyle={glassmorphismTooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />}
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center pointer-events-none">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Collection</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {summaryStats.totalRevenue > 0 ? Math.round((paymentData[0].value / summaryStats.totalRevenue) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-4 text-xs font-black text-slate-700 min-w-0">
                  <div className="flex items-center justify-between gap-2 bg-emerald-50/80 px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 shadow-sm shadow-emerald-300" />
                      <span className="text-emerald-950 font-extrabold">Paid:</span>
                    </div>
                    <span className="text-emerald-700 font-black whitespace-nowrap text-right">
                      ₹{paymentData[0].isEmpty ? 0 : paymentData[0].value.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-rose-50/80 px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-2xl border border-rose-100">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0 shadow-sm shadow-rose-300" />
                      <span className="text-rose-950 font-extrabold">Pending:</span>
                    </div>
                    <span className="text-rose-700 font-black whitespace-nowrap text-right">
                      ₹{paymentData[0].isEmpty ? 0 : paymentData[1].value.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Order Fulfillment (REMOVED CANCELED) */}
              <div className="bg-white border border-slate-200/80 shadow-xl shadow-slate-200/40 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between hover:shadow-2xl transition-all duration-300 min-w-0">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mb-1 truncate">Order Fulfillment - {periodLabel}</h3>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Active Execution Stages</p>
                </div>
                <div className="h-56 sm:h-60 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={orderFulfillmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 800 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                      <Tooltip contentStyle={glassmorphismTooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={36} name="Orders">
                        {orderFulfillmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] sm:text-xs font-black text-slate-700">
                  {orderFulfillmentData.map(item => (
                    <div key={item.name} className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 sm:py-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="whitespace-nowrap">{item.name}:</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-900 font-extrabold">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Prospective Clients (REFERENCE IMAGE 3) */}
              <div className="bg-white border border-slate-200/80 shadow-xl shadow-slate-200/40 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between hover:shadow-2xl transition-all duration-300 min-w-0">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mb-1 truncate">Prospective Clients - {periodLabel}</h3>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Pipeline Priority Breakdown</p>
                </div>
                <div className="h-56 sm:h-60 w-full relative flex items-center justify-center min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={prospectiveClientsData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                        {prospectiveClientsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      {!prospectiveClientsData[0].isEmpty && <Tooltip contentStyle={glassmorphismTooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />}
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center pointer-events-none">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">TOTAL</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {prospectiveClientsData[0].isEmpty ? 0 : prospectiveClientsData.reduce((sum, item) => sum + item.value, 0)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 mt-4 text-xs font-black text-slate-700 uppercase tracking-wider">
                  {prospectiveClientsData[0].isEmpty ? (
                    <span className="text-slate-400 font-bold">No Active Prospects</span>
                  ) : (
                    prospectiveClientsData.map(item => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
                        <span>{item.name} ({item.value})</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 4. Client Overview (MATCHING EXACT REFERENCE IMAGE - FULL WIDTH 3-COL SPAN) */}
              <div className="bg-white border border-slate-200/80 shadow-xl shadow-slate-200/40 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between hover:shadow-2xl transition-all duration-300 xl:col-span-3 min-w-0">
                {/* Header matching screenshot */}
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                  <BarChart2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight truncate">Client Overview - {periodLabel}</h3>
                </div>

                {/* Top Box: Vertical Bar Chart across all 6 categories */}
                <div className="h-64 sm:h-80 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clientOverviewData.chartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#475569', fontSize: 12, fontWeight: 700 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} allowDecimals={false} />
                      <Tooltip contentStyle={glassmorphismTooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
                      <Legend verticalAlign="top" align="center" iconType="square" formatter={() => <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Orders</span>} />
                      <Bar dataKey="orders" name="Orders" fill="#10b981" radius={[6, 6, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Middle Totals Strip matching screenshot */}
                <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-6 my-6 min-w-0">
                  <div className="text-left pl-2 sm:pl-4 min-w-0">
                    <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest block">TOTAL CLIENTS</span>
                    <span className="text-2xl sm:text-4xl font-black text-blue-600 tracking-tight mt-1 block truncate">{clientOverviewData.totalClients}</span>
                  </div>
                  <div className="text-right pr-2 sm:pr-4 border-l border-slate-200 min-w-0 pl-4 sm:pl-8">
                    <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest block">TOTAL AMOUNT</span>
                    <span className="text-2xl sm:text-4xl font-black text-emerald-600 tracking-tight mt-1 block truncate">{formatINRConcise(clientOverviewData.totalAmount)}</span>
                  </div>
                </div>

                {/* Bottom 6 Category Cards Grid matching exact 2-column pairing order */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 min-w-0">
                  {clientOverviewData.items.map((item) => (
                    <div key={item.name} className="flex items-center justify-between bg-slate-50/80 hover:bg-white p-4 sm:p-4.5 rounded-2xl border border-slate-200/80 shadow-sm transition-all min-w-0 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        <span className="text-xs sm:text-sm font-extrabold text-slate-700 break-words leading-tight">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                        <span className="text-xs sm:text-sm font-bold text-blue-600">{item.orders} orders</span>
                        <span className="text-sm sm:text-base font-black text-emerald-600 min-w-[75px] text-right">₹{item.amount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Service Status */}
              <div className="bg-white border border-slate-200/80 shadow-xl shadow-slate-200/40 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between hover:shadow-2xl transition-all duration-300 min-w-0">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mb-1 truncate">Service Status - {periodLabel}</h3>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Pending Bottleneck Analysis</p>
                </div>
                <div className="h-56 sm:h-60 w-full relative flex items-center justify-center min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={serviceStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {serviceStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      {!serviceStatusData[0].isEmpty && <Tooltip contentStyle={glassmorphismTooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />}
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center pointer-events-none">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Pending</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {serviceStatusData[0].isEmpty ? 0 : serviceStatusData.reduce((a, b) => a + b.value, 0)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 mt-4 text-xs font-black text-slate-700 min-w-0">
                  {serviceStatusData[0].isEmpty ? (
                    <div className="text-center py-2 text-slate-400 font-bold">No pending orders in bottleneck stages</div>
                  ) : (
                    serviceStatusData.map(item => (
                      <div key={item.name} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 min-w-0 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="font-bold text-slate-800 break-words leading-tight">{item.name}</span>
                        </div>
                        <span className="bg-white px-2.5 py-0.5 rounded-lg border font-black shadow-2xs shrink-0">{item.value}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 6. Most Ordered Products (REFERENCE IMAGE 1) */}
              <div className="bg-white border border-slate-200/80 shadow-xl shadow-slate-200/40 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between hover:shadow-2xl transition-all duration-300 lg:col-span-2 min-w-0">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mb-1 truncate">Most Ordered Products - {periodLabel}</h3>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Top Product Lines by Quantity Sold</p>
                </div>
                
                {productData.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-200/60 my-auto">
                    <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm font-bold text-slate-500">No product line items ordered during this period</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center min-w-0">
                    {/* Left Chart: Purple Horizontal Bars */}
                    <div className="md:col-span-7 h-60 w-full min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={productData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                          <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: '#0f172a', fontSize: 11, fontWeight: 800 }} width={100} />
                          <Tooltip contentStyle={glassmorphismTooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
                          <Bar dataKey="quantity" fill="#8b5cf6" radius={[0, 8, 8, 0]} barSize={20} name="Qty Sold" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Right Side: Product Rank Index Cards matching Reference Image 1 */}
                    <div className="md:col-span-5 space-y-3 border-t md:border-t-0 md:border-l border-slate-200 pt-6 md:pt-0 md:pl-6 min-w-0">
                      <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Product Rank Index</p>
                      
                      {/* 1st Place */}
                      {productData[0] && (
                        <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 shadow-sm min-w-0 gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] sm:text-[11px] font-black text-amber-700 block uppercase tracking-wide">🥇 1ST</span>
                            <span className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 block truncate">{productData[0].name}</span>
                          </div>
                          <span className="text-xs sm:text-sm font-black text-amber-600 shrink-0">{productData[0].quantity} sold</span>
                        </div>
                      )}

                      {/* 2nd Place */}
                      {productData[1] && (
                        <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-blue-50/90 border border-blue-200/80 shadow-sm min-w-0 gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] sm:text-[11px] font-black text-blue-700 block uppercase tracking-wide">🥈 2ND</span>
                            <span className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 block truncate">{productData[1].name}</span>
                          </div>
                          <span className="text-xs sm:text-sm font-black text-slate-700 shrink-0">{productData[1].quantity} sold</span>
                        </div>
                      )}

                      {/* 3rd Place */}
                      {productData[2] && (
                        <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-orange-50/90 border border-orange-200/80 shadow-sm min-w-0 gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] sm:text-[11px] font-black text-orange-700 block uppercase tracking-wide">🥉 3RD</span>
                            <span className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 block truncate">{productData[2].name}</span>
                          </div>
                          <span className="text-xs sm:text-sm font-black text-orange-600 shrink-0">{productData[2].quantity} sold</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 7. Appointments Status */}
              <div className="bg-white border border-slate-200/80 shadow-xl shadow-slate-200/40 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between hover:shadow-2xl transition-all duration-300 min-w-0">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mb-1 truncate">Appointments Status - {periodLabel}</h3>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Meetings & Schedule Overview</p>
                </div>
                <div className="h-56 sm:h-60 w-full relative flex items-center justify-center min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={appointmentsData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {appointmentsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      {!appointmentsData[0].isEmpty && <Tooltip contentStyle={glassmorphismTooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />}
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center pointer-events-none">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Done</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {summaryStats.totalAppointmentsCount > 0 ? Math.round((appointmentsData[0].value / summaryStats.totalAppointmentsCount) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] sm:text-xs font-black text-slate-700">
                  {appointmentsData.map(item => (
                    <div key={item.name} className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 sm:py-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="whitespace-nowrap">{item.name}:</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-900 font-extrabold">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UnifiedDashboard;
