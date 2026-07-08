import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Plus, Filter, IndianRupee, CheckCircle2, FileText, ArrowUpRight } from 'lucide-react';
import api from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';

const VendorPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    vendor: '', amount: '', paymentType: 'Advance', paymentMethod: 'Bank Transfer', transactionId: '', notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [payRes, venRes] = await Promise.all([
          api.get('/vendors/payments', user.token),
          api.get('/vendors', user.token)
        ]);
        setPayments(payRes.data.payments || []);
        setVendors(venRes.data.vendors || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.token]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/vendors/payments', { ...formData, status: 'Paid', paidDate: new Date() }, user.token);
      setIsModalOpen(false);
      const res = await api.get('/vendors/payments', user.token);
      setPayments(res.data.payments || []);
    } catch (error) {
      alert(error.message || 'Failed to process payment');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Partial': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Overdue': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const filtered = payments.filter(p => 
    p.vendor?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.transactionId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex w-full md:w-auto items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <input 
              type="search" 
              placeholder="Search vendor or transaction ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
        
        <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> Record Payment
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Date', 'Vendor Partner', 'Payment Type', 'Amount', 'Method', 'Status', 'Transaction ID'].map(h => (
                  <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-sm font-bold text-slate-400">Loading Payments...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-sm font-bold text-slate-400">No payment records found.</td></tr>
              ) : (
                filtered.map(payment => (
                  <tr key={payment._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{payment.vendor?.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest">{payment.paymentType}</span>
                    </td>
                    <td className="px-6 py-4 font-black text-emerald-600 flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" /> {payment.amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{payment.paymentMethod}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border flex w-fit items-center gap-1 ${getStatusColor(payment.status)}`}>
                        {payment.status === 'Paid' ? <CheckCircle2 className="h-3 w-3" /> : null}
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {payment.transactionId || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900">Record Vendor Payment</h2>
              <p className="text-sm font-bold text-slate-500 mt-1">Settle an advance or final payment for a vendor.</p>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Vendor Partner *</label>
                <select required value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="">Select Vendor...</option>
                  {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                </select>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Amount (₹) *</label>
                  <input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Type</label>
                  <select value={formData.paymentType} onChange={e => setFormData({...formData, paymentType: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-colors">
                    <option value="Advance">Advance</option>
                    <option value="Milestone">Milestone</option>
                    <option value="Final">Final</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Method</label>
                  <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-colors">
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Transaction ID</label>
                  <input type="text" value={formData.transactionId} onChange={e => setFormData({...formData, transactionId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Notes</label>
                <textarea rows="2" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-colors resize-none"></textarea>
              </div>

              <div className="flex items-center gap-4 pt-4 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-600/20">Process Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorPayments;
