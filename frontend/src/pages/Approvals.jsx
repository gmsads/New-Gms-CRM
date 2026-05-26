import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Clock, Eye, ShoppingCart, IndianRupee, User } from 'lucide-react';
import { approvalApi, paymentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/ui/Badge';

const Approvals = () => {
  const { user } = useAuth();
  if (!user) return null;
  const [activeTab, setActiveTab] = useState('Orders');
  const [approvals, setApprovals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [notes, setNotes] = useState('');

  const isManager = ['ADMIN', 'MD_CEO', 'SALES_MANAGER'].includes(user.role);
  const [statusFilter, setStatusFilter] = useState(isManager ? 'Pending' : '');

  const fetchData = async () => {
    try {
      setLoading(true);
      let appStatus = statusFilter;
      let payStatus = statusFilter;

      // Handle terminology differences: Orders use 'Approved', Payments use 'Verified'
      if (statusFilter === 'Approved') payStatus = 'Verified';
      else if (statusFilter === 'Verified') appStatus = 'Approved';

      const appParams = appStatus ? { status: appStatus } : {};
      const payParams = payStatus ? { status: payStatus } : {};
      
      const [appRes, payRes] = await Promise.all([
        approvalApi.list(appParams, user.token),
        isManager && statusFilter === 'Pending' 
          ? paymentApi.pending(user.token) 
          : paymentApi.list(payParams, user.token)
      ]);

      if (appRes.success) setApprovals(appRes.data);
      if (payRes.success) setPayments(payRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleApproveOrder = async (id) => {
    try {
      const res = await approvalApi.approve(id, { notes }, user.token);
      if (res.success) {
        setSelected(null);
        fetchData();
      }
    } catch (err) { alert(err.message); }
  };

  const handleRejectOrder = async (id) => {
    try {
      const res = await approvalApi.reject(id, { reason: notes }, user.token);
      if (res.success) {
        setSelected(null);
        fetchData();
      }
    } catch (err) { alert(err.message); }
  };

  const handleVerifyPayment = async (id) => {
    try {
      const res = await paymentApi.verify(id, user.token);
      if (res.success) {
        setSelectedPayment(null);
        fetchData();
      }
    } catch (err) { alert(err.message); }
  };

  const handleRejectPayment = async (id) => {
    try {
      const res = await paymentApi.reject(id, notes, user.token);
      if (res.success) {
        setSelectedPayment(null);
        fetchData();
      }
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="p-20 text-center text-muted-foreground">Loading approval queue...</div>;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Governance Hub</h1>
          <p className="text-slate-500 font-medium mt-1">Review orders and verify payment settlements.</p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          {['Orders', 'Payments'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {tab}
              {tab === 'Orders' && approvals.filter(a => a.status === 'Pending').length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded-full">
                  {approvals.filter(a => a.status === 'Pending').length}
                </span>
              )}
              {tab === 'Payments' && payments.filter(p => p.status === 'Pending').length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[10px] rounded-full">
                  {payments.filter(p => p.status === 'Pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Show:</label>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border-2 border-slate-100 bg-white px-4 text-xs font-bold outline-none focus:border-blue-600 transition-all"
          >
            <option value="">All History</option>
            <option value="Pending">Pending Action</option>
            <option value="Approved">Approved / Verified</option>
            <option value="Rejected">Rejected</option>
          </select>
          <button 
            onClick={fetchData}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Clock className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {activeTab === 'Orders' ? (
        <div className="grid gap-4">
          {approvals.length === 0 ? (
            <div className="p-16 text-center border-2 border-dashed rounded-3xl bg-slate-50/50">
              <ShieldCheck className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">Queue Empty</h3>
              <p className="text-sm text-slate-400 mt-1">No orders matching your filter.</p>
            </div>
          ) : (
            approvals.map((app) => (
              <div key={app._id} className="group bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-wrap lg:flex-nowrap gap-8 items-center">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-[10px] font-black text-blue-500 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-tighter">
                      {app.orderNumber}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full ${app.status === 'Approved' ? 'bg-green-500' : app.status === 'Pending' ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${app.status === 'Approved' ? 'text-green-600' : app.status === 'Pending' ? 'text-red-600' : 'text-slate-500'}`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-black text-slate-900 text-xl tracking-tight">{app.clientName}</h3>
                  <p className="text-xs text-slate-400 mt-1 font-bold">Requested by <span className="text-slate-600">{app.requestedBy?.name || 'You'}</span> · {new Date(app.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="flex items-center gap-10 px-8 border-x border-slate-100 h-16">
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Total</p>
                    <p className="font-black text-slate-900 text-lg">₹{app.grandTotal.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Advance</p>
                    <p className="font-black text-blue-600 text-lg">₹{app.advancePaid.toLocaleString()}</p>
                  </div>
                </div>

                <div className="ml-auto">
                  {isManager && app.status === 'Pending' ? (
                    <button 
                      onClick={() => setSelected(app)}
                      className="h-12 px-6 rounded-2xl bg-slate-900 text-white text-sm font-black flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
                    >
                      <Eye className="h-4 w-4" /> Review Request
                    </button>
                  ) : (
                    <div className="px-4 py-2 bg-slate-50 border rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {app.status === 'Pending' ? 'Awaiting Action' : `Processed`}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {payments.length === 0 ? (
            <div className="p-16 text-center border-2 border-dashed rounded-3xl bg-slate-50/50">
              <IndianRupee className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">All Clear</h3>
              <p className="text-sm text-slate-400 mt-1">No payments matching your filter.</p>
            </div>
          ) : (
            payments.map((p) => (
              <div key={p._id} className="group bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-wrap lg:flex-nowrap gap-8 items-center">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-[10px] font-black text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg uppercase tracking-tighter">
                      {p.paymentNumber}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full ${p.status === 'Verified' ? 'bg-green-500' : p.status === 'Pending' ? 'bg-amber-400 animate-pulse' : 'bg-red-500'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${p.status === 'Verified' ? 'text-green-600' : p.status === 'Pending' ? 'text-amber-600' : 'text-red-600'}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-black text-slate-900 text-xl tracking-tight">
                    {p.order?.clientSnapshot?.company || p.order?.clientSnapshot?.name || 'Client'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-bold">Collected by <span className="text-slate-600">{p.collectedBy?.name || 'You'}</span> · {new Date(p.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="flex items-center gap-10 px-8 border-x border-slate-100 h-16">
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Order Total</p>
                    <p className="font-black text-slate-900 text-lg">₹{(p.order?.grandTotal || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Received</p>
                    <p className="font-black text-blue-600 text-lg">₹{p.amount.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Balance Pending</p>
                    <p className="font-black text-rose-600 text-lg">₹{Math.max(0, (p.order?.grandTotal || 0) - p.amount).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Order</p>
                    <p className="font-black text-slate-900">#{p.order?.orderNumber}</p>
                  </div>
                </div>

                <div className="ml-auto">
                  {isManager && p.status === 'Pending' ? (
                    <button 
                      onClick={() => setSelectedPayment(p)}
                      className="h-12 px-6 rounded-2xl bg-slate-900 text-white text-sm font-black flex items-center gap-2 hover:bg-amber-500 transition-all shadow-lg shadow-slate-200"
                    >
                      <ShieldCheck className="h-4 w-4" /> Verify Payment
                    </button>
                  ) : (
                    <div className="px-4 py-2 bg-slate-50 border rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {p.status === 'Pending' ? 'Awaiting Action' : `Payment ${p.status}`}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Manager: Review Advance Payment Request Modal */}
      {selected && (() => {
        // Pull the first pending/any payment record from the linked order
        const pmtRecord = selected.order?.paymentRecords?.[0] || null;
        const balanceDue = (selected.grandTotal || 0) - (selected.advancePaid || 0);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">

              {/* Header */}
              <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Review Advance Payment Request</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                    {selected.orderNumber} · Submitted by {selected.requestedBy?.name || 'Executive'}
                  </p>
                </div>
                <button onClick={() => { setSelected(null); setNotes(''); }} className="p-2 rounded-full hover:bg-white text-slate-300 hover:text-slate-900 transition-colors">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="p-7 space-y-5 max-h-[80vh] overflow-y-auto">

                {/* Client info */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Client</p>
                  <p className="text-lg font-black text-slate-900">{selected.clientName}</p>
                  {selected.order?.clientSnapshot?.phone && (
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{selected.order.clientSnapshot.phone}</p>
                  )}
                </div>

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
                      {(selected.advancePct || 0).toFixed(1)}% of total — below 50%
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Balance Pending</p>
                    <p className="text-xl font-black text-rose-600">₹{balanceDue.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-rose-400 font-bold mt-0.5">
                      {(100 - (selected.advancePct || 0)).toFixed(1)}% remaining
                    </p>
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
                        <div className="p-3 rounded-xl bg-slate-50 border">
                          <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Payment Amount</p>
                          <p className="text-sm font-black text-blue-600">₹{(pmtRecord.amount || selected.advancePaid || 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border">
                          <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Payment Status</p>
                          <p className={`text-sm font-black ${
                            pmtRecord.status === 'Verified' ? 'text-emerald-600' :
                            pmtRecord.status === 'Rejected' ? 'text-rose-600' : 'text-amber-600'
                          }`}>{pmtRecord.status || 'Pending'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Proof image */}
                    <div className="shrink-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Proof</p>
                      {pmtRecord.proofUrl ? (
                        <div
                          className="w-40 h-40 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-inner group relative cursor-zoom-in"
                          onClick={() => window.open(pmtRecord.proofUrl)}
                        >
                          <img
                            src={pmtRecord.proofUrl}
                            alt="Payment proof"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                            <Eye className="h-5 w-5 text-white" />
                            <span className="text-[10px] font-bold text-white uppercase">View Full</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50">
                          <div className="text-center">
                            <IndianRupee className="h-7 w-7 mx-auto text-slate-300 mb-1" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase">No proof uploaded</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
                    <p className="text-xs font-bold text-slate-400">No payment record found for this order.</p>
                  </div>
                )}

                {/* Notes warning */}
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                    ⚠ Approval will confirm this order. Rejection returns it to Draft for the executive to fix.
                  </p>
                </div>

                {/* Manager notes */}
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter approval notes or rejection reason..."
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 p-4 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-all h-24 resize-none"
                />

                {/* Action buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => handleRejectOrder(selected._id)}
                    className="flex-1 h-14 rounded-2xl border-2 border-red-100 text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-colors"
                  >
                    ✕ Reject — Return to Draft
                  </button>
                  <button
                    onClick={() => handleApproveOrder(selected._id)}
                    className="flex-[2] h-14 px-8 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-100"
                  >
                    ✓ Approve & Confirm Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden">

            {/* Header */}
            <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Verify Advance Payment</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                  {selectedPayment.paymentNumber} · Order {selectedPayment.order?.orderNumber || '—'}
                </p>
              </div>
              <button onClick={() => { setSelectedPayment(null); setNotes(''); }} className="p-2 rounded-full hover:bg-white text-slate-300 hover:text-slate-900 transition-colors">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">

              {/* ── Row 1: Client + Order context ─────────────────────── */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Client / Company</p>
                  <p className="text-lg font-black text-slate-900">
                    {selectedPayment.order?.clientSnapshot?.company
                      ? `${selectedPayment.order.clientSnapshot.company}`
                      : (selectedPayment.order?.clientSnapshot?.name || 'Client')}
                  </p>
                  {selectedPayment.order?.clientSnapshot?.company && selectedPayment.order?.clientSnapshot?.name && (
                    <p className="text-xs font-bold text-slate-500 mt-0.5">Contact: {selectedPayment.order.clientSnapshot.name}</p>
                  )}
                  {selectedPayment.order?.clientSnapshot?.phone && (
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedPayment.order.clientSnapshot.phone}</p>
                  )}
                </div>
              </div>

              {/* ── Row 2: Financial breakdown ─────────────────────────── */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900 text-white">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Grand Total</p>
                  <p className="text-xl font-black">₹{(selectedPayment.order?.grandTotal || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 rounded-2xl bg-blue-600 text-white">
                  <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest mb-1">This Payment</p>
                  <p className="text-xl font-black">₹{selectedPayment.amount.toLocaleString('en-IN')}</p>
                  {selectedPayment.order?.grandTotal > 0 && (
                    <p className="text-[10px] text-blue-200 font-bold mt-0.5">
                      {((selectedPayment.amount / selectedPayment.order.grandTotal) * 100).toFixed(1)}% of total
                    </p>
                  )}
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                  <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Payment Type</p>
                  <p className="text-lg font-black text-amber-700">{selectedPayment.paymentType || 'Advance'}</p>
                  <p className="text-[9px] text-amber-500 font-bold uppercase mt-0.5">
                    Balance after: ₹{Math.max(0, (selectedPayment.order?.grandTotal || 0) - selectedPayment.amount).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* ── Row 3: Payment details + Proof ────────────────────── */}
              <div className="flex gap-6 items-start">
                {/* Payment details */}
                <div className="flex-1 space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border">
                      <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Method</p>
                      <p className="text-sm font-black text-slate-900">{selectedPayment.method}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border">
                      <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Reference / UTR</p>
                      <p className="text-sm font-black text-slate-900 truncate">{selectedPayment.reference || '—'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border">
                      <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Collected By</p>
                      <p className="text-sm font-black text-slate-900">{selectedPayment.collectedBy?.name || '—'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border">
                      <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Collection Date</p>
                      <p className="text-sm font-black text-slate-900">
                        {new Date(selectedPayment.collectedAt || selectedPayment.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  {selectedPayment.notes && (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <p className="text-[9px] text-blue-400 font-bold uppercase mb-1">Executive Notes</p>
                      <p className="text-xs text-blue-700 font-medium italic">"{selectedPayment.notes}"</p>
                    </div>
                  )}
                </div>

                {/* Proof image */}
                <div className="shrink-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Proof</p>
                  {selectedPayment.proofUrl ? (
                    <div
                      className="w-44 h-44 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-inner group relative cursor-zoom-in"
                      onClick={() => window.open(selectedPayment.proofUrl)}
                    >
                      <img
                        src={selectedPayment.proofUrl}
                        alt="Payment proof"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                      <div style={{ display: 'none' }} className="w-full h-full items-center justify-center bg-slate-100 text-slate-400 text-xs font-bold">
                        Image unavailable
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                        <Eye className="h-5 w-5 text-white" />
                        <span className="text-[10px] font-bold text-white uppercase">View Full</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-44 h-44 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50">
                      <div className="text-center">
                        <IndianRupee className="h-8 w-8 mx-auto text-slate-300 mb-1" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase">No proof uploaded</p>
                      </div>
                    </div>
                  )}
                  {selectedPayment.proofUrl && (
                    <a
                      href={selectedPayment.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 flex items-center gap-1 text-[10px] font-black text-blue-500 hover:underline uppercase tracking-widest"
                    >
                      <Eye className="h-3 w-3" /> Open Full Image
                    </a>
                  )}
                </div>
              </div>

              {/* ── Notes textarea */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Verification Notes (optional for approval, required for rejection)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter internal verification notes or rejection reason..."
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 p-4 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-all h-20 resize-none"
                />
              </div>

              {/* ── Action buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => handleRejectPayment(selectedPayment._id)}
                  className="flex-1 h-14 rounded-2xl border-2 border-red-100 text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-colors"
                >
                  ✕ Reject Proof
                </button>
                <button
                  onClick={() => handleVerifyPayment(selectedPayment._id)}
                  className="flex-[2] h-14 px-8 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-slate-200"
                >
                  ✓ Verify Payment — ₹{selectedPayment.amount.toLocaleString('en-IN')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
