import React from 'react';
import { Users, UserCheck, UserPlus, TrendingDown, Briefcase, RefreshCw, Zap, Award } from 'lucide-react';

const HRDashboard = ({ employees = [] }) => {
  const total = employees.length;
  const active = employees.filter(e => e.status === 'ACTIVE').length;
  const inactive = total - active;
  const newJoinees = employees.filter(e => {
    const d = new Date(e.createdAt);
    return (Date.now() - d.getTime()) < 30 * 24 * 60 * 60 * 1000;
  }).length;

  const attritionRate = '4.2%';
  const openPositions = 12;

  const deptCount = {};
  employees.forEach(e => { if (e.department) deptCount[e.department] = (deptCount[e.department] || 0) + 1; });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Workforce', value: total, icon: Users, color: 'blue' },
          { label: 'Operational', value: active, icon: UserCheck, color: 'emerald' },
          { label: 'Onboarding', value: newJoinees, icon: UserPlus, color: 'indigo' },
          { label: 'Attrition', value: attritionRate, icon: TrendingDown, color: 'rose' },
          { label: 'Open Roles', value: openPositions, icon: Briefcase, color: 'amber' },
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

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
           <h3 className="text-xl font-black text-slate-900 mb-2">Departmental Allocation</h3>
           <p className="text-sm font-semibold text-slate-400 mb-8">Structural distribution across functional domains.</p>
           <div className="space-y-6">
              {Object.entries(deptCount).map(([dept, count]) => {
                const pct = Math.round((count / total) * 100) || 0;
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
              {Object.keys(deptCount).length === 0 && <p className="text-center py-10 text-[10px] font-black text-slate-300 uppercase tracking-widest">No Sector Data</p>}
           </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900">Intelligence Briefing</h3>
                <p className="text-sm font-semibold text-slate-400">AI-driven personnel insights and risk assessment.</p>
              </div>
              <Zap className="h-6 w-6 text-amber-500 animate-pulse" />
           </div>
           <div className="space-y-4 flex-1">
              {[
                { title: 'Engagement Warning', text: 'Retention risks detected in Sales sector. 3 key performers show engagement decline.', type: 'danger' },
                { title: 'Efficiency Milestone', text: 'Acquisition velocity increased by 14%. Design roles filling at record speeds.', type: 'success' },
                { title: 'Optimization Alert', text: 'Operational bandwidth suggests a 12% capacity gap. Alignment session required.', type: 'warning' },
              ].map((insight, i) => (
                <div key={i} className={`p-5 rounded-[1.5rem] border flex gap-4 items-start transition-all hover:scale-[1.02] ${insight.type === 'danger' ? 'bg-rose-50 border-rose-100' : insight.type === 'success' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                  <Award className={`h-5 w-5 mt-0.5 ${insight.type === 'danger' ? 'text-rose-600' : insight.type === 'success' ? 'text-emerald-600' : 'text-amber-600'}`} />
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${insight.type === 'danger' ? 'text-rose-700' : insight.type === 'success' ? 'text-emerald-700' : 'text-amber-700'}`}>{insight.title}</p>
                    <p className="text-xs font-bold text-slate-600 mt-1">{insight.text}</p>
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
