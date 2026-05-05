import React, { useState } from 'react';
import { MapPin, CheckCircle2, Clock, Plus, Truck, AlertCircle } from 'lucide-react';

const fieldTasks = [
  { id: 1, title: 'Install Hoarding – Acme Corp', location: 'Whitefield, Bengaluru', assignee: 'Dan Patel', status: 'Completed', due: 'Apr 24', priority: 'High', type: 'Installation' },
  { id: 2, title: 'Site Survey – Global Tech', location: 'Electronic City, Bengaluru', assignee: 'Raj Kumar', status: 'In Progress', due: 'Today', priority: 'High', type: 'Survey' },
  { id: 3, title: 'Standee Placement – Wayne Ent', location: 'MG Road, Bengaluru', assignee: 'Suresh R.', status: 'Pending', due: 'Tomorrow', priority: 'Medium', type: 'Installation' },
  { id: 4, title: 'Billboard Maintenance – Acme', location: 'Indiranagar, Bengaluru', assignee: 'Dan Patel', status: 'Pending', due: 'Apr 29', priority: 'Low', type: 'Maintenance' },
  { id: 5, title: 'Campaign Shoot – Stark Ind.', location: 'Koramangala, Bengaluru', assignee: 'Anand S.', status: 'Completed', due: 'Apr 22', priority: 'High', type: 'Shoot' },
  { id: 6, title: 'Client Site Visit – Umbrella', location: 'HSR Layout, Bengaluru', assignee: 'Raj Kumar', status: 'Pending', due: 'May 2', priority: 'Medium', type: 'Visit' },
];

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
  const [filter, setFilter] = useState('All');

  const filtered = fieldTasks.filter(t => filter === 'All' || t.type === filter);
  const completedCount = fieldTasks.filter(t => t.status === 'Completed').length;
  const inProgressCount = fieldTasks.filter(t => t.status === 'In Progress').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Field Operations</h1>
          <p className="text-muted-foreground">Track on-ground campaign activities and site visits.</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="mr-2 h-4 w-4" /> Add Field Task
        </button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 grid-cols-3">
        {[
          { label: 'Total Tasks', value: fieldTasks.length, icon: Truck, color: 'bg-primary/10 text-primary' },
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
        {filtered.map(task => (
          <div key={task.id} className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeColors[task.type] || 'bg-muted text-muted-foreground'}`}>{task.type}</span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[task.status]}`}>{task.status}</span>
            </div>
            <div>
              <h3 className="font-semibold leading-snug">{task.title}</h3>
              <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />{task.location}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm border-t pt-3">
              <span className="text-muted-foreground">{task.assignee}</span>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span className={task.due === 'Today' ? 'text-red-500 font-medium' : ''}>{task.due}</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 py-16 text-center text-muted-foreground">No tasks for this filter.</div>
        )}
      </div>
    </div>
  );
};

export default Field;
