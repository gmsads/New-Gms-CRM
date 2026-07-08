import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import leadApi from '../../../services/lead.api';
import { 
  BarChart3, PieChart, TrendingUp, Users, PhoneCall, Award, Layers, 
  Calendar, Clock, CheckCircle2, AlertTriangle, MessageSquare, Send, 
  LogIn, LogOut, Activity, Flame, ShieldCheck, RefreshCw, Zap,
  CheckSquare, XCircle, ArrowUpRight, ArrowDownRight, UserCheck
} from 'lucide-react';

/**
 * MyReports.jsx
 * Executive Performance Scorecard & BI Dashboard
 * Presents personal metrics across 8 key operational areas without recorded audio data.
 */
export default function MyReports() {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState('today'); // today, yesterday, week, month, custom
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = () => {
    if (!user?.token) return;
    setLoading(true);

    const params = { filter: dateFilter };
    if (dateFilter === 'custom' && customStart && customEnd) {
      params.startDate = customStart;
      params.endDate = customEnd;
    }

    leadApi.getMyReports(params, user.token)
      .then(res => {
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setData(getFallbackData());
        }
      })
      .catch(err => {
        console.error('[MyReports] Fetch error:', err);
        setData(getFallbackData());
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    fetchReports();
  }, [user, dateFilter]);

  // Fallback structure in case API returns partial or empty data for new executives
  const getFallbackData = () => ({
    callOverview: { totalCalls: 0, answeredCalls: 0, unansweredCalls: 0, connectedRatio: 0 },
    outgoingCalls: { totalTalkDuration: '00h 00m', avgTalkTime: '0s', longestCall: '0s', shortestCall: '0s' },
    followupReport: { totalScheduled: 0, completed: 0, overdue: 0, upcomingToday: 0 },
    dispositionReport: [
      { label: 'Connected', count: 0, color: 'bg-emerald-500' },
      { label: 'Busy / Call Waiting', count: 0, color: 'bg-amber-500' },
      { label: 'Not Reachable', count: 0, color: 'bg-blue-500' },
      { label: 'Interested / Demo', count: 0, color: 'bg-indigo-500' },
      { label: 'Quotation Sent', count: 0, color: 'bg-purple-500' },
      { label: 'Not Interested / Lost', count: 0, color: 'bg-rose-500' }
    ],
    leadPerformance: { totalWorked: 0, touchedToday: 0, convertedToProspect: 0, hotLeads: 0 },
    activitySummary: { firstCallTime: '--:--', lastCallTime: '--:--', totalSessionTime: '00h 00m', acwBreakTime: '00m' },
    messageActivity: { whatsappSent: 0, emailSent: 0, smsSent: 0, quotesDispatched: 0 },
    loginActivity: { checkInTime: '--:--', checkOutTime: '--:--', activeDuration: '00h 00m', currentState: 'Available' }
  });

  const rep = data || getFallbackData();

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Page Header & Date Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                My Performance Reports
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                Personal sales productivity scorecard & activity metrics
              </p>
            </div>
          </div>
        </div>

        {/* Date Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 bg-card p-1.5 rounded-2xl border border-border shadow-sm">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'custom', label: 'Custom' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setDateFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dateFilter === f.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={fetchReports}
            title="Refresh Data"
            className="p-1.5 text-muted-foreground hover:text-primary rounded-xl hover:bg-muted/50 transition-all ml-1"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {dateFilter === 'custom' && (
        <div className="flex items-center gap-3 bg-muted/30 p-4 rounded-2xl border border-border animate-in slide-in-from-top-2">
          <span className="text-xs font-bold text-muted-foreground uppercase">Select Range:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="bg-background border rounded-xl px-3 py-1.5 text-xs font-semibold text-foreground"
          />
          <span className="text-muted-foreground text-xs">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="bg-background border rounded-xl px-3 py-1.5 text-xs font-semibold text-foreground"
          />
          <button
            onClick={fetchReports}
            className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-xl shadow hover:bg-primary/90 transition-all"
          >
            Apply Range
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-semibold">Aggregating executive scorecard metrics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* ── SECTION 1: CALL OVERVIEW ─────────────────────────────── */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <PhoneCall className="h-4 w-4 text-blue-500" /> 1. Call Overview
              </span>
              <span className="text-xs font-mono font-bold bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-lg">
                {rep.callOverview?.connectedRatio || 0}% Conn
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Total Dialed</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{rep.callOverview?.totalCalls || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Answered</p>
                <p className="text-2xl font-black text-emerald-600 mt-0.5">{rep.callOverview?.answeredCalls || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Unanswered</p>
                <p className="text-lg font-bold text-rose-500 mt-0.5">{rep.callOverview?.unansweredCalls || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Ratio</p>
                <p className="text-lg font-bold text-blue-600 mt-0.5">{rep.callOverview?.connectedRatio || 0}%</p>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: OUTGOING CALLS ────────────────────────────── */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-emerald-500" /> 2. Outgoing Calls
              </span>
              <span className="text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-lg">
                Duration
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Total Talk Time</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{rep.outgoingCalls?.totalTalkDuration || '00h 00m'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Avg / Call</p>
                <p className="text-2xl font-black text-emerald-600 mt-0.5">{rep.outgoingCalls?.avgTalkTime || '0s'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Longest Call</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{rep.outgoingCalls?.longestCall || '0s'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Shortest Call</p>
                <p className="text-sm font-bold text-muted-foreground mt-0.5">{rep.outgoingCalls?.shortestCall || '0s'}</p>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: FOLLOW-UP REPORT ──────────────────────────── */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-purple-500" /> 3. Follow-up Report
              </span>
              <span className="text-xs font-mono font-bold bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-lg">
                Schedule
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Total Scheduled</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{rep.followupReport?.totalScheduled || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Completed</p>
                <p className="text-2xl font-black text-emerald-600 mt-0.5">{rep.followupReport?.completed || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Overdue</p>
                <p className="text-lg font-bold text-rose-500 mt-0.5 flex items-center gap-1">
                  {rep.followupReport?.overdue || 0} {rep.followupReport?.overdue > 0 && <AlertTriangle className="h-3 w-3 text-rose-500 animate-pulse" />}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Due Today</p>
                <p className="text-lg font-bold text-purple-600 mt-0.5">{rep.followupReport?.upcomingToday || 0}</p>
              </div>
            </div>
          </div>

          {/* ── SECTION 5: LEAD PERFORMANCE ──────────────────────────── */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-amber-500" /> 5. Lead Performance
              </span>
              <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-lg">
                Pipeline
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Total Worked</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{rep.leadPerformance?.totalWorked || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Touched Today</p>
                <p className="text-2xl font-black text-blue-600 mt-0.5">{rep.leadPerformance?.touchedToday || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Prospect Converted</p>
                <p className="text-lg font-bold text-emerald-600 mt-0.5">{rep.leadPerformance?.convertedToProspect || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Hot / Interested</p>
                <p className="text-lg font-bold text-amber-600 mt-0.5">{rep.leadPerformance?.hotLeads || 0}</p>
              </div>
            </div>
          </div>

          {/* ── SECTION 4: DISPOSITION REPORT (SPAN 2 COLS) ──────────── */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all md:col-span-2 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <PieChart className="h-4 w-4 text-indigo-500" /> 4. Call Disposition Report
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                Outcome breakdown across dialed contacts
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              {(rep.dispositionReport || []).map((disp, i) => (
                <div key={i} className="bg-muted/30 p-3 rounded-xl border border-border/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-bold text-muted-foreground truncate">{disp.label}</span>
                    <span className={`h-2 w-2 rounded-full ${disp.color || 'bg-primary'}`}></span>
                  </div>
                  <p className="text-xl font-black text-foreground">{disp.count || 0}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── SECTION 6: ACTIVITY SUMMARY (SPAN 2 COLS) ────────────── */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all md:col-span-2 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-cyan-500" /> 6. Activity Summary
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                Daily operational timestamps
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
              <div className="bg-muted/20 p-3 rounded-xl border border-border/40">
                <p className="text-[11px] text-muted-foreground font-bold">First Call Time</p>
                <p className="text-base font-black text-foreground mt-1 font-mono">{rep.activitySummary?.firstCallTime || '--:--'}</p>
              </div>
              <div className="bg-muted/20 p-3 rounded-xl border border-border/40">
                <p className="text-[11px] text-muted-foreground font-bold">Last Call Time</p>
                <p className="text-base font-black text-foreground mt-1 font-mono">{rep.activitySummary?.lastCallTime || '--:--'}</p>
              </div>
              <div className="bg-muted/20 p-3 rounded-xl border border-border/40">
                <p className="text-[11px] text-muted-foreground font-bold">Working Session</p>
                <p className="text-base font-black text-emerald-600 mt-1 font-mono">{rep.activitySummary?.totalSessionTime || '00h 00m'}</p>
              </div>
              <div className="bg-muted/20 p-3 rounded-xl border border-border/40">
                <p className="text-[11px] text-muted-foreground font-bold">Break / ACW Time</p>
                <p className="text-base font-black text-amber-600 mt-1 font-mono">{rep.activitySummary?.acwBreakTime || '00m'}</p>
              </div>
            </div>
          </div>

          {/* ── SECTION 7: MESSAGE ACTIVITY (SPAN 2 COLS) ────────────── */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all md:col-span-2 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-green-500" /> 7. Message & Communication Activity
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                Multi-channel outreach count
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
              <div className="bg-green-500/5 p-3 rounded-xl border border-green-500/20">
                <p className="text-[11px] text-green-700 font-bold">WhatsApp Sent</p>
                <p className="text-xl font-black text-green-600 mt-1">{rep.messageActivity?.whatsappSent || 0}</p>
              </div>
              <div className="bg-blue-500/5 p-3 rounded-xl border border-blue-500/20">
                <p className="text-[11px] text-blue-700 font-bold">Email Brochures</p>
                <p className="text-xl font-black text-blue-600 mt-1">{rep.messageActivity?.emailSent || 0}</p>
              </div>
              <div className="bg-purple-500/5 p-3 rounded-xl border border-purple-500/20">
                <p className="text-[11px] text-purple-700 font-bold">SMS Dispatched</p>
                <p className="text-xl font-black text-purple-600 mt-1">{rep.messageActivity?.smsSent || 0}</p>
              </div>
              <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/20">
                <p className="text-[11px] text-amber-700 font-bold">Quotations Sent</p>
                <p className="text-xl font-black text-amber-600 mt-1">{rep.messageActivity?.quotesDispatched || 0}</p>
              </div>
            </div>
          </div>

          {/* ── SECTION 8: LOGIN ACTIVITY (SPAN 2 COLS) ──────────────── */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all md:col-span-2 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <LogIn className="h-4 w-4 text-slate-500" /> 8. Login & Attendance Activity
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                Session check-in and status tracking
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
              <div className="bg-muted/20 p-3 rounded-xl border border-border/40">
                <p className="text-[11px] text-muted-foreground font-bold">Check-in Time</p>
                <p className="text-base font-black text-foreground mt-1 font-mono">{rep.loginActivity?.checkInTime || '--:--'}</p>
              </div>
              <div className="bg-muted/20 p-3 rounded-xl border border-border/40">
                <p className="text-[11px] text-muted-foreground font-bold">Check-out Time</p>
                <p className="text-base font-black text-foreground mt-1 font-mono">{rep.loginActivity?.checkOutTime || '--:--'}</p>
              </div>
              <div className="bg-muted/20 p-3 rounded-xl border border-border/40">
                <p className="text-[11px] text-muted-foreground font-bold">Active Duration</p>
                <p className="text-base font-black text-emerald-600 mt-1 font-mono">{rep.loginActivity?.activeDuration || '00h 00m'}</p>
              </div>
              <div className="bg-muted/20 p-3 rounded-xl border border-border/40 flex flex-col justify-between">
                <p className="text-[11px] text-muted-foreground font-bold">Current State</p>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-xs font-bold w-fit mt-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {rep.loginActivity?.currentState || 'Available'}
                </span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
