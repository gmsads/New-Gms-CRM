import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import useApi from '../../../hooks/useApi';
import { 
  Users, TrendingUp, Calendar, Quote, ShieldCheck, 
  Clock, IndianRupee, Target, AlertTriangle, Package, CheckSquare
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// UI Components
const StatWidget = ({ title, value, subtext, icon: Icon, colorClass, onClick, delay = "0" }) => (
  <div 
    onClick={onClick}
    className={`relative overflow-hidden rounded-[2rem] bg-white border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[${delay}ms]`}
  >
    <div className="flex items-center justify-between">
      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border shadow-inner ${colorClass}`}>
        <Icon className="h-7 w-7" />
      </div>
    </div>
    <div className="mt-6">
      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
      <p className="mt-1 text-sm font-bold text-slate-500 uppercase tracking-tight">{title}</p>
      {subtext && <p className="mt-2 text-xs font-semibold text-slate-400">{subtext}</p>}
    </div>
  </div>
);

const SalesManagerWorkspace = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // APIs for stats
  const { data: prospectData } = useApi('/prospects');
  const { data: orderData } = useApi('/orders/stats');
  const { data: apptData } = useApi('/appointments/stats');
  const { data: quoteData } = useApi('/quotations');
  const { data: approvalData } = useApi('/approvals');

  const prospects = prospectData?.data || [];
  const orderStats = orderData?.data || {};
  const apptStats = apptData || {};
  const quotes = quoteData?.data || [];
  const approvals = approvalData?.data || [];

  const pendingApprovals = approvals.filter(a => a.status === 'Pending');
  const escalatedApprovals = pendingApprovals.filter(a => a.escalationRole === 'BRANCH_HEAD' || a.escalationRole === 'ADMIN');

  // Chart Data
  const targetData = [
    { name: 'Achieved', value: orderStats.totalRevenue || 550000, color: '#10b981' },
    { name: 'Remaining', value: Math.max(0, 1000000 - (orderStats.totalRevenue || 550000)), color: '#f1f5f9' }
  ];

  const teamPerfData = [
    { name: 'Exec 1', revenue: 120000, targets: 150000 },
    { name: 'Exec 2', revenue: 180000, targets: 150000 },
    { name: 'Exec 3', revenue: 90000, targets: 150000 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="bg-slate-900 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white tracking-tight">Manager Workspace</h1>
          <p className="text-lg text-slate-400 font-medium mt-2">
            Welcome, <span className="text-blue-400">{user?.name}</span>. Here is your enterprise snapshot.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-slate-300 uppercase tracking-widest border border-white/5">
              {(user?.role || '').replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatWidget 
          title="Team Revenue" 
          value={`₹${(orderStats.totalRevenue || 0).toLocaleString()}`} 
          subtext="Total revenue this month"
          icon={TrendingUp} 
          colorClass="bg-emerald-50 text-emerald-600 border-emerald-100" 
          delay="100"
        />
        <StatWidget 
          title="Pending Approvals" 
          value={pendingApprovals.length} 
          subtext={`${escalatedApprovals.length} escalations to Branch Head`}
          icon={ShieldCheck} 
          colorClass="bg-amber-50 text-amber-600 border-amber-100" 
          onClick={() => navigate('/approvals')}
          delay="200"
        />
        <StatWidget 
          title="Upcoming Appointments" 
          value={apptStats.pendingCount || 0} 
          subtext="Team wide appointments"
          icon={Calendar} 
          colorClass="bg-indigo-50 text-indigo-600 border-indigo-100" 
          onClick={() => navigate('/appointments')}
          delay="300"
        />
        <StatWidget 
          title="Pending Quotations" 
          value={quotes.length} 
          subtext="Waiting for client response"
          icon={Quote} 
          colorClass="bg-blue-50 text-blue-600 border-blue-100" 
          onClick={() => navigate('/quotations')}
          delay="400"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Target Progress */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Monthly Target</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Progress Snapshot</p>
          <div className="h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={targetData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                  {targetData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                  formatter={(val) => `₹${val.toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900">
                {Math.round((targetData[0].value / (targetData[0].value + targetData[1].value)) * 100)}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Achieved</span>
            </div>
          </div>
        </div>

        {/* Team Performance */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl lg:col-span-2">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Team Performance</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Revenue vs Targets</p>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamPerfData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" barSize={30} />
                <Bar dataKey="targets" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Target" barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Alerts & Actionables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Escalations */}
        <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-rose-900 tracking-tight">Escalation Alerts</h3>
              <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">Requires Branch Head Auth</p>
            </div>
          </div>
          <div className="space-y-3">
            {escalatedApprovals.length === 0 ? (
              <p className="text-sm font-semibold text-rose-400">No active escalations.</p>
            ) : (
              escalatedApprovals.slice(0, 3).map(app => (
                <div key={app._id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-rose-100/50">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{app.orderNumber || 'Order'}</p>
                    <p className="text-xs font-semibold text-slate-500">Requested by: {app.requestedBy?.name || 'Manager'}</p>
                  </div>
                  <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold uppercase tracking-widest">
                    Escalated
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Collections */}
        <div className="bg-amber-50 border border-amber-100 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-amber-900 tracking-tight">Payment Collections</h3>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Overdue & Pending</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-2xl flex items-center justify-between border border-amber-100/50">
              <div>
                <p className="text-sm font-bold text-slate-800">Pending Verification</p>
                <p className="text-xs font-semibold text-slate-500">Check with accounts</p>
              </div>
              <span className="text-lg font-black text-amber-600">5 Orders</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default SalesManagerWorkspace;
