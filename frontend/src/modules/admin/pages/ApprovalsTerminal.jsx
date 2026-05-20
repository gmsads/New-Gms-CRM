import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Clock, Eye, ShoppingCart, IndianRupee, User, RefreshCw } from 'lucide-react';
import { approvalApi, paymentApi } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const ApprovalsTerminal = () => {
  const { user } = useAuth();
  if (!user) return null;
  const [activeTab, setActiveTab] = useState('Orders');
  const [approvals, setApprovals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
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
    const res = await paymentApi.verify(id, user.token);
    if (res.success) { setSelectedPayment(null); fetchData(); }
  };

  const handleRejectPayment = async (id) => {
    const res = await paymentApi.reject(id, notes, user.token);
    if (res.success) { setSelectedPayment(null); fetchData(); }
  };

  if (loading && !approvals.length && !payments.length) return <div className="flex h-96 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight text-slate-900">Governance Terminal</h1>
          <p className="text-sm font-semibold text-slate-500">Review orders and verify payment settlements.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
          {['Orders', 'Payments'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {tab}
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
        {activeTab === 'Orders' ? (
          approvals.map((app) => (
            <div key={app._id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-wrap lg:flex-nowrap gap-8 items-center group hover:shadow-md transition-all">
               <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-[10px] font-black text-blue-500 bg-blue-50 px-2.5 py-1 rounded-lg uppercase">{app.orderNumber}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${app.status === 'Approved' ? 'text-emerald-600' : 'text-rose-600'}`}>{app.status}</span>
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
                   <button onClick={() => setSelected(app)} className="h-11 px-6 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-600 shadow-lg shadow-slate-200 transition-all active:scale-95">Review Request</button>
                 ) : (
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Processed</span>
                 )}
               </div>
            </div>
          ))
        ) : (
          payments.map((p) => (
            <div key={p._id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-wrap lg:flex-nowrap gap-8 items-center group hover:shadow-md transition-all">
               <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-[10px] font-black text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg uppercase">{p.paymentNumber}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${p.status === 'Verified' ? 'text-emerald-600' : 'text-amber-600'}`}>{p.status}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{p.order?.clientSnapshot?.name || 'Client'}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Collected by {p.collectedBy?.name}</p>
               </div>
               <div className="flex gap-10 px-8 border-x border-slate-50 h-12">
                  <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Amount</p><p className="font-black text-emerald-600">₹{p.amount?.toLocaleString()}</p></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Order</p><p className="font-black">#{p.order?.orderNumber}</p></div>
               </div>
               <div className="ml-auto">
                 {isManager && p.status === 'Pending' ? (
                   <button onClick={() => setSelectedPayment(p)} className="h-11 px-6 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-amber-500 shadow-lg shadow-slate-200 transition-all active:scale-95">Verify Payment</button>
                 ) : (
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Processed</span>
                 )}
               </div>
            </div>
          ))
        )}
      </div>

      {/* Modals for review and verify */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900">Review Order</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-900"><XCircle /></button>
            </div>
            <div className="p-8 space-y-6">
               <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add internal notes..." className="w-full h-32 p-4 rounded-xl border bg-slate-50 text-sm font-medium outline-none focus:bg-white focus:border-blue-500 transition-all" />
               <div className="flex gap-4">
                  <button onClick={() => handleRejectOrder(selected._id)} className="flex-1 h-12 rounded-xl border-2 border-rose-100 text-rose-600 font-black text-xs uppercase">Reject</button>
                  <button onClick={() => handleApproveOrder(selected._id)} className="flex-[2] h-12 rounded-xl bg-slate-900 text-white font-black text-xs uppercase hover:bg-blue-600 transition-all">Approve</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
               <h2 className="text-xl font-black text-slate-900">Verify Payment Receipt</h2>
               <button onClick={() => setSelectedPayment(null)} className="text-slate-400 hover:text-slate-900"><XCircle /></button>
            </div>
            <div className="p-8 space-y-8">
               <div className="flex gap-6 items-start">
                  <div className="flex-1 p-5 rounded-2xl bg-blue-50 border border-blue-100">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Receipt Amount</p>
                    <p className="text-2xl font-black text-blue-700">₹{selectedPayment.amount?.toLocaleString()}</p>
                  </div>
                  <div className="w-32 h-32 rounded-xl overflow-hidden border shadow-inner">
                    <img src={selectedPayment.proofUrl} className="w-full h-full object-cover" />
                  </div>
               </div>
               <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Rejection reason if applicable..." className="w-full h-24 p-4 rounded-xl border bg-slate-50 text-sm font-medium outline-none focus:bg-white focus:border-amber-500 transition-all" />
               <div className="flex gap-4">
                  <button onClick={() => handleRejectPayment(selectedPayment._id)} className="flex-1 h-12 rounded-xl border-2 border-rose-100 text-rose-600 font-black text-xs uppercase">Reject Proof</button>
                  <button onClick={() => handleVerifyPayment(selectedPayment._id)} className="flex-[2] h-12 rounded-xl bg-slate-900 text-white font-black text-xs uppercase hover:bg-emerald-600 transition-all">Verify Receipt</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalsTerminal;
