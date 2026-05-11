import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import {
  Users, TrendingUp, Briefcase, Clock, CheckCircle, Target,
  MapPin, Palette, Package, CreditCard, Server, Activity,
  Star, Truck, FileImage, BarChart2, AlertCircle, ShieldCheck
} from 'lucide-react';
import { SalesExecDashboard } from './SalesExec/index';

// ── Admin / CEO Dashboard ──────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const [filters, setFilters] = React.useState({
    month: '', // Default to all-time
    year: '',
    area: ''
  });

  const query = new URLSearchParams(Object.entries(filters).filter(([_, v]) => v !== '')).toString();
  const { data, loading, error, refetch } = useApi(`/analytics/stats${query ? '?' + query : ''}`);
  const rawStats = data?.data || data || {};
  const stats = {
    financials: rawStats.financials || {},
    products:   rawStats.products   || { top: [], least: [] },
    clients:    rawStats.clients    || [],
    executives: rawStats.executives || []
  };

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4">
      <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Generating CEO Report...</p>
    </div>
  );

  if (error) return (
    <div className="rounded-[2.5rem] border border-rose-200 bg-rose-50 p-12 text-center">
      <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
      <h3 className="text-xl font-black text-rose-900">Analytics Sync Failed</h3>
      <p className="text-sm text-rose-600 mt-2 font-semibold">{error}</p>
      <button onClick={() => refetch()} className="mt-6 px-6 py-2 bg-rose-600 text-white rounded-xl font-bold text-sm">Retry Sync</button>
    </div>
  );

  const financials = stats.financials || {};

  return (
    <div className="space-y-8 pb-10">
      {/* ── CEO Filter Command Bar ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-end gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1 w-full">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Select Month</label>
            <select name="month" value={filters.month} onChange={handleFilterChange} className="w-full h-10 px-3 rounded-xl border bg-slate-50 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all">
              <option value="">All Time</option>
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Select Year</label>
            <select name="year" value={filters.year} onChange={handleFilterChange} className="w-full h-10 px-3 rounded-xl border bg-slate-50 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all">
              <option value="">All Time</option>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="space-y-1.5 col-span-2 md:col-span-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Filter Area / Region</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                name="area"
                type="text" 
                value={filters.area}
                onChange={handleFilterChange}
                placeholder="Search area..." 
                className="w-full h-10 pl-9 pr-4 rounded-xl border bg-slate-50 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
        </div>
        <button 
          onClick={() => refetch()}
          className="h-10 px-6 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all active:scale-95"
        >
          Generate Report
        </button>
      </div>

      {/* ── Main Financial Pulse ─────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="relative overflow-hidden rounded-3xl bg-blue-600 p-6 text-white shadow-xl shadow-blue-200">
          <TrendingUp className="absolute -right-4 -top-4 h-24 w-24 opacity-10" />
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Sales Value</p>
          <h3 className="mt-2 text-2xl font-black">₹{(financials.totalSales || 0).toLocaleString()}</h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold bg-white/20 w-fit px-2 py-0.5 rounded-full">
            <Package className="h-3 w-3" /> {financials.orderCount || 0} Orders
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-emerald-600 p-6 text-white shadow-xl shadow-emerald-200">
          <CheckCircle className="absolute -right-4 -top-4 h-24 w-24 opacity-10" />
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Payments</p>
          <h3 className="mt-2 text-2xl font-black">₹{(financials.totalPaid || 0).toLocaleString()}</h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold bg-white/20 w-fit px-2 py-0.5 rounded-full">
            <CreditCard className="h-3 w-3" /> Verified
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-rose-600 p-6 text-white shadow-xl shadow-rose-200">
          <Clock className="absolute -right-4 -top-4 h-24 w-24 opacity-10" />
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Pending Balance</p>
          <h3 className="mt-2 text-2xl font-black">₹{(financials.totalPending || 0).toLocaleString()}</h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold bg-white/20 w-fit px-2 py-0.5 rounded-full">
            <AlertCircle className="h-3 w-3" /> Outstanding
          </div>
        </div>

        <div 
          onClick={() => navigate('/approvals')}
          className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-200 cursor-pointer group hover:bg-slate-800 transition-all"
        >
          <ShieldCheck className="absolute -right-4 -top-4 h-24 w-24 opacity-10 group-hover:scale-110 transition-transform" />
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Governance Approvals</p>
          <h3 className="mt-2 text-3xl font-black text-amber-400">
            {rawStats.pendingApprovals || 0}
          </h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold bg-white/10 w-fit px-2 py-0.5 rounded-full group-hover:bg-amber-500/20 transition-colors">
            <Target className="h-3 w-3 text-amber-400" /> Awaiting Action
          </div>
        </div>
      </div>

      {/* ── Product & Client Intelligence ───────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product Performance */}
        <div className="rounded-[2.5rem] border bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900">Product Velocity</h3>
              <p className="text-sm font-semibold text-slate-500">Comparing high-volume vs. stagnant items.</p>
            </div>
            <Activity className="h-6 w-6 text-blue-500" />
          </div>

          <div className="space-y-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-4 bg-emerald-50 w-fit px-3 py-1 rounded-full">Top Selling</p>
              <div className="space-y-4">
                {stats.products.top.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">{p._id}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-slate-400">{p.quantity} units</span>
                      <span className="text-sm font-black text-slate-900 w-24 text-right">₹{p.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-4 bg-rose-50 w-fit px-3 py-1 rounded-full">Least Selling</p>
              <div className="space-y-4">
                {stats.products.least.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-400">{p._id}</span>
                    <span className="text-xs font-black text-slate-400">{p.quantity} units</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Client & Executive Leaderboard */}
        <div className="space-y-8">
          <div className="rounded-[2.5rem] border bg-white p-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-6">Strategic Client Ranking</h3>
            <div className="space-y-4">
              {stats.clients.map((c, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-xs">
                    #{i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{c._id}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{c.orders} Orders Placed</p>
                  </div>
                  <span className="font-black text-slate-900">₹{c.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] border bg-white p-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-6">Sales Force Efficiency</h3>
            <div className="space-y-4">
              {stats.executives.map((e, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-xs">
                    {e.name ? e.name[0] : '?'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{e.name}</p>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${(e.revenue / (financials.totalSales || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">₹{e.revenue.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{e.orders} Closed</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── HR Dashboard ───────────────────────────────────────────────────────────────
const HRDashboard = () => {
  const { data: empData,   loading: l1 } = useApi('/employees');
  const { data: leaveData, loading: l2 } = useApi('/leaves?status=PENDING');

  const employees = empData?.employees || [];
  const leaves    = leaveData?.leaves || leaveData || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Employees"  value={employees.length}                                icon={Users}      color="primary" loading={l1} />
        <StatCard title="Active"           value={employees.filter(e=>e.status==='ACTIVE').length} icon={CheckCircle} color="green"  loading={l1} />
        <StatCard title="Pending Leaves"   value={leaves.length}                                   icon={Clock}       color="yellow" loading={l2} />
        <StatCard title="New (30d)"        value={employees.filter(e=>{ const d=new Date(e.createdAt); return (Date.now()-d)< 30*86400*1000; }).length} icon={Users} color="blue" loading={l1} />
      </div>
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="font-semibold text-lg mb-3">Quick Actions</h3>
        <p className="text-sm text-muted-foreground">Go to the <strong>HR</strong> section to add employees, manage attendance and review leaves.</p>
      </div>
    </div>
  );
};

// ── Sales Manager Dashboard ────────────────────────────────────────────────────
const SalesManagerDashboard = () => {
  const { data: prospectData, loading: l1 } = useApi('/prospects');
  const { data: orderData,    loading: l2 } = useApi('/orders/stats');

  const prospects = prospectData?.prospects || prospectData || [];
  const stats     = orderData || {};

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Prospects" value={Array.isArray(prospects)?prospects.length:(prospectData?.total||0)} icon={Users}     color="primary" loading={l1} />
        <StatCard title="Total Orders"    value={stats.total   ||0} icon={Package}    color="blue"   loading={l2} />
        <StatCard title="Order Revenue"   value={stats.totalRevenue?`₹${stats.totalRevenue.toLocaleString()}`:'₹0'} icon={TrendingUp} color="green" loading={l2} />
        <StatCard title="Pending Orders"  value={stats.pending ||0} icon={Clock}       color="yellow" loading={l2} />
      </div>
    </div>
  );
};

// ── Field Exec Dashboard ───────────────────────────────────────────────────────
const FieldExecDashboard = () => {
  const { data, loading } = useApi('/visits');
  const visits = data?.visits || data || [];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Visits"    value={visits.length}                                         icon={MapPin}     color="primary" loading={loading} />
        <StatCard title="Completed"       value={visits.filter(v=>v.status==='COMPLETED').length}        icon={CheckCircle} color="green"  loading={loading} />
        <StatCard title="Scheduled Today" value={visits.filter(v=>v.visitDate&&new Date(v.visitDate).toDateString()===new Date().toDateString()).length} icon={Truck} color="blue" loading={loading} />
      </div>
      {visits.length === 0 && !loading && (
        <EmptyState icon={MapPin} title="No visits yet" description="Your field visits will appear here once assigned." />
      )}
    </div>
  );
};

// ── Generic Role Dashboard ─────────────────────────────────────────────────────
const GenericDashboard = ({ role }) => {
  const { user } = useAuth();
  return (
    <div className="rounded-xl border bg-card p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <BarChart2 className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold">Welcome, {user?.name}</h3>
      <p className="text-muted-foreground mt-2">Your <strong>{(role || 'User').replace(/_/g,' ')}</strong> dashboard is live.</p>
      <p className="text-sm text-muted-foreground mt-1">Use the sidebar to navigate to your modules.</p>
    </div>
  );
};

// ── Role → Dashboard Map ────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role || '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        {role === 'SALES_EXEC' || role === 'FIELD_EXEC' ? (
          <p className="text-muted-foreground text-sm font-medium">
            Welcome back, <span className="font-medium text-foreground">{user.name}</span>. Here's your sales overview.
          </p>
        ) : role === 'ADMIN' || role === 'MD_CEO' ? (
          <p className="text-muted-foreground text-sm font-medium">
            Welcome back, <span className="font-bold text-slate-900">Mr. B B Chary</span>. General Management Overview.
          </p>
        ) : (
          <p className="text-muted-foreground">
            Welcome back, <span className="font-medium text-foreground">{user.name}</span>.
            {' '}Viewing as <span className="font-semibold text-primary">{role.replace(/_/g,' ')}</span>.
          </p>
        )}
      </div>

      {role === 'ADMIN'              && <AdminDashboard />}
      {role === 'MD_CEO'             && <AdminDashboard />}
      {role === 'HR'                 && <HRDashboard />}
      {role === 'SALES_EXEC'         && <SalesExecDashboard />}
      {role === 'SALES_MANAGER'      && <SalesManagerDashboard />}
      {role === 'FIELD_EXEC'         && <FieldExecDashboard />}
      {!['ADMIN','MD_CEO','HR','SALES_EXEC','SALES_MANAGER','FIELD_EXEC'].includes(role) && <GenericDashboard role={role} />}
    </div>
  );
};

export default Dashboard;
