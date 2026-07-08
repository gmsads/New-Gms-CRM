import React from 'react';
import { Users, UserCheck, UserPlus, TrendingDown, Briefcase } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';

const HRDashboard = ({ employees = [] }) => {
  const total = employees.length;
  const active = employees.filter(e => e.status === 'ACTIVE').length;
  const inactive = total - active;
  const newJoinees = employees.filter(e => {
    const d = new Date(e.createdAt);
    return (Date.now() - d.getTime()) < 30 * 24 * 60 * 60 * 1000;
  }).length;

  // Mock data for attrition and open positions
  const attritionRate = '4.2%';
  const openPositions = 12;

  const deptCount = {};
  employees.forEach(e => { if (e.department) deptCount[e.department] = (deptCount[e.department] || 0) + 1; });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-2">
        <h2 className="text-2xl font-bold tracking-tight">Workforce Overview</h2>
        <p className="text-muted-foreground text-sm">Key performance indicators and demographic data.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Employees" value={total} icon={Users} color="primary" />
        <StatCard title="Active / Inactive" value={`${active} / ${inactive}`} icon={UserCheck} color="green" />
        <StatCard title="New Joinees (30d)" value={newJoinees} icon={UserPlus} color="blue" />
        <StatCard title="Attrition Rate" value={attritionRate} icon={TrendingDown} color="red" trend="-0.5%" />
        <StatCard title="Open Positions" value={openPositions} icon={Briefcase} color="yellow" trend="+2" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Department Distribution */}
        <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg mb-4 text-foreground/90">Department Distribution</h3>
          {Object.keys(deptCount).length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(deptCount).map(([dept, count]) => {
                const pct = Math.round((count / total) * 100) || 0;
                return (
                  <div key={dept} className="group">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">{dept}</span>
                      <span className="text-muted-foreground font-mono">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Insights & Alerts */}
        <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <h3 className="font-semibold text-lg mb-4 text-foreground/90">AI People Insights</h3>
          <div className="space-y-3 flex-1">
            <div className="p-3 rounded-lg border border-blue-100 bg-blue-50/50 flex gap-3 items-start">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">High Attrition Risk in Sales</p>
                <p className="text-xs text-blue-700 mt-1">3 top performers in the Sales team show signs of reduced engagement based on recent attendance.</p>
              </div>
            </div>
            <div className="p-3 rounded-lg border border-green-100 bg-green-50/50 flex gap-3 items-start">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-green-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900">Hiring Velocity Increased</p>
                <p className="text-xs text-green-700 mt-1">Time-to-hire decreased by 14% this quarter. Design positions are filling the fastest.</p>
              </div>
            </div>
            <div className="p-3 rounded-lg border border-yellow-100 bg-yellow-50/50 flex gap-3 items-start">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-yellow-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Training Recommended</p>
                <p className="text-xs text-yellow-700 mt-1">Operations team shows a 12% drop in task completion rate. Consider a mid-month alignment session.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
