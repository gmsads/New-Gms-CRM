import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Trophy, Target, TrendingUp, Award } from 'lucide-react';
import Badge from '../../components/ui/Badge';

const PERFORMANCE_DATA = [
  { name: 'Jan', tasks: 65, sales: 40000 },
  { name: 'Feb', tasks: 59, sales: 30000 },
  { name: 'Mar', tasks: 80, sales: 55000 },
  { name: 'Apr', tasks: 81, sales: 45000 },
  { name: 'May', tasks: 96, sales: 60000 },
  { name: 'Jun', tasks: 110, sales: 75000 },
];

const TOP_PERFORMERS = [
  { id: 1, name: 'Alex Johnson', role: 'Sales Exec', tasks: 145, revenue: '₹8,50,000', score: 98 },
  { id: 2, name: 'Priya Sharma', role: 'UI/UX Designer', tasks: 112, revenue: '₹0 (Design)', score: 95 },
  { id: 3, name: 'Rahul Desai', role: 'Marketing Mgr', tasks: 89, revenue: '₹12,00,000', score: 92 },
  { id: 4, name: 'Sneha Patel', role: 'Field Exec', tasks: 134, revenue: '₹3,20,000', score: 88 },
];

const HRPerformance = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-2">
        <h2 className="text-2xl font-bold tracking-tight">Performance & Intelligence</h2>
        <p className="text-muted-foreground text-sm">Track employee performance, task completion, and revenue contribution.</p>
      </div>

      {/* Top Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Avg. Task Completion</p>
            <h3 className="text-2xl font-bold">87.5%</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <Target className="h-5 w-5" />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Sales Generated</p>
            <h3 className="text-2xl font-bold">₹42.5L</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm flex items-center justify-between border-l-4 border-l-yellow-500">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Employee of the Month</p>
            <h3 className="text-lg font-bold">Alex Johnson</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
            <Trophy className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Charts */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-6">Task Completion Trend</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={PERFORMANCE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 2 }}
                />
                <Line type="monotone" dataKey="tasks" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-6">Revenue Contribution</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PERFORMANCE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                />
                <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/10 flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" /> Top Performers Leaderboard
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-muted/30 border-b">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Rank</th>
                <th className="px-5 py-3 text-left font-medium">Employee</th>
                <th className="px-5 py-3 text-left font-medium">Role</th>
                <th className="px-5 py-3 text-center font-medium">Tasks Completed</th>
                <th className="px-5 py-3 text-right font-medium">Revenue Contribution</th>
                <th className="px-5 py-3 text-center font-medium">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {TOP_PERFORMERS.map((p, i) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4 font-bold text-muted-foreground">#{i + 1}</td>
                  <td className="px-5 py-4 font-medium text-foreground">{p.name}</td>
                  <td className="px-5 py-4 text-xs font-mono">{p.role}</td>
                  <td className="px-5 py-4 text-center">{p.tasks}</td>
                  <td className="px-5 py-4 text-right font-medium text-green-600">{p.revenue}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${p.score >= 95 ? 'bg-green-100 text-green-700' : p.score >= 90 ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {p.score}/100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HRPerformance;
