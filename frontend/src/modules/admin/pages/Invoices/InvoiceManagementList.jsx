import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { invoiceApi } from '../../../../services/api';
import { FileText, Search, Loader2, AlertCircle, XCircle, ChevronLeft, ChevronRight, Eye, ShieldCheck, CheckCircle2, TrendingUp, XOctagon, Edit3, Trash2 } from 'lucide-react';
import { ViewInvoiceModal } from '../../../../components/common/DocumentPreviews';

const InvoiceManagementList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalInvoices: 0, gstInvoices: 0, nonGstInvoices: 0, cancelled: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  
  // Viewer state
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [tab, setTab] = useState('All'); // All, GST, NON_GST
  const [gstType, setGstType] = useState('All'); // All, INTRA_STATE, INTER_STATE
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      if (search) setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchInvoices();
  }, [page, tab, gstType, debouncedSearch]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page,
        limit: 20,
        invoiceType: tab === 'All' ? undefined : tab,
        gstType: tab === 'GST' && gstType !== 'All' ? gstType : undefined,
        search: debouncedSearch || undefined
      };

      const res = await invoiceApi.list(params, user?.token);
      if (res.success) {
        setInvoices(res.data);
        setTotalPages(res.pages);
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err) {
      console.error('Failed to fetch invoices', err);
      setError('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvoice = async (invoiceId) => {
    if (!window.confirm("Are you sure you want to cancel this invoice? This action cannot be fully undone.")) return;
    
    try {
      const reason = window.prompt("Enter cancellation reason (required):");
      if (!reason) return;

      const res = await invoiceApi.cancel(invoiceId, reason, user?.token);
      if (res.success) {
        fetchInvoices();
      }
    } catch (err) {
      alert(err.message || "Failed to cancel invoice.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-2 md:p-3 font-sans">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 relative">
          <div className="relative z-10">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Invoice Management
            </h1>
          </div>
        </div>

        {/* Premium Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <FileText className="w-24 h-24" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="text-sm font-bold text-slate-500">Total</div>
            </div>
            <div className="text-3xl md:text-4xl font-black text-slate-800">{summary.totalInvoices}</div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl border border-emerald-400/50 p-5 md:p-6 shadow-xl shadow-emerald-500/20 text-white relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <CheckCircle2 className="w-24 h-24" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-md">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-sm font-bold text-emerald-50">GST Invoices</div>
            </div>
            <div className="text-3xl md:text-4xl font-black">{summary.gstInvoices}</div>
          </div>

          <div className="bg-white rounded-3xl border border-indigo-100 p-5 md:p-6 shadow-xl shadow-indigo-100/40 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 text-indigo-500 transition-opacity">
              <FileText className="w-24 h-24" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <FileText className="h-4 w-4" />
              </div>
              <div className="text-sm font-bold text-slate-500">Non-GST Invoices</div>
            </div>
            <div className="text-3xl md:text-4xl font-black text-slate-800">{summary.nonGstInvoices}</div>
          </div>

          <div className="bg-white rounded-3xl border border-rose-100 p-5 md:p-6 shadow-xl shadow-rose-100/40 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 text-rose-500 transition-opacity">
              <XOctagon className="w-24 h-24" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                <XCircle className="h-4 w-4" />
              </div>
              <div className="text-sm font-bold text-slate-500">Cancelled</div>
            </div>
            <div className="text-3xl md:text-4xl font-black text-slate-800">{summary.cancelled}</div>
          </div>
        </div>

        {/* Filter & Search Controls */}
        <div className="bg-white p-2 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-1 w-full overflow-x-auto py-1 pl-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`
              .overflow-x-auto::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {['All', 'GST', 'NON_GST'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setPage(1); }}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  tab === t 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {t === 'NON_GST' ? 'Non-GST Invoices' : t === 'All' ? 'All Invoices' : 'GST Invoices'}
              </button>
            ))}

            {tab === 'GST' && (
              <div className="ml-2 flex items-center gap-1 border-l pl-3 border-slate-200">
                {['All', 'INTRA_STATE', 'INTER_STATE'].map(gt => (
                  <button
                    key={gt}
                    onClick={() => { setGstType(gt); setPage(1); }}
                    className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ${
                      gstType === gt 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-transparent text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {gt === 'All' ? 'All Types' : gt === 'INTRA_STATE' ? 'Intra-State' : 'Inter-State'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative w-full lg:w-72 shrink-0 p-2 lg:p-0 pr-2">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-5 rounded-tl-3xl">Invoice Number</th>
                  <th className="px-6 py-5">Customer Details</th>
                  <th className="px-6 py-5">Client Type</th>
                  {tab !== 'NON_GST' && (
                    <th className="px-6 py-5 text-right">Taxable Amount</th>
                  )}
                  <th className="px-6 py-5 text-right text-indigo-900">Total Amount</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-center rounded-tr-3xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={tab !== 'NON_GST' ? 7 : 6} className="px-6 py-20 text-center text-slate-400">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-500" />
                      <p className="font-medium">Loading invoices securely...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={tab !== 'NON_GST' ? 7 : 6} className="px-6 py-20 text-center text-rose-500">
                      <AlertCircle className="h-10 w-10 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">{error}</p>
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={tab !== 'NON_GST' ? 7 : 6} className="px-6 py-24 text-center text-slate-400">
                      <div className="bg-slate-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="font-bold text-slate-600 mb-1">No invoices found</p>
                      <p className="text-xs">Adjust your search or filters to see more results.</p>
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice, idx) => (
                    <tr key={invoice._id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="font-black text-slate-900 text-[15px]">{invoice.invoiceNumber}</div>
                        <div className="text-[11px] font-bold text-slate-400 mt-1 flex items-center gap-2">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">REF: {invoice.order?.orderNumber || 'N/A'}</span>
                          <span>• {new Date(invoice.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-900">{invoice.customerSnapshot?.company || invoice.customerSnapshot?.name}</div>
                        {invoice.customerSnapshot?.gstin ? (
                          <div className="text-[10px] font-mono font-bold text-indigo-500 mt-1 bg-indigo-50 inline-block px-1.5 py-0.5 rounded">GST: {invoice.customerSnapshot.gstin}</div>
                        ) : (
                          <div className="text-[10px] font-medium text-slate-400 mt-1">No GSTIN</div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        {invoice.invoiceType === 'GST' ? (
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            invoice.gstType === 'INTRA_STATE' 
                              ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20' 
                              : 'bg-blue-50 text-blue-600 ring-1 ring-blue-500/20'
                          }`}>
                            {invoice.gstType === 'INTRA_STATE' ? 'GST INTRA' : 'GST INTER'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 ring-1 ring-slate-200">
                            NON-GST
                          </span>
                        )}
                      </td>
                      {tab !== 'NON_GST' && (
                        <td className="px-6 py-5 text-right font-mono font-medium text-slate-600">
                          ₹{invoice.taxableAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      )}
                      <td className="px-6 py-5 text-right">
                        <span className="font-mono font-black text-slate-900 bg-slate-50 px-2 py-1 rounded">
                          ₹{invoice.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          invoice.status === 'ISSUED' 
                            ? 'bg-emerald-500/10 text-emerald-600' 
                            : 'bg-rose-500/10 text-rose-600'
                        }`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${invoice.status === 'ISSUED' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              if (invoice.order?._id) navigate(`/orders/${invoice.order._id}`);
                            }}
                            className="h-8 px-3 rounded-lg bg-indigo-50 text-indigo-600 flex items-center gap-1.5 text-xs font-bold hover:bg-indigo-600 hover:text-white transition-colors shadow-sm"
                          >
                            <Eye className="h-3.5 w-3.5" /> View Details
                          </button>
                          
                          <button
                            onClick={() => {
                              if (invoice.order?._id) navigate(`/orders/${invoice.order._id}`);
                            }}
                            className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-colors shadow-sm"
                            title="Edit Details (via Order)"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          {invoice.status === 'ISSUED' && ['MD_CEO', 'CEO', 'ADMIN', 'ACCOUNTS'].includes(user?.role) && (
                            <button 
                              onClick={() => handleCancelInvoice(invoice._id)}
                              className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-colors shadow-sm"
                              title="Delete/Cancel Invoice"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Premium Pagination */}
        {!loading && totalPages > 1 && (
          <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="h-9 px-4 flex items-center gap-1 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:hover:bg-white shadow-sm transition-all"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="h-9 px-4 flex items-center gap-1 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:hover:bg-white shadow-sm transition-all"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      {viewingInvoice && (
        <ViewInvoiceModal order={viewingInvoice.order || viewingInvoice} onClose={() => setViewingInvoice(null)} />
      )}
    </div>
  );
};

export default InvoiceManagementList;
