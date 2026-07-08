import React, { useState } from 'react';
import { Search, Plus, CheckSquare, MoreVertical } from 'lucide-react';
import useApi from '../hooks/useApi';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const PRIORITIES = ['LOW','MEDIUM','HIGH','URGENT'];
const STATUSES   = ['TODO','IN_PROGRESS','DONE','CANCELLED'];
const BLANK = { title:'', description:'', priority:'MEDIUM', status:'TODO', dueDate:'' };

const AddTaskModal = ({ open, onClose, onSaved }) => {
  const { request } = useApi();
  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await request('POST', '/tasks', form);
      setForm(BLANK); onSaved(); onClose();
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Task" size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input value={form.title} onChange={e=>set('title',e.target.value)} required
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select value={form.priority} onChange={e=>set('priority',e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary">
              {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={form.status} onChange={e=>set('status',e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary">
              {STATUSES.map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input type="date" value={form.dueDate} onChange={e=>set('dueDate',e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {loading ? 'Creating…' : 'Create Task'}
          </button>
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium">Cancel</button>
        </div>
      </form>
    </Modal>
  );
};

const PRIORITY_COLOR = { LOW:'bg-blue-100 text-blue-700', MEDIUM:'bg-yellow-100 text-yellow-700', HIGH:'bg-orange-100 text-orange-700', URGENT:'bg-red-100 text-red-700' };

const Tasks = () => {
  const { data, loading, error, refetch } = useApi('/tasks');
  const { request } = useApi();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const tasks = data?.tasks || data || [];
  const filtered = tasks.filter(t => (t.title||'').toLowerCase().includes(search.toLowerCase()));

  const markDone = async (id) => {
    try { await request('PATCH', `/tasks/${id}`, { status: 'DONE' }); refetch(); }
    catch(e) { alert(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage and track your assigned tasks.</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> New Task
        </button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/10">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input type="search" placeholder="Search tasks…" value={search} onChange={e=>setSearch(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm outline-none focus:border-primary" />
          </div>
        </div>

        {loading ? <Spinner /> : error ? (
          <div className="p-6 text-sm text-red-500">{error}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={CheckSquare} title="No tasks yet"
            description="Create your first task to get started."
            action={<button onClick={()=>setShowAdd(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">New Task</button>} />
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(t => (
              <div key={t._id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                <button
                  onClick={() => t.status !== 'DONE' && markDone(t._id)}
                  className={`h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${t.status === 'DONE' ? 'bg-green-500 border-green-500' : 'border-input hover:border-primary'}`}>
                  {t.status === 'DONE' && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${t.status === 'DONE' ? 'line-through text-muted-foreground' : ''}`}>{t.title}</p>
                  {t.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {t.priority && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_COLOR[t.priority]||''}`}>{t.priority}</span>}
                  <Badge value={t.status} label={t.status?.replace('_',' ')} />
                  {t.dueDate && <span className="text-xs text-muted-foreground">{new Date(t.dueDate).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddTaskModal open={showAdd} onClose={()=>setShowAdd(false)} onSaved={refetch} />
    </div>
  );
};

export default Tasks;
