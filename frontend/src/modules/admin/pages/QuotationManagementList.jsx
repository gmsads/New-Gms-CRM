import React, { useState, useEffect } from 'react';
import { 
  Search, Calendar, Filter, FileText, CheckCircle, Clock, 
  Eye, Printer, RefreshCw, Send, ChevronLeft, ChevronRight,
  TrendingUp, Activity, Award, ShoppingBag, ArrowUpRight, Ban
} from 'lucide-react';
import { quotationApi, orderApi } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { ViewQuotationModal } from '../../sales/components/Panels';

const QuotationManagementList = () => {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // -- Pagination & Filtering --
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [previewQuote, setPreviewQuote] = useState(null);
  const [selectedTimelineQuote, setSelectedTimelineQuote] = useState(null);
  const [convertingQuoteId, setConvertingQuoteId] = useState(null);

  // -- Load Data --
  const fetchQuotations = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search,
        status: filterStatus,
        startDate,
        endDate
      };
      // Clean up empty params
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      
      const res = await quotationApi.list(params, user.token);
      if (res.success) {
        setQuotations(res.data || []);
        setTotalDocs(res.total || 0);
        setTotalPages(res.pages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch quotations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [page, filterStatus, startDate, endDate, user]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchQuotations();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // -- Actions --
  const handlePrint = (q) => {
    setPreviewQuote(q);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleResend = (q) => {
    const prospect = q.prospect;
    const phoneClean = prospect?.phone?.replace(/\D/g, '') || '';
    const formattedPhone = phoneClean.length === 10 ? `91${phoneClean}` : phoneClean;
    
    const itemsList = q.items.map(i => `• ${i.name} (x${i.quantity}): ₹${(i.totalCost || 0).toLocaleString()}`).join('\n');
    const validityStr = q.validUntil ? `\n*Validity:* Until ${new Date(q.validUntil).toLocaleDateString()}` : '';
    
    const text = `*QUOTATION: ${q.templateSnapshot?.companyName || 'GMS ADS & MARKETING'}*
Quotation ID: #${q.quotationId || q._id.slice(-6).toUpperCase()}

Hello *${prospect?.name || 'Client'}* (${prospect?.company || 'N/A'}),

Here is a reminder for the estimate requested:

${itemsList}
${validityStr}

--------------------------
*TOTAL AMOUNT:* ₹${Math.round(q.totalAmount).toLocaleString()}
--------------------------

Please review and confirm.

Regards,
*${user?.name || 'Sales Management'}*`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`, '_blank');
  };

  const handleConvertToOrder = async (q) => {
    if (window.confirm(`Are you sure you want to convert Quotation #${q.quotationId || q._id.slice(-6).toUpperCase()} to an active Order?`)) {
      setConvertingQuoteId(q._id);
      try {
        const orderPayload = {
          prospect: q.prospect?._id,
          quotation: q._id,
          clientSnapshot: {
            name: q.prospect?.name,
            phone: q.prospect?.phone,
            company: q.prospect?.company
          },
          lineItems: q.items.map(it => ({
            description: it.name,
            quantity: it.quantity,
            unitPrice: it.unitCost,
            discount: 0,
            gstRate: 0,
            amount: it.totalCost
          })),
          payment: {
            rawSubtotal: q.subtotal,
            discount: 0,
            discountAmount: 0,
            taxableAmount: q.subtotal,
            cgst: 0,
            sgst: 0,
            igst: 0,
            totalAmount: q.totalAmount,
            advance: Math.round(q.totalAmount * 0.5), // Default 50% advance
            paymentMethod: 'UPI',
            requiresApproval: false
          },
          orderType: 'Standard'
        };

        const res = await orderApi.create(orderPayload, user.token);
        if (res.success) {
          // Update Quotation Status to Converted to Order
          await quotationApi.updateStatus(q._id, { status: 'Converted to Order' }, user.token);
          alert('Successfully converted to order!');
          fetchQuotations();
        }
      } catch (err) {
        alert(err.message || 'Failed to convert to order');
      } finally {
        setConvertingQuoteId(null);
      }
    }
  };

  const handleExportCSV = () => {
    if (!quotations.length) return;
    const headers = ['Quotation ID,Client Company,Client Name,Total Amount,Status,Created At,Valid Until,Assigned Executive'];
    const rows = quotations.map(q => [
      q.quotationId || q._id.slice(-6).toUpperCase(),
      `"${q.prospect?.company || 'N/A'}"`,
      `"${q.prospect?.name || 'N/A'}"`,
      q.totalAmount,
      q.status,
      new Date(q.createdAt).toLocaleDateString(),
      q.validUntil ? new Date(q.validUntil).toLocaleDateString() : 'N/A',
      `"${q.executive?.name || 'System'}"`
    ].join(','));
    
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Quotation_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Quotation Management</h1>
          <p className="text-slate-500 mt-1 font-medium">Enterprise registry of all quotations, lifecycle tracking, and analytics conversion status</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="h-11 px-5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors text-sm flex items-center gap-2"
          >
            <ArrowUpRight className="h-4 w-4" /> Export CSV
          </button>
          <button 
            onClick={fetchQuotations}
            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className="h-4 w-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Filters Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by ID, client or sales exec..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs font-semibold shadow-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select 
            value={filterStatus}
            onChange={(e) => { setPage(1); setFilterStatus(e.target.value); }}
            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-700 appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Viewed">Viewed</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Converted to Order">Converted to Order</option>
          </select>
        </div>
        <div className="relative flex gap-2">
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => { setPage(1); setStartDate(e.target.value); }}
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl outline-none text-xs font-semibold"
            placeholder="Start Date"
          />
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => { setPage(1); setEndDate(e.target.value); }}
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl outline-none text-xs font-semibold"
            placeholder="End Date"
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="bg-white rounded-3xl border shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 font-black uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4">Quotation ID</th>
                <th className="px-6 py-4">Client Company</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Executive</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Validity</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center text-slate-400 italic">
                    No quotations found in registry
                  </td>
                </tr>
              ) : (
                quotations.map(q => (
                  <tr key={q._id} className="hover:bg-slate-50/50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <span className="font-mono font-black text-slate-400">#{q.quotationId || q._id.slice(-6).toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{q.prospect?.company || q.prospect?.name || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{q.prospect?.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ₹{q.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {q.executive?.name || 'System'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        q.status === 'Sent' ? 'bg-blue-50 text-blue-600' :
                        q.status === 'Viewed' ? 'bg-purple-50 text-purple-600' :
                        q.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        q.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                        q.status === 'Converted to Order' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {q.validUntil ? new Date(q.validUntil).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => setPreviewQuote(q)}
                          title="Preview"
                          className="p-2 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-lg transition-colors border border-slate-100 shadow-sm"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handlePrint(q)}
                          title="Print Document"
                          className="p-2 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-lg transition-colors border border-slate-100 shadow-sm"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handleResend(q)}
                          title="Resend WhatsApp"
                          className="p-2 bg-slate-50 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors border border-slate-100 shadow-sm text-emerald-600"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => setSelectedTimelineQuote(q)}
                          title="View Logs / Timeline"
                          className="p-2 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors border border-slate-100 shadow-sm text-indigo-600"
                        >
                          <Activity className="h-3.5 w-3.5" />
                        </button>
                        {q.status !== 'Converted to Order' && (
                          <button 
                            disabled={convertingQuoteId === q._id}
                            onClick={() => handleConvertToOrder(q)}
                            title="Convert to Order"
                            className="p-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors border border-emerald-100 shadow-sm text-emerald-600 disabled:opacity-50"
                          >
                            {convertingQuoteId === q._id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ShoppingBag className="h-3.5 w-3.5" />
                            )}
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

        {/* Pagination bar */}
        <div className="bg-slate-50/50 border-t px-6 py-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            Showing Page {page} of {totalPages} ({totalDocs} total quotations)
          </span>
          <div className="flex gap-2">
            <button 
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="h-9 px-3 rounded-lg border bg-white hover:bg-slate-50 font-bold transition-all disabled:opacity-50 disabled:hover:bg-white flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button 
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="h-9 px-3 rounded-lg border bg-white hover:bg-slate-50 font-bold transition-all disabled:opacity-50 disabled:hover:bg-white flex items-center gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewQuote && (
        <ViewQuotationModal 
          quotation={previewQuote}
          onClose={() => setPreviewQuote(null)}
        />
      )}

      {/* Timeline Modal */}
      {selectedTimelineQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center pb-4 border-b">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Activity History</h3>
                <p className="text-slate-400 text-xs mt-0.5">Audit log for Quotation #{selectedTimelineQuote.quotationId || selectedTimelineQuote._id.slice(-6).toUpperCase()}</p>
              </div>
              <button 
                onClick={() => setSelectedTimelineQuote(null)}
                className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-slate-50 font-bold text-slate-400"
              >
                ×
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              {selectedTimelineQuote.activityLogs?.length ? (
                <div className="relative border-l border-slate-100 ml-4 space-y-6 pl-6">
                  {selectedTimelineQuote.activityLogs.map((log, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border bg-white border-indigo-600 shadow shadow-indigo-100 flex items-center justify-center" />
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{log.action || 'Updated'}</span>
                        <p className="text-xs font-semibold text-slate-700 mt-1">{log.notes || 'Status updated or modified'}</p>
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 font-medium">
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                          <span>•</span>
                          <span>User ID: {log.performedBy}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 italic">No history log recorded for this quotation.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationManagementList;
