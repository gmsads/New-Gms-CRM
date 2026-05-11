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
                  <h3 className="font-black text-slate-900 text-xl tracking-tight">{p.order?.clientSnapshot?.name || 'Client'}</h3>
                  <p className="text-xs text-slate-400 mt-1 font-bold">Collected by <span className="text-slate-600">{p.collectedBy?.name || 'You'}</span> · {new Date(p.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="flex items-center gap-10 px-8 border-x border-slate-100 h-16">
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Amount</p>
                    <p className="font-black text-blue-600 text-lg">₹{p.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Order</p>
                    <p className="font-black text-slate-900 text-lg">#{p.order?.orderNumber}</p>
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

      {/* Modals remain similarly styled... */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900">Review Request</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{selected.orderNumber} · {selected.clientName}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-full hover:bg-white text-slate-300 hover:text-slate-900 transition-colors">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="p-8 space-y-6">
               <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 border">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Grand Total</p>
                  <p className="text-xl font-black text-slate-900">₹{selected.grandTotal.toLocaleString()}</p>
                </div>
                <div className="p-5 rounded-2xl bg-red-50 border border-red-100">
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Paid Advance</p>
                  <p className="text-xl font-black text-red-600">₹{selected.advancePaid.toLocaleString()}</p>
                  <p className="text-[10px] font-black text-red-400 mt-1">{selected.advancePct.toFixed(1)}% of total</p>
                </div>
              </div>
              <textarea 
                value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter verification notes..."
                className="w-full rounded-2xl border-slate-200 bg-slate-50 p-5 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-all h-32 resize-none"
              />
              <div className="flex gap-4">
                <button onClick={() => handleRejectOrder(selected._id)} className="flex-1 h-14 rounded-2xl border-2 border-red-100 text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-colors">Reject</button>
                <button onClick={() => handleApproveOrder(selected._id)} className="flex-2 h-14 px-8 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-100">Approve Order</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Verify Payment</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{selectedPayment.paymentNumber} · {selectedPayment.order?.orderNumber}</p>
              </div>
              <button onClick={() => setSelectedPayment(null)} className="p-2 rounded-full hover:bg-white text-slate-300 hover:text-slate-900 transition-colors">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="p-10 space-y-8">
              <div className="flex gap-8 items-start">
                <div className="flex-1 space-y-4">
                  <div className="p-5 rounded-3xl bg-blue-50 border border-blue-100">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Amount to Verify</p>
                    <p className="text-3xl font-black text-blue-700">₹{selectedPayment.amount.toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Info</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div><p className="text-[9px] text-slate-400 font-bold uppercase">Method</p><p className="text-xs font-black text-slate-900">{selectedPayment.method}</p></div>
                      <div><p className="text-[9px] text-slate-400 font-bold uppercase">Reference</p><p className="text-xs font-black text-slate-900 truncate">{selectedPayment.reference || '—'}</p></div>
                    </div>
                  </div>
                </div>
                <div className="w-48 h-48 rounded-3xl overflow-hidden border-4 border-slate-100 shadow-inner group relative">
                   <img src={selectedPayment.proofUrl} className="w-full h-full object-cover cursor-zoom-in" onClick={() => window.open(selectedPayment.proofUrl)} />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                     <span className="text-[10px] font-bold text-white uppercase tracking-widest">View Full Proof</span>
                   </div>
                </div>
              </div>

              <textarea 
                value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter internal verification notes or rejection reason..."
                className="w-full rounded-2xl border-slate-200 bg-slate-50 p-5 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-all h-24 resize-none"
              />

              <div className="flex gap-4">
                <button onClick={() => handleRejectPayment(selectedPayment._id)} className="flex-1 h-14 rounded-2xl border-2 border-red-100 text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-colors">Reject Proof</button>
                <button onClick={() => handleVerifyPayment(selectedPayment._id)} className="flex-2 h-14 px-8 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-green-500 transition-all shadow-lg shadow-slate-200">Verify Receipt</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
