import React from 'react';
import { TrendingUp, Users, Target, DollarSign } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const monthlyData = [
  { month: 'Jan', revenue: 42000, spend: 18000 }, { month: 'Feb', revenue: 38000, spend: 15000 },
  { month: 'Mar', revenue: 55000, spend: 22000 }, { month: 'Apr', revenue: 49000, spend: 20000 },
  { month: 'May', revenue: 63000, spend: 24000 }, { month: 'Jun', revenue: 58000, spend: 21000 },
];

const platformData = [
  { platform: 'Facebook', spend: 12000, leads: 340 }, { platform: 'Google', spend: 18000, leads: 520 },
  { platform: 'LinkedIn', spend: 8000, leads: 180 }, { platform: 'YouTube', spend: 5000, leads: 95 },
];

const pieData = [
  { name: 'Facebook', value: 34 }, { name: 'Google', value: 41 },
  { name: 'LinkedIn', value: 16 }, { name: 'YouTube', value: 9 },
];
const COLORS = ['hsl(220,80%,55%)', 'hsl(262,83%,58%)', 'hsl(170,65%,42%)', 'hsl(35,90%,55%)'];

const conversionData = [
  { month: 'Jan', rate: 5.2 }, { month: 'Feb', rate: 4.8 }, { month: 'Mar', rate: 6.1 },
  { month: 'Apr', rate: 5.9 }, { month: 'May', rate: 7.2 }, { month: 'Jun', rate: 6.8 },
];

const tooltipStyle = { backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' };
const tickStyle = { fill: 'hsl(var(--muted-foreground))', fontSize: 12 };

const Analytics = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
      <p className="text-muted-foreground">Campaign performance and revenue insights.</p>
    </div>

    {/* KPI Row */}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: 'Total Revenue', value: '$305,000', change: '+18%', up: true, icon: DollarSign },
        { label: 'Total Ad Spend', value: '$120,000', change: '+12%', up: false, icon: TrendingUp },
        { label: 'Total Leads', value: '1,135', change: '+24%', up: true, icon: Users },
        { label: 'Avg. Conversion', value: '6.0%', change: '+0.8%', up: true, icon: Target },
      ].map(({ label, value, change, up, icon: Icon }) => (
        <div key={label} className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold">{value}</p>
          <p className={`text-sm mt-1 ${up ? 'text-green-500' : 'text-red-500'}`}>{change} vs last period</p>
        </div>
      ))}
    </div>

    {/* Revenue vs Spend Chart */}
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h3 className="font-semibold text-lg mb-1">Revenue vs Ad Spend</h3>
      <p className="text-sm text-muted-foreground mb-4">Monthly comparison of revenue generated against advertising spend.</p>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={tickStyle} />
            <YAxis axisLine={false} tickLine={false} tick={tickStyle} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => [`$${v.toLocaleString()}`, '']} />
            <Legend />
            <Bar dataKey="revenue" name="Revenue" fill="hsl(262,83%,58%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="spend" name="Ad Spend" fill="hsl(215,80%,65%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Platform Breakdown + Conversion Rate */}
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="font-semibold text-lg mb-1">Platform Breakdown</h3>
        <p className="text-sm text-muted-foreground mb-4">Lead share by advertising platform.</p>
        <div className="h-[240px] flex items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}%`]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="font-semibold text-lg mb-1">Conversion Rate Trend</h3>
        <p className="text-sm text-muted-foreground mb-4">Monthly lead-to-client conversion rate (%).</p>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={conversionData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="cvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(170,65%,42%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(170,65%,42%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={tickStyle} />
              <YAxis axisLine={false} tickLine={false} tick={tickStyle} domain={[4, 8]} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}%`, 'Conversion Rate']} />
              <Area type="monotone" dataKey="rate" stroke="hsl(170,65%,42%)" strokeWidth={2} fill="url(#cvGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    {/* Platform Table */}
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="p-5 border-b"><h3 className="font-semibold text-lg">Platform Performance</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground bg-muted/50 border-b">
            <tr>{['Platform', 'Ad Spend', 'Leads Generated', 'CPL', 'ROI'].map(h => <th key={h} className="px-6 py-3 text-left font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {platformData.map((row, i) => {
              const cpl = (row.spend / row.leads).toFixed(0);
              const roi = (((row.leads * 500) / row.spend) * 100).toFixed(0);
              return (
                <tr key={i} className="bg-card hover:bg-muted/40 transition-colors">
                  <td className="px-6 py-4 font-medium">{row.platform}</td>
                  <td className="px-6 py-4">${row.spend.toLocaleString()}</td>
                  <td className="px-6 py-4">{row.leads}</td>
                  <td className="px-6 py-4">${cpl}</td>
                  <td className="px-6 py-4 font-medium text-green-600">{roi}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default Analytics;
