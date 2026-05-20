import React, { useState } from 'react';
import { ShieldCheck, Activity, Users, Clock, BarChart2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { employeeApi } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

// ── Components ────────────────────────────────────────────────────────────────
const Badge = ({ value, label }) => {
  const styles = {
    EMPLOYEE_CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    EMPLOYEE_UPDATE: 'bg-blue-50 text-blue-700 border-blue-100',
    LOGIN: 'bg-slate-50 text-slate-700 border-slate-100',
    LOGOUT: 'bg-slate-50 text-slate-700 border-slate-100',
    TARGET_UPDATE: 'bg-purple-50 text-purple-700 border-purple-100',
    LEAVE_APPROVED: 'bg-green-50 text-green-700 border-green-100',
    LEAVE_REJECTED: 'bg-rose-50 text-rose-700 border-rose-100',
  };
  return (
    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${styles[value] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {label || value?.replace(/_/g, ' ')}
    </span>
  );
};

const AuditTrail = () => {
  const { data, loading, error } = useApi('/audit-logs?limit=50');
  const logs = data?.logs || data || [];

  if (loading) return <div className="flex h-40 items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-[10px] font-black text-blue-600 uppercase tracking-widest shadow-inner">
        <ShieldCheck className="h-4 w-4" /> Audit logs are immutable — blockchain-style ledger enforced.
      </div>
      <div className="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
            <tr>{['Action','Performed By','Target','Notes','Time'].map(h => <th key={h} className="px-6 py-5">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {logs.map(log => (
              <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-5"><Badge value={log.action} /></td>
                <td className="px-6 py-5 font-bold text-slate-900">{log.performedBy?.name || '—'}<p className="text-[10px] font-black text-slate-400 uppercase">{log.performedByRole || ''}</p></td>
                <td className="px-6 py-5 font-bold text-slate-700">{log.targetEmployee?.name || '—'}</td>
                <td className="px-6 py-5 max-w-[200px] truncate text-slate-500 font-medium">{log.notes || '—'}</td>
                <td className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase">{log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const EmployeeList = () => {
  const { user: currentUser } = useAuth();
  const { data, loading, error, refetch } = useApi('/employees');
  const employees = data?.employees || [];
  const [updatingId, setUpdatingId] = useState(null);
  const [targetValue, setTargetValue] = useState('');

  const handleSetTarget = async (id) => {
    try {
      const month = new Date().toISOString().slice(0, 7);
      await employeeApi.updateTarget(id, { target: targetValue, month }, currentUser.token);
      setUpdatingId(null);
      setTargetValue('');
      refetch();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="flex h-40 items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
          <tr>{['Employee','Role','Status','Monthly Target','Joined Date'].map(h => <th key={h} className="px-8 py-5">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-50 text-sm">
          {employees.map(emp => (
            <tr key={emp._id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-8 py-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 border-2 border-white shadow-sm">{emp.name[0]}</div>
                  <div><p className="font-black text-slate-900">{emp.name}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{emp.email}</p></div>
                </div>
              </td>
              <td className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">{(emp.role||'').replace(/_/g,' ')}</td>
              <td className="px-8 py-6"><span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${emp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>{emp.status}</span></td>
              <td className="px-8 py-6">
                {updatingId === emp._id ? (
                  <div className="flex items-center gap-2">
                    <input type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="₹ Amount" className="w-24 h-8 px-3 text-xs border rounded-lg outline-none focus:border-blue-600" />
                    <button onClick={() => handleSetTarget(emp._id)} className="h-8 w-8 flex items-center justify-center bg-emerald-600 text-white rounded-lg"><CheckCircle className="h-4 w-4" /></button>
                    <button onClick={() => setUpdatingId(null)} className="h-8 w-8 flex items-center justify-center bg-rose-600 text-white rounded-lg"><AlertTriangle className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900">₹{(emp.monthlyTarget || 0).toLocaleString()}</span>
                    <button onClick={() => { setUpdatingId(emp._id); setTargetValue(emp.monthlyTarget || ''); }} className="text-[9px] font-black uppercase text-blue-600 hover:underline">Adjust</button>
                  </div>
                )}
              </td>
              <td className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase">{emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Main Controller ─────────────────────────────────────────────────────────
const AdminHRControl = () => {
  const [activeTab, setActiveTab] = useState('Employees');
  const { data: empData } = useApi('/employees');
  const employees = empData?.employees || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Governance & HR Console</h1>
          <p className="text-sm font-semibold text-slate-500">Corporate oversight, audit trails, and performance quotas.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] shadow-sm">
          <ShieldCheck className="h-4 w-4" /> Admin Authority Active
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Workforce', value: employees.length, color: 'blue' },
          { label: 'Active Status', value: employees.filter(e=>e.status==='ACTIVE').length, color: 'emerald' },
          { label: 'High Priority Alerts', value: 0, color: 'rose' },
          { label: 'Oversight Logs', value: 'Live', color: 'purple' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 flex items-center justify-between shadow-sm">
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
               <p className={`text-2xl font-black text-${color}-600`}>{value}</p>
            </div>
            <div className={`h-8 w-8 rounded-lg bg-${color}-50 flex items-center justify-center`}><Activity className={`h-4 w-4 text-${color}-600`} /></div>
          </div>
        ))}
      </div>

      <div className="flex gap-8 border-b border-slate-100">
        {['Employees','Audit Trail','HR Activity','Metrics'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`relative py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full shadow-[0_-4px_12px_rgba(37,99,235,0.5)]" />}
          </button>
        ))}
      </div>

      {activeTab === 'Employees' && <EmployeeList />}
      {activeTab === 'Audit Trail' && <AuditTrail />}
      {activeTab === 'HR Activity' && <div className="py-20 text-center text-slate-400 uppercase text-[10px] font-black tracking-widest">HR Activity Log Component</div>}
      {activeTab === 'Metrics' && <div className="py-20 text-center text-slate-400 uppercase text-[10px] font-black tracking-widest">HR Metrics Component</div>}
    </div>
  );
};

export default AdminHRControl;
