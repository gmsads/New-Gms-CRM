import React, { useState } from 'react';
import { Search, Plus, Megaphone, MoreVertical } from 'lucide-react';
import useApi from '../hooks/useApi';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';

const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const BLANK = { name:'', clientId:'', budget:'', startDate:'', endDate:'', status:'ACTIVE', type:'', description:'' };
const TYPES = ['SOCIAL_MEDIA','GOOGLE_ADS','EMAIL','OUTDOOR','INFLUENCER','OTHER'];
const STATUSES = ['DRAFT','ACTIVE','PAUSED','COMPLETED','CANCELLED'];

const AddCampaignModal = ({ open, onClose, onSaved }) => {
  const { request } = useApi();
  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await request('POST', '/campaigns', { ...form, budget: Number(form.budget) || 0 });
      setForm(BLANK); onSaved(); onClose();
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Campaign" size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Campaign Name *</label>
            <input value={form.name} onChange={e=>set('name',e.target.value)} required
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select value={form.type} onChange={e=>set('type',e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary">
              <option value="">Select type…</option>
              {TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={form.status} onChange={e=>set('status',e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary">
              {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Budget (₹)</label>
            <input type="number" value={form.budget} onChange={e=>set('budget',e.target.value)} min="0"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input type="date" value={form.startDate} onChange={e=>set('startDate',e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input type="date" value={form.endDate} onChange={e=>set('endDate',e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={2}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {loading ? 'Creating…' : 'Create Campaign'}
          </button>
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium">Cancel</button>
        </div>
      </form>
    </Modal>
  );
};

const Campaigns = () => {
  const { data, loading, error, refetch } = useApi('/campaigns');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const campaigns = data?.campaigns || data || [];
  const filtered = campaigns.filter(c => (c.name||'').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">Track and manage all marketing campaigns.</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> New Campaign
        </button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/10">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input type="search" placeholder="Search campaigns…" value={search} onChange={e=>setSearch(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm outline-none focus:border-primary" />
          </div>
        </div>

        {loading ? <Spinner /> : error ? (
          <div className="p-6 text-sm text-red-500">{error}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Megaphone} title="No campaigns yet"
            description="Create your first campaign to start tracking."
            action={<button onClick={()=>setShowAdd(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">New Campaign</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/50 border-b">
                <tr>{['Campaign','Type','Budget','Dates','Status',''].map(h=><th key={h} className="px-5 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(c => (
                  <tr key={c._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-medium">{c.name}</td>
                    <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{(c.type||'—').replace(/_/g,' ')}</td>
                    <td className="px-5 py-3">{c.budget ? `₹${Number(c.budget).toLocaleString()}` : '—'}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {c.startDate ? new Date(c.startDate).toLocaleDateString() : '—'} → {c.endDate ? new Date(c.endDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3"><Badge value={c.status} /></td>
                    <td className="px-5 py-3"><button className="text-muted-foreground hover:text-foreground"><MoreVertical className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddCampaignModal open={showAdd} onClose={()=>setShowAdd(false)} onSaved={refetch} />
    </div>
  );
};

export default Campaigns;
