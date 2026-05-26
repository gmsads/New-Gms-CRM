import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, RefreshCw, ShoppingCart, IndianRupee } from 'lucide-react';
import { orderApi } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const OrderVerification = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const isManager = ['ADMIN', 'MD_CEO', 'SALES_MANAGER', 'ACCOUNTS'].includes(user.role);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch orders waiting for verification
      const res = await orderApi.list({ verificationStatus: 'Pending' }, user.token);
      if (res.success) setOrders(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleVerifyOrder = async (id) => {
    try {
      // Create verify endpoint logic (we added this previously)
      const res = await orderApi.verify(id, user.token);
      if (res.success) { setSelected(null); fetchData(); }
    } catch (err) {
      alert(err.message || 'Failed to verify');
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Order Verification</h1>
          <p className="text-sm font-semibold text-slate-500">
            Verify orders that have been confirmed and are awaiting final administrative sign-off.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading && orders.length === 0 ? (
           <div className="flex h-64 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
            <ShoppingCart className="h-10 w-10 mx-auto text-slate-200 mb-3" />
            <p className="text-slate-500 font-bold">No orders are currently waiting for verification.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order._id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-wrap lg:flex-nowrap gap-8 items-center group hover:shadow-md transition-all">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-[10px] font-black text-blue-500 bg-blue-50 px-2.5 py-1 rounded-lg uppercase">{order.orderNumber}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">Pending Verification</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{order.clientSnapshot?.name || 'Client'}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Booked by {order.salesExec?.name}</p>
              </div>
              <div className="flex gap-10 px-8 border-x border-slate-50 h-16">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Items</p>
                  <p className="font-black">{order.lineItems?.length || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Value</p>
                  <p className="font-black text-slate-900 text-lg">₹{order.grandTotal?.toLocaleString()}</p>
                </div>
              </div>
              <div className="ml-auto shrink-0">
                {isManager ? (
                  <button onClick={() => setSelected(order)} className="h-11 px-6 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-slate-200 transition-all active:scale-95 animate-pulse">
                    Review Order
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900">Verify Order Details</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                  {selected.orderNumber} · {selected.clientSnapshot?.name}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-900"><XCircle /></button>
            </div>

            <div className="p-7 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Client Details</p>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="font-bold text-slate-900">{selected.clientSnapshot?.name}</p>
                    <p className="text-sm text-slate-500">{selected.clientSnapshot?.company}</p>
                    <p className="text-sm text-slate-500 mt-1">{selected.clientSnapshot?.phone}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Financials</p>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Subtotal</p>
                      <p className="font-bold text-slate-700">₹{selected.subtotal?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">GST</p>
                      <p className="font-bold text-slate-700">₹{selected.totalGST?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase">Grand Total</p>
                      <p className="font-black text-blue-600">₹{selected.grandTotal?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase">Advance Paid</p>
                      <p className="font-black text-emerald-600">₹{selected.advancePaid?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Line Items</p>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                      <tr>
                        <th className="px-4 py-2">Service</th>
                        <th className="px-4 py-2">Qty</th>
                        <th className="px-4 py-2">Unit Price</th>
                        <th className="px-4 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selected.lineItems?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 font-bold text-slate-700">{item.description}</td>
                          <td className="px-4 py-3">{item.quantity}</td>
                          <td className="px-4 py-3">₹{item.unitPrice?.toLocaleString()}</td>
                          <td className="px-4 py-3 font-bold">₹{item.amount?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex gap-4 pt-2">
                <button onClick={() => handleVerifyOrder(selected._id)} className="flex-1 h-14 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
                  Verify & Approve Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderVerification;
