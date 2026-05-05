import React, { useState } from 'react';
import {
  Phone, MessageCircle, Plus, Search, Filter,
  MoreVertical, ChevronUp, ChevronDown, Calendar, FileText, Trash2, Printer, Edit, IndianRupee
} from 'lucide-react';
// No mock data — real data comes via props from API


const STAGE_COLORS = {
  Lead: 'bg-gray-100 text-gray-700',
  Prospect: 'bg-blue-100 text-blue-700',
  'Follow-up': 'bg-amber-100 text-amber-700',
  Appointment: 'bg-purple-100 text-purple-700',
  Quotation: 'bg-indigo-100 text-indigo-700',
  Won: 'bg-green-100 text-green-700',
  Lost: 'bg-red-100 text-red-700',
};

const PRIORITY_COLORS = {
  Hot: 'bg-red-500',
  Warm: 'bg-orange-400',
  Cold: 'bg-blue-400',
};

const PRIORITY_BADGE = {
  Hot: 'bg-red-100 text-red-700 border border-red-200',
  Warm: 'bg-orange-100 text-orange-700 border border-orange-200',
  Cold: 'bg-blue-100 text-blue-700 border border-blue-200',
};

export const ProspectTable = ({ prospects = [], sortByFollowUp = false, onWhatsApp, onInteract, onCreateOrder, onEdit, onDelete, onBrochure, onQuotation, onAppointment, onUpdateStage, onAddRemark }) => {

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All Months');
  const [sortKey, setSortKey] = useState('lastInteraction');
  const [openMenu, setOpenMenu] = useState(null);
  const [openStatusMenu, setOpenStatusMenu] = useState(null);

  const months = ['All Months', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const filteredAndSorted = prospects
    .filter(p => {
      const matchSearch = !search || [p.name, p.company, p.phone].some(v => v?.toLowerCase().includes(search.toLowerCase()));
      const matchStage = stageFilter === 'All' || p.source === stageFilter;
      
      let matchMonth = true;
      if (monthFilter !== 'All Months') {
        const pMonth = new Date(p.createdAt || p.updatedAt).toLocaleString('default', { month: 'long' });
        matchMonth = pMonth === monthFilter;
      }
      
      return matchSearch && matchStage && matchMonth;
    })
    .sort((a, b) => {
      const order = { 'In-progress': 1, 'Sale Closed': 2, 'Canceled': 3 };
      const orderA = order[a.status || 'In-progress'] || 4;
      const orderB = order[b.status || 'In-progress'] || 4;
      
      if (orderA !== orderB) return orderA - orderB;
      
      if (sortByFollowUp) {
        const dateA = a.nextFollowUpDate ? new Date(a.nextFollowUpDate) : new Date(8640000000000000);
        const dateB = b.nextFollowUpDate ? new Date(b.nextFollowUpDate) : new Date(8640000000000000);
        return dateA - dateB; // Ascending (closest date first)
      } else {
        const dateA = new Date(a.createdAt || a.updatedAt || 0);
        const dateB = new Date(b.createdAt || b.updatedAt || 0);
        return dateB - dateA;
      }
    });

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <div className="rounded-xl border bg-white shadow-sm p-4">
        {/* Dropdowns */}
        <div className="flex gap-4 mb-4">
          <div className="flex flex-col gap-1 w-48">
            <label className="text-sm font-medium text-slate-700">Year:</label>
            <select className="h-10 rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]">
              <option>All Years</option>
              <option>2026</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 w-48">
            <label className="text-sm font-medium text-slate-700">Month:</label>
            <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="h-10 rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]">
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 w-64">
            <label className="text-sm font-medium text-slate-700">Lead Source:</label>
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="h-10 rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]">
              <option value="All">All Sources</option>
              <option value="India mart">India mart</option>
              <option value="Just dial">Just dial</option>
              <option value="Google ads">Google ads</option>
              <option value="Referral">Referral</option>
              <option value="Website">Website</option>
              <option value="Meta (Facebook/Instagram)">Meta (Facebook/Instagram)</option>
              <option value="Walk-in">Walk-in</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mb-4">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, business, phone, location, lead source, dates, etc..."
            className="h-12 w-full rounded-full border border-slate-300 px-6 text-sm outline-none focus:border-[#003366]"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button className="flex items-center gap-2 h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:opacity-90" style={{ background: '#4caf50' }}>
            <FileText className="h-4 w-4" /> Export to Excel
          </button>
          <button className="flex items-center gap-2 h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:opacity-90" style={{ background: '#00acc1' }}>
            <Printer className="h-4 w-4" /> Print Report
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              {[
                { name: 'Client', sticky: 0, width: 220 }, 
                { name: 'Created Date' }, 
                { name: 'Requirement' }, 
                { name: 'Source' }, 
                { name: 'Budget' }, 
                { name: 'Last Contact' }, 
                { name: 'Next Follow-up' }, 
                { name: 'Status' }, 
                { name: 'Remark' }, 
                { name: 'Actions' }
              ].map(h => (
                <th key={h.name} className={`px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap bg-slate-50 border-b border-slate-200 ${h.sticky !== undefined ? 'sticky z-20 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]' : ''}`} style={h.sticky !== undefined ? { left: h.sticky, minWidth: h.width, maxWidth: h.width } : {}}>
                  {h.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredAndSorted.length === 0 ? (
            <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground text-sm">
              {prospects.length === 0 ? '🎯 No prospects yet. Use the + button to add your first lead.' : 'No prospects match your filters.'}
            </td></tr>
          ) : filteredAndSorted.map((p, idx) => {
            
            // Color logic for Follow-up
            let rowColor = "bg-white hover:bg-slate-50"; // default
            if (p.nextFollowUpDate) {
              const fDate = new Date(p.nextFollowUpDate).setHours(0,0,0,0);
              const today = new Date().setHours(0,0,0,0);
              if (p.status === 'Canceled') {
                rowColor = "bg-slate-50 hover:bg-slate-100";
              } else if (p.status === 'Sale Closed') {
                rowColor = "bg-emerald-50 hover:bg-emerald-100"; 
              } else if (fDate < today) {
                rowColor = "bg-red-50 hover:bg-red-100"; // missed / not updated (red)
              } else if (fDate === today) {
                rowColor = "bg-blue-50 hover:bg-blue-100"; // due today (blue)
              }
            }
            
            const dotColor = p.status === 'Canceled' ? 'bg-red-500' : p.status === 'Sale Closed' ? 'bg-emerald-500' : 'bg-blue-500';

            return (
            <tr key={p._id || p.id || idx} className={`${rowColor} transition-colors group`}>

                {/* Client */}
                <td className="px-4 py-3 whitespace-nowrap sticky left-0 z-10 bg-inherit shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]" style={{ minWidth: 220, maxWidth: 220 }}>
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-8 w-8 shrink-0">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#1e3a8a' }}>
                        {p.name.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${dotColor}`} title="Follow-up Urgency" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold text-sm truncate w-full" title={p.name}>{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate w-full" title={p.company}>{p.company}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate w-full">{p.phone}</p>
                    </div>
                  </div>
                </td>
                {/* Created Date */}
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}
                </td>
                {/* Requirement / Products */}
                <td className="px-4 py-3 whitespace-nowrap max-w-[220px]">
                  {p.requirement?.service ? (
                    <div className="flex flex-wrap gap-1">
                      {p.requirement.service.split(', ').map((prod, i) => (
                        <span key={i} className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-semibold">{prod}</span>
                      ))}
                      {p.requirement.notes && (
                        <span className="text-[10px] text-muted-foreground ml-1 truncate max-w-[80px]" title={p.requirement.notes}>
                          ({p.requirement.notes})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground truncate block" title={p.requirement?.notes || (typeof p.requirement === 'string' ? p.requirement : '')}>
                      {p.requirement?.notes || (typeof p.requirement === 'string' ? p.requirement : '-')}
                    </span>
                  )}
                </td>
                {/* Source */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="rounded-full bg-slate-100 text-slate-700 text-xs px-2 py-0.5 font-medium">{p.source}</span>
                </td>
                {/* Budget */}
                <td className="px-4 py-3 text-xs font-semibold whitespace-nowrap">{p.requirement?.budget || p.budget || '-'}</td>
                {/* Last Contact / History */}
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {p.interactions && p.interactions.length > 0 ? (
                    <div className="flex flex-col gap-1 max-h-16 overflow-y-auto pr-1">
                      {p.interactions.slice().reverse().map((i, idx) => (
                        <div key={idx} className="flex gap-1.5 border-b border-slate-100 pb-1 mb-1 last:border-0 last:mb-0 last:pb-0">
                          <span className="font-semibold text-[10px] shrink-0 text-slate-500">{new Date(i.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}:</span>
                          <span className="text-[10px] truncate max-w-[140px]" title={i.notes}>{i.notes}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span>{p.lastInteraction ? new Date(p.lastInteraction).toLocaleDateString() : '-'}</span>
                  )}
                </td>
                {/* Next Follow-up */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-xs font-medium ${p.nextFollowUpDate && new Date(p.nextFollowUpDate) <= new Date() ? 'text-red-600 font-bold' : 'text-muted-foreground'}`}>
                    {p.nextFollowUpDate ? new Date(p.nextFollowUpDate).toLocaleDateString() : '-'}
                  </span>
                </td>
                {/* Status (Lifecycle) */}
                <td className="px-4 py-3 whitespace-nowrap relative">
                  <button 
                    onClick={() => setOpenStatusMenu(openStatusMenu === (p._id || p.id) ? null : (p._id || p.id))}
                    className={`rounded-full px-3 py-1 flex items-center justify-between min-w-[110px] text-xs font-bold outline-none cursor-pointer border shadow-sm transition-colors ${p.status === 'Canceled' ? 'bg-red-50 text-red-700 border-red-200' : p.status === 'Sale Closed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}
                  >
                    <span>{p.status || 'In-progress'}</span>
                    <span className="text-[9px] opacity-60 ml-2">▼</span>
                  </button>
                  
                  {openStatusMenu === (p._id || p.id) && (
                    <div className="absolute top-10 right-0 mt-1 w-36 bg-white rounded-lg shadow-xl border border-slate-200 z-[99] overflow-hidden py-1" onMouseLeave={() => setOpenStatusMenu(null)}>
                      {['In-progress', 'Canceled', 'Sale Closed'].map(s => {
                        let colorClass = 'text-slate-600 hover:bg-slate-50';
                        let dotColor = 'bg-slate-300';
                        if (s === 'In-progress') { colorClass = 'text-blue-700 hover:bg-blue-50'; dotColor = 'bg-blue-500'; }
                        else if (s === 'Canceled') { colorClass = 'text-red-700 hover:bg-red-50'; dotColor = 'bg-red-500'; }
                        else if (s === 'Sale Closed') { colorClass = 'text-emerald-700 hover:bg-emerald-50'; dotColor = 'bg-emerald-500'; }
                        
                        return (
                          <div 
                            key={s}
                            onClick={() => {
                              setOpenStatusMenu(null);
                              onUpdateStage && onUpdateStage(p._id || p.id, s, 'status', p);
                            }}
                            className={`px-3 py-2 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-2 ${colorClass} ${p.status === s ? 'bg-slate-50 border-l-2 border-slate-300' : 'border-l-2 border-transparent'}`}
                          >
                            <span className={`w-2 h-2 rounded-full shadow-sm ${dotColor}`}></span>
                            {s}
                            {p.status === s && <span className="ml-auto text-[10px] opacity-70">✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </td>
                {/* Remark */}
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate" title={p.lastInteractionNote}>{p.lastInteractionNote || p.cancelReason || '-'}</td>
                {/* Actions */}
                {/* Actions (Horizontal) */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    {/* Call & WhatsApp */}
                    <button onClick={() => window.location.href = `tel:${p.phone}`} title="Call Prospect" className="h-7 w-7 rounded border border-blue-200 bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors shadow-sm">
                      <Phone className="h-3.5 w-3.5 text-blue-700" />
                    </button>
                    <button onClick={() => window.open(`https://wa.me/${p.phone?.replace(/\\D/g, '')}`, '_blank')} title="WhatsApp Prospect" className="h-7 w-7 rounded border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors shadow-sm">
                      <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                    </button>
                    
                    {/* Brochure */}
                    <div className="relative group">
                      <button onClick={() => onBrochure && onBrochure(p)} title="Send Brochure" className={`h-7 px-2 rounded border flex items-center gap-1 text-xs font-semibold transition-colors shadow-sm ${p.whatsappActions?.some(a => a.action === 'Brochure') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
                        <FileText className="h-3.5 w-3.5" /> 
                        {p.whatsappActions?.some(a => a.action === 'Brochure') ? 'Sent ✓' : 'Brochure'}
                      </button>
                    </div>

                    {/* Quotation */}
                    <div className="relative group">
                      <button onClick={() => onQuotation && onQuotation(p)} title="Send Quotation" className={`h-7 px-2 rounded border flex items-center gap-1 text-xs font-semibold transition-colors shadow-sm ${p.whatsappActions?.some(a => a.action === 'Quotation') ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
                        <IndianRupee className="h-3.5 w-3.5" /> 
                        {p.whatsappActions?.some(a => a.action === 'Quotation') ? 'Quoted ✓' : 'Quote'}
                      </button>
                    </div>

                    {/* Appointment */}
                    <button onClick={() => onAppointment && onAppointment(p)} title="Schedule Appointment" className="h-7 px-2 rounded border border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-1 text-xs font-semibold text-purple-700 transition-colors shadow-sm">
                      <Calendar className="h-3.5 w-3.5" /> Appt
                    </button>

                    {/* Create Order */}
                    <button onClick={() => onCreateOrder && onCreateOrder(p)} title="Create Order" className="h-7 px-2 rounded border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1 text-xs font-bold text-emerald-700 transition-colors shadow-sm ml-1">
                      <Plus className="h-3.5 w-3.5" /> Order
                    </button>

                    {/* Edit/Delete */}
                    <button onClick={() => onEdit && onEdit(p)} title="Edit Prospect" className="h-7 w-7 rounded hover:bg-slate-100 flex items-center justify-center transition-colors ml-2">
                      <Edit className="h-3.5 w-3.5 text-slate-500" />
                    </button>
                    <button onClick={() => onDelete && onDelete(p._id || p.id)} title="Remove" className="h-7 w-7 rounded hover:bg-red-50 flex items-center justify-center transition-colors">
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
            {filteredAndSorted.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground text-sm">No prospects found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="flex items-center justify-between p-4 border-t bg-muted/10 text-xs text-muted-foreground">
        <span>Showing {filteredAndSorted.length} of {prospects.length} prospects</span>
        <div className="flex gap-1">
          <button className="h-7 px-2 rounded border text-xs hover:bg-muted">← Prev</button>
          <button className="h-7 px-2 rounded bg-blue-600 text-white text-xs">1</button>
          <button className="h-7 px-2 rounded border text-xs hover:bg-muted">Next →</button>
        </div>
      </div>
    </div>
    </div>
  );
};
