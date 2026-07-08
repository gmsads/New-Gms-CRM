import React, { useState } from 'react';
import { Package, Truck, CreditCard, MoreVertical, Plus, Search, RefreshCw } from 'lucide-react';

const mockOrders = [
  { id: '#V-1021', vendor: 'PrintFast Ltd.', item: 'Banner Prints', qty: 50, status: 'Delivered', date: 'Apr 22', amount: '₹8,500' },
  { id: '#V-1022', vendor: 'StandeeKing', item: '6ft Standees', qty: 10, status: 'Processing', date: 'Apr 25', amount: '₹4,200' },
  { id: '#V-1023', vendor: 'PrintFast Ltd.', item: 'A4 Brochures', qty: 200, status: 'Pending', date: 'Apr 26', amount: '₹6,000' },
  { id: '#V-1024', vendor: 'MediaDisplay Co.', item: 'LED Hoardings', qty: 2, status: 'Delivered', date: 'Apr 18', amount: '₹45,000' },
  { id: '#V-1025', vendor: 'DigitalPrint Hub', item: 'Vinyl Wraps', qty: 5, status: 'Cancelled', date: 'Apr 20', amount: '₹12,000' },
];

const payments = [
  { id: '#P-501', vendor: 'PrintFast Ltd.', amount: '₹8,500', date: 'Apr 23', status: 'Paid', method: 'Bank Transfer' },
  { id: '#P-502', vendor: 'MediaDisplay Co.', amount: '₹45,000', date: 'Apr 20', status: 'Paid', method: 'Cheque' },
  { id: '#P-503', vendor: 'StandeeKing', amount: '₹4,200', date: 'Apr 28', status: 'Pending', method: '—' },
  { id: '#P-504', vendor: 'PrintFast Ltd.', amount: '₹6,000', date: 'Apr 30', status: 'Pending', method: '—' },
];

const orderStatusStyle = {
  Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Processing: 'bg-blue-50 text-blue-700 border-blue-100',
  Pending: 'bg-amber-50 text-amber-700 border-amber-100',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
};
const payStatusStyle = { Paid: 'bg-emerald-50 text-emerald-700 border-emerald-100', Pending: 'bg-amber-50 text-amber-700 border-amber-100' };

const VendorPortal = () => {
  const [tab, setTab] = useState('orders');
  const [search, setSearch] = useState('');

  const filteredOrders = mockOrders.filter(o =>
    o.vendor.toLowerCase().includes(search.toLowerCase()) || o.item.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Vendor Management</h1>
          <p className="text-sm font-semibold text-slate-500">Track raw material procurement and vendor settlements.</p>
        </div>
        <button className="h-10 px-6 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg shadow-slate-200 hover:opacity-90 transition-all active:scale-95 flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Order
        </button>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {[
          { label: 'Active Vendor Orders', value: mockOrders.length, icon: Package, color: 'blue' },
          { label: 'Successfully Delivered', value: mockOrders.filter(o => o.status === 'Delivered').length, icon: Truck, color: 'emerald' },
          { label: 'Pending Payouts', value: payments.filter(p => p.status === 'Pending').length, icon: CreditCard, color: 'amber' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center bg-${color}-50 text-${color}-600 border border-${color}-100 shadow-inner`}><Icon className="h-7 w-7" /></div>
            <div>
              <p className="text-3xl font-black text-slate-900 leading-none mb-1">{value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-8 px-8 border-b border-slate-50">
          {['orders', 'payments'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`relative py-6 text-sm font-black uppercase tracking-widest transition-all ${tab === t ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
              {t === 'orders' ? 'Supply Orders' : 'Payment Ledger'}
              {tab === t && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full shadow-[0_-4px_12px_rgba(37,99,235,0.5)]" />}
            </button>
          ))}
        </div>

        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
             <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <input type="search" placeholder="Search by vendor or item..." value={search} onChange={e => setSearch(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none focus:border-blue-600 focus:bg-white transition-all shadow-inner" />
             </div>
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Filter:</span>
                <select className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase outline-none focus:border-blue-600">
                  <option>All Statuses</option>
                  <option>Delivered</option>
                  <option>Processing</option>
                </select>
             </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-50">
            <table className="w-full text-left">
              {tab === 'orders' ? (
                <>
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <tr>{['Order ID', 'Vendor Partner', 'Item Description', 'Qty', 'Timeline', 'Status', 'Cost', ''].map(h => <th key={h} className="px-6 py-5">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredOrders.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5 font-mono text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{row.id}</td>
                        <td className="px-6 py-5 font-bold text-slate-900">{row.vendor}</td>
                        <td className="px-6 py-5 text-sm text-slate-600">{row.item}</td>
                        <td className="px-6 py-5 text-sm font-black text-slate-700">{row.qty}</td>
                        <td className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase">{row.date}</td>
                        <td className="px-6 py-5"><span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${orderStatusStyle[row.status]}`}>{row.status}</span></td>
                        <td className="px-6 py-5 font-black text-slate-900">{row.amount}</td>
                        <td className="px-6 py-5"><button className="text-slate-400 hover:text-slate-900"><MoreVertical className="h-4 w-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </>
              ) : (
                <>
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <tr>{['Payment ID', 'Vendor Partner', 'Settlement Amount', 'Scheduled Date', 'Gateway', 'Status'].map(h => <th key={h} className="px-6 py-5">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {payments.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5 font-mono text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{row.id}</td>
                        <td className="px-6 py-5 font-bold text-slate-900">{row.vendor}</td>
                        <td className="px-6 py-5 font-black text-slate-900">{row.amount}</td>
                        <td className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase">{row.date}</td>
                        <td className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase">{row.method}</td>
                        <td className="px-6 py-5"><span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${payStatusStyle[row.status]}`}>{row.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPortal;
