import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, RefreshCw, ShoppingCart, IndianRupee } from 'lucide-react';
import api, { approvalApi } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const AdvancePaymentApprovals = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');

  const isManager = ['ADMIN', 'MD_CEO', 'SALES_MANAGER', 'ACCOUNTS'].includes(user.role);
  const [statusFilter, setStatusFilter] = useState('Pending');

  const fetchData = async () => {
    try {
      setLoading(true);
      const appParams = statusFilter ? { status: statusFilter } : {};
      const res = await approvalApi.list(appParams, user.token);
      if (res.success) setApprovals(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const handleApproveOrder = async (id) => {
    try {
      const res = await approvalApi.approve(id, { notes }, user.token);
      if (res.success) { setSelected(null); fetchData(); }
    } catch (err) {
      alert(err.message || 'Failed to approve');
    }
  };

  const handleRejectOrder = async (id) => {
    try {
      const res = await approvalApi.reject(id, { reason: notes }, user.token);
      if (res.success) { setSelected(null); fetchData(); }
    } catch (err) {
      alert(err.message || 'Failed to reject');
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Advance Payment Approvals</h1>
          <p className="text-sm font-semibold text-slate-500">
            Review and approve orders where the client paid less than the required advance amount.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase outline-none focus:border-blue-600">
            <option value="">All History</option>
            <option value="Pending">Pending Action</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <button onClick={fetchData} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading && approvals.length === 0 ? (
           <div className="flex h-64 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>
        ) : approvals.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
            <ShieldCheck className="h-10 w-10 mx-auto text-slate-200 mb-3" />
            <p className="text-slate-500 font-bold">No advance payment approval requests found.</p>
          </div>
        ) : (
          approvals.map((app) => (
            <div key={app._id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-wrap lg:flex-nowrap gap-8 items-center group hover:shadow-md transition-all">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-[10px] font-black text-blue-500 bg-blue-50 px-2.5 py-1 rounded-lg uppercase">{app.orderNumber}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${app.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : app.status === 'Rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                    {app.status}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{app.clientName}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Requested by {app.requestedBy?.name}</p>
              </div>
              <div className="flex gap-10 px-8 border-x border-slate-50 h-16">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total</p>
                  <p className="font-black">₹{app.grandTotal?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Advance Received</p>
                  <p className="font-black text-blue-600 text-lg">₹{app.advancePaid?.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">{(app.advancePct || 0).toFixed(1)}% (Req: 50%)</p>
                </div>
              </div>
              <div className="ml-auto shrink-0">
                {isManager && app.status === 'Pending' ? (
                  <button onClick={() => { setSelected(app); setNotes(''); }} className="h-11 px-6 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-600 shadow-lg shadow-slate-200 transition-all active:scale-95 animate-pulse">
                    Review Request
                  </button>
                ) : (
                  <div className="text-center">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Processed</span>
                    {app.approvedBy && <p className="text-[9px] text-slate-400 mt-1">by {app.approvedBy.name}</p>}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
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
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-900 text-white">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Total</p>
                    <p className="text-xl font-black">₹{(selected.grandTotal || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-500 text-white relative overflow-hidden">
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10" style={{ width: `${selected.advancePct}%` }}></div>
                    <p className="text-[9px] font-black text-amber-100 uppercase tracking-widest mb-1 relative z-10">Advance Paid</p>
                    <p className="text-xl font-black relative z-10">₹{(selected.advancePaid || 0).toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-amber-100 font-bold mt-0.5 relative z-10">
                      {(selected.advancePct || 0).toFixed(1)}% (50% Required)
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Balance Pending</p>
                    <p className="text-xl font-black text-rose-600">₹{balanceDue.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {pmtRecord ? (
                  <div className="flex gap-5 items-start">
                    <div className="flex-1 space-y-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Details</p>
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
                    <p className="text-xs font-bold text-slate-400">No payment record available.</p>
                  </div>
                )}

                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add internal notes for approval or rejection..." className="w-full h-24 p-4 rounded-xl border bg-slate-50 text-sm font-medium outline-none focus:bg-white focus:border-blue-500 transition-all resize-none" />
                
                <div className="flex gap-4">
                  <button onClick={() => handleRejectOrder(selected._id)} className="flex-1 h-12 rounded-xl border-2 border-rose-100 text-rose-600 font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all">Reject (Return to Draft)</button>
                  <button onClick={() => handleApproveOrder(selected._id)} className="flex-[2] h-12 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-200">Approve & Confirm Order</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AdvancePaymentApprovals;
