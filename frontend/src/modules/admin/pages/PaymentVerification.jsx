import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, RefreshCw, IndianRupee } from 'lucide-react';
import { paymentApi } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const PaymentVerification = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');

  const canVerifyPayments = ['ADMIN', 'MD_CEO', 'SALES_MANAGER', 'SR_SALES_MANAGER', 'ACCOUNTS'].includes(user.role);

  const fetchData = async () => {
    try {
      setLoading(true);
      const payStatus = statusFilter === 'Approved' ? 'Verified' : statusFilter === '' ? '' : statusFilter;
      const res = await paymentApi.list(payStatus ? { status: payStatus } : {}, user.token);
      if (res.success) setPayments(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

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

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payment Verification</h1>
          <p className="text-sm font-semibold text-slate-500">
            Review and verify client payment receipts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase outline-none focus:border-blue-600">
            <option value="">All History</option>
            <option value="Pending">Pending Action</option>
            <option value="Approved">Verified</option>
            <option value="Rejected">Rejected</option>
          </select>
          <button onClick={fetchData} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading && payments.length === 0 ? (
           <div className="flex h-64 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>
        ) : payments.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
            <IndianRupee className="h-10 w-10 mx-auto text-slate-200 mb-3" />
            <p className="text-slate-500 font-bold">No payment records found.</p>
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
              </div>
              <div className="ml-auto shrink-0">
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
        )}
      </div>

      {/* Verification Modal */}
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
    </div>
  );
};

export default PaymentVerification;
