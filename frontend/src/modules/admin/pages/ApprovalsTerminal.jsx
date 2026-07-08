import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Clock, Eye, ShoppingCart, Calendar, User, RefreshCw, IndianRupee } from 'lucide-react';
import { approvalApi, leaveApi, paymentApi } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const ApprovalsTerminal = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  

  const isAccountant = user.role === 'ACCOUNTS';
  
  // Read initial tab from URL, fallback to default
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') === 'Payments' ? 'Payments' : 
                     searchParams.get('tab') === 'OrderApprovals' ? 'Orders' : 
                     searchParams.get('tab') === 'Leaves' ? 'Leaves' :
                     (isAccountant ? 'Payments' : 'Orders');

  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab clicks to URL so that reloading keeps the tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/approvals?tab=${tab === 'Orders' ? 'OrderApprovals' : tab}`, { replace: true });
  };
  const [approvals, setApprovals] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [notes, setNotes] = useState('');
  const [rejectNote, setRejectNote] = useState('');

  const isManager = ['ADMIN', 'MD_CEO', 'SALES_MANAGER', 'ACCOUNTS'].includes(user.role);
  const canReviewLeaves = ['HR', 'ADMIN', 'MD_CEO'].includes(user.role);
  const canVerifyPayments = ['ADMIN', 'MD_CEO', 'SALES_MANAGER', 'SR_SALES_MANAGER', 'ACCOUNTS'].includes(user.role);
  const [statusFilter, setStatusFilter] = useState('Pending');

  const fetchData = async () => {
    try {
      setLoading(true);
      const appParams = statusFilter ? { status: statusFilter } : {};
      let leaveStatus = '';
      if (statusFilter === 'Pending') leaveStatus = 'PENDING,HR_APPROVED';
      else if (statusFilter === 'Approved') leaveStatus = 'HR_APPROVED,ADMIN_APPROVED';
      else if (statusFilter === 'Rejected') leaveStatus = 'HR_REJECTED,ADMIN_REJECTED';
      const leaveParams = leaveStatus ? { status: leaveStatus } : {};

      const payStatus = statusFilter === 'Approved' ? 'Verified' : statusFilter === '' ? '' : statusFilter;
      const payParams = payStatus ? { status: payStatus } : {};

      const promises = [
        !isAccountant ? approvalApi.list(appParams, user.token) : Promise.resolve({ success: true, data: [] }),
        !isAccountant ? leaveApi.list(leaveParams, user.token) : Promise.resolve({ success: true, data: [] }),
        canVerifyPayments ? paymentApi.list(payParams, user.token) : Promise.resolve({ success: true, data: [] }),
      ];

      const [appRes, leaveRes, payRes] = await Promise.all(promises);
      if (appRes.success) setApprovals(appRes.data);
      if (leaveRes.success || leaveRes.leaves) setLeaves(leaveRes.leaves || leaveRes.data || []);
      if (payRes.success) setPayments(payRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const handleApproveOrder = async (id) => {
    const res = await approvalApi.approve(id, { notes }, user.token);
    if (res.success) { setSelected(null); fetchData(); }
  };

  const handleRejectOrder = async (id) => {
    const res = await approvalApi.reject(id, { reason: notes }, user.token);
    if (res.success) { setSelected(null); fetchData(); }
  };

  const handleVerifyPayment = async (id) => {
    try {
      const res = await paymentApi.verify(id, user.token);
      if (res.success) { setSelectedPayment(null); fetchData(); }
    } catch (err) { alert(err.message || 'Verification failed'); }
  };

  const handleRejectPayment = async (id) => {
    try {
      const res = await paymentApi.reject(id, rejectNote, user.token);
      if (res.success) { setSelectedPayment(null); setRejectNote(''); fetchData(); }
    } catch (err) { alert(err.message || 'Rejection failed'); }
  };

  const pendingPaymentCount = payments.filter(p => p.status === 'Pending').length;
  const pendingOrderCount = approvals.filter(a => a.status === 'Pending').length;

  if (loading && !approvals.length && !leaves.length && !payments.length)
    return <div className="flex h-96 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>;

  const tabs = isAccountant
    ? ['Payments']
    : ['Orders', 'Payments', 'Leaves'];

  
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {isAccountant ? 'Accounts & Payments' : 'Governance Terminal'}
          </h1>
          <p className="text-sm font-semibold text-slate-500">
            {isAccountant ? 'Verify advance payments and track financial records.' : 'Review orders, verify payment settlements, and manage leave requests.'}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => handleTabChange(tab)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {tab}
              {tab === 'Orders' && pendingOrderCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                  {pendingOrderCount}
                </span>
              )}
              {tab === 'Payments' && pendingPaymentCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                  {pendingPaymentCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase outline-none focus:border-blue-600">
            <option value="">All History</option>
            <option value="Pending">Pending Action</option>
            <option value="Approved">Approved / Verified</option>
            <option value="Rejected">Rejected</option>
          </select>
          <button onClick={fetchData} className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-4">

        {/* ─── Orders Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'Orders' && (
          approvals.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
              <ShoppingCart className="h-10 w-10 mx-auto text-slate-200 mb-3" />
              <p className="text-slate-500 font-bold">No orders found in this category</p>
            </div>
          ) : (
            approvals.map((app) => (
              <div key={app._id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-wrap lg:flex-nowrap gap-8 items-center group hover:shadow-md transition-all">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-[10px] font-black text-blue-500 bg-blue-50 px-2.5 py-1 rounded-lg uppercase">{app.orderNumber}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${app.status === 'Approved' ? 'text-emerald-600' : app.status === 'Rejected' ? 'text-rose-600' : 'text-amber-600'}`}>{app.status}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{app.clientName}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Requested by {app.requestedBy?.name}</p>
                </div>
                <div className="flex gap-10 px-8 border-x border-slate-50 h-12">
                  <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total</p><p className="font-black">₹{app.grandTotal?.toLocaleString()}</p></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Advance</p><p className="font-black text-blue-600">₹{app.advancePaid?.toLocaleString()}</p></div>
                </div>
                <div className="ml-auto">
                  {isManager && app.status === 'Pending' ? (
                    <button onClick={() => { setSelected(app); setNotes(''); }} className="h-11 px-6 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-600 shadow-lg shadow-slate-200 transition-all active:scale-95 animate-pulse">Review Request</button>
                  ) : (
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Processed</span>
                  )}
                </div>
              </div>
            ))
          )
        )}

        {/* ─── Payments Tab ────────────────────────────────────────────────── */}
        {activeTab === 'Payments' && (
          payments.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
              <IndianRupee className="h-10 w-10 mx-auto text-slate-200 mb-3" />
              <p className="text-slate-500 font-bold">No payment records found in this category</p>
            </div>
          ) : (
            payments.map((p) => (
              <div key={p._id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-wrap lg:flex-nowrap gap-8 items-center group hover:shadow-md transition-all">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-[10px] font-black text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg uppercase">{p.paymentNumber}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      p.status === 'Verified' ? 'bg-emerald-50 text-emerald-600' :
                      p.status === 'Rejected' ? 'bg-red-50 text-red-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {p.status === 'Verified' ? '✅ Verified' : p.status === 'Rejected' ? '❌ Rejected' : '⏳ Pending'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{p.method}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{p.order?.clientSnapshot?.name || 'Client'}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase mt-1">
                    Order #{p.order?.orderNumber} · Collected by {p.collectedBy?.name} · {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-10 px-8 border-x border-slate-50 h-16">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Received</p>
                    <p className="text-2xl font-black text-blue-600">₹{p.amount?.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Order Total</p>
                    <p className="font-black text-slate-700">₹{p.order?.grandTotal?.toLocaleString('en-IN') || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Balance</p>
                    <p className="font-black text-rose-500">₹{Math.max(0, (p.order?.grandTotal || 0) - (p.amount || 0)).toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className="ml-auto">
                  {canVerifyPayments && p.status === 'Pending' ? (
                    <button onClick={() => { setSelectedPayment(p); setRejectNote(''); }}
                      className="h-11 px-6 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-amber-500 shadow-lg shadow-slate-200 transition-all active:scale-95 animate-pulse flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> Verify Payment
                    </button>
                  ) : (
                    <div className="text-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                        {p.status === 'Verified' ? 'Verified ✅' : p.status === 'Rejected' ? 'Rejected ❌' : 'Awaiting'}
                      </span>
                      {p.status === 'Verified' && p.verifiedBy && (
                        <p className="text-[9px] text-slate-400 mt-1">by {p.verifiedBy?.name}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )
        )}

        {/* ─── Leaves Tab ──────────────────────────────────────────────────── */}
        {activeTab === 'Leaves' && (
          leaves.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
              <Calendar className="h-10 w-10 mx-auto text-slate-200 mb-3" />
              <p className="text-slate-500 font-bold">No leave requests found in this category</p>
            </div>
          ) : (
            leaves.map((lv) => (
              <div key={lv._id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-wrap lg:flex-nowrap gap-8 items-center group hover:shadow-md transition-all">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-[10px] font-black text-purple-500 bg-purple-50 px-2.5 py-1 rounded-lg uppercase">{lv.leaveType}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      lv.status.includes('APPROVED') ? 'text-emerald-600' :
                      lv.status.includes('REJECTED') ? 'text-rose-600' : 'text-amber-600'
                    }`}>{lv.status.replace('_', ' ')}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{lv.employee?.name || 'Employee'}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase mt-1">
                    {lv.employee?.department || 'Sales'} · {lv.employee?.role?.replace('_', ' ')}
                  </p>
                </div>
                <div className="flex gap-10 px-8 border-x border-slate-50 h-12">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Duration</p>
                    <p className="font-bold text-xs">{new Date(lv.fromDate).toLocaleDateString()} - {new Date(lv.toDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Days</p>
                    <p className="font-black text-purple-600">{lv.totalDays} Day(s)</p>
                  </div>
                </div>
                <div className="max-w-xs flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Reason</p>
                  <p className="text-xs text-slate-600 italic line-clamp-2">"{lv.reason}"</p>
                </div>
                <div className="ml-auto">
                  {canReviewLeaves && (lv.status === 'PENDING' || (lv.status === 'HR_APPROVED' && ['ADMIN', 'MD_CEO'].includes(user.role))) ? (
                    <button onClick={() => { setSelectedLeave(lv); setNotes(''); }}
                      className="h-11 px-6 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-purple-600 shadow-lg shadow-slate-200 transition-all active:scale-95 animate-pulse">
                      Review Leave
                    </button>
                  ) : (
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Processed</span>
                  )}
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* ─── Order Review Modal (Advance Payment Verification) ──────────────── */}
      {selected && (() => {
        const pmtRecord = selected.order?.paymentRecords?.[0] || null;
        const balanceDue = (selected.grandTotal || 0) - (selected.advancePaid || 0);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
              
              <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Review Advance Payment Request</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                    {selected.orderNumber} · {selected.clientName}
                  </p>
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-900"><XCircle /></button>
              </div>

              <div className="p-7 space-y-5 max-h-[80vh] overflow-y-auto">
                
                {/* Financial summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-900 text-white">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Total</p>
                    <p className="text-xl font-black">₹{(selected.grandTotal || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-500 text-white">
                    <p className="text-[9px] font-black text-amber-100 uppercase tracking-widest mb-1">Advance Paid</p>
                    <p className="text-xl font-black">₹{(selected.advancePaid || 0).toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-amber-100 font-bold mt-0.5">
                      {(selected.advancePct || 0).toFixed(1)}% of total
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Balance Pending</p>
                    <p className="text-xl font-black text-rose-600">₹{balanceDue.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Payment proof section */}
                {pmtRecord ? (
                  <div className="flex gap-5 items-start">
                    <div className="flex-1 space-y-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Advance Payment Details</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-slate-50 border">
                          <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Method</p>
                          <p className="text-sm font-black text-slate-900">{pmtRecord.method || '—'}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border">
                          <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Reference / UTR</p>
                          <p className="text-sm font-black text-slate-900 truncate">{pmtRecord.reference || '—'}</p>
                        </div>
                      </div>
                    </div>
                    {/* Proof image */}
                    <div className="shrink-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Proof</p>
                      {pmtRecord.proofUrl ? (
                        <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-inner group relative cursor-zoom-in" onClick={() => window.open(pmtRecord.proofUrl)}>
                          <img src={pmtRecord.proofUrl} alt="proof" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white uppercase">View</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">No proof</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
                    <p className="text-xs font-bold text-slate-400">No payment record found for this order.</p>
                  </div>
                )}

                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add internal notes..." className="w-full h-24 p-4 rounded-xl border bg-slate-50 text-sm font-medium outline-none focus:bg-white focus:border-blue-500 transition-all" />
                
                <div className="flex gap-4">
                  <button onClick={() => handleRejectOrder(selected._id)} className="flex-1 h-12 rounded-xl border-2 border-rose-100 text-rose-600 font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all">Reject & Return to Draft</button>
                  <button onClick={() => handleApproveOrder(selected._id)} className="flex-[2] h-12 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all">Approve & Confirm Order</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── Payment Verify Modal ──────────────────────────────────────────── */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-b flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Verify Payment</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                  {selectedPayment.paymentNumber} · Order #{selectedPayment.order?.orderNumber}
                </p>
              </div>
              <button onClick={() => setSelectedPayment(null)} className="p-2 rounded-full hover:bg-white text-slate-400 hover:text-slate-900 transition-colors">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 col-span-3 sm:col-span-1">
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Received</p>
                  <p className="text-3xl font-black text-amber-700">₹{selectedPayment.amount?.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 text-white col-span-3 sm:col-span-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Total</p>
                  <p className="text-xl font-black">₹{selectedPayment.order?.grandTotal?.toLocaleString('en-IN') || 0}</p>
                </div>
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100 col-span-3 sm:col-span-1">
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Balance Pending</p>
                  <p className="text-xl font-black text-rose-600">₹{Math.max(0, (selectedPayment.order?.grandTotal || 0) - (selectedPayment.amount || 0)).toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border col-span-3 sm:col-span-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Method</p>
                  <p className="font-black text-slate-800">{selectedPayment.method}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Client</p>
                  <p className="font-black text-slate-800 truncate">{selectedPayment.order?.clientSnapshot?.name || 'Client'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Reference</p>
                  <p className="font-bold text-slate-700 text-xs">{selectedPayment.reference || '—'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Collected By</p>
                  <p className="font-bold text-slate-700 text-xs">{selectedPayment.collectedBy?.name || '—'}</p>
                </div>
              </div>

              {selectedPayment.proofUrl && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Payment Proof</p>
                  <div className="relative rounded-2xl overflow-hidden border-2 border-slate-100 h-36 bg-slate-50 group cursor-pointer"
                    onClick={() => window.open(selectedPayment.proofUrl)}>
                    <img src={selectedPayment.proofUrl} alt="proof" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold uppercase tracking-widest">View Full Proof ↗</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Rejection Reason (if rejecting)</label>
                <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Enter reason for rejection (required when rejecting)..."
                  className="w-full h-20 p-4 rounded-xl border bg-slate-50 text-sm outline-none focus:bg-white focus:border-red-400 transition-all resize-none" />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleRejectPayment(selectedPayment._id)}
                  className="flex-1 h-14 rounded-2xl border-2 border-red-100 text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-colors">
                  ❌ Reject Proof
                </button>
                <button
                  onClick={() => handleVerifyPayment(selectedPayment._id)}
                  className="flex-[2] h-14 px-8 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200">
                  ✅ Verify Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Leave Review Modal ────────────────────────────────────────────── */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900">Review Leave Request</h2>
              <button onClick={() => setSelectedLeave(null)} className="text-slate-400 hover:text-slate-900"><XCircle /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2 text-sm text-slate-700 bg-slate-50 p-4 rounded-2xl border">
                <p><strong>Employee:</strong> {selectedLeave.employee?.name}</p>
                <p><strong>Department:</strong> {selectedLeave.employee?.department || 'Sales'}</p>
                <p><strong>Leave Type:</strong> {selectedLeave.leaveType}</p>
                <p><strong>Dates:</strong> {new Date(selectedLeave.fromDate).toLocaleDateString()} to {new Date(selectedLeave.toDate).toLocaleDateString()} ({selectedLeave.totalDays} day(s))</p>
                <p><strong>Reason:</strong> <span className="italic">"{selectedLeave.reason}"</span></p>
                <p><strong>Status:</strong> <span className="font-bold text-amber-600 uppercase text-xs">{selectedLeave.status.replace('_', ' ')}</span></p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Review Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Remarks for approval/rejection..."
                  className="w-full h-24 p-4 rounded-xl border bg-slate-50 text-sm font-medium outline-none focus:bg-white focus:border-purple-500 transition-all" />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={async () => {
                    try {
                      let res;
                      if (user.role === 'HR') {
                        res = await leaveApi.hrReview(selectedLeave._id, { action: 'REJECT', notes }, user.token);
                      } else {
                        res = await leaveApi.adminOverride(selectedLeave._id, { action: 'REJECT', notes }, user.token);
                      }
                      if (res.success || res.message) { alert('Leave request rejected'); setSelectedLeave(null); fetchData(); }
                    } catch (err) { alert(err.message || 'Error rejecting leave'); }
                  }}
                  className="flex-1 h-12 rounded-xl border-2 border-rose-100 text-rose-600 font-black text-xs uppercase hover:bg-rose-50 transition-all active:scale-95">
                  Reject
                </button>
                <button
                  onClick={async () => {
                    try {
                      let res;
                      if (user.role === 'HR') {
                        res = await leaveApi.hrReview(selectedLeave._id, { action: 'APPROVE', notes }, user.token);
                      } else {
                        res = await leaveApi.adminOverride(selectedLeave._id, { action: 'APPROVE', notes }, user.token);
                      }
                      if (res.success || res.message) { alert('Leave request approved'); setSelectedLeave(null); fetchData(); }
                    } catch (err) { alert(err.message || 'Error approving leave'); }
                  }}
                  className="flex-[2] h-12 rounded-xl bg-slate-900 text-white font-black text-xs uppercase hover:bg-purple-600 transition-all active:scale-95">
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalsTerminal;
