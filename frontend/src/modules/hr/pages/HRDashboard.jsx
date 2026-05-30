import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserPlus, TrendingDown, Briefcase, RefreshCw, Zap, Award, DollarSign, Activity, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const fallbackData = {
  workforce: { total: 156, active: 148, attrition: '4.2%' },
  recruitment: { openRoles: 12, newJoinees: 8 },
  compensation: { payroll: '$1.2M', incentives: '$45K' },
  alerts: [
    { type: 'danger', title: 'Engagement Warning', message: 'Retention risks detected in Sales sector. 3 key performers show engagement decline.' },
    { type: 'success', title: 'Efficiency Milestone', message: 'Acquisition velocity increased by 14%. Design roles filling at record speeds.' },
    { type: 'warning', title: 'Optimization Alert', message: 'Operational bandwidth suggests a 12% capacity gap in Engineering.' },
  ]
};

const HRDashboard = ({ employees = [] }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/hr-dashboard/stats');
        if (!response.ok) throw new Error('API not available');
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.warn('Failed to fetch stats, using fallback data.', err);
        setStats(fallbackData);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const deptCount = {};
  employees.forEach(e => { if (e.department) deptCount[e.department] = (deptCount[e.department] || 0) + 1; });

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{user?.name?.split(' ')[0] || 'HR'}!</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium mt-2 italic">
            "People are the heartbeat of our company. Keep the pulse strong."
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Workforce', value: stats.workforce.total, icon: Users, color: 'blue' },
          { label: 'Active Employees', value: stats.workforce.active, icon: UserCheck, color: 'emerald' },
          { label: 'Attrition Rate', value: stats.workforce.attrition, icon: TrendingDown, color: 'rose' },
          { label: 'Open Positions', value: stats.recruitment.openRoles, icon: Briefcase, color: 'amber' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
             <div className={`h-12 w-12 rounded-2xl flex items-center justify-center bg-${color}-50 text-${color}-600 border border-${color}-100 shadow-inner mb-4`}>
               <Icon className="h-6 w-6" />
             </div>
             <p className="text-3xl font-black text-slate-900 leading-none mb-1">{value}</p>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
         <div className="rounded-[2rem] bg-gradient-to-br from-indigo-500 to-blue-600 p-8 text-white shadow-lg shadow-blue-200">
            <h3 className="text-sm font-black uppercase tracking-widest text-blue-100 mb-6">Workforce Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/20 pb-4">
                <span className="font-medium text-blue-50">Total Employees</span>
                <span className="text-2xl font-black">{stats.workforce.total}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/20 pb-4">
                <span className="font-medium text-blue-50">Active Operational</span>
                <span className="text-2xl font-black">{stats.workforce.active}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-blue-50">Monthly Attrition</span>
                <span className="text-2xl font-black">{stats.workforce.attrition}</span>
              </div>
            </div>
         </div>

         <div className="rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white shadow-lg shadow-emerald-200">
            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-100 mb-6">Recruitment Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/20 pb-4">
                <span className="font-medium text-emerald-50">Open Requisitions</span>
                <span className="text-2xl font-black">{stats.recruitment.openRoles}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/20 pb-4">
                <span className="font-medium text-emerald-50">Recent Joinees</span>
                <span className="text-2xl font-black">{stats.recruitment.newJoinees}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-emerald-50">Offer Acceptance</span>
                <span className="text-2xl font-black">92%</span>
              </div>
            </div>
         </div>

         <div className="rounded-[2rem] bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-white shadow-lg shadow-amber-200">
            <h3 className="text-sm font-black uppercase tracking-widest text-amber-100 mb-6">Compensation Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/20 pb-4">
                <span className="font-medium text-amber-50">Monthly Payroll</span>
                <span className="text-2xl font-black">{stats.compensation.payroll}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/20 pb-4">
                <span className="font-medium text-amber-50">Active Incentives</span>
                <span className="text-2xl font-black">{stats.compensation.incentives}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-amber-50">Pending Claims</span>
                <span className="text-2xl font-black">18</span>
              </div>
            </div>
         </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
           <h3 className="text-xl font-black text-slate-900 mb-2">Departmental Allocation</h3>
           <p className="text-sm font-semibold text-slate-400 mb-8">Structural distribution across functional domains.</p>
           <div className="space-y-6">
              {Object.entries(deptCount).map(([dept, count]) => {
                const pct = Math.round((count / employees.length) * 100) || 0;
                return (
                  <div key={dept} className="group">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                      <span className="text-slate-500 group-hover:text-blue-600 transition-colors">{dept}</span>
                      <span className="text-slate-400">{count} Units ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {Object.keys(deptCount).length === 0 && (
                <div className="py-10 flex flex-col items-center justify-center text-slate-300">
                  <Activity className="w-8 h-8 mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No Sector Data</p>
                </div>
              )}
           </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  System Alerts
                </h3>
                <p className="text-sm font-semibold text-slate-400">Real-time intelligence and automated notifications.</p>
              </div>
              <div className="relative">
                <AlertTriangle className="h-6 w-6 text-rose-500 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
              </div>
           </div>
           <div className="space-y-4 flex-1">
              {stats.alerts.map((insight, i) => (
                <div key={i} className={`p-5 rounded-[1.5rem] border flex gap-4 items-start transition-all hover:scale-[1.02] ${insight.type === 'danger' ? 'bg-rose-50 border-rose-100' : insight.type === 'success' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                  <Award className={`h-5 w-5 mt-0.5 ${insight.type === 'danger' ? 'text-rose-600' : insight.type === 'success' ? 'text-emerald-600' : 'text-amber-600'}`} />
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${insight.type === 'danger' ? 'text-rose-700' : insight.type === 'success' ? 'text-emerald-700' : 'text-amber-700'}`}>{insight.title}</p>
                    <p className="text-xs font-bold text-slate-600 mt-1">{insight.message}</p>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
