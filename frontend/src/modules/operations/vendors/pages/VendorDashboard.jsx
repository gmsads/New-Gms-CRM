import React, { useState, useEffect } from 'react';
import { Truck, Briefcase, CreditCard, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import api from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';

const StatCard = ({ icon: Icon, title, value, subtext, color, bg }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 ${bg}`} />
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bg} ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 relative z-10">{title}</p>
    <h3 className="text-3xl font-black text-slate-900 tracking-tight relative z-10">{value}</h3>
    {subtext && <p className="text-xs font-bold text-slate-500 mt-2 relative z-10">{subtext}</p>}
  </div>
);

const VendorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalVendors: 0,
    activeAssignments: 0,
    pendingPayments: 0,
    topCategories: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  // Mock data for charts (since we don't have dedicated analytics endpoint yet)
  const monthlyData = [
    { name: 'Jan', assigned: 12, completed: 10 },
    { name: 'Feb', assigned: 19, completed: 15 },
    { name: 'Mar', assigned: 15, completed: 18 },
    { name: 'Apr', assigned: 22, completed: 20 },
    { name: 'May', assigned: 30, completed: 25 },
    { name: 'Jun', assigned: 28, completed: 22 },
  ];

  const categoryData = [
    { name: 'Mobile Vans', value: 45, color: '#3b82f6' },
    { name: 'Try Cycles', value: 25, color: '#10b981' },
    { name: 'Wall Pasting', value: 15, color: '#8b5cf6' },
    { name: 'Pamphlets', value: 10, color: '#f59e0b' },
    { name: 'Digital', value: 5, color: '#ec4899' },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Fetch base data to calculate stats
        const [venRes, assRes, payRes] = await Promise.all([
          api.get('/vendors', user.token),
          api.get('/vendors/assignments', user.token),
          api.get('/vendors/payments', user.token)
        ]);
        
        const vendors = venRes.data.vendors || [];
        const assignments = assRes.data.assignments || [];
        const payments = payRes.data.payments || [];

        setStats({
          totalVendors: vendors.length,
          activeAssignments: assignments.filter(a => ['Pending', 'Assigned', 'In Progress'].includes(a.status)).length,
          pendingPayments: payments.filter(p => ['Pending', 'Overdue'].includes(p.status)).reduce((acc, p) => acc + p.amount, 0),
        });
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user.token]);



  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Truck} 
          title="Total Vendors" 
          value={loading ? '-' : stats.totalVendors} 
          subtext="Active Network Partners"
          bg="bg-blue-50" color="text-blue-600"
        />
        <StatCard 
          icon={Briefcase} 
          title="Active Assignments" 
          value={loading ? '-' : stats.activeAssignments} 
          subtext="Ongoing Campaigns"
          bg="bg-emerald-50" color="text-emerald-600"
        />
        <StatCard 
          icon={CreditCard} 
          title="Pending Payables" 
          value={loading ? '-' : `₹ ${stats.pendingPayments.toLocaleString('en-IN')}`} 
          subtext="Requires Processing"
          bg="bg-rose-50" color="text-rose-600"
        />
        <StatCard 
          icon={ShieldCheck} 
          title="Avg Reliability" 
          value="94%" 
          subtext="Based on last 30 days"
          bg="bg-purple-50" color="text-purple-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignment Trends */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-black text-slate-900">Assignment Trends</h3>
            <p className="text-xs font-bold text-slate-500">Campaigns dispatched vs completed (6 Months)</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAssigned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 700 }}
                  labelStyle={{ fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}
                />
                <Area type="monotone" dataKey="assigned" name="Assigned" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAssigned)" />
                <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vendor Distribution */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="mb-6 text-center">
            <h3 className="text-lg font-black text-slate-900">Vendor Distribution</h3>
            <p className="text-xs font-bold text-slate-500">By operational category</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 700, color: '#0f172a' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {categoryData.map(c => (
              <div key={c.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
