import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import leadApi from '../../../services/lead.api';
import { CeoFunnelWidget, EnterpriseConfigModal } from '../components/EnterpriseTelePanels';
import { Users, PhoneCall, CheckCircle2, Clock, Flame, Megaphone, Activity, TrendingUp, AlertCircle, Settings } from 'lucide-react';

/**
 * LeadDashboard.jsx
 * Admin & Manager KPI Dashboard specifically for Lead Management.
 */
export default function LeadDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [topExecs, setTopExecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    leadApi.getDashboard(user.token)
      .then(res => {
        if (res.success) {
          setStats(res.stats);
          setTopExecs(res.topExecs || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Lead Analytics...</div>;
  }

  const cards = [
    { label: 'Total Leads Pool', value: stats?.totalLeads || 0, icon: Users, color: 'text-blue-500 bg-blue-500/10' },
    { label: "Today's New Leads", value: stats?.todayLeads || 0, icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10' },
    { label: "Today's Tele Calls", value: stats?.todayCalls || 0, icon: PhoneCall, color: 'text-purple-500 bg-purple-500/10' },
    { label: 'Connected Calls', value: stats?.connectedCalls || 0, icon: CheckCircle2, color: 'text-teal-500 bg-teal-500/10' },
    { label: 'Busy / Waiting', value: stats?.busyCalls || 0, icon: Clock, color: 'text-amber-500 bg-amber-500/10' },
    { label: 'Not Reachable', value: stats?.notConnectedCalls || 0, icon: AlertCircle, color: 'text-rose-500 bg-rose-500/10' },
    { label: 'Interested Leads', value: stats?.interestedLeads || 0, icon: Flame, color: 'text-amber-600 bg-amber-600/10' },
    { label: 'Converted to Prospect', value: stats?.convertedLeads || 0, icon: Activity, color: 'text-emerald-600 bg-emerald-600/10' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Lead Management & Tele Sales Dashboard</h1>
          <p className="text-xs text-muted-foreground">Real-time enterprise acquisition KPIs and calling telemetry.</p>
        </div>
        <button
          onClick={() => setShowConfigModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm flex items-center gap-1.5"
        >
          <Settings className="w-4 h-4" /> Enterprise Rules
        </button>
      </div>

      <CeoFunnelWidget token={user?.token} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">{c.label}</p>
              <h3 className="text-2xl font-black text-foreground mt-1 font-mono">{c.value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${c.color}`}>
              <c.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard & Campaign Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            🏆 Top Performing Sales Executives
          </h3>
          <div className="space-y-3">
            {topExecs.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No telecalling activity recorded today.</p>
            ) : (
              topExecs.map((ex, idx) => (
                <div key={idx} className="flex items-center justify-between bg-muted/40 p-3 rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-primary">#{idx + 1}</span>
                    <span className="font-bold">{ex.callerName || 'Sales Executive'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span>📞 {ex.callsCount} calls</span>
                    <span className="text-emerald-500 font-bold">{Math.round(ex.talkTimeSeconds / 60)}m talk time</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            📢 Active Pipeline Distribution
          </h3>
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-xs border border-dashed rounded-xl">
            [Chart Area: Tele Sales vs Sales vs Appointment Conversion Funnel]
          </div>
        </div>
      </div>

      <EnterpriseConfigModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} token={user?.token} />
    </div>
  );
}
