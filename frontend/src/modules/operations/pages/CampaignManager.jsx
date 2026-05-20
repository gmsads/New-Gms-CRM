import React, { useState } from 'react';
import { Search, Plus, Megaphone, MoreVertical, RefreshCw, XCircle, Calendar, Target } from 'lucide-react';
import useApi from '../../../hooks/useApi';

const TYPES = ['SOCIAL_MEDIA','GOOGLE_ADS','EMAIL','OUTDOOR','INFLUENCER','OTHER'];
const STATUSES = ['DRAFT','ACTIVE','PAUSED','COMPLETED','CANCELLED'];

const statusStyle = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  DRAFT: 'bg-slate-50 text-slate-700 border-slate-100',
  PAUSED: 'bg-amber-50 text-amber-700 border-amber-100',
  COMPLETED: 'bg-blue-50 text-blue-700 border-blue-100',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-100',
};

const CampaignManager = () => {
  const { data, loading, error, refetch, request } = useApi('/campaigns');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:'', type:'', budget:'', startDate:'', endDate:'', status:'ACTIVE', description:'' });

  const campaigns = data?.campaigns || data || [];
  const filtered = campaigns.filter(c => (c.name||'').toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await request('POST', '/campaigns', { ...form, budget: Number(form.budget) || 0 });
      setShowAdd(false);
      setForm({ name:'', type:'', budget:'', startDate:'', endDate:'', status:'ACTIVE', description:'' });
      refetch();
    } catch(err) { console.error(err); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Marketing Campaigns</h1>
          <p className="text-sm font-semibold text-slate-500">Orchestrate and monitor high-impact advertising initiatives.</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="h-11 px-6 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-600 shadow-lg shadow-slate-200 transition-all active:scale-95 flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Campaign
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
           <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
              <input type="search" placeholder="Search campaigns..." value={search} onChange={e=>setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none focus:bg-white focus:border-blue-600 transition-all" />
           </div>
           <button onClick={refetch} className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100">
             <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
           </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <tr>{['Campaign','Type','Budget Allocation','Execution Window','Status',''].map(h=><th key={h} className="px-8 py-5">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(c => (
                <tr key={c._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{c.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[200px]">{c.description || 'No description provided'}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-lg uppercase tracking-widest">{(c.type||'—').replace(/_/g,' ')}</span>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-900">{c.budget ? `₹${Number(c.budget).toLocaleString()}` : '—'}</td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Start: {c.startDate ? new Date(c.startDate).toLocaleDateString() : 'TBD'}</span>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">End: {c.endDate ? new Date(c.endDate).toLocaleDateString() : 'TBD'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${statusStyle[c.status] || 'bg-slate-100 text-slate-600'}`}>{c.status}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-slate-300 hover:text-slate-900"><MoreVertical className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <Megaphone className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Silence. No Active Campaigns Found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
               <div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Initiate Campaign</h2>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Configure your marketing objective</p>
               </div>
               <button onClick={()=>setShowAdd(false)} className="text-slate-300 hover:text-slate-900"><XCircle className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-10 space-y-6">
               <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Campaign Title</label>
                        <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-bold outline-none focus:bg-white focus:border-blue-600 transition-all shadow-inner" />
                     </div>
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Strategy Type</label>
                        <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-5 text-xs font-black uppercase outline-none focus:border-blue-600">
                           <option value="">Select strategy...</option>
                           {TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Target Budget (₹)</label>
                        <input type="number" value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})} className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-bold outline-none focus:bg-white focus:border-blue-600 transition-all shadow-inner" />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Launch Date</label>
                        <input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-bold outline-none focus:bg-white focus:border-blue-600 transition-all shadow-inner" />
                     </div>
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Completion Date</label>
                        <input type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-bold outline-none focus:bg-white focus:border-blue-600 transition-all shadow-inner" />
                     </div>
                  </div>
                  <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Brief Description</label>
                     <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full h-24 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium outline-none focus:bg-white focus:border-blue-600 transition-all shadow-inner resize-none" />
                  </div>
               </div>
               <div className="pt-4">
                  <button type="submit" className="w-full h-14 rounded-[1.5rem] bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all active:scale-[0.98]">Deploy Campaign</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignManager;
