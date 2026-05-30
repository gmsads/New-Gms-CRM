import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Clock, Eye, ShoppingCart, Calendar, User, RefreshCw, IndianRupee, Package } from 'lucide-react';
import { approvalApi, leaveApi, orderApi, paymentApi } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { key: 'AdvanceApproval',   label: 'Advance Payment Approval' },
  { key: 'OrderVerification', label: 'Order Verification'       },
  { key: 'PaymentVerification', label: 'Payment Verification'   },
  { key: 'Leaves',            label: 'Leaves'                   },
];

// ─── Status badge helper ──────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const isApproved = status === 'Approved' || status === 'Verified' || status?.includes('APPROVED');
  const isRejected = status === 'Rejected' || status?.includes('REJECTED');
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest ${
      isApproved ? 'text-emerald-600' : isRejected ? 'text-rose-600' : 'text-amber-600'
    }`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
};

// ─── Empty state (reuses existing design) ────────────────────────────────────
const EmptyState = ({ icon: Icon, message }) => (
  <div className="py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
    <Icon className="h-10 w-10 mx-auto text-slate-200 mb-3" />
    <p className="text-slate-500 font-bold">{message}</p>
  </div>
);

// ─── Card wrapper (reuses existing design) ───────────────────────────────────
const Card = ({ children }) => (
  <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-wrap lg:flex-nowrap gap-8 items-center group hover:shadow-md transition-all">
    {children}
  </div>
);

// ─── Stat column (reuses existing border-x design) ───────────────────────────
const StatCol = ({ label, value, valueClass = '' }) => (
  <div>
    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{label}</p>
    <p className={`font-black ${valueClass}`}>{value}</p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const ApprovalsTerminal = () => {
  const { user } = useAuth();
  

  const isAccountant = user.role === 'ACCOUNTS';

  // ── State
  const [activeTab, setActiveTab]           = useState(isAccountant ? 'PaymentVerification' : 'AdvanceApproval');
  const [approvals, setApprovals]           = useState([]);   // OrderApproval records (tab 1)
  const [pendingOrders, setPendingOrders]   = useState([]);   // verificationStatus=Pending (tab 2)
  const [payments, setPayments]             = useState([]);   // Payment records (tab 3)
  const [leaves, setLeaves]                 = useState([]);   // Leave records (tab 4)
  const [loading, setLoading]               = useState(true);

  const [statusFilter, setStatusFilter]     = useState('Pending');
  const [selectedLeave, setSelectedLeave]   = useState(null);
  const [notes, setNotes]                   = useState('');

  const canReviewLeaves = ['HR', 'ADMIN', 'MD_CEO'].includes(user.role);

  // ── Data fetch ───────────────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      setLoading(true);

      // ── Leave status mapping (unchanged from original)
      let leaveStatus = '';
      if (statusFilter === 'Pending')  leaveStatus = 'PENDING,HR_APPROVED';
      else if (statusFilter === 'Approved') leaveStatus = 'HR_APPROVED,ADMIN_APPROVED';
      else if (statusFilter === 'Rejected') leaveStatus = 'HR_REJECTED,ADMIN_REJECTED';
      const leaveParams = leaveStatus ? { status: leaveStatus, employeeId: user._id } : { employeeId: user._id };

      // ── Approval (OrderApproval) params — tab 1
      const appParams = statusFilter ? { status: statusFilter, requestedBy: user._id } : { requestedBy: user._id };

      // ── Payment params — tab 3
      // Map statusFilter to payment status terminology
      let payStatus = statusFilter;
      if (statusFilter === 'Approved') payStatus = 'Verified';
      const payParams = payStatus ? { status: payStatus, collectedBy: user._id } : { collectedBy: user._id };

      // ── Fetch all in parallel
      const [appRes, leaveRes, payRes] = await Promise.all([
        approvalApi.list(appParams, user.token),
        leaveApi.list(leaveParams, user.token),
        paymentApi.list(payParams, user.token),
      ]);

      if (appRes.success)                         setApprovals(appRes.data);
      if (leaveRes.success || leaveRes.leaves)    setLeaves(leaveRes.leaves || leaveRes.data || []);
      if (payRes.success)                         setPayments(payRes.data);

      // ── Order Verification: fetch orders with verificationStatus filter
      const verifStatus = statusFilter === 'Approved' ? 'Verified' : statusFilter === 'Pending' ? 'Pending' : undefined;
      const orderParams = verifStatus ? { verificationStatus: verifStatus, salesExec: user._id } : { salesExec: user._id };
      const orderRes = await orderApi.list(orderParams, user.token);
      if (orderRes.success) {
        // For exec role: backend already limits to their own orders; managers see all
        setPendingOrders(orderRes.data.filter(o =>
          o.status !== 'Pending_Approval' &&
          o.status !== 'Draft' &&
          o.status !== 'Cancelled'
        ));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  // ── Loading state (unchanged from original)
  if (loading && !approvals.length && !leaves.length && !payments.length) {
    return <div className="flex h-96 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  // ── Badge counts per tab ─────────────────────────────────────────────────────
  const badgeCounts = {
    AdvanceApproval:    approvals.filter(a => a.status === 'Pending').length,
    OrderVerification:  pendingOrders.filter(o => o.verificationStatus === 'Pending').length,
    PaymentVerification:payments.filter(p => p.status === 'Pending').length,
    Leaves:             leaves.filter(l => l.status === 'PENDING' || l.status === 'HR_APPROVED').length,
  };

  // ─────────────────────────────────────────────────────────────────────────────
  
  
  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* ── Header (unchanged) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Approvals</h1>
          <p className="text-sm font-semibold text-slate-500">Track your order approvals, payment verifications, and leave requests.</p>
        </div>
      </div>

      {/* ── Tab bar + filter controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        {/* Tabs — same pill style as original */}
        <div className="flex flex-wrap p-1 bg-slate-100 rounded-2xl w-fit gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab.key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {/* Pending count badge */}
              {badgeCounts[tab.key] > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-black leading-none">
                  {badgeCounts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Status dropdown + refresh — unchanged */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase outline-none focus:border-blue-600"
          >
            <option value="">All History</option>
            <option value="Pending">Pending Approval</option>
            <option value="Approved">Approved / Verified</option>
            <option value="Rejected">Rejected</option>
          </select>
          <button
            onClick={fetchData}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Tab content */}
      <div className="space-y-4">

        {/* ══ TAB 1: Advance Payment Approval ════════════════════════════════════ */}
        {activeTab === 'AdvanceApproval' && (
          approvals.length === 0 ? (
            <EmptyState icon={ShoppingCart} message="No advance payment approvals found" />
          ) : (
            approvals.map((app) => (
              <Card key={app._id}>
                {/* Identity */}
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-[10px] font-black text-blue-500 bg-blue-50 px-2.5 py-1 rounded-lg uppercase">
                      {app.orderNumber || 'REF-PENDING'}
                    </span>
                    <StatusBadge status={app.status} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{app.clientName}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase mt-1">
                    Submitted {new Date(app.createdAt).toLocaleDateString()}
                    {app.advancePct != null && ` · ${app.advancePct.toFixed(1)}% advance paid`}
                  </p>
                </div>

                {/* Financials */}
                <div className="flex gap-10 px-8 border-x border-slate-50 h-12 items-center">
                  <StatCol label="Total"   value={`₹${app.grandTotal?.toLocaleString('en-IN') || 0}`} />
                  <StatCol label="Advance" value={`₹${app.advancePaid?.toLocaleString('en-IN') || 0}`} valueClass="text-blue-600" />
                  <StatCol
                    label="Remaining"
                    value={`₹${((app.grandTotal || 0) - (app.advancePaid || 0)).toLocaleString('en-IN')}`}
                    valueClass="text-rose-500"
                  />
                </div>

                {/* Status indicator — read-only for exec */}
                <div className="ml-auto shrink-0">
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
              </Card>
            ))
          )
        )}

        {/* ══ TAB 2: Order Verification ═══════════════════════════════════════════ */}
        {activeTab === 'OrderVerification' && (
          pendingOrders.length === 0 ? (
            <EmptyState icon={Package} message="No order verifications found" />
          ) : (
            pendingOrders.map((order) => (
              <Card key={order._id}>
                {/* Identity */}
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase">
                      {order.orderNumber}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      order.verificationStatus === 'Verified' ? 'text-emerald-600' :
                      order.verificationStatus === 'None'     ? 'text-slate-400'   : 'text-amber-600'
                    }`}>
                      {order.verificationStatus === 'Pending'  ? 'Verification Pending' :
                       order.verificationStatus === 'Verified' ? 'Verified'             : 'Not Required'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {order.clientSnapshot?.company
                      ? `${order.clientSnapshot.company} (${order.clientSnapshot.name || ''})`
                      : (order.clientSnapshot?.name || 'Client')}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase mt-1">
                    Created {new Date(order.createdAt).toLocaleDateString()}
                    {order.salesManager?.name && ` · Manager: ${order.salesManager.name}`}
                  </p>
                </div>

                {/* Financials */}
                <div className="flex gap-10 px-8 border-x border-slate-50 h-12 items-center">
                  <StatCol label="Order Total" value={`₹${order.grandTotal?.toLocaleString('en-IN') || 0}`} />
                  <StatCol label="Advance"     value={`₹${order.advancePaid?.toLocaleString('en-IN') || 0}`} valueClass="text-blue-600" />
                </div>

                {/* Status indicator — read-only */}
                <div className="ml-auto shrink-0">
                  {order.verificationStatus === 'Pending' && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <Clock className="h-4 w-4 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Verification</span>
                    </div>
                  )}
                  {order.verificationStatus === 'Verified' && (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                      </div>
                      {order.verifiedByName && (
                        <p className="text-[9px] text-slate-400 font-bold">by {order.verifiedByName}</p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))
          )
        )}

        {/* ══ TAB 3: Payment Verification ════════════════════════════════════════ */}
        {activeTab === 'PaymentVerification' && (
          payments.length === 0 ? (
            <EmptyState icon={IndianRupee} message="No payment verifications found" />
          ) : (
            payments.map((pay) => (
              <Card key={pay._id}>
                {/* Identity */}
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg uppercase">
                      {pay.paymentNumber}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      pay.status === 'Verified' ? 'text-emerald-600' :
                      pay.status === 'Rejected' ? 'text-rose-600'   : 'text-amber-600'
                    }`}>
                      {pay.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {pay.order?.clientSnapshot?.name || pay.order?.clientSnapshot?.company || 'Client'}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase mt-1">
                    Order: {pay.order?.orderNumber || '—'}
                    {pay.reference && ` · Ref: ${pay.reference}`}
                  </p>
                </div>

                {/* Payment details */}
                <div className="flex gap-10 px-8 border-x border-slate-50 h-12 items-center">
                  <StatCol label="Amount"  value={`₹${pay.amount?.toLocaleString('en-IN') || 0}`} valueClass="text-blue-600" />
                  <StatCol label="Method"  value={pay.method || '—'} />
                  <StatCol label="Date"    value={new Date(pay.collectedAt || pay.createdAt).toLocaleDateString()} />
                </div>

                {/* Status / verified-by indicator — read-only */}
                <div className="ml-auto shrink-0">
                  {pay.status === 'Rejected' && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 max-w-[200px]">
                      <p className="text-[9px] font-black text-rose-400 uppercase mb-1">Rejection Reason</p>
                      <p className="text-xs font-bold text-rose-700">{pay.rejectionNote || 'No reason provided'}</p>
                    </div>
                  )}
                  {pay.status === 'Pending' && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <Clock className="h-4 w-4 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Accountant</span>
                    </div>
                  )}
                  {pay.status === 'Verified' && (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                      </div>
                      {pay.verifiedBy?.name && (
                        <p className="text-[9px] text-slate-400 font-bold">by {pay.verifiedBy.name}</p>
                      )}
                    </div>
                  )}
                  {/* Proof image thumbnail */}
                  {pay.proofUrl && (
                    <a
                      href={pay.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 flex items-center gap-1 text-[10px] font-black text-blue-500 hover:underline uppercase tracking-widest"
                    >
                      <Eye className="h-3 w-3" /> View Proof
                    </a>
                  )}
                </div>
              </Card>
            ))
          )
        )}

        {/* ══ TAB 4: Leaves (UNCHANGED from original) ════════════════════════════ */}
        {activeTab === 'Leaves' && (
          leaves.length === 0 ? (
            <EmptyState icon={Calendar} message="No leave requests found in this category" />
          ) : (
            leaves.map((lv) => (
              <div key={lv._id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-wrap lg:flex-nowrap gap-8 items-center group hover:shadow-md transition-all">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-[10px] font-black text-purple-500 bg-purple-50 px-2.5 py-1 rounded-lg uppercase">{lv.leaveType}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      lv.status.includes('APPROVED') ? 'text-emerald-600' :
                      lv.status.includes('REJECTED') ? 'text-rose-600'   : 'text-amber-600'
                    }`}>{lv.status.replace(/_/g, ' ')}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{lv.employee?.name || 'Employee'}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase mt-1">
                    {lv.employee?.department || 'Sales'} · {lv.employee?.role?.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="flex gap-10 px-8 border-x border-slate-50 h-12 items-center">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Duration</p>
                    <p className="font-bold text-xs">
                      {new Date(lv.fromDate).toLocaleDateString()} - {new Date(lv.toDate).toLocaleDateString()}
                    </p>
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
                    <button
                      onClick={() => { setSelectedLeave(lv); setNotes(''); }}
                      className="h-11 px-6 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-purple-600 shadow-lg shadow-slate-200 transition-all active:scale-95 animate-pulse"
                    >
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

      {/* ── Leave Review Modal (UNCHANGED from original) ─────────────────────── */}
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
                <p><strong>Current Status:</strong> <span className="font-bold text-amber-600 uppercase text-xs">{selectedLeave.status.replace(/_/g, ' ')}</span></p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Review Notes / Remarks</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Remarks for approval/rejection..."
                  className="w-full h-24 p-4 rounded-xl border bg-slate-50 text-sm font-medium outline-none focus:bg-white focus:border-purple-500 transition-all"
                />
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
                      if (res.success || res.message) {
                        alert('Leave request rejected');
                        setSelectedLeave(null);
                        fetchData();
                      }
                    } catch (err) { alert(err.message || 'Error rejecting leave'); }
                  }}
                  className="flex-1 h-12 rounded-xl border-2 border-rose-100 text-rose-600 font-black text-xs uppercase hover:bg-rose-50 transition-all active:scale-95"
                >
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
                      if (res.success || res.message) {
                        alert('Leave request approved');
                        setSelectedLeave(null);
                        fetchData();
                      }
                    } catch (err) { alert(err.message || 'Error approving leave'); }
                  }}
                  className="flex-[2] h-12 rounded-xl bg-slate-900 text-white font-black text-xs uppercase hover:bg-purple-600 transition-all active:scale-95"
                >
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
