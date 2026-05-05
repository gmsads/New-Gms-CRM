import React, { useState } from 'react';
import { ShieldCheck, Activity, Users, Clock, BarChart2, CheckCircle, AlertTriangle } from 'lucide-react';
import useApi from '../hooks/useApi';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';

const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

// ── Audit Trail Tab ────────────────────────────────────────────────────────────
const AuditTrail = () => {
  const { data, loading, error } = useApi('/audit-logs?limit=50');
  const logs = data?.logs || data || [];

  if (loading) return <Spinner />;
  if (error)   return <div className="text-sm text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 font-medium">
        <ShieldCheck className="h-4 w-4" /> Audit logs are immutable — no edits or deletions allowed.
      </div>
      {logs.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No audit entries yet" description="Actions performed by HR and Admin will appear here." />
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/50 border-b">
                <tr>{['Action','Performed By','Target','Notes','Time'].map(h => <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map(log => (
                  <tr key={log._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3"><Badge value={log.action} label={log.action?.replace(/_/g,' ')} /></td>
                    <td className="px-5 py-3 font-medium">{log.performedBy?.name || '—'}<p className="text-xs text-muted-foreground">{log.performedByRole || ''}</p></td>
                    <td className="px-5 py-3">{log.targetEmployee?.name || '—'}</td>
                    <td className="px-5 py-3 max-w-[200px] truncate text-muted-foreground">{log.notes || '—'}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">{log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ── HR Activity Tab ────────────────────────────────────────────────────────────
const HRActivity = () => {
  const { data, loading, error } = useApi('/audit-logs?performedByRole=HR&limit=30');
  const logs = data?.logs || data || [];

  if (loading) return <Spinner />;
  if (error)   return <div className="text-sm text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Real-time log of all HR actions.</p>
      {logs.length === 0 ? (
        <EmptyState icon={Activity} title="No HR activity yet" description="Actions performed by HR will appear here." />
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden divide-y divide-border">
          {logs.map(log => (
            <div key={log._id} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
              <Badge value={log.action} label={log.action?.replace(/_/g,' ')} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{log.notes || log.action}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  By <span className="font-medium">{log.performedBy?.name || '—'}</span>
                  {log.targetEmployee?.name ? ` → ${log.targetEmployee.name}` : ''}
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Metrics Tab ────────────────────────────────────────────────────────────────
const HRMetrics = () => {
  const { data: empData, loading: empLoading } = useApi('/employees');
  const { data: leaveData, loading: leaveLoading } = useApi('/leaves');
  const { data: auditData, loading: auditLoading } = useApi('/audit-logs?limit=100');

  const employees = empData?.employees || [];
  const leaves    = leaveData?.leaves || leaveData || [];
  const logs      = auditData?.logs   || auditData || [];

  const loading = empLoading || leaveLoading || auditLoading;

  const totalEmp    = employees.length;
  const activeEmp   = employees.filter(e => e.status === 'ACTIVE').length;
  const pendingLeaves = leaves.filter(l => l.status === 'PENDING').length;
  const logsToday   = logs.filter(l => l.createdAt && new Date(l.createdAt).toDateString() === new Date().toDateString()).length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard title="Total Employees"  value={totalEmp}      icon={Users}      color="primary"  loading={loading} />
      <StatCard title="Active Employees" value={activeEmp}     icon={CheckCircle} color="green"   loading={loading} />
      <StatCard title="Pending Leaves"   value={pendingLeaves} icon={Clock}       color="yellow"  loading={loading} />
      <StatCard title="Audit Actions Today" value={logsToday}  icon={Activity}    color="blue"    loading={loading} />
      <StatCard title="Total Audit Logs" value={logs.length}   icon={ShieldCheck} color="purple"  loading={loading} />
      <StatCard title="Leave Requests"   value={leaves.length} icon={BarChart2}   color="orange"  loading={loading} />
    </div>
  );
};

// ── Employee List Tab ─────────────────────────────────────────────────────────
const EmployeeList = () => {
  const { data, loading, error } = useApi('/employees');
  const employees = data?.employees || [];

  if (loading) return <Spinner />;
  if (error)   return <div className="text-sm text-red-500 p-4">{error}</div>;
  if (employees.length === 0) return <EmptyState icon={Users} title="No employees yet" description="Employees created by HR will appear here." />;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground bg-muted/50 border-b">
            <tr>{['Employee','ID','Role','Dept','Status','Created'].map(h => <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {employees.map(emp => (
              <tr key={emp._id} className="hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{emp.name[0]}</div>
                    <div><p className="font-medium">{emp.name}</p><p className="text-xs text-muted-foreground">{emp.email}</p></div>
                  </div>
                </td>
                <td className="px-5 py-3 font-mono text-xs">{emp.username || '—'}</td>
                <td className="px-5 py-3 text-xs">{(emp.role||'').replace(/_/g,' ')}</td>
                <td className="px-5 py-3">{emp.department || '—'}</td>
                <td className="px-5 py-3"><Badge value={emp.status} /></td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Main AdminHR Page ─────────────────────────────────────────────────────────
const TABS = ['Employees','HR Activity','Audit Trail','Metrics'];

const AdminHR = () => {
  const [activeTab, setActiveTab] = useState('Employees');
  const { data: empData } = useApi('/employees');
  const { data: auditData } = useApi('/audit-logs?limit=5');
  const employees = empData?.employees || [];
  const recentLogs = auditData?.logs || auditData || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin HR Control Panel</h1>
          <p className="text-muted-foreground">Monitor employees · Review audit trail · HR oversight</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
          <ShieldCheck className="h-3.5 w-3.5" /> Admin Authority Active
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Employees', value: employees.length,                                   color: 'text-blue-600 bg-blue-50 border-blue-200' },
          { label: 'Active',          value: employees.filter(e=>e.status==='ACTIVE').length,    color: 'text-green-600 bg-green-50 border-green-200' },
          { label: 'Audit Logs',      value: recentLogs.length,                                  color: 'text-purple-600 bg-purple-50 border-purple-200' },
          { label: 'Inactive',        value: employees.filter(e=>e.status==='INACTIVE').length,  color: 'text-red-600 bg-red-50 border-red-200' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl border px-4 py-3 flex items-center justify-between ${color}`}>
            <span className="text-xs font-medium">{label}</span>
            <span className="text-2xl font-bold">{value}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Employees'    && <EmployeeList />}
      {activeTab === 'HR Activity'  && <HRActivity />}
      {activeTab === 'Audit Trail'  && <AuditTrail />}
      {activeTab === 'Metrics'      && <HRMetrics />}
    </div>
  );
};

export default AdminHR;
