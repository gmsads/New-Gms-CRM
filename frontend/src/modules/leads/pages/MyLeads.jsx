import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import leadApi from '../../../services/lead.api';
import LeadCard from '../components/LeadCard';
import AfterCallModal from '../components/AfterCallModal';
import CreateLeadModal from '../components/CreateLeadModal';
import LeadDetailsDrawer from '../components/LeadDetailsDrawer';
import { LiveSessionBar } from '../components/EnterpriseTelePanels';
import { PhoneCall, Flame, Clock, CheckCircle2, Search, Filter, RefreshCw, Zap, Plus, X, SlidersHorizontal, Users, UserCheck } from 'lucide-react';

/**
 * MyLeads.jsx — Executive "My Leads Desk"
 * Role-based Lead Workspace for Sales Executive & Field Executive.
 */
export default function MyLeads() {
  const { user } = useAuth();
  
  const isMgmt = ['ADMIN', 'CEO', 'MD_CEO', 'COO', 'BRANCH_HEAD', 'SALES_MANAGER', 'SR_SALES_MANAGER', 'ASSIGNED PERSON'].includes(user?.role);
  if (isMgmt) {
    return <Navigate to="/telecrm/my-reports" replace />;
  }

  // Ownership Top Toggles: 'assigned' vs 'created'
  const [ownerTab, setOwnerTab] = useState('assigned');
  
  // Sub-workflow status tabs
  const [workflowTab, setWorkflowTab] = useState('all');
  
  const [leads, setLeads] = useState([]);
  const [displayLimit, setDisplayLimit] = useState(25);
  const sentinelRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [campaigns, setCampaigns] = useState([]);

  // Modals & Drawers state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [activeCallLead, setActiveCallLead] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedDrawerLead, setSelectedDrawerLead] = useState(null);

  // Filter criteria
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    source: '',
    campaign: ''
  });

  const statusTabs = [
    { id: 'all', label: 'All Active' },
    { id: 'new', label: 'New' },
    { id: 'today', label: "Today's" },
    { id: 'tomorrow', label: 'Tomorrow Queue' },
    { id: 'followup', label: 'Follow-ups' },
    { id: 'retry', label: 'Retry Queue' },
    { id: 'interested', label: 'Interested' },
    { id: 'hot', label: 'Hot Priority' }
  ];

  const fetchMyLeads = () => {
    if (!user) return;
    setLoading(true);
    
    // Pass tab=assigned or tab=created to trigger strict controller scoping
    const queryParams = {
      tab: workflowTab === 'all' ? ownerTab : workflowTab,
      search,
      ...filters
    };

    // If workflow tab is set, make sure backend still knows if we want assigned vs created
    if (workflowTab !== 'all') {
      queryParams.ownerFilter = ownerTab;
    }

    leadApi.list(queryParams, user.token)
      .then(res => {
        if (res.success) {
          // Client side safety check ensuring executives only ever see their own records
          const isExec = ['SALES_EXEC', 'SR_SALES_EXEC', 'FIELD_EXEC'].includes(user.role);
          let rawLeads = res.leads || [];
          if (isExec) {
            const activeOwnerMode = workflowTab !== 'all' ? ownerTab : ownerTab;
            if (activeOwnerMode === 'assigned') {
              rawLeads = rawLeads.filter(l => 
                (l.assignedEmployee?._id || l.assignedEmployee)?.toString() === user._id && 
                (l.createdBy?._id || l.createdBy)?.toString() !== user._id
              );
            } else if (activeOwnerMode === 'created') {
              rawLeads = rawLeads.filter(l => 
                (l.createdBy?._id || l.createdBy)?.toString() === user._id
              );
            } else {
              rawLeads = rawLeads.filter(l => 
                (l.assignedEmployee?._id || l.assignedEmployee)?.toString() === user._id || 
                (l.createdBy?._id || l.createdBy)?.toString() === user._id
              );
            }
          }
          setLeads(rawLeads);
          setDisplayLimit(25);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    fetchMyLeads();
    leadApi.listCampaigns(user.token)
      .then(res => { if (res.success) setCampaigns(res.data || []); })
      .catch(() => {});
  }, [user, ownerTab, workflowTab, filters]);

  // Scroll trigger observer for rendering batches (0-25 -> 25-50 -> 50-75)
  useEffect(() => {
    if (loading || leads.length <= displayLimit) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setDisplayLimit(prev => Math.min(prev + 25, leads.length));
      }
    }, { threshold: 0.1 });

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);
    return () => { if (currentSentinel) observer.unobserve(currentSentinel); };
  }, [loading, leads.length, displayLimit]);

  // Socket.IO real-time listener for automated post-call disposition popup
  useEffect(() => {
    if (!user?.token) return;

    let socket = null;
    const initRealtime = () => {
      if (typeof window !== 'undefined' && window.io) {
        const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
        socket = window.io(socketUrl, {
          auth: { token: user.token },
          transports: ['polling', 'websocket']
        });

        socket.on('connect', () => {
          console.log('[MyLeads] Connected to real-time calling server');
        });

        socket.on('CALL_COMPLETED', (data) => {
          console.log('[MyLeads] CALL_COMPLETED event received:', data);
          const targetLead = leads.find(l => l._id === data.leadId || l.phone?.includes(data.calleePhone?.slice(-10))) || activeCallLead || {
            _id: data.leadId,
            phone: data.calleePhone,
            companyName: 'Customer'
          };
          
          if (targetLead) {
            setActiveCallLead({
              ...targetLead,
              callId: data.callId,
              talkDuration: data.talkDuration,
              durationSeconds: data.talkDuration,
              recordingUrl: data.recordingUrl,
              status: data.status
            });
            setShowPostModal(true);
          }
        });

        socket.on('CALL_FAILED', (data) => {
          console.warn('[MyLeads] CALL_FAILED event received:', data);
        });
      }
    };

    if (typeof window !== 'undefined' && !window.io) {
      const script = document.createElement('script');
      script.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
      script.onload = initRealtime;
      document.head.appendChild(script);
    } else {
      initRealtime();
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [user, leads, activeCallLead]);

  // Auto-display post-call disposition popup when user returns from phone dialer
  useEffect(() => {
    const handleReturnFromCall = () => {
      if (activeCallLead && !showPostModal && activeCallLead.callStartTime) {
        if (Date.now() - activeCallLead.callStartTime > 2500) {
          setShowPostModal(true);
        }
      }
    };

    window.addEventListener('focus', handleReturnFromCall);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleReturnFromCall();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleReturnFromCall);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [activeCallLead, showPostModal]);

  // Create Lead Save Handler
  const handleCreateSave = async (formData, callImmediately) => {
    try {
      const payload = {
        ...formData,
        assignedEmployee: user._id, // Enforce logged in user owner
      };
      const res = await leadApi.createManual(payload, user.token);
      if (res.success) {
        setShowCreateModal(false);
        setOwnerTab('created');
        fetchMyLeads();

        if (callImmediately && res.data) {
          handleInitiateCall(res.data);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to create lead');
    }
  };

  // Telephony Click To Call & Native Device Dialer
  const handleInitiateCall = (ld) => {
    if (!ld || !ld.phone) return alert('No valid phone number found for this lead');
    const cleanPhone = ld.phone.replace(/\D/g, '');
    const dialPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : (cleanPhone || ld.phone);

    // 1. Trigger native phone dialer immediately so the call goes to another person
    try {
      const telLink = document.createElement('a');
      telLink.href = `tel:${dialPhone}`;
      telLink.style.display = 'none';
      document.body.appendChild(telLink);
      telLink.click();
      setTimeout(() => {
        if (telLink.parentNode) telLink.parentNode.removeChild(telLink);
      }, 500);
    } catch (e) {
      console.warn('Native dialer click fallback:', e);
      window.location.href = `tel:${dialPhone}`;
    }

    // 2. Log call initiation in backend and set active call state
    leadApi.initiateCall(ld.phone, ld._id, user.token)
      .then(res => {
        setActiveCallLead({
          ...ld,
          callId: res.data?._id || res.call?._id || res.data?.callId,
          callStartTime: Date.now()
        });
      })
      .catch(err => {
        alert(err.message || 'Call initiation logging failed');
      });
  };

  // WhatsApp Chat Launcher
  const handleOpenWhatsApp = (ld) => {
    const cleanNum = (ld.phone || '').replace(/\D/g, '');
    const fullNum = cleanNum.length === 10 ? `91${cleanNum}` : cleanNum;
    window.open(`https://wa.me/${fullNum}?text=Hello%20${encodeURIComponent(ld.contactPerson || '')},%20reaching%20out%20from%20Global%20Marketing%20Solutions...`, '_blank');
  };

  const handleSaveDisposition = (dispData) => {
    const payload = {
      ...dispData,
      callId: activeCallLead?.callId || dispData.callId
    };
    leadApi.saveCallDisposition(payload, user.token)
      .then(res => {
        setShowPostModal(false);
        setActiveCallLead(null);
        fetchMyLeads(); // In-place refresh preserving scroll & search
      })
      .catch(err => alert(err.message || 'Disposition save failed'));
  };

  const handleConvertLead = (id) => {
    if (!confirm('Are you sure you want to convert this lead into a qualified Sales Prospect?')) return;
    leadApi.convert(id, user.token)
      .then(res => {
        if (res.success) {
          alert('🎉 Lead successfully converted to Prospect pipeline!');
          setSelectedDrawerLead(null);
          fetchMyLeads();
        }
      })
      .catch(err => alert(err.message || 'Conversion failed'));
  };

  return (
    <div className="w-full min-w-0 p-4 md:p-6 max-w-7xl mx-auto space-y-6 pb-20">
      {user?.token && <LiveSessionBar token={user.token} />}
      
      {/* ── PAGE HEADER REQUIRED BY PROMPT ─────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            My Leads Desk
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Role-based executive workspace. Manage personal queue & field visits.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full md:w-auto px-5 py-2.5 bg-primary text-primary-foreground font-extrabold rounded-xl shadow-lg hover:opacity-95 active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[3]" /> Create Lead
        </button>
      </div>

      {/* ── TOP SECTION: ASSIGNED LEADS vs CREATED BY ME ───────────── */}
      <div className="flex items-center justify-between gap-4 bg-muted/20 p-1.5 rounded-2xl border">
        <div className="grid grid-cols-2 gap-1.5 w-full sm:w-80">
          <button
            onClick={() => { setOwnerTab('assigned'); setWorkflowTab('all'); }}
            className={`py-2 px-4 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
              ownerTab === 'assigned' ? 'bg-card text-primary shadow border border-primary/20 scale-[1.02]' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserCheck className="h-4 w-4" /> Assigned Leads
          </button>

          <button
            onClick={() => { setOwnerTab('created'); setWorkflowTab('all'); }}
            className={`py-2 px-4 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
              ownerTab === 'created' ? 'bg-card text-primary shadow border border-primary/20 scale-[1.02]' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" /> Created By Me
          </button>
        </div>


      </div>

      {/* Sticky Search & Filter Toolbar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur py-2 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchMyLeads()}
              placeholder="Search My Leads by company, contact person, phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-card border rounded-xl text-xs text-foreground shadow-sm outline-none focus:ring-2 focus:ring-primary/40 truncate"
            />
          </div>

          <button
            onClick={() => setShowFilterSheet(true)}
            className={`px-4 py-2.5 border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              Object.values(filters).some(Boolean) ? 'bg-primary/10 border-primary text-primary' : 'bg-card hover:bg-muted text-foreground'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
            {Object.values(filters).filter(Boolean).length > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] rounded-full px-1.5">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Workflow Sub-Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs w-full min-w-0">
          {statusTabs.map(st => (
            <button
              key={st.id}
              onClick={() => setWorkflowTab(st.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                workflowTab === st.id ? 'bg-secondary text-secondary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count Range Indicator */}
      {!loading && leads.length > 0 && (
        <div className="bg-muted/30 border rounded-xl p-3 flex flex-wrap items-center justify-between text-xs gap-2">
          <span className="font-bold text-foreground bg-primary/10 text-primary px-3 py-1 rounded-lg">
            Showing 0 to {Math.min(displayLimit, leads.length)} of {leads.length} entries
          </span>
          {displayLimit > 25 && (
            <span className="text-[11px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-semibold">
              Latest Scroll Batch: {displayLimit - 25} to {Math.min(displayLimit, leads.length)}
            </span>
          )}
        </div>
      )}

      {/* Responsive Lead Cards List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-muted-foreground animate-pulse">
            Loading My Leads Desk Records...
          </div>
        ) : leads.length === 0 ? (
          <div className="col-span-full py-20 bg-card border rounded-2xl text-center text-muted-foreground space-y-2 shadow-sm">
            <p className="font-extrabold text-sm text-foreground">No leads found in My Leads Desk.</p>
            <p className="text-xs max-w-md mx-auto">
              {ownerTab === 'assigned' 
                ? "You don't have any leads assigned under this filter criteria. Use 'Create Lead (+)'."
                : "You haven't created any manual leads matching this query."}
            </p>
          </div>
        ) : (
          leads.slice(0, displayLimit).map(ld => (
            <LeadCard
              key={ld._id}
              lead={ld}
              onCall={handleInitiateCall}
              onWhatsApp={handleOpenWhatsApp}
              onRemark={(l) => { setActiveCallLead(l); setShowPostModal(true); }}
              onFollowup={(l) => { setActiveCallLead(l); setShowPostModal(true); }}
              onDetails={(l) => setSelectedDrawerLead(l)}
            />
          ))
        )}
      </div>

      {/* Scroll Trigger Sentinel */}
      <div ref={sentinelRef} className="py-2 w-full flex items-center justify-center bg-transparent">
        {displayLimit < leads.length && <div className="text-xs text-primary font-bold animate-pulse py-2">⚡ Scroll Trigger: Showing next batch ({displayLimit} to {Math.min(displayLimit + 25, leads.length)})...</div>}
      </div>

      {/* ── CREATE LEAD MODAL ──────────────────────────────────────── */}
      <CreateLeadModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateSave}
        campaigns={campaigns}
      />

      {/* ── ACTIVE CALL LIVE IN-PROGRESS BANNER ────────────────────── */}
      {activeCallLead && !showPostModal && (
        <div className="fixed bottom-6 right-6 z-50 bg-card border-2 border-primary/50 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-5 max-w-md w-[calc(100%-3rem)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                <PhoneCall className="h-3 w-3 animate-pulse" /> Call Connected
              </div>
              <div className="font-extrabold text-foreground truncate text-sm">
                {activeCallLead.contactPerson || activeCallLead.companyName || activeCallLead.phone}
              </div>
              <div className="text-[11px] text-muted-foreground truncate font-mono">
                {activeCallLead.phone}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowPostModal(true)}
            className="px-4 py-2 bg-destructive text-destructive-foreground font-extrabold rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all text-xs flex items-center gap-1.5 shrink-0"
            title="End Call & Dispose"
          >
            <CheckCircle2 className="h-4 w-4" /> End & Dispose
          </button>
        </div>
      )}

      {/* ── AFTER CALL POST-DISPOSITION POPUP ──────────────────────── */}
      <AfterCallModal
        isOpen={showPostModal}
        lead={activeCallLead}
        onClose={() => { setShowPostModal(false); setActiveCallLead(null); }}
        onSave={handleSaveDisposition}
      />

      {/* ── LEAD DETAILS DRAWER ────────────────────────────────────── */}
      <LeadDetailsDrawer
        isOpen={Boolean(selectedDrawerLead)}
        lead={selectedDrawerLead}
        onClose={() => setSelectedDrawerLead(null)}
        onCall={handleInitiateCall}
        onWhatsApp={handleOpenWhatsApp}
        onConvert={handleConvertLead}
        userRole={user?.role}
        onSaveFieldNotes={(disp, notes) => {
          leadApi.saveCallDisposition({ leadId: selectedDrawerLead._id, callStatus: disp, remarks: `[Field Visit]: ${notes}` }, user.token)
            .then(() => fetchMyLeads());
        }}
      />

      {/* ── MOBILE BOTTOM SHEET FILTERS ────────────────────────────── */}
      {showFilterSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
          <div className="bg-card border rounded-t-3xl sm:rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base">Filter My Leads Desk</h3>
              <button onClick={() => setShowFilterSheet(false)}><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground">Lead Status</label>
                <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="w-full p-2 border rounded-xl mt-1 bg-background">
                  <option value="">All Statuses</option>
                  <option value="New">New</option>
                  <option value="Interested">Interested</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Busy">Busy</option>
                  <option value="Not Reachable">Not Reachable</option>
                  <option value="Converted">Converted</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground">Priority</label>
                <select value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})} className="w-full p-2 border rounded-xl mt-1 bg-background">
                  <option value="">All Priorities</option>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground">Acquisition Source</label>
                <select value={filters.source} onChange={e => setFilters({...filters, source: e.target.value})} className="w-full p-2 border rounded-xl mt-1 bg-background">
                  <option value="">All Sources</option>
                  <option value="Website">Website</option>
                  <option value="Facebook">Facebook</option>
                  <option value="IndiaMart">IndiaMart</option>
                  <option value="Referral">Referral</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                onClick={() => { setFilters({ status: '', priority: '', source: '', campaign: '' }); setShowFilterSheet(false); }}
                className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-muted"
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilterSheet(false)}
                className="px-5 py-2 bg-primary text-primary-foreground font-bold rounded-xl shadow"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
