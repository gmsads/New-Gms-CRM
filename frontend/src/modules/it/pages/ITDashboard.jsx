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

const ITDashboard = () => (
  <div className="space-y-6">
    <div className="flex flex-col gap-1">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">IT & Systems</h1>
      <p className="text-sm font-semibold text-slate-500">Infrastructure pulse and support terminal.</p>
    </div>

    {/* KPI Row */}
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: 'Open Tickets', value: tickets.filter(t => t.status !== 'Resolved').length, icon: Ticket, color: 'emerald' },
        { label: 'Systems Online', value: `${systems.filter(s => s.status === 'Healthy').length}/${systems.length}`, icon: Server, color: 'blue' },
        { label: 'Avg. Response', value: '1.8h', icon: Clock, color: 'amber' },
        { label: 'Avg. Uptime', value: '98.9%', icon: Wifi, color: 'indigo' },
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-${color}-50 text-${color}-600`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{value}</p>
        </div>
      ))}
    </div>

    {/* System Health */}
    <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
      <h3 className="text-xl font-black text-slate-900 mb-6">Real-time Infrastructure Health</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {systems.map((sys, i) => (
          <div key={i} className="flex items-center justify-between rounded-2xl border border-slate-50 bg-slate-50/50 p-4 hover:border-blue-200 hover:bg-white transition-all cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className={`h-2.5 w-2.5 rounded-full shadow-[0_0_8px] ${sys.status === 'Healthy' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-amber-500 shadow-amber-200'}`} />
              <div>
                <p className="text-sm font-bold text-slate-700">{sys.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Load: {sys.load}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{sys.uptime}</span>
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter ${sys.status === 'Healthy' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{sys.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Support Tickets */}
    <div className="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-50 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-900">Support Ticket Terminal</h3>
          <p className="text-sm font-semibold text-slate-500">Recent internal help requests.</p>
        </div>
        <button className="h-10 px-6 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg shadow-slate-200 hover:opacity-90 transition-opacity">
          + New Ticket
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
            <tr>
              <th className="px-8 py-5">Ticket ID</th>
              <th className="px-8 py-5">Issue Description</th>
              <th className="px-8 py-5">Priority</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Raised</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tickets.map(t => (
              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-6 font-mono text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t.id}</td>
                <td className="px-8 py-6">
                  <p className="text-sm font-bold text-slate-800">{t.title}</p>
                </td>
                <td className="px-8 py-6">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${priorityStyle[t.priority]}`}>{t.priority}</span>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${statusBadge[t.status]}`}>{t.status}</span>
                </td>
                <td className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase">{t.raised}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default ITDashboard;
