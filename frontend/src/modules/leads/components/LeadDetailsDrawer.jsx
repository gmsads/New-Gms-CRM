import React, { useState } from 'react';
import { X, Phone, MessageCircle, Edit, ArrowUpRight, Navigation, Camera, CheckSquare, Clock, FileText, Calendar, Paperclip, Activity, ShieldAlert } from 'lucide-react';

/**
 * LeadDetailsDrawer.jsx
 * Side Drawer for viewing deep audit trail, timeline, and executive field actions.
 */
export default function LeadDetailsDrawer({ isOpen, lead, onClose, onCall, onWhatsApp, onConvert, userRole, onSaveFieldNotes }) {
  const [activeTab, setActiveTab] = useState('details');
  const [visitNotes, setVisitNotes] = useState('');
  const [visitStatus, setVisitStatus] = useState('Completed');

  if (!isOpen || !lead) return null;

  const isFieldExec = userRole === 'FIELD_EXEC';

  const tabs = [
    { id: 'details', label: 'Overview & Details' },
    { id: 'timeline', label: `Timeline (${lead.timeline?.length || 0})` },
    { id: 'history', label: 'Call History & QA' },
    { id: 'remarks', label: 'Remarks & Followups' },
  ];

  const handleNavigate = () => {
    const query = `${lead.address || ''} ${lead.city || ''} ${lead.state || ''}`.trim() || lead.companyName;
    window.open(`https://maps.google.com/?q=${encodeURIComponent(query)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-card border-l border-border shadow-2xl flex flex-col text-xs animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="p-5 border-b bg-muted/20 flex items-center justify-between">
            <div className="space-y-1 truncate pr-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded">{lead.leadNumber}</span>
                <span className="text-[10px] font-bold text-primary border border-primary/30 bg-primary/5 px-2 py-0.5 rounded-full">{lead.priority || 'Medium'}</span>
              </div>
              <h2 className="text-lg font-extrabold text-foreground truncate mt-1">{lead.companyName || lead.contactPerson}</h2>
              <p className="text-muted-foreground font-medium">{lead.contactPerson} • <span className="font-mono text-foreground">{lead.phone}</span></p>
            </div>

            <button onClick={onClose} className="p-2 rounded-xl border hover:bg-muted text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Action Ribbon Buttons */}
          <div className="p-3 bg-card border-b flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button onClick={() => onCall(lead)} className="px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 font-bold hover:bg-emerald-500 hover:text-white flex items-center gap-1.5 shrink-0 transition-all">
              <Phone className="h-3.5 w-3.5" /> Call Customer
            </button>

            <button onClick={() => onWhatsApp(lead)} className="px-3.5 py-2 rounded-xl bg-teal-500/10 text-teal-500 font-bold hover:bg-teal-500 hover:text-white flex items-center gap-1.5 shrink-0 transition-all">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </button>

            {isFieldExec && (
              <button onClick={handleNavigate} className="px-3.5 py-2 rounded-xl bg-blue-500/10 text-blue-500 font-bold hover:bg-blue-500 hover:text-white flex items-center gap-1.5 shrink-0 transition-all">
                <Navigation className="h-3.5 w-3.5" /> Navigate
              </button>
            )}

            {lead.currentStatus !== 'Converted' && (
              <button onClick={() => onConvert(lead._id)} className="px-3.5 py-2 rounded-xl bg-purple-500/10 text-purple-600 font-bold hover:bg-purple-600 hover:text-white flex items-center gap-1.5 shrink-0 transition-all ml-auto">
                <ArrowUpRight className="h-3.5 w-3.5" /> Convert to Prospect
              </button>
            )}
          </div>

          {/* Drawer Tabs */}
          <div className="flex border-b px-4 bg-muted/10">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`py-3 px-3 font-bold text-xs border-b-2 transition-all ${
                  activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Drawer Body Content */}
          <div className="p-5 overflow-y-auto flex-1 space-y-6">
            
            {activeTab === 'details' && (
              <div className="space-y-6">
                
                {/* Field Executive Specialized Meeting Box */}
                {isFieldExec && (
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 space-y-3">
                    <h4 className="font-bold text-blue-600 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Navigation className="h-3.5 w-3.5" /> Field Visit & Meeting Terminal
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-muted-foreground">Visit Disposition</label>
                        <select value={visitStatus} onChange={e => setVisitStatus(e.target.value)} className="w-full mt-1 p-2 border rounded-xl bg-background font-bold">
                          <option>Completed</option>
                          <option>Rescheduled</option>
                          <option>Customer Unavailable</option>
                          <option>Premises Closed</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button onClick={() => alert('Camera module initialized. Select photos to upload.')} className="w-full p-2 border border-dashed rounded-xl bg-background hover:bg-muted flex items-center justify-center gap-1.5 font-semibold text-muted-foreground">
                          <Camera className="h-4 w-4 text-primary" /> Upload Photos
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground">Meeting Minutes & Visit Notes</label>
                      <textarea rows={2} value={visitNotes} onChange={e => setVisitNotes(e.target.value)} placeholder="Record discussions, site observations, or customer feedback..." className="w-full mt-1 p-2 border rounded-xl bg-background text-foreground" />
                    </div>
                    <button onClick={() => { alert('✅ Field Visit Marked Complete!'); onSaveFieldNotes?.(visitStatus, visitNotes); }} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow transition-all flex items-center justify-center gap-1.5">
                      <CheckSquare className="h-4 w-4" /> Mark Visit Complete & Save Notes
                    </button>
                  </div>
                )}

                {/* Attributes Grid */}
                <div className="bg-muted/10 border rounded-2xl p-4 space-y-4">
                  <h4 className="font-bold text-foreground border-b pb-2">Customer & Enterprise Attributes</h4>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                    <div><span className="text-muted-foreground block text-[10px]">Company</span><span className="font-semibold">{lead.companyName || 'N/A'}</span></div>
                    <div><span className="text-muted-foreground block text-[10px]">Contact Person</span><span className="font-semibold">{lead.contactPerson || 'N/A'}</span></div>
                    <div><span className="text-muted-foreground block text-[10px]">Primary Mobile</span><span className="font-mono font-bold text-primary">{lead.phone}</span></div>
                    <div><span className="text-muted-foreground block text-[10px]">Alternate Mobile</span><span className="font-mono">{lead.alternatePhone || 'N/A'}</span></div>
                    <div><span className="text-muted-foreground block text-[10px]">Email</span><span>{lead.email || 'N/A'}</span></div>
                    <div><span className="text-muted-foreground block text-[10px]">Acquisition Channel</span><span className="font-bold">{lead.source || 'Manual'}</span></div>
                    <div><span className="text-muted-foreground block text-[10px]">Business Entity</span><span>{lead.businessName || 'N/A'}</span></div>
                    <div><span className="text-muted-foreground block text-[10px]">Category</span><span>{lead.businessCategory || 'N/A'}</span></div>
                    <div className="col-span-2"><span className="text-muted-foreground block text-[10px]">Location</span><span>{[lead.address, lead.city, lead.district, lead.state, lead.pincode].filter(Boolean).join(', ') || 'No Address Logged'}</span></div>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <h4 className="font-bold text-foreground">Immutable Activity Timeline</h4>
                <div className="relative border-l-2 border-primary/20 ml-3 pl-4 space-y-6 my-2">
                  {(lead.timeline || []).slice().reverse().map((tm, idx) => (
                    <div key={idx} className="relative group">
                      <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-card" />
                      <div className="bg-muted/20 border rounded-xl p-3 space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                          <span className="font-bold text-foreground">{tm.title}</span>
                          <span>{tm.timestamp ? new Date(tm.timestamp).toLocaleString() : 'Recent'}</span>
                        </div>
                        <p className="text-xs text-foreground mt-1">{tm.description}</p>
                        {tm.performedByName && <p className="text-[10px] text-muted-foreground italic">By {tm.performedByName}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <h4 className="font-bold text-foreground">Telephony Telemetry & Recordings</h4>
                <p className="text-muted-foreground">Recordings are stored safely in cloud storage compliant with telecom standards.</p>
                <div className="bg-muted/10 border rounded-xl p-4 text-center py-12 text-muted-foreground">
                  View full telephony logs and play audio streams directly from each Call card.
                </div>
              </div>
            )}

            {activeTab === 'remarks' && (
              <div className="space-y-4">
                <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-2">
                  <h4 className="font-bold">Latest Disposition Note</h4>
                  <p className="text-sm italic text-foreground bg-muted/30 p-3 rounded-xl border border-dashed">
                    "{lead.lastRemark || 'No remarks recorded yet.'}"
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
