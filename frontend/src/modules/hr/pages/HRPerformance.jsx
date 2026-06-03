import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Trophy, Target, TrendingUp, Award, LayoutDashboard } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import EmptyState from '../../../components/ui/EmptyState';

const HRPerformance = () => {
  const { data: response, loading } = useApi('/hr-performance');
  
  const performanceData = response?.performanceData || response?.chartData || [];
  const topPerformers = response?.topPerformers || [];
  
  const hasData = performanceData.length > 0 || topPerformers.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6 md:p-8">
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Performance & Intelligence</h2>
        <p className="text-slate-500 font-medium mt-2">Track employee performance, task completion, and revenue contribution.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-500 font-medium">Loading intelligence data...</div>
      ) : !hasData ? (
        <div className="py-12 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
          <EmptyState 
            icon={LayoutDashboard} 
            title="Intelligence Data Unavailable" 
            description="There's not enough employee performance data to generate intelligence reports yet." 
          />
        </div>
      ) : (
        <>
          {/* Top Cards */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-1">Avg. Task Completion</p>
                <h3 className="text-3xl font-black text-slate-900">{response?.avgCompletion || '0%'}</h3>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                <Target className="h-7 w-7" />
              </div>
            </div>
            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-1">Total Sales Generated</p>
                <h3 className="text-3xl font-black text-slate-900">₹{response?.totalSales?.toLocaleString() || '0'}</h3>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                <TrendingUp className="h-7 w-7" />
              </div>
            </div>
            <div className="rounded-[2rem] border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-sm flex items-center justify-between relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10">
                <Trophy className="h-32 w-32 text-amber-600" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black tracking-widest uppercase text-amber-600/80 mb-1">Employee of the Month</p>
                <h3 className="text-2xl font-black text-amber-900">{response?.employeeOfTheMonth || 'Not Announced'}</h3>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm relative z-10">
                <Trophy className="h-7 w-7" />
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Charts */}
            <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
              <h3 className="font-black text-xl text-slate-900 mb-8">Task Completion Trend</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} dx={-10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4' }}
                    />
                    <Line type="monotone" dataKey="tasks" stroke="#4f46e5" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8, strokeWidth: 0, fill: '#4f46e5' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
              <h3 className="font-black text-xl text-slate-900 mb-8">Revenue Contribution</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} dx={-10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#f8fafc' }}
                    />
                    <Bar dataKey="sales" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-black text-xl text-slate-900 flex items-center gap-3">
                <Award className="h-6 w-6 text-amber-500" /> Top Performers Leaderboard
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[10px] uppercase font-black tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-4 text-left">Rank</th>
                    <th className="px-8 py-4 text-left">Employee</th>
                    <th className="px-8 py-4 text-left">Role</th>
                    <th className="px-8 py-4 text-center">Tasks Completed</th>
                    <th className="px-8 py-4 text-right">Revenue Contribution</th>
                    <th className="px-8 py-4 text-center">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topPerformers.map((p, i) => (
                    <tr key={p._id || i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-black text-slate-400 text-lg">#{i + 1}</td>
                      <td className="px-8 py-5 font-bold text-slate-900">{p.name}</td>
                      <td className="px-8 py-5 text-xs font-bold text-indigo-600 bg-indigo-50/50 rounded-lg max-w-max inline-block mt-2 ml-4 px-2 py-1">{p.role}</td>
                      <td className="px-8 py-5 text-center font-bold text-slate-700">{p.tasks}</td>
                      <td className="px-8 py-5 text-right font-black text-emerald-600 text-lg">₹{p.revenue?.toLocaleString() || '0'}</td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-sm ${p.score >= 95 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white' : p.score >= 90 ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white' : 'bg-gradient-to-r from-amber-400 to-amber-500 text-white'}`}>
                          {p.score}/100
                        </span>
                      </td>
                    </tr>
                  ))}
                  {topPerformers.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500 font-medium">No top performers data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HRPerformance;
