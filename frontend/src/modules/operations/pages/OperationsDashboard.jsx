import React, { useState } from 'react';
import { MapPin, CheckCircle2, Clock, Plus, Truck, AlertCircle, RefreshCw, Filter } from 'lucide-react';
import useApi from '../../../hooks/useApi';

const statusStyle = {
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-100',
  Pending: 'bg-amber-50 text-amber-700 border-amber-100',
};

const typeColors = {
  Installation: 'bg-purple-50 text-purple-700 border-purple-100',
  Survey: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  Maintenance: 'bg-orange-50 text-orange-700 border-orange-100',
  Shoot: 'bg-pink-50 text-pink-700 border-pink-100',
  Visit: 'bg-indigo-50 text-indigo-700 border-indigo-100',
};

const TYPES = ['All', 'Installation', 'Survey', 'Maintenance', 'Shoot', 'Visit'];

const OperationsDashboard = () => {
  const { data, loading, error, refetch } = useApi('/visits');
  const [filter, setFilter] = useState('All');

  const visits = data?.data || [];
  const filtered = visits.filter(v => filter === 'All' || v.visitType === filter);
  const completedCount = visits.filter(v => v.status === 'Completed').length;
  const inProgressCount = visits.filter(v => v.status === 'In Progress').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Field Operations</h1>
          <p className="text-sm font-semibold text-slate-500">Logistics, installations, and site visit management.</p>
        </div>
        <div className="flex gap-3">
           <button onClick={() => refetch()} className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
             <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
             Sync
           </button>
           <button className="h-10 px-6 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg shadow-slate-200 hover:opacity-90 transition-all active:scale-95 flex items-center gap-2">
             <Plus className="h-4 w-4" /> Add Task
           </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex h-96 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : error ? (
        <div className="p-6 text-sm text-red-500 bg-red-50 rounded-xl border border-red-200">Error loading operations: {error}</div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {[
              { label: 'Total Tasks', value: visits.length, icon: Truck, color: 'blue' },
              { label: 'In Progress', value: inProgressCount, icon: Clock, color: 'amber' },
              { label: 'Completed', value: completedCount, icon: CheckCircle2, color: 'emerald' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center bg-${color}-50 text-${color}-600 border border-${color}-100 shadow-inner`}><Icon className="h-7 w-7" /></div>
                <div>
                  <p className="text-3xl font-black text-slate-900 leading-none mb-1">{value}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 bg-slate-100/50 p-1.5 rounded-2xl w-fit border border-slate-200/50">
            {TYPES.map(t => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${filter === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Task Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(visit => (
              <div key={visit._id} className="group rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col gap-5">
                <div className="flex items-start justify-between">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${typeColors[visit.visitType] || 'bg-slate-100 text-slate-600'}`}>{visit.visitType || 'Visit'}</span>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${statusStyle[visit.status] || 'bg-slate-100 text-slate-600'}`}>{visit.status}</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors">{visit.purpose || 'Field Visit'}</h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-blue-400" />
                    <span className="truncate">{visit.locationName || 'Unknown Location'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 border border-white">
                      {visit.assignedTo?.name?.charAt(0) || '?'}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{visit.assignedTo?.name || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{visit.scheduledDate ? new Date(visit.scheduledDate).toLocaleDateString() : 'TBD'}</span>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed rounded-[2.5rem] bg-slate-50/50">
                <Truck className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Mission Control: No Tasks Found</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default OperationsDashboard;
