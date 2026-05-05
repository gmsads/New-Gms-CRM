import React, { useState } from 'react';
import { Package, Truck, CreditCard, MoreVertical, Plus, Search } from 'lucide-react';

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
  Delivered: 'bg-green-100 text-green-700', Processing: 'bg-blue-100 text-blue-700',
  Pending: 'bg-yellow-100 text-yellow-700', Cancelled: 'bg-red-100 text-red-700',
};
const payStatusStyle = { Paid: 'bg-green-100 text-green-700', Pending: 'bg-yellow-100 text-yellow-700' };

const Vendors = () => {
  const [tab, setTab] = useState('orders');
  const [search, setSearch] = useState('');

  const filteredOrders = mockOrders.filter(o =>
    o.vendor.toLowerCase().includes(search.toLowerCase()) || o.item.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Portal</h1>
          <p className="text-muted-foreground">Track vendor orders, deliveries, and payments.</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="mr-2 h-4 w-4" /> New Order
        </button>
      </div>

      <div className="grid gap-4 grid-cols-3">
        {[
          { label: 'Total Orders', value: mockOrders.length, icon: Package },
          { label: 'Delivered', value: mockOrders.filter(o => o.status === 'Delivered').length, icon: Truck },
          { label: 'Pending Payments', value: payments.filter(p => p.status === 'Pending').length, icon: CreditCard },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-card p-5 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0"><Icon className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b">
        {['orders', 'payments'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t === 'orders' ? 'Orders' : 'Payment History'}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/10">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input type="search" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border bg-background pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/50 border-b">
                <tr>{['Order ID', 'Vendor', 'Item', 'Qty', 'Date', 'Status', 'Amount', ''].map(h => <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map(row => (
                  <tr key={row.id} className="bg-card hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs">{row.id}</td>
                    <td className="px-5 py-3 font-medium">{row.vendor}</td>
                    <td className="px-5 py-3">{row.item}</td>
                    <td className="px-5 py-3">{row.qty}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.date}</td>
                    <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${orderStatusStyle[row.status]}`}>{row.status}</span></td>
                    <td className="px-5 py-3 font-medium">{row.amount}</td>
                    <td className="px-5 py-3"><button className="text-muted-foreground hover:text-foreground"><MoreVertical className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'payments' && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/50 border-b">
                <tr>{['Payment ID', 'Vendor', 'Amount', 'Due Date', 'Method', 'Status'].map(h => <th key={h} className="px-6 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map(row => (
                  <tr key={row.id} className="bg-card hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs">{row.id}</td>
                    <td className="px-6 py-3 font-medium">{row.vendor}</td>
                    <td className="px-6 py-3 font-medium">{row.amount}</td>
                    <td className="px-6 py-3 text-muted-foreground">{row.date}</td>
                    <td className="px-6 py-3 text-muted-foreground">{row.method}</td>
                    <td className="px-6 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${payStatusStyle[row.status]}`}>{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendors;
