import React, { useState } from 'react';
import { MapPin, CheckCircle2, Clock, Plus, Truck, AlertCircle } from 'lucide-react';
import useApi from '../hooks/useApi';
import EmptyState from '../components/ui/EmptyState';

const statusStyle = {
  Completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const priorityStyle = {
  High: 'text-red-500', Medium: 'text-yellow-500', Low: 'text-blue-500',
};

const typeColors = {
  Installation: 'bg-purple-100 text-purple-700', Survey: 'bg-cyan-100 text-cyan-700',
  Maintenance: 'bg-orange-100 text-orange-700', Shoot: 'bg-pink-100 text-pink-700', Visit: 'bg-indigo-100 text-indigo-700',
};

const TYPES = ['All', 'Installation', 'Survey', 'Maintenance', 'Shoot', 'Visit'];

const Field = () => {
  const { data, loading, error, refetch } = useApi('/visits');
  const [filter, setFilter] = useState('All');

  const visits = data?.data || [];
  const filtered = visits.filter(v => filter === 'All' || v.visitType === filter);
  const completedCount = visits.filter(v => v.status === 'Completed').length;
  const inProgressCount = visits.filter(v => v.status === 'In Progress').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Field Operations</h1>
          <p className="text-muted-foreground">Track on-ground campaign activities and site visits.</p>
        </div>
        <button onClick={() => refetch()} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="mr-2 h-4 w-4" /> Add Field Task
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : error ? (
        <div className="p-6 text-sm text-red-500 bg-red-50 rounded-xl border border-red-200">Error: {error}</div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid gap-4 grid-cols-3">
            {[
              { label: 'Total Tasks', value: visits.length, icon: Truck, color: 'bg-primary/10 text-primary' },
              { label: 'In Progress', value: inProgressCount, icon: Clock, color: 'bg-blue-100 text-blue-600' },
              { label: 'Completed', value: completedCount, icon: CheckCircle2, color: 'bg-green-100 text-green-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl border bg-card p-5 shadow-sm flex items-center gap-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${color}`}><Icon className="h-5 w-5" /></div>
                <div><p className="text-2xl font-bold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>
              </div>
            ))}
          </div>

          {/* Type Filters */}
          <div className="flex gap-2 flex-wrap">
            {TYPES.map(t => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${filter === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted border-input text-muted-foreground'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Task Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(visit => (
              <div key={visit._id} className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeColors[visit.visitType] || 'bg-muted text-muted-foreground'}`}>{visit.visitType || 'Visit'}</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[visit.status] || 'bg-muted text-muted-foreground'}`}>{visit.status}</span>
                </div>
                <div>
                  <h3 className="font-semibold leading-snug">{visit.purpose || 'Field Visit'}</h3>
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />{visit.locationName || 'Unknown Location'}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm border-t pt-3">
                  <span className="text-muted-foreground">{visit.assignedTo?.name || 'Unassigned'}</span>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{visit.scheduledDate ? new Date(visit.scheduledDate).toLocaleDateString() : 'No date'}</span>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full">
                <EmptyState icon={MapPin} title="No tasks found" description="Try a different filter or check back later." />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Field;

