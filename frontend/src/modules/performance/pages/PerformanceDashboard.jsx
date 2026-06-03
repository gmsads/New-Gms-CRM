import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  TrendingUp, Users, Target, Activity, ShieldCheck, 
  BarChart2, Clock, AlertTriangle 
} from 'lucide-react';
import api from '../../../services/api'; // Standard axios instance

export default function PerformanceDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ipsData, setIpsData] = useState(null);
  const [bottlenecks, setBottlenecks] = useState(null);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        // Fetch Individual Score
        const ipsRes = await api.get('/api/performance/engine/ips');
        if (ipsRes.data.success) {
          setIpsData(ipsRes.data);
        }

        // Managers and Above get Bottlenecks
        if (['ADMIN', 'BRANCH_HEAD', 'MD_CEO', 'SALES_MANAGER', 'SR_SALES_MANAGER', 'HR'].includes(user?.role)) {
          const btnRes = await api.get('/api/performance/engine/bottlenecks');
          if (btnRes.data.success) setBottlenecks(btnRes.data.data);
        }

        // Insights
        const insRes = await api.get('/api/performance/engine/insights');
        if (insRes.data.success) setInsights(insRes.data.data);

      } catch (error) {
        console.error('Error fetching performance data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchPerformanceData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900 text-slate-300">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Initializing Performance Engine...</p>
        </div>
      </div>
    );
  }

  // Define grade colors based on A+ to F
  const getGradeColor = (grade) => {
    switch(grade) {
      case 'A+': return 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]';
      case 'A': return 'text-emerald-500';
      case 'B': return 'text-blue-400';
      case 'C': return 'text-amber-400';
      case 'D': return 'text-orange-500';
      case 'F': return 'text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6 font-sans text-slate-200">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Performance Intelligence
          </h1>
          <p className="text-slate-400 mt-1">Real-time analytical layer</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 flex items-center gap-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-medium text-slate-300">Engine Online</span>
          </div>
        </div>
      </div>

      {/* Hero KPIs (Glassmorphism) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* IPS Score Card */}
        <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
          <h3 className="text-slate-400 font-medium mb-1">Individual Score (IPS)</h3>
          <div className="flex items-end gap-3 mt-4">
            <span className="text-5xl font-black text-white">{ipsData?.ips || 0}</span>
            <span className={`text-3xl font-bold ${getGradeColor(ipsData?.grade)}`}>{ipsData?.grade || '-'}</span>
          </div>
        </div>

        {/* Placeholder cards for Phase 6 visualization */}
        <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-400 font-medium">Productivity Ratio</h3>
            <Activity className="text-cyan-400 h-5 w-5" />
          </div>
          <span className="text-3xl font-bold text-white">87%</span>
        </div>
        
        <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-400 font-medium">Target Achievement</h3>
            <Target className="text-purple-400 h-5 w-5" />
          </div>
          <span className="text-3xl font-bold text-white">92%</span>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-400 font-medium">Health Index</h3>
            <ShieldCheck className="text-emerald-400 h-5 w-5" />
          </div>
          <span className="text-3xl font-bold text-emerald-400">Healthy</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* KPI Breakdown */}
          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-indigo-400" />
              Metric Breakdown
            </h3>
            <div className="space-y-6">
              {ipsData?.metrics?.length > 0 ? (
                ipsData.metrics.map((m, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-slate-300">{m.kpiName}</span>
                      <span className="text-emerald-400">{m.score.toFixed(1)} / 100</span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-2">
                      <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full" style={{ width: `${m.score}%` }}></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-center py-4">No KPI configurations mapped for your role yet.</div>
              )}
            </div>
          </div>
          
          {/* Bottlenecks (Managers +) */}
          {bottlenecks && (
            <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Clock className="h-5 w-5 text-rose-400" />
                Queue Bottlenecks
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Pending Verification</h4>
                  {bottlenecks.verificationBottlenecks?.map((b, i) => (
                    <div key={i} className="flex justify-between p-3 bg-slate-800 rounded-lg mb-2 border border-slate-700/50">
                      <span className="text-slate-300">{b.orderId}</span>
                      <span className="text-rose-400 font-medium">{Math.floor(b.ageDays)} days</span>
                    </div>
                  ))}
                  {bottlenecks.verificationBottlenecks?.length === 0 && <span className="text-emerald-500 text-sm">Clear</span>}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Pending Design</h4>
                  {bottlenecks.designBottlenecks?.map((b, i) => (
                    <div key={i} className="flex justify-between p-3 bg-slate-800 rounded-lg mb-2 border border-slate-700/50">
                      <span className="text-slate-300">{b.orderId}</span>
                      <span className="text-rose-400 font-medium">{Math.floor(b.ageDays)} days</span>
                    </div>
                  ))}
                  {bottlenecks.designBottlenecks?.length === 0 && <span className="text-emerald-500 text-sm">Clear</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - AI Insights */}
        <div className="space-y-8">
          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              AI Insights
            </h3>
            <div className="space-y-4">
              {insights?.length > 0 ? (
                insights.map((ins, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-700/50 bg-slate-800/80 shadow-lg relative overflow-hidden">
                    {ins.priority === 'Critical' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>}
                    {ins.priority === 'High' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>}
                    <div className="flex gap-2 items-center mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ins.priority === 'Critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {ins.priority}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm mb-3">{ins.message}</p>
                    <div className="bg-slate-900/50 rounded-lg p-3 text-xs text-slate-400">
                      <strong>Recommendation:</strong> {ins.recommendedAction}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-center py-8">No critical insights detected.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
