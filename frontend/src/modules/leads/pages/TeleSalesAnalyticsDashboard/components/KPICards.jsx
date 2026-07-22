import React from 'react';
import { Users, PhoneCall, PhoneForwarded, Target, CheckCircle, XCircle, Clock, Zap, TrendingUp, IndianRupee } from 'lucide-react';

export default function KPICards({ data, loading }) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-xl p-4 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0s';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const kpis = [
    { label: 'Total Leads', value: data.totalLeads, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Created', value: data.createdLeads, icon: PlusCircle, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Assigned', value: data.assignedLeads, icon: Target, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Pending', value: data.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    
    { label: 'Called', value: data.called, icon: PhoneCall, color: 'text-teal-500', bg: 'bg-teal-500/10' },
    { label: 'Connected', value: data.connected, icon: PhoneForwarded, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Today\'s Calls', value: data.todaysCalls, icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Remarks Updated', value: data.remarksUpdated, icon: Edit3, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    
    { label: 'Interested', value: data.interested, icon: ThumbsUp, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { label: 'Follow-ups', value: data.followups, icon: Calendar, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { label: 'Prospects', value: data.prospects, icon: TrendingUp, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10' },
    { label: 'Lost', value: data.lost, icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    
    { label: 'Sales (Converted)', value: data.sales, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-600/10' },
    { label: 'Total Call Time', value: formatTime(data.totalCallTime), icon: Clock, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { label: 'Avg Call Time', value: formatTime(data.averageCallTime), icon: Clock, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { label: 'Conversion %', value: `${data.conversionPercent}%`, icon: Percent, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div key={idx} className="bg-card border rounded-xl p-3 flex flex-col justify-between shadow-sm hover:shadow transition-all group">
            <div className="flex justify-between items-start">
              <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground">{kpi.label}</span>
              <div className={`p-1.5 rounded-lg ${kpi.bg}`}>
                <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${kpi.color}`} />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-black mt-2 text-foreground group-hover:scale-105 transition-transform origin-left">
              {kpi.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Inline fallback icons for missing lucide imports
const PlusCircle = (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>;
const ThumbsUp = (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>;
const Calendar = (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const Edit3 = (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const Percent = (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>;
