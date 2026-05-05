import React from 'react';
import { Server, Wifi, Shield, HardDrive, AlertCircle, CheckCircle2, Clock, Ticket } from 'lucide-react';

const systems = [
  { name: 'API Server (Node.js)', status: 'Healthy', uptime: '99.9%', load: '42%' },
  { name: 'Database (MongoDB)', status: 'Healthy', uptime: '99.7%', load: '38%' },
  { name: 'CDN / Static Assets', status: 'Healthy', uptime: '100%', load: '12%' },
  { name: 'Email Service (SMTP)', status: 'Degraded', uptime: '94.2%', load: '78%' },
  { name: 'Object Storage', status: 'Healthy', uptime: '100%', load: '21%' },
  { name: 'Auth Service (JWT)', status: 'Healthy', uptime: '99.8%', load: '15%' },
];

const tickets = [
  { id: '#T-201', title: 'Laptop setup for new joiner – Carol S.', priority: 'High', status: 'Open', raised: 'Apr 25' },
  { id: '#T-202', title: 'Email not syncing on mobile – Bob K.', priority: 'Medium', status: 'In Progress', raised: 'Apr 24' },
  { id: '#T-203', title: 'VPN access request – Dan P.', priority: 'Medium', status: 'Open', raised: 'Apr 24' },
  { id: '#T-204', title: 'Password reset – Wayne Ent. client portal', priority: 'Low', status: 'Resolved', raised: 'Apr 22' },
  { id: '#T-205', title: 'Slow internet in Ops floor', priority: 'High', status: 'In Progress', raised: 'Apr 23' },
];

const statusBadge = {
  Open: 'bg-red-100 text-red-700', 'In Progress': 'bg-blue-100 text-blue-700',
  Resolved: 'bg-green-100 text-green-700',
};
const priorityStyle = { High: 'text-red-500', Medium: 'text-yellow-500', Low: 'text-blue-500' };

const IT = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">IT & Systems</h1>
      <p className="text-muted-foreground">Monitor infrastructure health and manage support tickets.</p>
    </div>

    {/* KPI Row */}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: 'Open Tickets', value: tickets.filter(t => t.status !== 'Resolved').length, icon: Ticket, color: 'text-red-500 bg-red-100' },
        { label: 'Systems Online', value: `${systems.filter(s => s.status === 'Healthy').length}/${systems.length}`, icon: Server, color: 'text-primary bg-primary/10' },
        { label: 'Avg. Response', value: '1.8h', icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
        { label: 'Avg. Uptime', value: '98.9%', icon: Wifi, color: 'text-green-600 bg-green-100' },
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className={`h-9 w-9 rounded-full flex items-center justify-center ${color}`}><Icon className="h-4 w-4" /></div>
          </div>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      ))}
    </div>

    {/* System Health */}
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h3 className="font-semibold text-lg mb-4">System Health</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {systems.map((sys, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${sys.status === 'Healthy' ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <div>
                <p className="text-sm font-medium">{sys.name}</p>
                <p className="text-xs text-muted-foreground">Load: {sys.load}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm shrink-0">
              <span className="text-muted-foreground text-xs">{sys.uptime}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sys.status === 'Healthy' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{sys.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Support Tickets */}
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="p-5 border-b flex items-center justify-between">
        <h3 className="font-semibold text-lg">Support Tickets</h3>
        <button className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          + New Ticket
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground bg-muted/50 border-b">
            <tr>{['ID', 'Issue', 'Priority', 'Status', 'Raised'].map(h => <th key={h} className="px-6 py-3 text-left font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tickets.map(t => (
              <tr key={t.id} className="bg-card hover:bg-muted/40 transition-colors">
                <td className="px-6 py-3 font-mono text-xs">{t.id}</td>
                <td className="px-6 py-3 font-medium max-w-[260px] truncate">{t.title}</td>
                <td className={`px-6 py-3 font-semibold text-xs ${priorityStyle[t.priority]}`}>{t.priority}</td>
                <td className="px-6 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge[t.status]}`}>{t.status}</span></td>
                <td className="px-6 py-3 text-muted-foreground">{t.raised}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default IT;
