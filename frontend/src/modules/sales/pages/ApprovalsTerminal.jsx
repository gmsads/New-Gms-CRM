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

  const [statusFilter, setStatusFilter] = useState('Pending');

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
        paymentApi.list(payParams, user.token)
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

  if (loading && !approvals.length && !payments.length) return <div className="flex h-96 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight text-slate-900">My Approvals</h1>
          <p className="text-sm font-semibold text-slate-500">Track your order approvals and payment verifications.</p>
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
            <option value="Pending">Pending Approval</option>
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
                </div>
                <div className="flex gap-10 px-8 border-x border-slate-50 h-12">
                  <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total</p><p className="font-black">₹{app.grandTotal?.toLocaleString()}</p></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Advance</p><p className="font-black text-blue-600">₹{app.advancePaid?.toLocaleString()}</p></div>
                </div>
                <div className="ml-auto">
                  {app.status === 'Rejected' && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 max-w-[200px]">
                      <p className="text-[9px] font-black text-rose-400 uppercase mb-1">Rejection Reason</p>
                      <p className="text-xs font-bold text-rose-700">{app.rejectionReason || 'No reason provided'}</p>
                    </div>
                  )}
                  {app.status === 'Pending' && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Manager</span>
                    </div>
                  )}
                  {app.status === 'Approved' && (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Approved</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )
        ) : (
          payments.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
              <IndianRupee className="h-10 w-10 mx-auto text-slate-200 mb-3" />
              <p className="text-slate-500 font-bold">No payments found in this category</p>
            </div>
          ) : (
            payments.map((p) => (
              <div key={p._id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-wrap lg:flex-nowrap gap-8 items-center group hover:shadow-md transition-all">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-[10px] font-black text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg uppercase">{p.paymentNumber}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${p.status === 'Verified' ? 'text-emerald-600' : p.status === 'Rejected' ? 'text-rose-600' : 'text-amber-600'}`}>{p.status}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{p.order?.clientSnapshot?.name || 'Client'}</h3>
                </div>
                <div className="flex gap-10 px-8 border-x border-slate-50 h-12">
                  <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Amount</p><p className="font-black text-emerald-600">₹{p.amount?.toLocaleString()}</p></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Order</p><p className="font-black">#{p.order?.orderNumber}</p></div>
                </div>
                <div className="ml-auto">
                  {p.status === 'Rejected' && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 max-w-[200px]">
                      <p className="text-[9px] font-black text-rose-400 uppercase mb-1">Rejection Reason</p>
                      <p className="text-xs font-bold text-rose-700">{p.rejectionReason || 'No reason provided'}</p>
                    </div>
                  )}
                  {p.status === 'Pending' && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Verification</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default ApprovalsTerminal;
