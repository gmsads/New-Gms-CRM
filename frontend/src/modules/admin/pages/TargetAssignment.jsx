import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { targetApi, employeeApi } from '../../../services/api';
import { Target, Search, Plus, TrendingUp, BarChart2, ShieldAlert, CheckCircle, Clock, XCircle, LayoutDashboard, List, Activity, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';

const TargetAssignment = () => {
  const { user } = useAuth();
  
  // Tabs
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // DASHBOARD, ASSIGN, LIST
  
  // Data
  const [employees, setEmployees] = useState([]);
  const [targets, setTargets] = useState([]);
  const [analytics, setAnalytics] = useState({ overview: {}, branchPerformance: [], topPerformers: [] });
  
  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    branch: '', employee: '', role: '', period: '', status: ''
  });

  // Form State
  const [formData, setFormData] = useState({
    title: '', branch: '', department: '', employee: '', role: '',
    targetType: 'Revenue Target', category: 'Performance', difficultyLevel: 'Fresher',
    period: 'Monthly', startDate: '', endDate: '', targetValue: 0, weightage: 0, notes: ''
  });

  const fetchData = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      let empRes, targetsRes, analyticsRes;
      try {
        empRes = await employeeApi.list({ limit: 1000 }, user.token);
      } catch(e) { console.error("Employee API error:", e); }
      
      try {
        targetsRes = await targetApi.list({ ...filters, limit: 100, search }, user.token);
      } catch(e) { console.error("Target list API error:", e); }
      
      try {
        analyticsRes = await targetApi.analytics({}, user.token);
      } catch(e) { console.error("Target analytics API error:", e); }
      
      if (empRes?.employees) setEmployees(empRes.employees);
      else if (empRes?.data?.employees) setEmployees(empRes.data.employees);
      else if (Array.isArray(empRes)) setEmployees(empRes);
      else if (Array.isArray(empRes?.data)) setEmployees(empRes.data);
      else console.error("Could not parse employees from response:", empRes);
      
      if (targetsRes?.success) setTargets(targetsRes.data);
      if (analyticsRes?.success) setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, user]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleAssignTarget = async (e) => {
    e.preventDefault();
    if (!user?.token) return;
    setSubmitting(true);
    try {
      const res = await targetApi.assign(formData, user.token);
      if (res.success) {
        setFormData({
          title: '', branch: '', department: '', employee: '', role: '',
          targetType: 'Revenue Target', category: 'Performance', difficultyLevel: 'Fresher',
          period: 'Monthly', startDate: '', endDate: '', targetValue: 0, weightage: 0, notes: ''
        });
        setActiveTab('LIST');
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to assign target');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProgress = async (id, value, notes) => {
    try {
      await targetApi.updateProgress(id, { achievedValue: Number(value), notes }, user.token);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update progress');
    }
  };

  const difficultyRecommendations = {
    Fresher: 'Low activity targets, Focus on learning.',
    Junior: 'Small revenue targets, conversions.',
    'Mid-Level': 'Standard revenue, moderate conversions.',
    Senior: 'High-value revenue targets, collections.',
    Manager: 'Team performance targets, branch targets.'
  };

  const getStatusBadge = (status) => {
    const colors = {
      Pending: 'bg-slate-100 text-slate-700',
      'In Progress': 'bg-blue-100 text-blue-700',
      Achieved: 'bg-green-100 text-green-700',
      Overachieved: 'bg-indigo-100 text-indigo-700',
      Missed: 'bg-orange-100 text-orange-700',
      Expired: 'bg-red-100 text-red-700'
    };
    return <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${colors[status] || 'bg-slate-100'}`}>{status}</span>;
  };

  const isManagerOrAdmin = ['ADMIN', 'MD_CEO', 'SALES_MANAGER', 'BRANCH_HEAD'].includes(user?.role);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Target className="h-6 w-6 text-indigo-600" />
            Target Assignment
          </h1>
          <p className="text-slate-500 font-medium mt-1">Assign, track, and analyze role-based targets.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border shadow-sm w-max">
          <button onClick={() => setActiveTab('DASHBOARD')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'DASHBOARD' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <LayoutDashboard className="h-4 w-4" /> Analytics
          </button>
          <button onClick={() => setActiveTab('LIST')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'LIST' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <List className="h-4 w-4" /> Target List
          </button>
          {isManagerOrAdmin && (
            <button onClick={() => setActiveTab('ASSIGN')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'ASSIGN' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Plus className="h-4 w-4" /> Assign Target
            </button>
          )}
        </div>
      </div>

      {loading && <div className="h-1 bg-indigo-100 overflow-hidden rounded-full"><div className="h-full bg-indigo-600 w-1/3 animate-pulse rounded-full"></div></div>}

      {/* DASHBOARD TAB */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2 text-slate-500">
                <Target className="h-5 w-5 text-indigo-500" />
                <h3 className="font-bold">Total Assigned</h3>
              </div>
              <p className="text-3xl font-black text-slate-900">{analytics.overview?.totalAssigned || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2 text-slate-500">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h3 className="font-bold">Achieved</h3>
              </div>
              <p className="text-3xl font-black text-slate-900">{analytics.overview?.achieved || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2 text-slate-500">
                <Clock className="h-5 w-5 text-blue-500" />
                <h3 className="font-bold">In Progress</h3>
              </div>
              <p className="text-3xl font-black text-slate-900">{(analytics.overview?.pending || 0) + (analytics.overview?.inProgress || 0)}</p>
            </div>
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2 text-slate-500">
                <XCircle className="h-5 w-5 text-orange-500" />
                <h3 className="font-bold">Missed / Expired</h3>
              </div>
              <p className="text-3xl font-black text-slate-900">{analytics.overview?.missed || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2"><BarChart2 className="h-5 w-5 text-indigo-600" /> Branch Performance</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.branchPerformance || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="branch" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend />
                    <Bar dataKey="totalTargets" name="Total Targets" fill="#94a3b8" radius={[4,4,0,0]} />
                    <Bar dataKey="achievedTargets" name="Achieved" fill="#4f46e5" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2"><Activity className="h-5 w-5 text-green-600" /> Top Performers</h3>
              <div className="space-y-4">
                {(analytics.topPerformers || []).length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No performance data yet.</p>
                ) : analytics.topPerformers.map((perf, i) => (
                  <div key={perf._id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">{i+1}</div>
                      <div>
                        <p className="font-bold text-slate-900">{perf.name}</p>
                        <p className="text-xs text-slate-500">{perf.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-indigo-600">{perf.achievedCount} Achieved</p>
                      <p className="text-xs text-slate-500">Score: {perf.totalScore}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN TAB */}
      {activeTab === 'ASSIGN' && isManagerOrAdmin && (
        <form onSubmit={handleAssignTarget} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 max-w-4xl mx-auto space-y-8">
          <div className="border-b pb-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Target className="h-6 w-6 text-indigo-600" /> New Target Assignment</h2>
            <p className="text-slate-500 mt-1">Fill out the details to assign a role-based target.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">Target Title</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:border-indigo-600 focus:bg-white transition-colors" placeholder="e.g. Q3 Sales Quota" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">Employee</label>
              <select required value={formData.employee} onChange={e => {
                const emp = employees.find(x => x._id === e.target.value);
                setFormData({...formData, employee: e.target.value, branch: emp?.branch || 'HQ', department: emp?.department || 'Sales', role: emp?.role || 'SALES_EXEC'});
              }} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:border-indigo-600 focus:bg-white transition-colors">
                <option value="">Select Employee...</option>
                {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name} ({emp.role})</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">Difficulty Level</label>
              <select required value={formData.difficultyLevel} onChange={e => setFormData({...formData, difficultyLevel: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:border-indigo-600 focus:bg-white transition-colors">
                {Object.keys(difficultyRecommendations).map(level => <option key={level} value={level}>{level}</option>)}
              </select>
              <p className="text-[10px] text-indigo-600 font-medium mt-1">{difficultyRecommendations[formData.difficultyLevel]}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">Target Type</label>
              <select required value={formData.targetType} onChange={e => setFormData({...formData, targetType: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:border-indigo-600 focus:bg-white transition-colors">
                {['Revenue Target', 'Conversion Target', 'Collection Target', 'Calls Target', 'Appointments Target', 'Quotations Target', 'Client Visits Target', 'Team Performance Target', 'Follow-Up Target'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">Category</label>
              <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:border-indigo-600 focus:bg-white transition-colors">
                {['Activity', 'Performance', 'Strategic'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">Period</label>
              <select required value={formData.period} onChange={e => setFormData({...formData, period: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:border-indigo-600 focus:bg-white transition-colors">
                {['Monthly', 'Quarterly', 'Yearly'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">Weightage % (KPI)</label>
              <input required type="number" min="0" max="100" value={formData.weightage} onChange={e => setFormData({...formData, weightage: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:border-indigo-600 focus:bg-white transition-colors" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">Start Date</label>
              <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:border-indigo-600 focus:bg-white transition-colors" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">End Date</label>
              <input required type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:border-indigo-600 focus:bg-white transition-colors" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">Target Value</label>
              <input required type="number" min="0" value={formData.targetValue} onChange={e => setFormData({...formData, targetValue: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium text-lg outline-none focus:border-indigo-600 focus:bg-white transition-colors" placeholder="Numeric value (e.g. 100000)" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">Remarks / Notes</label>
              <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full h-24 p-4 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:border-indigo-600 focus:bg-white transition-colors resize-none" placeholder="Any specific instructions..."></textarea>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
            {submitting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <ShieldAlert className="h-5 w-5" />}
            {submitting ? 'Assigning...' : 'Assign Target'}
          </button>
        </form>
      )}

      {/* LIST TAB */}
      {activeTab === 'LIST' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-white p-2 pl-4 rounded-2xl border shadow-sm flex-wrap">
            <Search className="h-5 w-5 text-slate-400" />
            <input type="text" placeholder="Search targets by title..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 h-10 min-w-[200px] outline-none font-medium text-slate-700 bg-transparent" />
            <div className="w-[1px] h-8 bg-slate-200 mx-2 hidden md:block"></div>
            <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium outline-none focus:border-indigo-600">
              <option value="">All Statuses</option>
              {['Pending', 'In Progress', 'Achieved', 'Overachieved', 'Missed', 'Expired'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.period} onChange={e => setFilters({...filters, period: e.target.value})} className="h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium outline-none focus:border-indigo-600">
              <option value="">All Periods</option>
              {['Monthly', 'Quarterly', 'Yearly'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">
                  <tr>
                    <th className="px-6 py-4">Target Details</th>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Timeline</th>
                    <th className="px-6 py-4 min-w-[200px]">Progress</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {targets.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-500"><Target className="h-8 w-8 mx-auto text-slate-300 mb-2" /><p className="font-medium">No targets found.</p></td></tr>
                  ) : targets.map(target => (
                    <tr key={target._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{target.title}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{target.targetType} • {target.difficultyLevel}</p>
                        <div className="mt-1">{getStatusBadge(target.status)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{target.employee?.name || 'Unknown'}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{target.employee?.role}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-700">{new Date(target.startDate).toLocaleDateString()} - {new Date(target.endDate).toLocaleDateString()}</p>
                        <p className="text-[11px] text-slate-500">{target.period}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className="text-slate-700">{target.achievedValue} / {target.targetValue}</span>
                          <span className={target.progressPercent >= 100 ? 'text-green-600' : 'text-indigo-600'}>{target.progressPercent}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${target.progressPercent >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${target.progressPercent}%` }}></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(isManagerOrAdmin || target.employee?._id === user?._id) && (
                          <button onClick={() => {
                            const val = prompt(`Update achieved value for ${target.title} (Current: ${target.achievedValue})`, target.achievedValue);
                            if (val !== null && !isNaN(val)) handleUpdateProgress(target._id, val, 'Manual update');
                          }} className="px-3 py-1.5 bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 font-bold text-xs rounded-lg transition-colors">
                            Update
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TargetAssignment;
