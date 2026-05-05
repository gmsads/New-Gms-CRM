import React from 'react';
import {
  TrendingUp, Users, Clock, CheckCircle,
  IndianRupee, Target, AlertCircle, Phone, MessageCircle, Plus,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ title, value, sub, icon: Icon, color, urgent }) => (
  <div
    className="rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
    style={{ background: urgent ? 'linear-gradient(135deg, #fef2f2, #fff)' : 'white' }}
  >
    <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-5"
      style={{ background: color, transform: 'translate(30%,-30%)' }} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold mt-1 tracking-tight">{value ?? 0}</h3>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
    </div>
    {urgent && (
      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
        <AlertCircle className="h-3 w-3" /> Needs attention
      </div>
    )}
  </div>
);

// ─── Target Progress Bar ──────────────────────────────────────────────────────
const TargetBar = ({ kpi }) => {
  const pct = kpi?.targetPercent ?? 0;
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Monthly Target</p>
          <p className="text-2xl font-bold mt-1">{kpi?.revenueAchieved ?? '₹0'}</p>
          <p className="text-xs text-muted-foreground">of {kpi?.target ?? '₹0'} target</p>
        </div>
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: '#10b98118' }}>
          <Target className="h-5 w-5 text-emerald-600" />
        </div>
      </div>
      <div className="w-full h-2.5 rounded-full bg-gray-100">
        <div className="h-2.5 rounded-full transition-all"
          style={{ width: `${pct}%`, background: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' }} />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-xs font-semibold" style={{ color: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' }}>
          {pct}% achieved
        </span>
        <span className="text-xs text-muted-foreground">{100 - pct}% remaining</span>
      </div>
    </div>
  );
};

// ─── Action Center ────────────────────────────────────────────────────────────
export const ActionCenter = ({ followups = [], onWhatsApp, onCall, onAddFollowup }) => {
  const overdue = followups.filter(f => f.status === 'Overdue');
  const today   = followups.filter(f => f.status === 'Pending');
  const priorityColor = p =>
    p === 'Hot' ? 'bg-red-100 text-red-700' :
    p === 'Warm' ? 'bg-orange-100 text-orange-700' :
    'bg-blue-100 text-blue-700';

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b">
        <div>
          <h3 className="font-bold text-base">🔥 Action Center</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {overdue.length} overdue · {today.length} due today
          </p>
        </div>
        <button onClick={onAddFollowup}
          className="h-8 px-3 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5"
          style={{ background: '#1e3a8a' }}>
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>

      {followups.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No pending follow-ups
        </div>
      ) : (
        <>
          {overdue.length > 0 && (
            <div className="p-3 border-b bg-red-50/50">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Overdue
              </p>
              <div className="space-y-2">
                {overdue.map((f, i) => (
                  <div key={f._id || i} className="flex items-center gap-3 rounded-xl border border-red-100 bg-white p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm truncate">{f.client || f.prospect?.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${priorityColor(f.priority)}`}>{f.priority}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{f.type} · {f.scheduledAt}</p>
                      <p className="text-xs text-muted-foreground italic truncate">{f.note || f.notes}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => onCall?.(f)} className="h-8 w-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"><Phone className="h-3.5 w-3.5 text-blue-600" /></button>
                      <button onClick={() => onWhatsApp?.(f)} className="h-8 w-8 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"><MessageCircle className="h-3.5 w-3.5 text-green-600" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {today.length > 0 && (
            <div className="p-3">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Today
              </p>
              <div className="space-y-2">
                {today.map((f, i) => (
                  <div key={f._id || i} className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm truncate">{f.client || f.prospect?.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${priorityColor(f.priority)}`}>{f.priority}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{f.type} · {f.scheduledAt}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => onCall?.(f)} className="h-8 w-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center"><Phone className="h-3.5 w-3.5 text-blue-600" /></button>
                      <button onClick={() => onWhatsApp?.(f)} className="h-8 w-8 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center"><MessageCircle className="h-3.5 w-3.5 text-green-600" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Pipeline Funnel ──────────────────────────────────────────────────────────
const PipelineFunnel = ({ stages = [] }) => (
  <div className="rounded-2xl border bg-white p-5 shadow-sm">
    <h3 className="font-bold text-base mb-4">📊 My Pipeline</h3>
    {stages.length === 0 ? (
      <div className="text-center text-muted-foreground text-sm py-6">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />No pipeline data yet
      </div>
    ) : (
      <div className="space-y-2">
        {stages.map(s => {
          const max = Math.max(...stages.map(x => x.count), 1);
          const pct = Math.round((s.count / max) * 100);
          return (
            <div key={s.stage} className="flex items-center gap-3">
              <span className="text-xs font-medium w-20 text-right text-muted-foreground">{s.stage}</span>
              <div className="flex-1 h-6 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-6 rounded-full flex items-center px-2 transition-all"
                  style={{ width: `${Math.max(pct, 12)}%`, background: s.color || '#60a5fa' }}>
                  <span className="text-white text-xs font-bold">{s.count}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

// ─── Performance Chart ────────────────────────────────────────────────────────
const PerformanceChart = ({ data = [] }) => (
  <div className="rounded-2xl border bg-white p-5 shadow-sm">
    <h3 className="font-bold text-base mb-4">📈 Revenue vs Target</h3>
    {data.length === 0 ? (
      <div className="text-center text-muted-foreground text-sm py-6">
        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />No data yet
      </div>
    ) : (
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `₹${v/1000}k`} />
            <Tooltip formatter={(v, n) => [`₹${(v/1000).toFixed(0)}k`, n === 'achieved' ? 'Achieved' : 'Target']}
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Bar dataKey="target"   fill="#e2e8f0" radius={[4,4,0,0]} name="Target" />
            <Bar dataKey="achieved" fill="#1e3a8a" radius={[4,4,0,0]} name="Achieved" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

// ─── KPI Section (exported) ───────────────────────────────────────────────────
export const KpiSection = ({ kpi = {}, pipelineStages = [], monthlyData = [] }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <KpiCard title="Leads Today"      value={kpi.leadsToday}        icon={Users}        color="#3b82f6" sub="From all sources" />
      <KpiCard title="Follow-ups"       value={kpi.followupsPending}  icon={Clock}        color="#f59e0b" sub="Pending action" urgent />
      <KpiCard title="Orders Closed"    value={kpi.ordersClosed}      icon={CheckCircle}  color="#10b981" sub="This month" />
      <KpiCard title="Pending Payments" value={kpi.pendingPayments}   icon={IndianRupee}   color="#ef4444" sub="Needs collection" urgent />
      <KpiCard title="Conversion Rate"  value={kpi.conversionRate}    icon={TrendingUp}   color="#8b5cf6" sub="Lead to order" />
      <TargetBar kpi={kpi} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <PipelineFunnel stages={pipelineStages} />
      <PerformanceChart data={monthlyData} />
    </div>
  </div>
);
