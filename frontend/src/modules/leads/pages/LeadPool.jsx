import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import leadApi from '../../../services/lead.api';
import { Search, Filter, Download, Plus, Trash2, Eye, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * LeadPool.jsx
 * Universal Lead Repository Table
 * Stores every lead regardless of source.
 */
export default function LeadPool() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // New Lead Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [formData, setFormData] = useState({ contactPerson: '', companyName: '', phone: '', email: '', source: 'Manual Entry', priority: 'Medium' });

  const fetchLeads = (pg = 1) => {
    if (!user) return;
    setLoading(true);
    const params = { page: pg, limit: 20, search, status: statusFilter, source: sourceFilter };
    leadApi.list(params, user.token)
      .then(res => {
        if (res.success) {
          setLeads(res.leads);
          setPagination(res.pagination);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads(1);
  }, [user, statusFilter, sourceFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeads(1);
  };

  const handleCreateLead = (e) => {
    e.preventDefault();
    leadApi.createManual(formData, user.token)
      .then(res => {
        if (res.success) {
          setShowNewModal(false);
          setFormData({ contactPerson: '', companyName: '', phone: '', email: '', source: 'Manual Entry', priority: 'Medium' });
          fetchLeads(1);
        }
      })
      .catch(err => alert(err.message));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(leads.map(l => l._id));
    else setSelectedIds([]);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleExportCSV = () => {
    const headers = ['Lead Number,Company,Contact Person,Phone,Email,Source,Status,Priority'];
    const rows = leads.map(l => `"${l.leadNumber}","${l.companyName || ''}","${l.contactPerson}","${l.phone}","${l.email || ''}","${l.source}","${l.currentStatus}","${l.priority}"`);
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Leads_Pool_Export_${Date.now()}.csv`; a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enterprise Lead Pool</h1>
          <p className="text-xs text-muted-foreground">Universal master repository storing acquisition data across all 12 channels.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="px-3.5 py-2 border rounded-xl text-xs font-semibold hover:bg-muted flex items-center gap-1.5">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button onClick={() => setShowNewModal(true)} className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl shadow hover:bg-primary/90 text-xs flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Manual Entry
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search company, contact, phone, email..."
              className="w-full pl-9 pr-3 py-2 bg-background border rounded-lg text-xs"
            />
          </div>
          <button type="submit" className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-xs font-semibold">Search</button>
        </form>

        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-background border rounded-lg px-2.5 py-2 text-xs font-medium">
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Interested">Interested</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="bg-background border rounded-lg px-2.5 py-2 text-xs font-medium">
            <option value="">All Sources</option>
            <option value="Excel">Excel / CSV</option>
            <option value="Facebook">Facebook Ads</option>
            <option value="Google Ads">Google Ads</option>
            <option value="Website">Website</option>
            <option value="Manual Entry">Manual Entry</option>
          </select>
        </div>
      </div>

      {/* Grid Table */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/50 border-b text-muted-foreground font-mono">
                <th className="p-3 w-10"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === leads.length && leads.length > 0} className="rounded" /></th>
                <th className="p-3">Lead #</th>
                <th className="p-3">Company & Contact</th>
                <th className="p-3">Phone & Email</th>
                <th className="p-3">Source</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
                <th className="p-3">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground animate-pulse">Loading Pool...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No leads found matching criteria.</td></tr>
              ) : (
                leads.map(ld => (
                  <tr key={ld._id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3"><input type="checkbox" checked={selectedIds.includes(ld._id)} onChange={() => toggleSelect(ld._id)} className="rounded" /></td>
                    <td className="p-3 font-mono font-bold text-primary">{ld.leadNumber}</td>
                    <td className="p-3">
                      <div className="font-bold text-foreground">{ld.companyName || ld.contactPerson}</div>
                      {ld.companyName && <div className="text-[11px] text-muted-foreground">{ld.contactPerson}</div>}
                    </td>
                    <td className="p-3 font-mono">
                      <div>{ld.phone}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[150px]">{ld.email}</div>
                    </td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded border bg-muted/40 font-medium">{ld.source}</span></td>
                    <td className="p-3"><span className="font-bold">{ld.priority}</span></td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded font-semibold bg-primary/10 text-primary">{ld.currentStatus}</span></td>
                    <td className="p-3">{ld.assignedEmployee?.name || <span className="text-muted-foreground italic">Unassigned</span>}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 bg-muted/30 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)</span>
          <div className="flex items-center gap-1">
            <button disabled={pagination.page <= 1} onClick={() => fetchLeads(pagination.page - 1)} className="p-1.5 border rounded hover:bg-muted disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <button disabled={pagination.page >= pagination.pages} onClick={() => fetchLeads(pagination.page + 1)} className="p-1.5 border rounded hover:bg-muted disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base">Create Manual Lead</h3>
            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div><label className="font-bold">Contact Person *</label><input required type="text" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} className="w-full border rounded p-2 mt-1 bg-background" /></div>
              <div><label className="font-bold">Company Name</label><input type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full border rounded p-2 mt-1 bg-background" /></div>
              <div><label className="font-bold">Phone Number *</label><input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border rounded p-2 mt-1 bg-background" /></div>
              <div><label className="font-bold">Email Address</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border rounded p-2 mt-1 bg-background" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="font-bold">Priority</label><select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full border rounded p-2 mt-1 bg-background"><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></div>
                <div><label className="font-bold">Source</label><select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full border rounded p-2 mt-1 bg-background"><option>Manual Entry</option><option>Referral</option><option>Walk-in</option></select></div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setShowNewModal(false)} className="px-4 py-2 border rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground font-bold rounded-xl shadow">Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
