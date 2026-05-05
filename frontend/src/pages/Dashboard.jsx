import React from 'react';
import { useAuth } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import {
  Users, TrendingUp, Briefcase, Clock, CheckCircle, Target,
  MapPin, Palette, Package, CreditCard, Server, Activity,
  Star, Truck, FileImage, BarChart2, AlertCircle
} from 'lucide-react';
import { SalesExecDashboard } from './SalesExec/index';

// ── Admin Dashboard ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { data: empData,  loading: l1 } = useApi('/employees');
  const { data: clientData, loading: l2 } = useApi('/clients');
  const { data: campaignData, loading: l3 } = useApi('/campaigns');
  const { data: orderData, loading: l4 } = useApi('/orders/stats');

  const employees  = empData?.employees || [];
  const clients    = clientData?.clients || clientData || [];
  const campaigns  = campaignData?.campaigns || campaignData || [];
  const stats      = orderData || {};

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Employees"  value={employees.length}                              icon={Users}     color="primary" loading={l1} />
        <StatCard title="Active Employees" value={employees.filter(e=>e.status==='ACTIVE').length} icon={CheckCircle} color="green" loading={l1} />
        <StatCard title="Total Clients"    value={Array.isArray(clients) ? clients.length : (clientData?.total||0)} icon={Briefcase} color="blue" loading={l2} />
        <StatCard title="Active Campaigns" value={Array.isArray(campaigns) ? campaigns.length : (campaignData?.total||0)} icon={Activity} color="purple" loading={l3} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Orders"   value={stats.total   || 0} icon={Package}    color="orange" loading={l4} />
        <StatCard title="Orders Value"   value={stats.totalRevenue ? `₹${stats.totalRevenue.toLocaleString()}` : '₹0'} icon={TrendingUp} color="green" loading={l4} />
        <StatCard title="Pending Orders" value={stats.pending || 0} icon={Clock}       color="yellow" loading={l4} />
      </div>
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="font-semibold text-lg mb-2">Employee Breakdown</h3>
        {employees.length === 0 ? (
          <p className="text-sm text-muted-foreground">No employees yet. Go to <strong>HR</strong> to add the first employee.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(employees.reduce((a,e) => { a[e.role]=(a[e.role]||0)+1; return a; }, {}))
              .sort((a,b)=>b[1]-a[1]).map(([role, cnt]) => (
              <div key={role} className="rounded-lg border bg-muted/20 p-3 text-sm">
                <p className="font-mono text-xs text-muted-foreground">{role.replace(/_/g,' ')}</p>
                <p className="text-2xl font-bold mt-1">{cnt}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── HR Dashboard ───────────────────────────────────────────────────────────────
const HRDashboard = () => {
  const { data: empData,   loading: l1 } = useApi('/employees');
  const { data: leaveData, loading: l2 } = useApi('/leaves?status=PENDING');

  const employees = empData?.employees || [];
  const leaves    = leaveData?.leaves || leaveData || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Employees"  value={employees.length}                                icon={Users}      color="primary" loading={l1} />
        <StatCard title="Active"           value={employees.filter(e=>e.status==='ACTIVE').length} icon={CheckCircle} color="green"  loading={l1} />
        <StatCard title="Pending Leaves"   value={leaves.length}                                   icon={Clock}       color="yellow" loading={l2} />
        <StatCard title="New (30d)"        value={employees.filter(e=>{ const d=new Date(e.createdAt); return (Date.now()-d)< 30*86400*1000; }).length} icon={Users} color="blue" loading={l1} />
      </div>
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="font-semibold text-lg mb-3">Quick Actions</h3>
        <p className="text-sm text-muted-foreground">Go to the <strong>HR</strong> section to add employees, manage attendance and review leaves.</p>
      </div>
    </div>
  );
};

// ── Sales Manager Dashboard ────────────────────────────────────────────────────
const SalesManagerDashboard = () => {
  const { data: prospectData, loading: l1 } = useApi('/prospects');
  const { data: orderData,    loading: l2 } = useApi('/orders/stats');

  const prospects = prospectData?.prospects || prospectData || [];
  const stats     = orderData || {};

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Prospects" value={Array.isArray(prospects)?prospects.length:(prospectData?.total||0)} icon={Users}     color="primary" loading={l1} />
        <StatCard title="Total Orders"    value={stats.total   ||0} icon={Package}    color="blue"   loading={l2} />
        <StatCard title="Order Revenue"   value={stats.totalRevenue?`₹${stats.totalRevenue.toLocaleString()}`:'₹0'} icon={TrendingUp} color="green" loading={l2} />
        <StatCard title="Pending Orders"  value={stats.pending ||0} icon={Clock}       color="yellow" loading={l2} />
      </div>
    </div>
  );
};

// ── Field Exec Dashboard ───────────────────────────────────────────────────────
const FieldExecDashboard = () => {
  const { data, loading } = useApi('/visits');
  const visits = data?.visits || data || [];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Visits"    value={visits.length}                                         icon={MapPin}     color="primary" loading={loading} />
        <StatCard title="Completed"       value={visits.filter(v=>v.status==='COMPLETED').length}        icon={CheckCircle} color="green"  loading={loading} />
        <StatCard title="Scheduled Today" value={visits.filter(v=>v.visitDate&&new Date(v.visitDate).toDateString()===new Date().toDateString()).length} icon={Truck} color="blue" loading={loading} />
      </div>
      {visits.length === 0 && !loading && (
        <EmptyState icon={MapPin} title="No visits yet" description="Your field visits will appear here once assigned." />
      )}
    </div>
  );
};

// ── Generic Role Dashboard ─────────────────────────────────────────────────────
const GenericDashboard = ({ role }) => {
  const { user } = useAuth();
  return (
    <div className="rounded-xl border bg-card p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <BarChart2 className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold">Welcome, {user?.name}</h3>
      <p className="text-muted-foreground mt-2">Your <strong>{role.replace(/_/g,' ')}</strong> dashboard is live.</p>
      <p className="text-sm text-muted-foreground mt-1">Use the sidebar to navigate to your modules.</p>
    </div>
  );
};

// ── Role → Dashboard Map ────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  if (!user) return null;

  const { role } = user;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, <span className="font-medium text-foreground">{user.name}</span>.
          {' '}Viewing as <span className="font-semibold text-primary">{role.replace(/_/g,' ')}</span>.
        </p>
      </div>

      {role === 'ADMIN'              && <AdminDashboard />}
      {role === 'MD_CEO'             && <AdminDashboard />}
      {role === 'HR'                 && <HRDashboard />}
      {role === 'SALES_EXEC'         && <SalesExecDashboard />}
      {role === 'SALES_MANAGER'      && <SalesManagerDashboard />}
      {role === 'FIELD_EXEC'         && <FieldExecDashboard />}
      {!['ADMIN','MD_CEO','HR','SALES_EXEC','SALES_MANAGER','FIELD_EXEC'].includes(role) && <GenericDashboard role={role} />}
    </div>
  );
};

export default Dashboard;
