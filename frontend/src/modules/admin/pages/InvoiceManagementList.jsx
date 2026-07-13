import React, { useState, useEffect } from 'react';
import { 
  Search, Calendar, Filter, FileText, CheckCircle, Clock, 
  Eye, Printer, RefreshCw, Send, ChevronLeft, ChevronRight,
  TrendingUp, Activity, Award, ShoppingBag, ArrowUpRight, Ban, IndianRupee, Landmark, CheckSquare
} from 'lucide-react';
import { orderApi } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useCompanyProfile } from '../../../context/CompanyProfileContext';
import { ViewInvoiceModal } from '../../sales/components/Panels';

const formatUKDate = (dateVal) => {
  if (!dateVal) return new Date().toLocaleDateString('en-GB');
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-');
      return `${d}/${m}/${y}`;
    }
  }
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? String(dateVal) : d.toLocaleDateString('en-GB');
};

const InvoiceManagementList = () => {
  const { user } = useAuth();
  const { profile } = useCompanyProfile();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // -- Pagination & Filtering --
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  
  const [search, setSearch] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Summary KPIs
  const [summary, setSummary] = useState({
    totalValue: 0,
    totalReceived: 0,
    totalBalance: 0
  });

  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [selectedTimelineOrder, setSelectedTimelineOrder] = useState(null);
  const [recordingPaymentFor, setRecordingPaymentFor] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'UPI',
    reference: '',
    notes: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // -- Load Data --
  const fetchInvoices = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search,
        paymentStatus: filterPaymentStatus,
        startDate,
        endDate
      };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      
      const res = await orderApi.list(params, user.token);
      if (res.success || res.data) {
        const orderList = res.data || [];
        setInvoices(orderList);
        setTotalDocs(res.total || orderList.length || 0);
        setTotalPages(res.pages || Math.ceil((res.total || orderList.length || 0) / limit) || 1);

        // Calculate KPI summary across loaded list
        let totalVal = 0;
        let totalRec = 0;
        orderList.forEach(ord => {
          const val = Number(ord.grandTotal !== undefined ? ord.grandTotal : (ord.totalAmount || 0));
          const rec = Number(ord.totalPaid || 0);
          totalVal += val;
          totalRec += rec;
        });
        setSummary({
          totalValue: totalVal,
          totalReceived: totalRec,
          totalBalance: Math.max(0, totalVal - totalRec)
        });
      }
    } catch (err) {
      console.error('Failed to fetch invoice registry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, filterPaymentStatus, startDate, endDate, user]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchInvoices();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // -- Actions --
  const handlePrint = (order) => {
    setPreviewInvoice(order);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleResendWhatsApp = (order) => {
    const client = order.clientSnapshot || order.prospect || {};
    const phoneClean = (client.phone || client.mobile || '').replace(/\D/g, '');
    const formattedPhone = phoneClean.length === 10 ? `91${phoneClean}` : phoneClean;
    
    const invoiceNo = order.invoiceNumber || order.orderNumber || order._id?.slice(-6)?.toUpperCase() || 'N/A';
    const totalAmount = Number(order.grandTotal !== undefined ? order.grandTotal : (order.totalAmount || 0));
    const totalPaid = Number(order.totalPaid || 0);
    const balance = Math.max(0, totalAmount - totalPaid);
    
    const itemsList = (order.lineItems || []).map(i => `• ${i.description || i.name} (x${i.quantity}): ₹${Number(i.amount || (i.quantity * i.unitPrice) || 0).toLocaleString()}`).join('\n');
    
    const text = `*TAX INVOICE: ${profile?.companyName || 'GLOBAL MARKETING SOLUTIONS'}*
Invoice No: #${invoiceNo}
Date: ${formatUKDate(order.invoiceDate || order.orderDate || order.createdAt)}

Hello *${client.contactPerson || client.name || 'Client'}* (${client.company || 'N/A'}),

Here is the invoice summary for your order:

${itemsList || 'Order items exactly as agreed'}

--------------------------
*TOTAL INVOICE AMOUNT:* ₹${totalAmount.toLocaleString('en-IN')}
*AMOUNT RECEIVED:* ₹${totalPaid.toLocaleString('en-IN')}
*BALANCE DUE:* ₹${balance.toLocaleString('en-IN')}
--------------------------

${balance > 0 && profile?.bankDetails ? `*Payment Bank Details:*
Bank: ${profile.bankDetails.bankName}
A/C Name: ${profile.bankDetails.accountName}
A/C No: ${profile.bankDetails.accountNumber}
IFSC Code: ${profile.bankDetails.ifscCode}
${profile.qrCode?.upiId ? `UPI ID: ${profile.qrCode.upiId}` : ''}` : ''}

Thank you for your business!

Regards,
*${user?.name || 'Accounts Management'}*`;

    const encodedText = encodeURIComponent(text);
    if (formattedPhone) {
      window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`, '_blank');
    } else {
      alert('No valid mobile number found for this client. You can copy the message or add a mobile number.');
    }
  };

  const handleOpenRecordPayment = (order) => {
    setRecordingPaymentFor(order);
    const totalAmount = Number(order.grandTotal !== undefined ? order.grandTotal : (order.totalAmount || 0));
    const totalPaid = Number(order.totalPaid || 0);
    const balance = Math.max(0, totalAmount - totalPaid);
    setPaymentForm({
      amount: balance > 0 ? balance : '',
      method: 'UPI',
      reference: '',
      notes: 'Payment received against Invoice #' + (order.invoiceNumber || order.orderNumber || order._id?.slice(-6)?.toUpperCase())
    });
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!recordingPaymentFor || !paymentForm.amount) return;
    setSubmittingPayment(true);
    try {
      const res = await orderApi.addPayment(recordingPaymentFor._id, {
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        reference: paymentForm.reference,
        notes: paymentForm.notes
      }, user.token);

      if (res.success || res.data) {
        alert('Payment recorded successfully!');
        setRecordingPaymentFor(null);
        fetchInvoices();
      } else {
        alert(res.message || 'Error recording payment');
      }
    } catch (err) {
      alert(err.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleExportCSV = () => {
    if (!invoices.length) return;
    const headers = ['Invoice ID,Client Company,Client Name,Total Billed,Amount Received,Balance Due,Payment Status,Invoice Date,Executive'];
    const rows = invoices.map(ord => {
      const totalAmount = Number(ord.grandTotal !== undefined ? ord.grandTotal : (ord.totalAmount || 0));
      const totalPaid = Number(ord.totalPaid || 0);
      const balance = Math.max(0, totalAmount - totalPaid);
      return [
        ord.invoiceNumber || ord.orderNumber || ord._id.slice(-6).toUpperCase(),
        `"${ord.clientSnapshot?.company || ord.prospect?.company || 'N/A'}"`,
        `"${ord.clientSnapshot?.contactPerson || ord.clientSnapshot?.name || 'N/A'}"`,
        totalAmount,
        totalPaid,
        balance,
        ord.paymentStatus || (balance <= 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Pending')),
        formatUKDate(ord.invoiceDate || ord.orderDate || ord.createdAt),
        `"${ord.executive?.name || 'System'}"`
      ].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Invoice_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Invoice Management</h1>
          <p className="text-slate-500 mt-1 font-medium">Enterprise registry of all generated tax invoices, billing lifecycle, and payment reconciliation</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="h-11 px-5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors text-sm flex items-center gap-2"
          >
            <ArrowUpRight className="h-4 w-4" /> Export CSV
          </button>
          <button 
            onClick={fetchInvoices}
            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className="h-4 w-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* KPI Cards Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <FileText className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Invoices</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalDocs}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <TrendingUp className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Billed Value</p>
            <p className="text-2xl font-black text-slate-900 mt-1">₹{summary.totalValue.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Received</p>
            <p className="text-2xl font-black text-slate-900 mt-1">₹{summary.totalReceived.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <Clock className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Balance Due</p>
            <p className="text-2xl font-black text-rose-600 mt-1">₹{summary.totalBalance.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Filters Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Invoice No, client or contact..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs font-semibold shadow-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select 
            value={filterPaymentStatus}
            onChange={(e) => { setPage(1); setFilterPaymentStatus(e.target.value); }}
            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-700 appearance-none cursor-pointer"
          >
            <option value="">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Pending">Pending / Unpaid</option>
            <option value="Overdue">Overdue</option>
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
                <th className="px-6 py-4">Invoice ID</th>
                <th className="px-6 py-4">Client Company</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Received / Balance</th>
                <th className="px-6 py-4">Payment Status</th>
                <th className="px-6 py-4">Invoice Date</th>
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
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center text-slate-400 italic">
                    No invoices found in registry
                  </td>
                </tr>
              ) : (
                invoices.map(ord => {
                  const totalAmount = Number(ord.grandTotal !== undefined ? ord.grandTotal : (ord.totalAmount || 0));
                  const totalPaid = Number(ord.totalPaid || 0);
                  const balance = Math.max(0, totalAmount - totalPaid);
                  const payStatus = ord.paymentStatus || (balance <= 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Pending'));

                  return (
                    <tr key={ord._id} className="hover:bg-slate-50/50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <span className="font-mono font-black text-slate-900">
                          #{ord.invoiceNumber || ord.orderNumber || ord._id.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{ord.clientSnapshot?.company || ord.prospect?.company || ord.clientSnapshot?.name || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {ord.clientSnapshot?.contactPerson && `Attn: ${ord.clientSnapshot.contactPerson} • `}
                          {ord.clientSnapshot?.phone || ord.clientSnapshot?.mobile || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        ₹{totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-emerald-600 font-bold">Rec: ₹{totalPaid.toLocaleString('en-IN')}</div>
                        <div className={`text-[11px] font-bold mt-0.5 ${balance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          Due: ₹{balance.toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          payStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                          payStatus === 'Partial' ? 'bg-amber-100 text-amber-800' :
                          payStatus === 'Verified' ? 'bg-blue-100 text-blue-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {payStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-semibold">
                        {formatUKDate(ord.invoiceDate || ord.orderDate || ord.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => setPreviewInvoice(ord)}
                            title="Preview Exact Tax Invoice"
                            className="p-2 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-lg transition-colors border border-slate-100 shadow-sm"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handlePrint(ord)}
                            title="Print Tax Invoice"
                            className="p-2 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-lg transition-colors border border-slate-100 shadow-sm"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleResendWhatsApp(ord)}
                            title="Send via WhatsApp"
                            className="p-2 bg-slate-50 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors border border-slate-100 shadow-sm text-emerald-600"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => setSelectedTimelineOrder(ord)}
                            title="View Audit Logs / Timeline"
                            className="p-2 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors border border-slate-100 shadow-sm text-indigo-600"
                          >
                            <Activity className="h-3.5 w-3.5" />
                          </button>
                          {balance > 0 && (
                            <button 
                              onClick={() => handleOpenRecordPayment(ord)}
                              title="Record Payment / Settle Balance"
                              className="p-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors border border-emerald-100 shadow-sm text-emerald-600 font-bold flex items-center gap-1 px-2.5"
                            >
                              <IndianRupee className="h-3.5 w-3.5" /> Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="bg-slate-50/50 border-t px-6 py-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            Showing Page {page} of {totalPages} ({totalDocs} total invoices)
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
      {previewInvoice && (
        <ViewInvoiceModal 
          order={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
        />
      )}

      {/* Timeline / Audit Modal */}
      {selectedTimelineOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center pb-4 border-b">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Invoice Ledger & History</h3>
                <p className="text-slate-400 text-xs mt-0.5">Audit log for Invoice #{selectedTimelineOrder.invoiceNumber || selectedTimelineOrder.orderNumber || selectedTimelineOrder._id.slice(-6).toUpperCase()}</p>
              </div>
              <button 
                onClick={() => setSelectedTimelineOrder(null)}
                className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-slate-50 font-bold text-slate-400"
              >
                ×
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              {/* Payment ledger summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-2">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Grand Total:</span>
                  <span>₹{Number(selectedTimelineOrder.grandTotal || selectedTimelineOrder.totalAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-600">
                  <span>Total Amount Paid:</span>
                  <span>₹{Number(selectedTimelineOrder.totalPaid || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-rose-600 border-t pt-2">
                  <span>Pending Balance:</span>
                  <span>₹{Math.max(0, Number(selectedTimelineOrder.grandTotal || selectedTimelineOrder.totalAmount || 0) - Number(selectedTimelineOrder.totalPaid || 0)).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {selectedTimelineOrder.activityLogs?.length ? (
                <div className="relative border-l border-slate-100 ml-4 space-y-6 pl-6">
                  {selectedTimelineOrder.activityLogs.map((log, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border bg-white border-indigo-600 shadow shadow-indigo-100 flex items-center justify-center" />
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{log.action || 'Updated'}</span>
                        <p className="text-xs font-semibold text-slate-700 mt-1">{log.notes || 'Status updated or payment received'}</p>
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 font-medium">
                          <span>{new Date(log.timestamp || log.createdAt || Date.now()).toLocaleString()}</span>
                          <span>•</span>
                          <span>By {log.performedBy?.name || log.by || 'System'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 py-10 text-xs italic">No historical logs recorded for this invoice yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {recordingPaymentFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <IndianRupee className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Record Payment</h3>
                  <p className="text-slate-400 text-xs">Invoice #{recordingPaymentFor.invoiceNumber || recordingPaymentFor.orderNumber || recordingPaymentFor._id.slice(-6).toUpperCase()}</p>
                </div>
              </div>
              <button 
                onClick={() => setRecordingPaymentFor(null)}
                className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-slate-50 font-bold text-slate-400"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="pt-6 space-y-4 text-xs">
              <div>
                <label className="font-black uppercase tracking-widest text-slate-400 block mb-1">Amount Received (₹)</label>
                <input 
                  type="number" 
                  step="any"
                  required
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-2xl px-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
                  placeholder="Enter amount paid..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-black uppercase tracking-widest text-slate-400 block mb-1">Payment Method</label>
                  <select 
                    value={paymentForm.method}
                    onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-2xl px-3 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="NEFT/IMPS">NEFT / IMPS / RTGS</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="font-black uppercase tracking-widest text-slate-400 block mb-1">Reference No / UTR</label>
                  <input 
                    type="text" 
                    value={paymentForm.reference}
                    onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-2xl px-4 font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="e.g. UTR / Ref ID"
                  />
                </div>
              </div>

              <div>
                <label className="font-black uppercase tracking-widest text-slate-400 block mb-1">Remarks / Notes</label>
                <textarea 
                  rows="3"
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Additional payment verification remarks..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button 
                  type="button"
                  onClick={() => setRecordingPaymentFor(null)}
                  className="h-11 px-6 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submittingPayment}
                  className="h-11 px-6 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-200 disabled:opacity-70"
                >
                  {submittingPayment ? 'Saving...' : 'Confirm & Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManagementList;
