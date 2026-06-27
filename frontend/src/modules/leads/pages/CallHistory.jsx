import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import leadApi from '../../../services/lead.api';
import { Phone, Play, Pause, Clock, CheckCircle2, AlertCircle, Filter, Volume2 } from 'lucide-react';

/**
 * CallHistory.jsx
 * Telephony Telemetry & Recording Listener Table
 */
export default function CallHistory() {
  const { user } = useAuth();
  const [calls, setCalls] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [playingUrl, setPlayingUrl] = useState(null);

  const fetchHistory = (pg = 1) => {
    if (!user) return;
    setLoading(true);
    leadApi.getCallHistory({ page: pg, limit: 25, status: statusFilter }, user.token)
      .then(res => {
        if (res.success) {
          setCalls(res.calls);
          setPagination(res.pagination);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory(1);
  }, [user, statusFilter]);

  const toggleAudio = (url) => {
    if (playingUrl === url) setPlayingUrl(null);
    else setPlayingUrl(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Telephony Call Logs & Recordings</h1>
          <p className="text-xs text-muted-foreground">Audio telemetry and quality assurance review grid.</p>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-card border rounded-xl px-3 py-2 text-xs font-bold">
          <option value="">All Call Outcomes</option>
          <option value="Connected">Connected</option>
          <option value="Busy">Busy</option>
          <option value="Not Reachable">Not Reachable</option>
        </select>
      </div>

      {/* Grid Table */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/50 border-b text-muted-foreground font-mono">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Caller Agent</th>
                <th className="p-3">Customer Lead</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Status</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Recording QA</th>
                <th className="p-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center animate-pulse">Loading Telemetry...</td></tr>
              ) : calls.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No call logs recorded yet.</td></tr>
              ) : (
                calls.map(cl => (
                  <tr key={cl._id} className="hover:bg-muted/20">
                    <td className="p-3 font-mono text-muted-foreground">{new Date(cl.createdAt).toLocaleString()}</td>
                    <td className="p-3 font-bold text-foreground">{cl.callerName || 'Executive'}</td>
                    <td className="p-3">
                      <div className="font-bold">{cl.leadId?.companyName || cl.leadId?.contactPerson || 'Customer'}</div>
                      <div className="text-[10px] font-mono text-primary">{cl.leadId?.leadNumber}</div>
                    </td>
                    <td className="p-3 font-mono">{cl.calleePhone}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded font-semibold ${cl.callStatus === 'Connected' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>{cl.callStatus}</span></td>
                    <td className="p-3 font-mono font-bold">{cl.durationSeconds}s</td>
                    <td className="p-3">
                      {cl.recordingUrl ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleAudio(cl.recordingUrl)} className="p-1.5 rounded-full bg-primary text-primary-foreground hover:scale-105 transition-all">
                            {playingUrl === cl.recordingUrl ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          </button>
                          <span className="text-[10px] text-muted-foreground">Audio QA</span>
                        </div>
                      ) : <span className="text-muted-foreground italic">No Audio</span>}
                    </td>
                    <td className="p-3 text-muted-foreground max-w-[200px] truncate">{cl.remarks}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {playingUrl && <audio autoPlay src={playingUrl} onEnded={() => setPlayingUrl(null)} className="hidden" />}
    </div>
  );
}
