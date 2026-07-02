import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import leadApi from '../../../services/lead.api';
import { Search, Filter, Download, Plus, Trash2, Eye, RefreshCw, ChevronLeft, ChevronRight, Users } from 'lucide-react';

/**
 * LeadPool.jsx
 * Universal Lead Repository Table
 * Stores every lead regardless of source.
 */
export default function LeadPool() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [distMethod, setDistMethod] = useState('Round Robin');
  const [targetUser, setTargetUser] = useState('');

  // New Lead Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [formData, setFormData] = useState({ contactPerson: '', companyName: '', phone: '', email: '', source: 'Manual Entry', priority: 'Medium' });

  useEffect(() => {
    if (!user) return;
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/employees`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(r => r.json())
      .then(res => {
        const empList = res.data || res.employees || [];
        if (Array.isArray(empList)) {
          setUsers(empList);
          if (empList.length > 0) setTargetUser(empList[0]._id);
        }
      })
      .catch(console.error);
  }, [user]);

  const handleDistributeSelected = () => {
    if (selectedIds.length === 0) return;
    leadApi.distributePoolLeads({
      leadIds: selectedIds,
      method: distMethod,
      singleUserId: distMethod === 'Assign To Single Employee' ? targetUser : undefined
    }, user.token)
      .then(res => {
        if (res.success) {
          alert(res.message || 'Leads distributed successfully.');
          setSelectedIds([]);
          fetchLeads(1, false);
        } else {
          alert(res.message || 'Failed to distribute leads.');
        }
      })
      .catch(err => alert('Error distributing leads: ' + err.message));
  };

  const fetchLeads = (pg = 1, isAppend = false) => {
    if (!user) return;
    if (isAppend) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    const params = { page: pg, limit: 25, search, status: statusFilter, source: sourceFilter };
    leadApi.list(params, user.token)
      .then(res => {
        if (res.success) {
          if (isAppend) {
            setLeads(prev => {
              const existingIds = new Set(prev.map(l => l._id));
              const newLeads = (res.leads || []).filter(l => !existingIds.has(l._id));
              return [...prev, ...newLeads];
            });
          } else {
            setLeads(res.leads || []);
          }
          if (res.pagination) setPagination(res.pagination);
        }
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  };

  useEffect(() => {
    fetchLeads(1, false);
  }, [user, statusFilter, sourceFilter]);

  // Scroll trigger observer for infinite scroll batches (0-25 -> 25-50 -> 50-75)
  useEffect(() => {
    if (loading || loadingMore || !user) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && pagination.page < pagination.pages) {
        fetchLeads(pagination.page + 1, true);
      }
    }, { threshold: 0.1 });

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }
    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [loading, loadingMore, pagination.page, pagination.pages, user]);

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

      {/* Manual Distribution Toolbar for Selected Leads */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <Users className="h-4 w-4" />
            <span>{selectedIds.length} lead(s) selected for manual distribution</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <select
              value={distMethod}
              onChange={e => setDistMethod(e.target.value)}
              className="bg-background border rounded-lg px-2.5 py-1.5 font-semibold"
            >
              <option value="Round Robin">Round Robin</option>
              <option value="Assign To Single Employee">Assign To Single Employee</option>
            </select>
            {distMethod === 'Assign To Single Employee' && (
              <select
                value={targetUser}
                onChange={e => setTargetUser(e.target.value)}
                className="bg-background border rounded-lg px-2.5 py-1.5 font-semibold"
              >
                {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
              </select>
            )}
            <button
              onClick={handleDistributeSelected}
              className="px-4 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg shadow hover:bg-primary/90"
            >
              Distribute Leads
            </button>
          </div>
        </div>
      )}

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

        {/* Scroll Trigger Sentinel */}
        <div ref={sentinelRef} className="py-2 w-full flex items-center justify-center bg-transparent">
          {loadingMore && <div className="text-xs text-primary font-bold animate-pulse py-2">⚡ Scroll Trigger: Loading next batch ({pagination.page * 25} to {Math.min((pagination.page + 1) * 25, pagination.total)})...</div>}
        </div>

        {/* Pagination & Range Count Footer */}
        <div className="p-3.5 bg-muted/30 border-t flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground bg-primary/10 text-primary px-3 py-1 rounded-lg">
              Showing {leads.length === 0 ? 0 : 0} to {leads.length} of {pagination.total} entries
            </span>
            {pagination.page >= 1 && (
              <span className="text-[11px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-semibold">
                Latest Batch: {(pagination.page - 1) * 25} to {Math.min(pagination.page * 25, pagination.total)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {pagination.page < pagination.pages && (
              <button
                onClick={() => fetchLeads(pagination.page + 1, true)}
                disabled={loadingMore}
                className="px-3 py-1 bg-primary text-primary-foreground font-bold rounded-lg shadow hover:bg-primary/90 text-xs disabled:opacity-50 flex items-center gap-1"
              >
                <span>{loadingMore ? 'Loading Batch...' : `Load Next Batch (${pagination.page * 25} to ${Math.min((pagination.page + 1) * 25, pagination.total)})`}</span>
              </button>
            )}
            <div className="flex items-center gap-1 border-l pl-2">
              <button disabled={pagination.page <= 1} onClick={() => fetchLeads(pagination.page - 1, false)} className="p-1.5 border rounded hover:bg-muted disabled:opacity-40" title="Previous Page"><ChevronLeft className="h-4 w-4" /></button>
              <span className="px-2 text-muted-foreground font-medium">Page {pagination.page} / {pagination.pages}</span>
              <button disabled={pagination.page >= pagination.pages} onClick={() => fetchLeads(pagination.page + 1, false)} className="p-1.5 border rounded hover:bg-muted disabled:opacity-40" title="Next Page"><ChevronRight className="h-4 w-4" /></button>
            </div>
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
