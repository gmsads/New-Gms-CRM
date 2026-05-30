import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import useApi from '../../../hooks/useApi';
import {
  TrendingUp, CheckCircle, Clock, ShieldCheck, 
  Target, MapPin, Package, CreditCard, Activity, 
  AlertCircle, Quote
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [filters, setFilters] = React.useState({
    month: '',
    year: '',
    area: ''
  });

  const { data: rawData, loading, refetch } = useApi('/analytics/ceo-report', { params: filters });
  const { data: qData, loading: qLoading } = useApi('/quotations');

  
  
  const stats = {
    financials: rawData?.financials || {},
    products:   rawData?.products   || { top: [], least: [] },
    clients:    rawData?.clients    || [],
    executives: rawData?.executives || [],
    pendingApprovals: rawData?.pendingApprovals || 0
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

  const financials = stats.financials || {};
  const quotesCount = qData?.data?.length || 0;

  
  return (
    <div className="space-y-8 pb-10">
      {/* CEO Filter Command Bar */}
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
              <input name="area" type="text" value={filters.area} onChange={handleFilterChange} placeholder="Search area..." className="w-full h-10 pl-9 pr-4 rounded-xl border bg-slate-50 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
            </div>
          </div>
        </div>
        <button onClick={() => refetch()} className="h-10 px-6 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all active:scale-95">Generate Report</button>
      </div>

      {/* Main Financial Pulse */}
      <div className="grid gap-6 md:grid-cols-5">
        <div className="relative overflow-hidden rounded-3xl bg-blue-600 p-6 text-white shadow-xl shadow-blue-200">
          <TrendingUp className="absolute -right-4 -top-4 h-24 w-24 opacity-10" />
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Sales Value</p>
          <h3 className="mt-2 text-2xl font-black">₹{(financials.totalSales || 0).toLocaleString()}</h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold bg-white/20 w-fit px-2 py-0.5 rounded-full">
            <Package className="h-3 w-3" /> {financials.orderCount || 0} Orders
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-indigo-600 p-6 text-white shadow-xl shadow-indigo-200 cursor-pointer hover:scale-105 transition-all" onClick={() => navigate('/quotations')}>
          <Quote className="absolute -right-4 -top-4 h-24 w-24 opacity-10" />
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Sales Quotations</p>
          <h3 className="mt-2 text-2xl font-black">{quotesCount}</h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold bg-white/20 w-fit px-2 py-0.5 rounded-full">
            <Activity className="h-3 w-3" /> Active Pipeline
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

        <div onClick={() => navigate('/approvals')} className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-200 cursor-pointer group hover:bg-slate-800 transition-all">
          <ShieldCheck className="absolute -right-4 -top-4 h-24 w-24 opacity-10 group-hover:scale-110 transition-transform" />
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Governance Approvals</p>
          <h3 className="mt-2 text-3xl font-black text-amber-400">{stats.pendingApprovals || 0}</h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold bg-white/10 w-fit px-2 py-0.5 rounded-full group-hover:bg-amber-500/20 transition-colors">
            <Target className="h-3 w-3 text-amber-400" /> Awaiting Action
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
