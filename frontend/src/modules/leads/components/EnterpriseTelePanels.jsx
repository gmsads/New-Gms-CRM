import React, { useState, useEffect } from 'react';
import { PhoneCall, Play, Pause, Star, CheckCircle, Clock, AlertTriangle, ShieldCheck, Download, Settings, RefreshCw, BarChart2, Users } from 'lucide-react';
import leadApi from '../../../services/lead.api';

export const LiveSessionBar = ({ token, onStatusChange }) => {
  const [status, setStatus] = useState('Available');
  const [loading, setLoading] = useState(false);

  const statuses = [
    { label: 'Available', color: 'bg-emerald-500 text-white' },
    { label: 'Calling', color: 'bg-blue-600 text-white' },
    { label: 'Break', color: 'bg-amber-500 text-white' },
    { label: 'Lunch', color: 'bg-orange-500 text-white' },
    { label: 'Meeting', color: 'bg-purple-600 text-white' },
    { label: 'After Call Work', color: 'bg-indigo-600 text-white' },
    { label: 'Offline', color: 'bg-slate-500 text-white' },
  ];

  const handleUpdate = async (st) => {
    setStatus(st);
    setLoading(true);
    try {
      await leadApi.updateLiveStatus(st, token);
      if (onStatusChange) onStatusChange(st);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-white shadow-sm overflow-x-auto w-full min-w-0">
      <div className="flex items-center gap-2 shrink-0">
        <span className="relative flex h-3 w-3">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === 'Available' || status === 'Calling' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
          <span className={`relative inline-flex rounded-full h-3 w-3 ${status === 'Available' || status === 'Calling' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Working Session: <span className="text-white">{status}</span></span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {statuses.map((st) => (
          <button
            key={st.label}
            disabled={loading}
            onClick={() => handleUpdate(st.label)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all transform active:scale-95 ${
              status === st.label ? st.color + ' shadow-sm ring-2 ring-white/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export const QaReviewModal = ({ isOpen, onClose, call, token }) => {
  const [scores, setScores] = useState({
    greeting: 8,
    communicationQuality: 8,
    requirementUnderstanding: 8,
    objectionHandling: 7,
    closingSkill: 7,
    professionalism: 9
  });
  const [coachingNotes, setCoachingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !call) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await leadApi.submitQaReview(call._id, { scores, coachingNotes }, token);
      alert('QA review submitted successfully!');
      onClose();
    } catch (err) {
      alert('Error saving review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold">QA Call Review Scoring</h3>
            <p className="text-xs text-muted-foreground">Executive: {call.callerName} | Callee: {call.calleePhone}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {call.recordingUrl && (
          <div className="my-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-500 fill-current" /> Call Audio ({call.talkDuration || call.durationSeconds}s)
            </span>
            <a href={call.recordingUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> Download Audio
            </a>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {Object.entries(scores).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="capitalize font-medium text-slate-700 dark:text-slate-300">
                {key.replace(/([A-Z])/g, ' $1')}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={val}
                  onChange={(e) => setScores({ ...scores, [key]: Number(e.target.value) })}
                  className="w-32 accent-emerald-600"
                />
                <span className="w-6 text-center font-bold text-emerald-600">{val}/10</span>
              </div>
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Coaching Notes & Action Items</label>
            <textarea
              rows={3}
              value={coachingNotes}
              onChange={(e) => setCoachingNotes(e.target.value)}
              placeholder="Provide constructive feedback and pointers..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-transparent"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm">
              {submitting ? 'Submitting...' : 'Save QA Score'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EnterpriseConfigModal = ({ isOpen, onClose, token }) => {
  const [cfg, setCfg] = useState({
    retryRules: { maxRetries: 3, busyRetryHours: 2 },
    slaRules: { firstCallMaxMinutes: 30, reminderMinutes: 15 },
    defaultTargets: { dailyCalls: 60, dailyTalkTimeMinutes: 150 }
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      leadApi.getConfig(token).then(res => {
        if (res?.data) setCfg(res.data);
      }).catch(() => {});
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await leadApi.saveConfig(cfg, token);
      alert('Settings saved successfully');
      onClose();
    } catch (err) {
      alert('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold flex items-center gap-2"><Settings className="w-5 h-5 text-blue-600" /> Enterprise Tele Sales Configuration</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="space-y-4 my-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Max Call Retries</label>
              <input
                type="number"
                value={cfg?.retryRules?.maxRetries || 3}
                onChange={e => setCfg({ ...cfg, retryRules: { ...cfg.retryRules, maxRetries: Number(e.target.value) } })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Busy Retry Delay (Hours)</label>
              <input
                type="number"
                value={cfg?.retryRules?.busyRetryHours || 2}
                onChange={e => setCfg({ ...cfg, retryRules: { ...cfg.retryRules, busyRetryHours: Number(e.target.value) } })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">First Call SLA Limit (Mins)</label>
              <input
                type="number"
                value={cfg?.slaRules?.firstCallMaxMinutes || 30}
                onChange={e => setCfg({ ...cfg, slaRules: { ...cfg.slaRules, firstCallMaxMinutes: Number(e.target.value) } })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Daily Call Target</label>
              <input
                type="number"
                value={cfg?.defaultTargets?.dailyCalls || 60}
                onChange={e => setCfg({ ...cfg, defaultTargets: { ...cfg.defaultTargets, dailyCalls: Number(e.target.value) } })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 hover:bg-slate-50">Close</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
            {saving ? 'Saving...' : 'Save Rules'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const CeoFunnelWidget = ({ token }) => {
  const [funnel, setFunnel] = useState(null);

  useEffect(() => {
    leadApi.getCeoFunnel(token).then(res => {
      if (res?.data?.funnel) setFunnel(res.data.funnel);
    }).catch(() => {});
  }, [token]);

  if (!funnel) return null;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
      <h3 className="text-base font-bold mb-4 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-indigo-600" /> CEO Operational Funnel</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {Object.entries(funnel).map(([step, val]) => (
          <div key={step} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{val}</div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">{step}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
