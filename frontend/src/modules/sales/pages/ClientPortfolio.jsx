import React, { useState } from 'react';
import { Search, Plus, MoreVertical, Filter, Download, Briefcase, RefreshCw } from 'lucide-react';

const mockClients = [
  { id: 1, name: 'Acme Corp', contact: 'John Smith', email: 'john@acme.com', status: 'Active', spend: '₹1,25,000' },
  { id: 2, name: 'Global Tech', contact: 'Sarah Jones', email: 'sarah@globaltech.com', status: 'Onboarding', spend: '₹0' },
  { id: 3, name: 'Stark Industries', contact: 'Tony Stark', email: 'tony@stark.com', status: 'Active', spend: '₹4,50,000' },
  { id: 4, name: 'Wayne Enterprises', contact: 'Bruce Wayne', email: 'bruce@wayne.com', status: 'Lead', spend: '₹0' },
  { id: 5, name: 'Umbrella Corp', contact: 'Albert Wesker', email: 'albert@umbrella.com', status: 'Churned', spend: '₹52,000' },
];

const statusStyle = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Onboarding: 'bg-blue-50 text-blue-700 border-blue-100',
  Lead: 'bg-amber-50 text-amber-700 border-amber-100',
  Churned: 'bg-rose-50 text-rose-700 border-rose-100',
};

const ClientPortfolio = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = mockClients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Client Portfolio</h1>
          <p className="text-sm font-semibold text-slate-500">Global relationship management and lifetime value tracking.</p>
        </div>
        <button className="h-11 px-6 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-600 shadow-lg shadow-slate-200 transition-all active:scale-95 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Partner
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <input type="search" placeholder="Search by partner or contact..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none focus:bg-white focus:border-blue-600 transition-all shadow-inner" />
           </div>
           <div className="flex items-center gap-3">
              <button className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filter
              </button>
              <button className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                <Download className="h-4 w-4" /> Export
              </button>
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-8 py-5">Corporate Identity</th>
                <th className="px-8 py-5">Relationship Manager</th>
                <th className="px-8 py-5">Strategic Status</th>
                <th className="px-8 py-5 text-right">Lifetime Value</th>
                <th className="px-8 py-5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{client.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {client.id.toString().padStart(4, '0')}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">{client.contact}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{client.email}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${statusStyle[client.status] || 'bg-slate-100 text-slate-600'}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-slate-900">{client.spend}</td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-slate-300 hover:text-slate-900"><MoreVertical className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <Briefcase className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">No Portfolio Entities Identified</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientPortfolio;
