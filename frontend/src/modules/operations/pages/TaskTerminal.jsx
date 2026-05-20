import React, { useState } from 'react';
import { Search, Plus, CheckSquare, MoreVertical, RefreshCw, XCircle, Clock, AlertCircle } from 'lucide-react';
import useApi from '../../../hooks/useApi';

const PRIORITIES = ['LOW','MEDIUM','HIGH','URGENT'];
const STATUSES   = ['TODO','IN_PROGRESS','DONE','CANCELLED'];

const PRIORITY_THEME = { 
  LOW:'bg-blue-50 text-blue-600 border-blue-100', 
  MEDIUM:'bg-amber-50 text-amber-600 border-amber-100', 
  HIGH:'bg-orange-50 text-orange-600 border-orange-100', 
  URGENT:'bg-rose-50 text-rose-600 border-rose-100' 
};

const TaskTerminal = () => {
  const { data, loading, error, refetch, request } = useApi('/tasks');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title:'', description:'', priority:'MEDIUM', status:'TODO', dueDate:'' });

  const tasks = data?.tasks || data || [];
  const filtered = tasks.filter(t => (t.title||'').toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await request('POST', '/tasks', form);
      setShowAdd(false);
      setForm({ title:'', description:'', priority:'MEDIUM', status:'TODO', dueDate:'' });
      refetch();
    } catch(err) { console.error(err); }
  };

  const markDone = async (id) => {
    try { await request('PATCH', `/tasks/${id}`, { status: 'DONE' }); refetch(); }
    catch(e) { console.error(e); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mission Control: Tasks</h1>
          <p className="text-sm font-semibold text-slate-500">Coordinate and execute operational objectives.</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="h-11 px-6 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-600 shadow-lg shadow-slate-200 transition-all active:scale-95 flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Objective
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
           <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
              <input type="search" placeholder="Search objectives..." value={search} onChange={e=>setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none focus:bg-white focus:border-blue-600 transition-all" />
           </div>
           <button onClick={refetch} className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100">
             <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
           </button>
        </div>

        <div className="divide-y divide-slate-50">
          {filtered.map(t => (
            <div key={t._id} className="flex items-center gap-6 px-8 py-6 hover:bg-slate-50/50 transition-colors group">
              <button onClick={() => t.status !== 'DONE' && markDone(t._id)}
                className={`h-6 w-6 shrink-0 rounded-lg border-2 flex items-center justify-center transition-all ${t.status === 'DONE' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-50'}`}>
                {t.status === 'DONE' && <CheckSquare className="h-4 w-4 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-base font-black tracking-tight transition-all ${t.status === 'DONE' ? 'line-through text-slate-300' : 'text-slate-900 group-hover:text-blue-600'}`}>{t.title}</p>
                {t.description && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1 truncate">{t.description}</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${PRIORITY_THEME[t.priority] || 'bg-slate-50 text-slate-600'}`}>{t.priority}</span>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'TBD'}</span>
                <button className="text-slate-200 hover:text-slate-900 transition-colors"><MoreVertical className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="py-20 text-center">
              <CheckSquare className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Operational Silence. No Tasks.</p>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
               <div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">New Objective</h2>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Assign task parameters</p>
               </div>
               <button onClick={()=>setShowAdd(false)} className="text-slate-300 hover:text-slate-900"><XCircle className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-10 space-y-6">
               <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Title</label>
                    <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-bold outline-none focus:bg-white focus:border-blue-600 transition-all shadow-inner" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Priority</label>
                        <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-5 text-xs font-black uppercase outline-none focus:border-blue-600">
                           {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Target Date</label>
                        <input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-bold outline-none focus:bg-white focus:border-blue-600 transition-all shadow-inner" />
                     </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Description</label>
                    <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full h-24 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium outline-none focus:bg-white focus:border-blue-600 transition-all shadow-inner resize-none" />
                  </div>
               </div>
               <div className="pt-4">
                  <button type="submit" className="w-full h-14 rounded-[1.5rem] bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all active:scale-[0.98]">Authorize Task</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTerminal;
