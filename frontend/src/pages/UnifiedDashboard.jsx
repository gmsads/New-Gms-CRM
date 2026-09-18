import React, { useState, useEffect, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { prospectApi, orderApi, appointmentApi, analyticsApi, paymentApi, targetApi } from '../services/api';
import { formatINRConcise } from '../utils/numberFormatters';
import { 
  Users, Package, CheckCircle, Clock, Calendar, Briefcase, TrendingUp, ShieldCheck,
  AlertCircle, Target, Filter, DollarSign, IndianRupee, Activity, Award, ArrowUpRight, Sparkles, Layers, Inbox, BarChart2
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { ResponsivePage, PageHeader, FilterToolbar, EmptyState, KPIGrid, ResponsiveCard } from '../components/ui/ResponsiveComponents';

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

const clientCategoryColors = {
  'Retail': '#3b82f6',
  'Renewal': '#10b981',
  'Corporate': '#8b5cf6',
  'Corporate-Renewal': '#f59e0b',
  'Agent': '#06b6d4',
  'Agent-Renewal': '#ec4899'
};

const UnifiedDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const availableYears = useMemo(() => {
    const years = new Set();
    const addDate = (dStr) => {
      if (!dStr) return;
      const date = new Date(dStr);
      if (!isNaN(date.getTime())) years.add(date.getFullYear());
    };
    rawOrders.forEach(o => addDate(o.createdAt || o.date));
    rawProspects.forEach(p => addDate(p.createdAt || p.date || p.updatedAt));
    rawAppointments.forEach(a => addDate(a.date || a.createdAt || a.startTime));
    
    // Always include current year as fallback
    years.add(currentYear);
    
    return Array.from(years).sort((a, b) => a - b);
  }, [rawOrders, rawProspects, rawAppointments, currentYear]);

  const fetchDashboardData = async () => {
    try {
      const [prospects, orders, appointments, analytics, targetsRes] = await Promise.all([
        prospectApi.list({}, user.token).catch(() => ({ data: [] })),
        orderApi.list({ limit: 5000 }, user.token).catch(() => ({ data: [] })),
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

    const collectionRate = totalRevenue > 0 ? (paidCollection >= totalRevenue ? 100 : (Math.floor((paidCollection / totalRevenue) * 1000) / 10)) : 0;
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
      { name: 'EXPECT', value: expected, color: '#f59e0b' },
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
    <ResponsivePage className="space-y-3 animate-in fade-in duration-700">
      {/* New Simple Filter Bar */}
      <div className="bg-slate-50 border border-slate-200 py-3 px-4 flex flex-wrap items-center gap-4 sm:gap-6 shadow-sm rounded-lg mb-2">
        <div className="flex items-center gap-2">
          <label className="text-[#0f172a] font-bold text-sm">Year:</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-slate-300 rounded text-sm px-2 py-1.5 outline-none font-medium bg-white text-slate-700 min-w-[80px]"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-[#0f172a] font-bold text-sm">Month:</label>
          <select 
            value={filterType === 'month' ? selectedMonth : 'all'} 
            onChange={(e) => {
              if (e.target.value === 'all') {
                 setFilterType('year');
              } else {
                 setFilterType('month');
                 setSelectedMonth(Number(e.target.value));
              }
            }}
            className="border border-slate-300 rounded text-sm px-2 py-1.5 outline-none font-medium bg-white text-slate-700 min-w-[110px]"
          >
            <option value="all">All Months</option>
            {monthNames.map((name, i) => (
              <option key={name} value={i}>{name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[#0f172a] font-bold text-sm">From:</label>
          <input 
            type="date" 
            value={fromDate}
            onChange={(e) => {
              setFilterType('custom');
              setFromDate(e.target.value);
            }}
            className="border border-slate-300 rounded text-sm px-2 py-1 outline-none font-medium bg-white text-slate-700"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[#0f172a] font-bold text-sm">To:</label>
          <input 
            type="date" 
            value={toDate}
            onChange={(e) => {
              setFilterType('custom');
              setToDate(e.target.value);
            }}
            className="border border-slate-300 rounded text-sm px-2 py-1 outline-none font-medium bg-white text-slate-700"
          />
        </div>

        <button 
          onClick={() => {
            setFilterType('year');
            setSelectedYear(currentYear);
            setFromDate('');
            setToDate('');
          }}
          className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-1.5 rounded text-sm font-medium transition-colors ml-auto sm:ml-0"
        >
          Clear Filters
        </button>
      </div>

      {!hasAnyData ? (
        <EmptyState 
          title={`No Records Found for ${periodLabel}`}
          description="There are no live orders, prospects, or appointments recorded during this selected date range. Please select another month (e.g., May 2026) or select All Year 2026 to view active records."
          icon={Inbox}
          className="my-6 sm:my-8"
        />
      ) : (
        <>
          {/* Enterprise Charts Section */}
          <div className="space-y-4 pt-2 min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0">
              
              {/* 1. Payment Status */}
              <ResponsiveCard className="flex flex-col justify-between hover:shadow-xl transition-all duration-300 min-w-0 h-full p-4">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight mb-0.5 truncate">Pending Payment - {periodLabel}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Paid vs Pending Revenue</p>
                </div>
                <div className="h-44 sm:h-48 w-full relative flex items-center justify-center min-w-0 mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="#059669" stopOpacity={1}/>
                        </linearGradient>
                        <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="#dc2626" stopOpacity={1}/>
                        </linearGradient>
                      </defs>
                      <Pie 
                        data={paymentData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={48} 
                        outerRadius={64} 
                        paddingAngle={5} 
                        dataKey="value"
                        stroke="none"
                        onClick={(entry, index) => navigate(`/orders?paymentStatus=${index === 0 ? 'Paid' : 'Pending'}`)}
                        className="cursor-pointer"
                      >
                        {paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? 'url(#colorPaid)' : 'url(#colorPending)'} />
                        ))}
                      </Pie>
                      {!paymentData[0].isEmpty && <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} contentStyle={glassmorphismTooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={{fill: 'transparent'}} />}
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center justify-center pointer-events-none drop-shadow-sm">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Collection</span>
                    <span className="text-2xl font-black text-slate-800 tracking-tight">
                      {summaryStats.totalRevenue > 0 ? (
                        paymentData[0].value >= summaryStats.totalRevenue
                          ? 100
                          : (Math.floor((paymentData[0].value / summaryStats.totalRevenue) * 1000) / 10)
                      ) : 0}%
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 mt-4 text-[11px] font-black text-slate-700 min-w-0">
                  <div 
                    onClick={() => navigate('/orders?paymentStatus=Paid')}
                    className="flex items-center justify-between gap-2 bg-gradient-to-r from-emerald-50/80 to-emerald-100/40 px-3 py-2 rounded-xl border border-emerald-100/60 shadow-2xs cursor-pointer hover:scale-[1.02] transition-transform"
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-xs shadow-emerald-300 ring-1 ring-white" />
                      <span className="text-emerald-950 font-bold uppercase tracking-wide text-[10px]">Paid Revenue</span>
                    </div>
                    <span className="text-emerald-700 font-black whitespace-nowrap text-right text-xs tracking-tight">
                      ₹{paymentData[0].isEmpty ? 0 : paymentData[0].value.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div 
                    onClick={() => navigate('/orders?paymentStatus=Pending')}
                    className="flex items-center justify-between gap-2 bg-gradient-to-r from-rose-50/80 to-rose-100/40 px-3 py-2 rounded-xl border border-rose-100/60 shadow-2xs cursor-pointer hover:scale-[1.02] transition-transform"
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 shadow-xs shadow-rose-300 ring-1 ring-white" />
                      <span className="text-rose-950 font-bold uppercase tracking-wide text-[10px]">Pending Revenue</span>
                    </div>
                    <span className="text-rose-700 font-black whitespace-nowrap text-right text-xs tracking-tight">
                      ₹{paymentData[0].isEmpty ? 0 : paymentData[1].value.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </ResponsiveCard>

              {/* 2. Order Fulfillment */}
              <ResponsiveCard className="flex flex-col justify-between hover:shadow-xl transition-all duration-300 min-w-0 h-full p-4">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight mb-0.5 truncate">Order Fulfillment - {periodLabel}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Active Execution Stages</p>
                </div>
                <div className="h-44 sm:h-48 w-full min-w-0 mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={orderFulfillmentData} margin={{ top: 15, right: 10, left: -30, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }} dy={5} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={glassmorphismTooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
                      <Bar 
                        dataKey="value" 
                        radius={[4, 4, 4, 4]} 
                        barSize={24} 
                        name="Orders"
                        onClick={(data) => navigate(`/orders?status=${encodeURIComponent(data.name)}`)}
                        className="cursor-pointer hover:opacity-80"
                      >
                        {orderFulfillmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' }} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4 text-[10px] font-black text-slate-700 w-full">
                  {orderFulfillmentData.map(item => (
                    <div 
                      key={item.name} 
                      onClick={() => navigate(`/orders?status=${encodeURIComponent(item.name)}`)}
                      className="flex flex-1 min-w-[90px] items-center justify-between gap-1.5 bg-slate-50/80 px-2.5 py-1.5 rounded-xl border border-slate-200/60 shadow-2xs cursor-pointer hover:scale-[1.02] transition-transform"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white" style={{ backgroundColor: item.color }} />
                        <span className="uppercase tracking-wider text-slate-600 text-[9px]">{item.name}</span>
                      </div>
                      <span className="text-slate-800 font-black text-xs">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </ResponsiveCard>

              {/* 3. Prospective Clients */}
              <ResponsiveCard className="flex flex-col justify-between hover:shadow-xl transition-all duration-300 min-w-0 h-full p-4">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight mb-0.5 truncate">Prospective Clients - {periodLabel}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Pipeline Priority Breakdown</p>
                </div>
                <div className="h-44 sm:h-48 w-full relative flex items-center justify-center min-w-0 mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={prospectiveClientsData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={48} 
                        outerRadius={64} 
                        paddingAngle={5} 
                        dataKey="value"
                        stroke="none"
                        onClick={(entry) => navigate(`/prospects?priority=${entry.name.charAt(0).toUpperCase() + entry.name.slice(1).toLowerCase()}`)}
                        className="cursor-pointer"
                      >
                        {prospectiveClientsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))' }} />
                        ))}
                      </Pie>
                      {!prospectiveClientsData[0].isEmpty && <Tooltip contentStyle={glassmorphismTooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />}
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center justify-center pointer-events-none drop-shadow-sm">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">TOTAL</span>
                    <span className="text-2xl font-black text-slate-800 tracking-tight">
                      {prospectiveClientsData[0].isEmpty ? 0 : prospectiveClientsData.reduce((sum, item) => sum + item.value, 0)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center items-center gap-1.5 mt-4 text-[10px] font-black text-slate-700 uppercase tracking-wider w-full">
                  {prospectiveClientsData[0].isEmpty ? (
                    <span className="text-slate-400 font-bold bg-slate-50 px-3 py-1.5 rounded-lg">No Active Prospects</span>
                  ) : (
                    prospectiveClientsData.map(item => (
                      <div 
                        key={item.name} 
                        onClick={() => navigate(`/prospects?priority=${item.name.charAt(0).toUpperCase() + item.name.slice(1).toLowerCase()}`)}
                        className="flex flex-1 min-w-[85px] items-center justify-between gap-1.5 bg-slate-50/80 px-2.5 py-1.5 rounded-xl border border-slate-200/60 shadow-2xs cursor-pointer hover:scale-[1.02] transition-transform"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white" style={{ backgroundColor: item.color }} />
                          <span className="text-[9px] text-slate-600">{item.name}</span>
                        </div>
                        <span className="text-slate-800 text-xs font-black">{item.value}</span>
                      </div>
                    ))
                  )}
                </div>
              </ResponsiveCard>

              {/* 4. Client Overview (RESPONSIVE HORIZONTAL ON DESKTOP) */}
              <ResponsiveCard className="flex flex-col hover:shadow-xl transition-all duration-300 min-w-0 h-full p-4 md:col-span-2 xl:col-span-2">
                {/* Header */}
                <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2 shrink-0">
                  <BarChart2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <h3 className="text-sm sm:text-base font-black text-slate-800 tracking-tight truncate">Client Overview - {periodLabel}</h3>
                </div>

                <div className="flex flex-col md:flex-row gap-4 md:gap-6 flex-1 min-w-0 h-full">
                  {/* Left Side: Chart */}
                  <div className="w-full md:w-1/2 flex flex-col min-h-[180px] min-w-0 md:border-r border-slate-100 md:pr-4">
                    <div className="h-44 sm:h-48 md:h-full w-full min-w-0 flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={clientOverviewData.chartData} margin={{ top: 10, right: 5, left: -25, bottom: 25 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            interval={0}
                            tickLine={false} 
                            axisLine={{ stroke: '#e2e8f0' }} 
                            tick={{ fill: '#475569', fontSize: 8, fontWeight: 700 }} 
                            angle={-20}
                            textAnchor="end"
                            height={35}
                          />
                          <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 9, fontWeight: 600 }} allowDecimals={false} />
                          <Tooltip contentStyle={glassmorphismTooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
                          <Bar 
                            dataKey="orders" 
                            name="Orders" 
                            radius={[4, 4, 0, 0]} 
                            barSize={14}
                            onClick={(data) => navigate(`/orders?orderType=${encodeURIComponent(data.name)}`)}
                            className="cursor-pointer hover:opacity-80"
                          >
                            {clientOverviewData.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={clientCategoryColors[entry.name] || '#3b82f6'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right Side: Totals and List */}
                  <div className="w-full md:w-1/2 flex flex-col min-w-0 justify-center">
                    {/* Totals Strip */}
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-100 pb-3 mb-3 min-w-0 shrink-0">
                      <div className="text-left pl-1 min-w-0">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">TOTAL CLIENTS</span>
                        <span className="text-lg sm:text-xl font-black text-blue-600 tracking-tight mt-0.5 block truncate">{clientOverviewData.totalClients}</span>
                      </div>
                      <div className="text-right pr-1 border-l border-slate-200 min-w-0 pl-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">TOTAL AMOUNT</span>
                        <span className="text-lg sm:text-xl font-black text-emerald-600 tracking-tight mt-0.5 block truncate">{formatINRConcise(clientOverviewData.totalAmount)}</span>
                      </div>
                    </div>

                    {/* 6 Category Items Grid */}
                    <div className="grid grid-cols-1 gap-1.5 min-w-0 overflow-y-auto pr-1 flex-1 content-start">
                      {clientOverviewData.items.map((item) => (
                        <div 
                          key={item.name} 
                          onClick={() => navigate(`/orders?orderType=${encodeURIComponent(item.name)}`)}
                          className="flex items-center justify-between bg-slate-50/80 hover:bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs transition-all min-w-0 gap-1.5 cursor-pointer hover:scale-[1.01]"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white" style={{ backgroundColor: clientCategoryColors[item.name] || '#3b82f6' }} />
                            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-700 truncate">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[9px] font-bold text-blue-600">{item.orders} ord</span>
                            <span className="text-[11px] font-black text-emerald-600 min-w-[55px] text-right">₹{item.amount.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ResponsiveCard>

              {/* 5. Pending Services */}
              <ResponsiveCard className="flex flex-col justify-start gap-2.5 hover:shadow-xl transition-all duration-300 min-w-0 h-fit p-4">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight mb-0.5 truncate">Pending Services - {periodLabel}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Bottleneck Analysis</p>
                </div>
                <div className="h-44 sm:h-48 w-full relative flex items-center justify-center min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={serviceStatusData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={46} 
                        outerRadius={64} 
                        paddingAngle={4} 
                        dataKey="value"
                        onClick={(entry) => navigate(`/orders?status=${encodeURIComponent(entry.name)}`)}
                        className="cursor-pointer"
                      >
                        {serviceStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))' }} />
                        ))}
                      </Pie>
                      {!serviceStatusData[0].isEmpty && <Tooltip contentStyle={glassmorphismTooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />}
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center pointer-events-none">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Pending</span>
                    <span className="text-xl font-black text-slate-900 tracking-tight">
                      {serviceStatusData[0].isEmpty ? 0 : serviceStatusData.reduce((a, b) => a + b.value, 0)}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 text-[10px] font-black text-slate-700 min-w-0">
                  {serviceStatusData[0].isEmpty ? (
                    <div className="text-center py-2 text-slate-400 font-bold">No pending orders in bottleneck stages</div>
                  ) : (
                    serviceStatusData.map(item => (
                      <div 
                        key={item.name} 
                        onClick={() => navigate(`/orders?status=${encodeURIComponent(item.name)}`)}
                        className="flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80 min-w-0 gap-1.5 cursor-pointer hover:scale-[1.01] transition-transform"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="font-bold text-slate-800 text-[10px] truncate">{item.name}</span>
                        </div>
                        <span className="bg-white px-2 py-0.5 rounded-md border text-xs font-black shadow-2xs shrink-0">{item.value}</span>
                      </div>
                    ))
                  )}
                </div>
              </ResponsiveCard>

              {/* 6. Most Ordered Products */}
              <ResponsiveCard className="flex flex-col justify-start gap-2.5 hover:shadow-xl transition-all duration-300 min-w-0 h-fit p-4">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight mb-0.5 truncate">Most Ordered Products - {periodLabel}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Product Lines by Quantity Sold</p>
                </div>
                
                {productData.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-200/60 my-auto">
                    <Package className="h-7 w-7 text-slate-300 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-500">No product line items ordered during this period</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 min-w-0">
                    {/* Horizontal Bars */}
                    <div className="h-40 sm:h-44 w-full min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={productData} layout="vertical" margin={{ top: 0, right: 15, left: 5, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }} />
                          <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickFormatter={(value) => value.length > 12 ? value.substring(0, 10) + '...' : value} tick={{ fill: '#0f172a', fontSize: 10, fontWeight: 800 }} width={85} />
                          <Tooltip contentStyle={glassmorphismTooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
                          <Bar dataKey="quantity" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={14} name="Qty Sold" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Product Rank Index Cards */}
                    <div className="space-y-1 border-t border-slate-100 pt-1.5 min-w-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider pb-0.5">Product Rank Index</p>
                      
                      {productData[0] && (
                        <div className="flex items-center justify-between px-2 py-1 rounded-xl bg-amber-50/90 border border-amber-200/80 shadow-2xs min-w-0 gap-1.5">
                          <div className="min-w-0 flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-amber-700 uppercase">🥇 1ST</span>
                            <span className="text-[11px] font-black text-slate-900 truncate">{productData[0].name}</span>
                          </div>
                          <span className="text-[11px] font-black text-amber-600 shrink-0">{productData[0].quantity} sold</span>
                        </div>
                      )}

                      {productData[1] && (
                        <div className="flex items-center justify-between px-2 py-1 rounded-xl bg-blue-50/90 border border-blue-200/80 shadow-2xs min-w-0 gap-1.5">
                          <div className="min-w-0 flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-blue-700 uppercase">🥈 2ND</span>
                            <span className="text-[11px] font-black text-slate-900 truncate">{productData[1].name}</span>
                          </div>
                          <span className="text-[11px] font-black text-slate-700 shrink-0">{productData[1].quantity} sold</span>
                        </div>
                      )}

                      {productData[2] && (
                        <div className="flex items-center justify-between px-2 py-1 rounded-xl bg-orange-50/90 border border-orange-200/80 shadow-2xs min-w-0 gap-1.5">
                          <div className="min-w-0 flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-orange-700 uppercase">🥉 3RD</span>
                            <span className="text-[11px] font-black text-slate-900 truncate">{productData[2].name}</span>
                          </div>
                          <span className="text-[11px] font-black text-orange-600 shrink-0">{productData[2].quantity} sold</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </ResponsiveCard>

              {/* 7. Appointments Status */}
              <ResponsiveCard className="flex flex-col justify-between hover:shadow-xl transition-all duration-300 min-w-0 h-full p-4">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight mb-0.5 truncate">Appointments Status - {periodLabel}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Meetings & Schedule Overview</p>
                </div>
                <div className="h-44 sm:h-48 w-full relative flex items-center justify-center min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={appointmentsData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={48} 
                        outerRadius={64} 
                        paddingAngle={5} 
                        dataKey="value"
                        onClick={(entry) => navigate(`/appointments?status=${encodeURIComponent(entry.name)}`)}
                        className="cursor-pointer"
                      >
                        {appointmentsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))' }} />
                        ))}
                      </Pie>
                      {!appointmentsData[0].isEmpty && <Tooltip contentStyle={glassmorphismTooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />}
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center pointer-events-none">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Done</span>
                    <span className="text-xl font-black text-slate-900 tracking-tight">
                      {summaryStats.totalAppointmentsCount > 0 ? Math.round((appointmentsData[0].value / summaryStats.totalAppointmentsCount) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-[10px] font-black text-slate-700">
                  {appointmentsData.map(item => (
                    <div 
                      key={item.name} 
                      onClick={() => navigate(`/appointments?status=${encodeURIComponent(item.name)}`)}
                      className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/80 shadow-2xs cursor-pointer hover:scale-[1.02] transition-transform"
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="whitespace-nowrap text-[9px]">{item.name}:</span>
                      <span className="px-1 py-0.2 rounded bg-white border border-slate-200 text-slate-900 font-extrabold text-[10px]">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </ResponsiveCard>

            </div>
          </div>
        </>
      )}
    </ResponsivePage>
  );
};

export default UnifiedDashboard;


