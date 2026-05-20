import React from 'react';
import { TrendingUp, Users, Target, DollarSign, RefreshCw } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

const BusinessIntelligence = () => {
  const { data: apiData, loading, error, refetch } = useApi('/analytics/stats');
  const stats = apiData?.data || {};

  const kpis = [
    { label: 'Cumulative Revenue', value: `₹${(stats.kpis?.totalRevenue || 0).toLocaleString()}`, change: '+18%', up: true, icon: DollarSign, color: 'emerald' },
    { label: 'Strategic Ad Spend', value: `₹${(stats.kpis?.totalSpend || 0).toLocaleString()}`, change: '+12%', up: false, icon: TrendingUp, color: 'blue' },
    { label: 'Acquisition Yield', value: (stats.kpis?.totalLeads || 0).toString(), change: '+24%', up: true, icon: Users, color: 'indigo' },
    { label: 'Conversion Efficiency', value: stats.kpis?.avgConversion || '0%', change: '+0.8%', up: true, icon: Target, color: 'amber' },
  ];

  if (loading && !apiData) return <div className="flex h-96 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Business Intelligence</h1>
          <p className="text-sm font-semibold text-slate-500">Holistic performance metrics and growth projection models.</p>
        </div>
        <button onClick={refetch} className="h-11 px-6 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-600 shadow-lg shadow-slate-200 transition-all flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Recalculate Stats
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, change, up, icon: Icon, color }) => (
          <div key={label} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-${color}-50 text-${color}-600 border border-${color}-100 shadow-inner`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">{value}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <TrendingUp className={`h-3 w-3 ${up ? 'text-emerald-500' : 'text-rose-500 rotate-180'}`} />
              <span className={`text-[10px] font-black uppercase ${up ? 'text-emerald-600' : 'text-rose-600'}`}>{change} vs period</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
           <h3 className="text-xl font-black text-slate-900 mb-2">Revenue vs Deployment</h3>
           <p className="text-sm font-semibold text-slate-400 mb-8">Quarterly analysis of gross intake against operational expenditure.</p>
           <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={stats.revenueVsSpend || []}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                 <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                 <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                 <Bar dataKey="spend" name="Ad Spend" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
           <h3 className="text-xl font-black text-slate-900 mb-2">Platform Efficiency</h3>
           <p className="text-sm font-semibold text-slate-400 mb-8">Lead distribution across multi-channel acquisition funnels.</p>
           <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={stats.platformBreakdown || []} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="leads" nameKey="platform">
                   {(stats.platformBreakdown || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                 </Pie>
                 <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                 <Legend verticalAlign="bottom" height={36}/>
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
           <h3 className="text-xl font-black text-slate-900">Strategic Performance Matrix</h3>
           <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <table className="w-full text-left">
           <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <tr>{['Acquisition Channel', 'Net Leads Generated', 'Conversion Weighted Yield'].map(h => <th key={h} className="px-8 py-5">{h}</th>)}</tr>
           </thead>
           <tbody className="divide-y divide-slate-50">
              {(stats.platformBreakdown || []).map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6 font-black text-slate-900">{row.platform}</td>
                  <td className="px-8 py-6 font-black text-blue-600">{row.leads}</td>
                  <td className="px-8 py-6">
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500" style={{width: `${Math.min(100, (row.leads / 100) * 100)}%`}} />
                    </div>
                  </td>
                </tr>
              ))}
           </tbody>
        </table>
      </div>
    </div>
  );
};

export default BusinessIntelligence;
