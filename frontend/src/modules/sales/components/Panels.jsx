import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, CheckCircle, Clock, MapPin, ShieldCheck,
  Plus, X, Upload, Printer, IndianRupee, AlertCircle, FileText, MessageCircle, Image, Link, Edit, Trash2, XCircle, AlertTriangle, Quote, User, Phone, Eye, ShoppingBag
} from 'lucide-react';
import { requirementTypes } from '../data/constants';
import { useAuth } from '../../../context/AuthContext';
import { 
  prospectApi, orderApi, appointmentApi, 
  employeeApi, productApi, quotationApi 
} from '../../../services/api';
import { ProductCatalogueModal } from '../../../pages/SalesExec/components/ProductCatalogueModal';

// ─── Appointment Hub ──────────────────────────────────────────────────────────
export const AppointmentHub = ({ appointments = [], onSchedule }) => (
  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
    <div className="flex items-center justify-between p-5 border-b">
      <div>
        <h3 className="font-bold text-base">📅 Appointment Hub</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{appointments.length} upcoming meetings</p>
      </div>
      <button onClick={onSchedule}
        className="h-8 px-3 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5"
        style={{ background: '#7c3aed' }}>
        <Plus className="h-3.5 w-3.5" /> Schedule
      </button>
    </div>
    {appointments.length === 0 ? (
      <div className="p-8 text-center text-muted-foreground text-sm">
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
        No appointments scheduled
      </div>
    ) : (
      <div className="divide-y divide-border">
        {appointments.map((apt, i) => (
          <div key={apt._id || i} className="flex items-start gap-4 p-4 hover:bg-purple-50/30 transition-colors">
            <div className="h-10 w-10 rounded-xl flex flex-col items-center justify-center shrink-0 text-white font-bold text-xs" style={{ background: '#7c3aed' }}>
              <span>{apt.date === 'Today' ? 'NOW' : (apt.date || '').replace('Apr ', '')}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{apt.client || apt.prospect?.name}</span>
                {apt.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5">
                    <ShieldCheck className="h-3 w-3" /> Manager Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{apt.company || apt.prospect?.company}</p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{apt.time}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{apt.location}</span>
              </div>
              <span className="inline-block mt-1.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-semibold px-2 py-0.5">{apt.purpose}</span>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button className="h-7 px-2 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors">Confirm</button>
              <button className="h-7 px-2 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors">Reschedule</button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ─── Order List ───────────────────────────────────────────────────────────────
export const OrderList = ({ orders = [], onCreateOrder, onUploadPayment, onViewDetails, onLineItemUpdated, compact, hideCompleted }) => {
  const { user } = useAuth();
  const [updatingLineItem, setUpdatingLineItem] = useState(null);
  const statusColors = { Confirmed: 'bg-blue-100 text-blue-700', 'In Production': 'bg-amber-100 text-amber-700', 'Design Review': 'bg-purple-100 text-purple-700', Completed: 'bg-green-100 text-green-700' };
  const paymentColors = { Partial: 'bg-orange-100 text-orange-700', Paid: 'bg-green-100 text-green-700', Pending: 'bg-red-100 text-red-700' };

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All Months');
  const months = ['All Months', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const filteredOrders = (orders || []).filter(o => {
    const matchSearch = !search || [o.orderNumber, o.id, o.clientSnapshot?.name, o.client].some(v => String(v || '').toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    const matchPayment = paymentFilter === 'All' || o.paymentStatus === paymentFilter;
    let matchMonth = true;
    if (monthFilter !== 'All Months') {
      const oMonth = new Date(o.createdAt || o.date || new Date()).toLocaleString('default', { month: 'long' });
      matchMonth = oMonth === monthFilter;
    }
    const matchHide = hideCompleted ? !['Completed', 'Cancelled'].includes(o.status) : true;
    return matchSearch && matchStatus && matchPayment && matchMonth && matchHide;
  });

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      {!compact && (
        <div className="rounded-xl border bg-white shadow-sm p-4">
          <div className="flex gap-4 mb-4">
            <div className="flex flex-col gap-1 w-48">
              <label className="text-sm font-medium text-slate-700">Year:</label>
              <select className="h-10 rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]">
                <option>All Years</option>
                <option>2026</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 w-48">
              <label className="text-sm font-medium text-slate-700">Month:</label>
              <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="h-10 rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]">
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1 w-48">
              <label className="text-sm font-medium text-slate-700">Status:</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]">
                <option value="All">All Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In Production">In Production</option>
                <option value="Design Review">Design Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 w-48">
              <label className="text-sm font-medium text-slate-700">Payment:</label>
              <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className="h-10 rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]">
                <option value="All">All Payments</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by order ID, client name..."
              className="h-12 w-full rounded-full border border-slate-300 px-6 text-sm outline-none focus:border-[#003366]"
            />
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-2 h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:opacity-90" style={{ background: '#4caf50' }}>
              <FileText className="h-4 w-4" /> Export to Excel
            </button>
            <button className="flex items-center gap-2 h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:opacity-90" style={{ background: '#00acc1' }}>
              <Printer className="h-4 w-4" /> Print Report
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h3 className="font-bold text-base">🧾 My Orders</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{filteredOrders.length} active orders</p>
          </div>
        </div>
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
            No orders match your filters
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredOrders.map((order, i) => (
              <div key={order._id || order.id || i} className="p-4 hover:bg-green-50/20 transition-colors">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono font-bold text-sm text-blue-700">{order.orderNumber || order.id}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>{order.status}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${paymentColors[order.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>{order.paymentStatus} Payment</span>
                    </div>
                    <p className="font-semibold text-sm">
                      {order.clientSnapshot?.company 
                        ? `${order.clientSnapshot.company} (${order.clientSnapshot.name || 'No Contact'})` 
                        : (order.clientSnapshot?.name || order.client)}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">Total: <span className="font-bold text-foreground">₹{order.grandTotal?.toLocaleString('en-IN') || order.amount}</span></span>
                      <span className="text-xs text-muted-foreground">Paid: <span className="font-semibold text-emerald-600">₹{order.totalPaid?.toLocaleString('en-IN') || order.advance}</span></span>
                      <span className="text-xs text-muted-foreground">Balance: <span className="font-bold text-red-500">₹{( (order.grandTotal || 0) - (order.totalPaid || 0) ).toLocaleString('en-IN')}</span></span>
                    </div>
                  </div>
                </div>
                {order.lineItems && order.lineItems.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Added Products / Services</h4>
                    <div className="space-y-2">
                      {order.lineItems.map((item, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 gap-3">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800">{item.description}</p>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Qty: {item.quantity} | Unit Price: ₹{item.unitPrice}</p>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 mt-3 sm:mt-0">
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              {/* Designer Status */}
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Design</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                  ${item.designerStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                    item.designerStatus === 'work-in progress' ? 'bg-blue-100 text-blue-700' :
                                    item.designerStatus === 'reached to designer' ? 'bg-amber-100 text-amber-700' :
                                    'bg-slate-200 text-slate-700'}`}>
                                  {item.designerStatus?.replace('designer ', '') || 'update pending'}
                                </span>
                                {item.designFileUrl && (
                                  <a href={item.designFileUrl} target="_blank" rel="noreferrer" className="flex items-center text-[10px] font-bold text-blue-600 hover:underline">
                                    <FileText className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                              
                              {/* Operation Status */}
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Ops</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                  ${item.operationStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                    item.operationStatus === 'work-in progress' ? 'bg-blue-100 text-blue-700' :
                                    item.operationStatus === 'reached to operation' ? 'bg-amber-100 text-amber-700' :
                                    'bg-slate-200 text-slate-700'}`}>
                                  {item.operationStatus?.replace('operation ', '') || 'update pending'}
                                </span>
                                {item.operationFileUrl && (
                                  <a href={item.operationFileUrl} target="_blank" rel="noreferrer" className="flex items-center text-[10px] font-bold text-blue-600 hover:underline">
                                    <FileText className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                              
                              {/* Service Status */}
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Service</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                  ${item.serviceStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                    item.serviceStatus === 'work-in progress' ? 'bg-blue-100 text-blue-700' :
                                    item.serviceStatus === 'reached to service' ? 'bg-amber-100 text-amber-700' :
                                    item.serviceStatus === 'payment pending' ? 'bg-red-100 text-red-700' :
                                    'bg-slate-200 text-slate-700'}`}>
                                  {item.serviceStatus?.replace('service ', '') || 'update pending'}
                                </span>
                                {item.serviceFileUrl && (
                                  <a href={item.serviceFileUrl} target="_blank" rel="noreferrer" className="flex items-center text-[10px] font-bold text-blue-600 hover:underline">
                                    <FileText className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>

                            {(user?.role === 'DESIGNER' || user?.role === 'OPERATION_EXEC' || user?.role === 'OPERATION_MANAGER' || user?.role === 'ADMIN' || user?.role === 'MD_CEO') && (
                              <button 
                                onClick={() => setUpdatingLineItem({ order, itemIndex: idx, item })}
                                className="flex items-center gap-1 h-7 px-2.5 rounded text-white text-xs font-semibold hover:opacity-90 transition-opacity" style={{ background: '#7c3aed' }}>
                                <Edit className="h-3 w-3" /> Update
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button onClick={() => onUploadPayment?.(order)} className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors">
                    <Upload className="h-3 w-3" /> Upload Payment
                  </button>
                  <button onClick={() => onViewDetails?.(order)} className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors">
                    <FileText className="h-3 w-3" /> View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {updatingLineItem && (
        <UpdateLineItemModal 
          order={updatingLineItem.order} 
          itemIndex={updatingLineItem.itemIndex}
          item={updatingLineItem.item}
          user={user}
          onClose={() => setUpdatingLineItem(null)}
          onSuccess={() => {
            setUpdatingLineItem(null);
            onLineItemUpdated?.();
          }}
        />
      )}
    </div>
  );
};

// ─── Update Line Item Modal ───────────────────────────────────────────────────
export const UpdateLineItemModal = ({ order, itemIndex, item, user, onClose, onSuccess }) => {
  const isDesigner = user?.role === 'DESIGNER' || user?.role === 'ADMIN' || user?.role === 'MD_CEO';
  const isOps = user?.role === 'OPERATION_EXEC' || user?.role === 'OPERATION_MANAGER' || user?.role === 'ADMIN' || user?.role === 'MD_CEO';
  
  // Decide which tab to show by default
  const [activeTab, setActiveTab] = useState(isDesigner ? 'designer' : (isOps ? 'ops' : 'service'));

  const [designerStatus, setDesignerStatus] = useState(item.designerStatus || 'designer update pending');
  const [designFileUrl, setDesignFileUrl] = useState(item.designFileUrl || '');

  const [operationStatus, setOperationStatus] = useState(item.operationStatus || 'operation update pending');
  const [operationFileUrl, setOperationFileUrl] = useState(item.operationFileUrl || '');

  const [serviceStatus, setServiceStatus] = useState(item.serviceStatus || 'service update pending');
  const [serviceFileUrl, setServiceFileUrl] = useState(item.serviceFileUrl || '');

  const [loading, setLoading] = useState(false);

  const statusesDesigner = ['designer update pending', 'reached to designer', 'work-in progress', 'completed'];
  const statusesOps = ['operation update pending', 'reached to operation', 'work-in progress', 'completed'];
  const statusesService = ['service update pending', 'reached to service', 'work-in progress', 'completed', 'payment pending'];

  const handleFileChange = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {};
      if (isDesigner) {
        payload.designerStatus = designerStatus;
        payload.designFileUrl = designFileUrl;
      }
      if (isOps) {
        payload.operationStatus = operationStatus;
        payload.operationFileUrl = operationFileUrl;
        payload.serviceStatus = serviceStatus;
        payload.serviceFileUrl = serviceFileUrl;
      }
      
      const res = await orderApi.updateLineItem(order._id || order.id, itemIndex, payload, user.token);
      
      if (res.success) {
        onSuccess?.();
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to update line item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b" style={{ background: '#7c3aed' }}>
          <div>
            <h2 className="text-white font-bold text-lg">Update Status</h2>
            <p className="text-purple-200 text-xs mt-0.5">{item.description}</p>
          </div>
          <button onClick={onClose} className="text-purple-200 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex border-b bg-slate-50">
          {isDesigner && (
            <button onClick={() => setActiveTab('designer')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'designer' ? 'border-b-2 border-purple-600 text-purple-700' : 'text-slate-500 hover:text-slate-700'}`}>Designer</button>
          )}
          {isOps && (
            <>
              <button onClick={() => setActiveTab('ops')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'ops' ? 'border-b-2 border-purple-600 text-purple-700' : 'text-slate-500 hover:text-slate-700'}`}>Ops</button>
              <button onClick={() => setActiveTab('service')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'service' ? 'border-b-2 border-purple-600 text-purple-700' : 'text-slate-500 hover:text-slate-700'}`}>Service</button>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {activeTab === 'designer' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Designer Status</label>
                <select value={designerStatus} onChange={e => setDesignerStatus(e.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-purple-500 bg-white">
                  {statusesDesigner.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              {designerStatus === 'completed' && (
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1 block">Design Image / Document (completed only)</label>
                  <input type="file" accept="image/png, image/jpeg, image/webp, application/pdf, .doc, .docx" onChange={e => handleFileChange(e, setDesignFileUrl)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
                  {designFileUrl && (
                     <div className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> File ready</div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'ops' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Operation Status</label>
                <select value={operationStatus} onChange={e => setOperationStatus(e.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-purple-500 bg-white">
                  {statusesOps.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              {operationStatus === 'completed' && (
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1 block">Operation Document (completed only)</label>
                  <input type="file" accept="image/png, image/jpeg, image/webp, application/pdf, .doc, .docx" onChange={e => handleFileChange(e, setOperationFileUrl)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
                  {operationFileUrl && (
                     <div className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> File ready</div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'service' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Service Status</label>
                <select value={serviceStatus} onChange={e => setServiceStatus(e.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-purple-500 bg-white">
                  {statusesService.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              {(serviceStatus === 'completed' || serviceStatus === 'payment pending') && (
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1 block">Service Document / Receipt</label>
                  <input type="file" accept="image/png, image/jpeg, image/webp, application/pdf, .doc, .docx" onChange={e => handleFileChange(e, setServiceFileUrl)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
                  {serviceFileUrl && (
                     <div className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> File ready</div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="h-10 flex-1 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="h-10 flex-1 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-70" style={{ background: '#7c3aed' }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Schedule Appointment Modal ────────────────────────────────────────────────
export const ScheduleAppointmentModal = ({ prospect, onClose, onSaved }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    venue: ''
  });
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const handleSubmit = async (e, forceCreate = false) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await appointmentApi.create({
        prospectId: prospect._id || prospect.id,
        date: formData.date,
        time: formData.time,
        venue: formData.venue,
        forceCreate
      }, user.token);
      if (res.success) {
        onSaved?.();
        onClose();
      }
    } catch (err) {
      if (err.status === 409 && err.data?.existingAppointment) {
        setDuplicateWarning(err.data.existingAppointment);
      } else {
        console.error(err);
        alert(err.message || 'Failed to schedule appointment');
      }
    } finally {
      setLoading(false);
    }
  };

  if (duplicateWarning) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
        <div className="w-full max-w-md rounded-2xl border bg-white shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-5 border-b shrink-0 bg-red-600">
            <div>
              <h2 className="text-white font-bold text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5"/> APPOINTMENT ALREADY EXISTS</h2>
            </div>
            <button onClick={onClose} className="text-red-200 hover:text-white"><X className="h-5 w-5" /></button>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-700">An appointment is already scheduled for <strong>{prospect?.company}</strong>.</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between"><span className="text-xs font-bold text-slate-500">Date:</span><span className="text-sm font-semibold">{new Date(duplicateWarning.date).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-xs font-bold text-slate-500">Time:</span><span className="text-sm font-semibold">{duplicateWarning.time}</span></div>
              <div className="flex justify-between"><span className="text-xs font-bold text-slate-500">Status:</span><span className="text-sm font-semibold text-blue-600">{duplicateWarning.status}</span></div>
              <div className="flex justify-between"><span className="text-xs font-bold text-slate-500">Venue:</span><span className="text-sm font-semibold truncate max-w-[200px]">{duplicateWarning.venue}</span></div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 border-t flex flex-col gap-3">
            <button onClick={() => setDuplicateWarning(null)} className="h-10 w-full rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700">View / Edit Existing Details</button>
            <div className="flex gap-3">
              <button onClick={onClose} className="h-10 flex-1 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={() => handleSubmit(null, true)} className="h-10 flex-1 rounded-lg border border-red-600 text-red-600 bg-red-50 font-semibold text-sm hover:bg-red-100">Create New Anyway</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border bg-card shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b shrink-0" style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)' }}>
          <div>
            <h2 className="text-white font-bold text-lg">📅 Schedule Appointment</h2>
            <p className="text-indigo-200 text-xs mt-0.5">Assign meeting for {prospect?.company}</p>
          </div>
          <button onClick={onClose} className="text-indigo-200 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Executive Name</label>
            <input value={user?.name || ''} readOnly className="h-9 w-full rounded-lg border border-input bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Business Name</label>
              <input value={prospect?.company || ''} readOnly className="h-9 w-full rounded-lg border border-input bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Contact Person</label>
              <input value={prospect?.name || ''} readOnly className="h-9 w-full rounded-lg border border-input bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone Number</label>
            <input value={prospect?.phone || ''} readOnly className="h-9 w-full rounded-lg border border-input bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
              <input required type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Time</label>
              <input required type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Venue / Address</label>
            <textarea required rows={3} placeholder="Enter full address or meeting link..." value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} className="w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus:border-indigo-500 resize-none" />
          </div>

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="h-9 flex-1 rounded-lg border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="h-9 flex-1 rounded-lg text-white text-sm font-medium flex justify-center items-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-70" style={{ background: '#4f46e5' }}>
              {loading ? 'Scheduling...' : 'Schedule Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Order Search Modal ───────────────────────────────────────────────────────
export const OrderSearchModal = ({ onClose, onSearch }) => {
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-xl border bg-white shadow-2xl overflow-hidden p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-slate-900">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-center mb-8 text-slate-900">Search Client</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-800 mb-2 block">10-Digit Mobile Number:</label>
            <input 
              value={phone} 
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
              placeholder="Enter mobile number" 
              className="h-10 w-full rounded border border-slate-300 bg-background px-3 text-sm outline-none focus:border-[#003366]" 
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-800 mb-2 block">Business Name:</label>
            <input 
              value={company} 
              onChange={e => setCompany(e.target.value)} 
              placeholder="Enter business name" 
              className="h-10 w-full rounded border border-slate-300 bg-background px-3 text-sm outline-none focus:border-[#003366]" 
            />
          </div>
          <button
            onClick={() => onSearch({ phone, company: (company || '').toLowerCase() })}
            className="w-full h-10 rounded text-white font-semibold text-sm transition-colors hover:opacity-90"
            style={{ background: '#003366' }}
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Order Client Details Modal ───────────────────────────────────────────────
export const OrderClientDetailsModal = ({ client, onBack, onCreateOrder, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-xl border bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col p-8 relative">
        <button onClick={onClose || onBack} className="absolute top-4 right-4 text-muted-foreground hover:text-slate-900">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-900">Client Details</h2>
        <div className="overflow-y-auto flex-1 space-y-4 pr-2">
          {/* Read only fields with light grey background */}
          {[
            { label: 'Business Name', value: client.company || client.businessName || 'N/A' },
            { label: 'Contact Person', value: client.name || client.contactPerson || 'N/A' },
            { label: 'Phone Number', value: client.phone || 'N/A' },
            { label: 'Location', value: client.location || 'N/A' },
            { label: 'Client Type', value: client.clientType || 'N/A' },
          ].map((field, i) => (
            <div key={i}>
              <label className="text-xs font-bold text-slate-800 mb-1 block">{field.label}</label>
              <div className="w-full rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 min-h-[36px]">
                {field.value || '-'}
              </div>
            </div>
          ))}
        </div>
        <div className="pt-6 flex justify-center gap-4 shrink-0">
          <button onClick={onBack} className="h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:bg-green-600" style={{ background: '#4caf50' }}>
            Back to Search
          </button>
          <button onClick={() => onCreateOrder(client)} className="h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:bg-blue-600" style={{ background: '#2196f3' }}>
            Create New Order
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Create Order Modal ───────────────────────────────────────────────────────
export const CreateOrderModal = ({ client, executiveName, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    executiveName: executiveName || '',
    orderDate: new Date().toISOString().split('T')[0],
    orderType: client?.clientType || 'retail',
    gstNumber: '',
    company: client?.company || client?.businessName || '',
    name: client?.name || client?.contactPerson || '',
    phone: client?.phone || '',
    location: client?.location || client?.requirement?.location || '',
    state: 'Telangana',
    pincode: '',
    birthDate: '',
    anniversaryDate: '',
    designStatus: 'Design Provided',
  });

  const { user } = useAuth();
  const [availableProducts, setAvailableProducts] = useState([]);
  
  React.useEffect(() => {
    productApi.list(user?.token)
      .then(res => {
        if (res.success) setAvailableProducts(res.data.filter(p => p.status === 'Active'));
      })
      .catch(console.error);
  }, [user]);

  const [items, setItems] = useState([{ productId: '', desc: '', isCustom: false, customDesc: '', qty: 1, cost: 0, deliveryDate: '' }]);
  const [isCatalogueOpen, setIsCatalogueOpen] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(null);
  const [advance, setAdvance] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentProof, setPaymentProof] = useState(null);
  const [applyGst, setApplyGst] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [errors, setErrors] = useState({});

  const handleSelectFromCatalogue = (product) => {
    const price = product.pricingRules?.totalBasePrice || product.basePrice || 0;
    const desc = product.productName || product.name;
    const moq = product.minimumOrderQuantity || 1;
    
    if (activeItemIndex !== null) {
      setItems(prev => prev.map((item, idx) => {
        if (idx === activeItemIndex) {
          return {
            ...item,
            productId: product._id,
            desc: desc,
            cost: price,
            qty: Math.max(item.qty, moq),
            isCustom: false
          };
        }
        return item;
      }));
    } else {
      const newItem = {
        productId: product._id,
        desc: desc,
        isCustom: false,
        customDesc: '',
        qty: moq,
        cost: price,
        deliveryDate: ''
      };
      if (items.length === 1 && !items[0].productId && !items[0].desc && items[0].cost === 0) {
        setItems([newItem]);
      } else {
        setItems(prev => [...prev, newItem]);
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.orderType) newErrors.orderType = 'Required';
    if (!formData.company) newErrors.company = 'Required';
    if (!formData.name) newErrors.name = 'Required';
    if (!formData.phone) newErrors.phone = 'Required';
    else if (formData.phone.length !== 10) newErrors.phone = 'Enter 10 digits';
    
    if (!formData.location) newErrors.location = 'Required';
    if (!formData.state) newErrors.state = 'Required';
    if (!formData.pincode) newErrors.pincode = 'Required';
    else if (formData.pincode.length !== 6) newErrors.pincode = 'Enter 6 digits';

    if (!advance || Number(advance) <= 0) newErrors.advance = 'Required';
    if (!paymentProof) newErrors.paymentProof = 'Required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const states = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Other"];

  const addItem = () => setItems(prev => [...prev, { productId: '', desc: '', isCustom: false, customDesc: '', qty: 1, cost: 0, deliveryDate: '' }]);
  const removeItem = i => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i, k, v) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item));

  const handleProductSelect = (i, productId) => {
    const product = availableProducts.find(p => p._id === productId);
    if (!product) return;
    setItems(prev => prev.map((item, idx) => {
      if (idx === i) {
        return {
          ...item,
          productId,
          desc: product.productName || product.name,
          cost: product.pricingRules?.totalBasePrice || product.basePrice || 0,
          qty: Math.max(item.qty, product.minimumOrderQuantity || 1),
          isCustom: false
        };
      }
      return item;
    }));
  };

  // Calculations
  const rawSubtotal = items.reduce((s, item) => s + (item.qty * Number(item.cost || 0)), 0);
  const discountAmount = rawSubtotal * (Number(discount) / 100);
  const taxableAmount = rawSubtotal - discountAmount;
  
  const isInterState = formData.state !== 'Telangana'; 
  const cgst = applyGst && !isInterState ? taxableAmount * 0.09 : 0;
  const sgst = applyGst && !isInterState ? taxableAmount * 0.09 : 0;
  const igst = applyGst && isInterState ? taxableAmount * 0.18 : 0;
  const totalAmount = taxableAmount + cgst + sgst + igst;

  const advancePct = totalAmount > 0 ? (Number(advance) / totalAmount) * 100 : 0;
  const advanceLow = totalAmount > 0 && advancePct < 50 && advance !== '';

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'phone' || name === 'pincode') {
      finalValue = value.replace(/\D/g, '').slice(0, name === 'phone' ? 10 : 6);
    } else if (name === 'name') {
      finalValue = value.replace(/[^a-zA-Z\s]/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProof(reader.result);
        if (errors.paymentProof) setErrors(prev => ({ ...prev, paymentProof: null }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdvanceChange = (val) => {
    setAdvance(val);
    if (errors.advance && Number(val) > 0) setErrors(prev => ({ ...prev, advance: null }));
  };

  const handleFormSubmit = () => {
    if (!validate()) return;
    
    const lineItems = items.map(it => ({
      description: it.isCustom ? (it.customDesc || it.desc) : it.desc,
      quantity: Number(it.qty),
      unitPrice: Number(it.cost),
      discount: 0,
      gstRate: applyGst ? 18 : 0
    }));

    onSubmit({
      ...formData,
      lineItems,
      clientSnapshot: {
        name: formData.name,
        phone: formData.phone,
        company: formData.company,
      },
      payment: {
        rawSubtotal,
        discount,
        discountAmount,
        taxableAmount,
        cgst,
        sgst,
        igst,
        totalAmount,
        advance: Number(advance),
        paymentMethod,
        paymentProof,
        requiresApproval: advanceLow
      },
      initialPayment: {
        amount: Number(advance),
        method: paymentMethod,
        proofUrl: paymentProof
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-4xl rounded-2xl border bg-card shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b shrink-0" style={{ background: 'linear-gradient(135deg, #064e3b, #065f46)' }}>
          <div>
            <h2 className="text-white font-bold text-lg">🧾 Create New Order</h2>
            {client && <p className="text-emerald-200 text-xs mt-0.5">Creating for {client.company || client.name}</p>}
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-6 bg-slate-50">
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">1. Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Executive Name</label>
                <input name="executiveName" value={formData.executiveName} readOnly className="h-9 w-full rounded border bg-slate-100 px-3 text-sm outline-none text-slate-600 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Order Date</label>
                <input type="date" name="orderDate" value={formData.orderDate} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Order Type *</label>
                <select name="orderType" value={formData.orderType} onChange={handleChange} className={`h-9 w-full rounded border ${errors.orderType ? 'border-red-500 bg-red-50' : 'border-slate-300'} px-3 text-sm outline-none focus:border-green-500`}>
                  <option value="">Select Type...</option>
                  {['renewal', 'renewal-agent', 'retail', 'retail-agent', 'agent', 'corporate', 'corporate-renewal', 'website', 'walk-in'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.orderType && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors.orderType}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">2. Client Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Business Name *</label>
                <input name="company" value={formData.company} onChange={handleChange} className={`h-9 w-full rounded border ${errors.company ? 'border-red-500 bg-red-50' : 'border-slate-300'} px-3 text-sm outline-none focus:border-green-500`} />
                {errors.company && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors.company}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Contact Person *</label>
                <input name="name" value={formData.name} onChange={handleChange} className={`h-9 w-full rounded border ${errors.name ? 'border-red-500 bg-red-50' : 'border-slate-300'} px-3 text-sm outline-none focus:border-green-500`} />
                {errors.name && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors.name}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Contact Number *</label>
                <input name="phone" value={formData.phone} onChange={handleChange} className={`h-9 w-full rounded border ${errors.phone ? 'border-red-500 bg-red-50' : 'border-slate-300'} px-3 text-sm outline-none focus:border-green-500`} />
                {errors.phone && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors.phone}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Location *</label>
                <input name="location" value={formData.location} onChange={handleChange} className={`h-9 w-full rounded border ${errors.location ? 'border-red-500 bg-red-50' : 'border-slate-300'} px-3 text-sm outline-none focus:border-green-500`} />
                {errors.location && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors.location}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">State *</label>
                <select name="state" value={formData.state} onChange={handleChange} className={`h-9 w-full rounded border ${errors.state ? 'border-red-500 bg-red-50' : 'border-slate-300'} px-3 text-sm outline-none focus:border-green-500`}>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors.state}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Pincode *</label>
                <input name="pincode" value={formData.pincode} onChange={handleChange} className={`h-9 w-full rounded border ${errors.pincode ? 'border-red-500 bg-red-50' : 'border-slate-300'} px-3 text-sm outline-none focus:border-green-500`} maxLength={6} />
                {errors.pincode && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors.pincode}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">GST Number (Optional)</label>
                <input name="gstNumber" value={formData.gstNumber} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Birth Date (Optional)</label>
                <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Anniversary Date (Opt)</label>
                <input type="date" name="anniversaryDate" value={formData.anniversaryDate} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Design Status</label>
                <select name="designStatus" value={formData.designStatus} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-green-500">
                  <option value="Design Provided">Design Provided</option>
                  <option value="Need Design">Need Design</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="font-bold text-slate-800">3. Order Requirements</h3>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    setActiveItemIndex(null);
                    setIsCatalogueOpen(true);
                  }} 
                  className="text-xs font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition flex items-center gap-1 shadow"
                >
                  <ShoppingBag className="h-3.5 w-3.5" /> Catalogue
                </button>
                <button onClick={addItem} className="text-xs font-bold text-white bg-green-600 px-3 py-1.5 rounded-lg hover:bg-green-700 transition flex items-center gap-1"><Plus className="h-3.5 w-3.5" />Add Item</button>
              </div>
            </div>
            
            <div className="space-y-4">
              {items.map((item, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4 relative">
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="absolute top-2 right-2 h-7 w-7 rounded bg-red-100 hover:bg-red-200 flex items-center justify-center shrink-0"><X className="h-3 w-3 text-red-600" /></button>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="col-span-1 sm:col-span-2">
                      <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Requirement</label>
                      <div className="flex gap-2">
                        <select value={item.productId} onChange={e => handleProductSelect(i, e.target.value)} className="h-9 flex-1 rounded border border-slate-300 bg-white px-3 text-sm outline-none">
                          <option value="">Select product...</option>
                          {availableProducts.map(p => <option key={p._id} value={p._id}>{p.productName || p.name} - ₹{(p.pricingRules?.totalBasePrice || p.basePrice || 0).toLocaleString()}</option>)}
                        </select>
                        <button 
                          type="button" 
                          onClick={() => {
                            setActiveItemIndex(i);
                            setIsCatalogueOpen(true);
                          }} 
                          className="h-9 px-2.5 rounded bg-indigo-600 text-white transition-colors hover:bg-indigo-700 flex items-center justify-center shrink-0 shadow" 
                          title="Browse Catalogue"
                        >
                          <ShoppingBag className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <input type="checkbox" id={`custom-${i}`} checked={item.isCustom} onChange={e => updateItem(i, 'isCustom', e.target.checked)} className="rounded cursor-pointer" />
                        <label htmlFor={`custom-${i}`} className="text-xs font-bold text-slate-700 cursor-pointer">Customization Required</label>
                      </div>
                      {item.isCustom && (
                        <div className="mt-2">
                          <input value={item.customDesc} onChange={e => updateItem(i, 'customDesc', e.target.value)} placeholder="Describe customization..." className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs outline-none" />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Quantity</label>
                      <input type="number" value={item.qty} onChange={e => updateItem(i, 'qty', +e.target.value)} className="h-9 w-full rounded border border-slate-300 bg-white px-3 text-sm outline-none" min="1" />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Cost (₹)</label>
                      <input type="number" value={item.cost} onChange={e => updateItem(i, 'cost', +e.target.value)} disabled={!item.isCustom} className={`h-9 w-full rounded border px-3 text-sm outline-none ${!item.isCustom ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white border-slate-300'}`} placeholder={item.isCustom ? "Enter cost" : "Fixed cost"} />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Delivery Date</label>
                      <input type="date" value={item.deliveryDate} onChange={e => updateItem(i, 'deliveryDate', e.target.value)} className="h-9 w-full rounded border border-slate-300 bg-white px-3 text-sm outline-none" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t pt-4 space-y-3">
              <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                <span>Subtotal (Items):</span>
                <span>₹{rawSubtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700">Discount Percentage (%):</label>
                  <input type="number" value={discount} onChange={e => setDiscount(Math.min(100, Math.max(0, +e.target.value)))} className="h-8 w-20 rounded border border-slate-300 px-2 text-sm outline-none focus:border-green-500" />
                </div>
                <span className="text-sm font-medium text-red-600">- ₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded border border-dashed border-slate-200">
                <input type="checkbox" id="gst-check" checked={applyGst} onChange={e => setApplyGst(e.target.checked)} className="h-4 w-4 cursor-pointer" />
                <label htmlFor="gst-check" className="text-sm font-bold text-slate-800 cursor-pointer">Apply GST (18%)</label>
              </div>

              {applyGst && (
                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 space-y-2">
                  {!isInterState ? (
                    <>
                      <div className="flex justify-between text-xs font-medium text-blue-800">
                        <span>CGST (9%):</span>
                        <span>₹{cgst.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-xs font-medium text-blue-800">
                        <span>SGST (9%):</span>
                        <span>₹{sgst.toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-xs font-medium text-blue-800">
                      <span>IGST (18%):</span>
                      <span>₹{igst.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 rounded-xl border bg-green-50 p-4 flex justify-between items-center shadow-sm">
                <span className="text-sm font-bold text-slate-700">Final Total Amount</span>
                <span className="font-black text-2xl text-green-700">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">4. Payment & Proof</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1 block">Advance Payment Received (₹) *</label>
                  <input type="number" value={advance} onChange={e => handleAdvanceChange(e.target.value)} placeholder={`Min 50% (₹${(totalAmount * 0.5).toLocaleString('en-IN')})`} className={`h-10 w-full rounded-lg border bg-slate-50 px-3 text-sm outline-none transition-colors ${errors.advance ? 'border-red-500 bg-red-50' : advanceLow ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-green-500'}`} />
                  {errors.advance && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors.advance}</p>}
                  {advanceLow && !errors.advance && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span className="font-medium">Advance is below 50% ({advancePct.toFixed(0)}%). Manager approval required.</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1 block">Payment Method</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-green-500 bg-slate-50">
                    <option value="Cash">Cash</option>
                    <option value="PhonePe">PhonePe / UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-2 block text-center">Payment Proof (Screenshot/Receipt) *</label>
                <div className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 relative min-h-[120px] transition-colors ${errors.paymentProof ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}>
                  {paymentProof ? (
                    <div className="w-full h-full relative">
                      <img src={paymentProof} alt="Proof" className="w-full h-32 object-contain rounded-lg" />
                      <button onClick={() => setPaymentProof(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <>
                      <Image className={`h-8 w-8 mb-2 ${errors.paymentProof ? 'text-red-300' : 'text-slate-300'}`} />
                      <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <span className={`text-[10px] font-bold ${errors.paymentProof ? 'text-red-500' : 'text-slate-500'}`}>Click to upload image</span>
                    </>
                  )}
                </div>
                {errors.paymentProof && <p className="text-[10px] text-red-500 mt-1 font-bold text-center">{errors.paymentProof}</p>}
                <p className="mt-3 text-[10px] text-muted-foreground text-center italic">Remaining balance: ₹{(totalAmount - Number(advance || 0)).toLocaleString('en-IN')}.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t shrink-0 flex gap-4 bg-white">
          <button onClick={onClose} className="h-11 px-8 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button
            onClick={handleFormSubmit}
            className="flex-1 h-11 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2 shadow-sm"
            style={{ background: advanceLow ? '#dc2626' : '#059669' }}
          >
            {advanceLow ? '⚠ Request Manager Approval' : '✅ Submit & Create Order'}
          </button>
        </div>
      </div>
      
      <ProductCatalogueModal
        isOpen={isCatalogueOpen}
        onClose={() => setIsCatalogueOpen(false)}
        mode="single"
        onSelectProduct={handleSelectFromCatalogue}
      />
    </div>
  );
};

// ─── Phone Search Modal ───────────────────────────────────────────────────────
export const PhoneSearchModal = ({ onClose, onSearch }) => {
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-xl border bg-white shadow-2xl overflow-hidden p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-slate-900">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-center mb-8 text-slate-900">Search Prospect</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-800 mb-2 block">10-Digit Mobile Number:</label>
            <input 
              value={phone} 
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
              placeholder="Enter mobile number" 
              className="h-10 w-full rounded border border-slate-300 bg-background px-3 text-sm outline-none focus:border-[#003366]" 
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-800 mb-2 block">Business Name:</label>
            <input 
              value={company} 
              onChange={e => setCompany(e.target.value)} 
              placeholder="Enter business name" 
              className="h-10 w-full rounded border border-slate-300 bg-background px-3 text-sm outline-none focus:border-[#003366]" 
            />
          </div>
          <button
            onClick={() => onSearch({ phone, company: (company || '').toLowerCase() })}
            className="w-full h-10 rounded text-white font-semibold text-sm transition-colors hover:opacity-90"
            style={{ background: '#003366' }}
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Prospect Details Modal ───────────────────────────────────────────────────
export const ProspectDetailsModal = ({ prospect, onBack, onCreateNew, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-xl border bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col p-8 relative">
        <button onClick={onClose || onBack} className="absolute top-4 right-4 text-muted-foreground hover:text-slate-900">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-900">Prospect Details</h2>
        <div className="overflow-y-auto flex-1 space-y-4 pr-2">
          {[
            { label: 'Prospect ID', value: prospect._id || prospect.id || 'N/A' },
            { label: 'Executive Name', value: (typeof prospect.assignedTo === 'object' ? prospect.assignedTo?.name : null) || prospect.executiveName || 'Not Assigned' },
            { label: 'Business Name', value: prospect.company },
            { label: 'Contact Person', value: prospect.name },
            { label: 'Phone Number', value: prospect.phone },
            { label: 'Location', value: prospect.requirement?.location || prospect.location },
            { label: 'Prospect Type', value: prospect.priority },
            { label: 'Client Type', value: prospect.clientType },
            { label: 'Lead From', value: prospect.source },
            { label: 'Follow-up Date', value: prospect.nextFollowUpDate ? new Date(prospect.nextFollowUpDate).toLocaleDateString() : 'N/A' },
            { label: 'Services Needed', value: prospect.requirement?.service },
            { label: 'Additional Notes', value: prospect.requirement?.notes }
          ].map((field, i) => (
            <div key={i}>
              <label className="text-xs font-bold text-slate-800 mb-1 block">{field.label}</label>
              <div className="w-full rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 min-h-[36px]">
                {field.value}
              </div>
            </div>
          ))}
        </div>
        <div className="pt-6 flex justify-center gap-4 shrink-0">
          <button onClick={onBack} className="h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:bg-green-600" style={{ background: '#4caf50' }}>
            Back to Dashboard
          </button>
          <button onClick={onCreateNew} className="h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:bg-blue-600" style={{ background: '#2196f3' }}>
            Create New Prospect
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Create/Edit Prospect Modal ────────────────────────────────────────────────
export const CreateProspectModal = ({ phone, executiveName, onBack, onSubmit, onClose, initialData = null }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    executiveName: (typeof initialData?.assignedTo === 'object' ? initialData?.assignedTo?.name : null) || initialData?.executiveName || executiveName || '',
    name: initialData?.name || '',
    company: initialData?.company || '',
    phone: initialData?.phone || phone || '',
    location: initialData?.requirement?.location || '',
    source: initialData?.source || '',
    priority: initialData?.priority || '',
    nextFollowUpDate: initialData?.nextFollowUpDate ? new Date(initialData.nextFollowUpDate).toISOString().split('T')[0] : '',
    notes: initialData?.requirement?.notes || (typeof initialData?.requirement === 'string' ? initialData.requirement : ''),
    clientType: initialData?.clientType || 'Retail',
    budget: initialData?.requirement?.budget || '',
  });

  const [predefinedProducts, setPredefinedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState(initialData?.requirement?.service ? initialData.requirement.service.split(', ').filter(Boolean) : []);
  const [customProduct, setCustomProduct] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCatalogueOpen, setIsCatalogueOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const pRes = await productApi.list(user?.token);
        if (pRes.success) setPredefinedProducts(pRes.data);
      } catch (err) { console.error(err); }
    };
    loadMasterData();
  }, [user]);

  const removeProduct = (prod) => {
    setProducts(products.filter(p => p !== prod));
  };

  const addCustomProduct = (e, val) => {
    e?.preventDefault();
    const toAdd = val || customProduct.trim();
    if (toAdd && !products.includes(toAdd)) {
      setProducts([...products, toAdd]);
    }
    setCustomProduct('');
    setShowSuggestions(false);
  };

  const filteredProducts = predefinedProducts
    .filter(p => p.status === 'Active') // Show only admin-added 'Active' products
    .filter(p => {
      const name = p.productName || p.name;
      if (!name || products.includes(name)) return false;
      if (!customProduct.trim()) return true;
      return name.toLowerCase().includes(customProduct.toLowerCase());
    })
    .slice(0, 10);

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.company) newErrors.company = 'Required';
    if (!formData.name) newErrors.name = 'Required';
    if (!formData.phone) newErrors.phone = 'Required';
    else if (formData.phone.length !== 10) newErrors.phone = 'Enter 10 digits';
    
    if (!formData.location) newErrors.location = 'Required';
    if (!formData.source) newErrors.source = 'Required';
    if (!formData.priority) newErrors.priority = 'Required';
    if (!formData.nextFollowUpDate) newErrors.nextFollowUpDate = 'Required';
    if (products.length === 0) newErrors.products = 'Add at least one product';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'phone') {
      finalValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'name') {
      finalValue = value.replace(/[^a-zA-Z\s]/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleFormSubmit = () => {
    if (!validate()) return;
    onSubmit({ ...formData, products });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-xl border bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col p-8 relative">
        <button onClick={onClose || onBack} className="absolute top-4 right-4 text-muted-foreground hover:text-slate-900">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-900">{initialData ? 'Edit Prospect' : 'Create New Prospect'}</h2>
        <div className="overflow-y-auto flex-1 space-y-4 pr-2">
          <div><label className="text-xs font-bold text-slate-800 mb-1 block">Executive Name</label><input name="executiveName" value={formData.executiveName} readOnly className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none bg-slate-50" /></div>
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">Business Name *</label>
            <input name="company" value={formData.company} onChange={handleChange} className={`h-9 w-full rounded border ${errors.company ? 'border-red-500 bg-red-50' : 'border-slate-300'} px-3 text-sm outline-none focus:border-[#003366]`} />
            {errors.company && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors.company}</p>}
          </div>
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">Contact Person *</label>
            <input name="name" value={formData.name} onChange={handleChange} className={`h-9 w-full rounded border ${errors.name ? 'border-red-500 bg-red-50' : 'border-slate-300'} px-3 text-sm outline-none focus:border-[#003366]`} />
            {errors.name && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors.name}</p>}
          </div>
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">Phone Number *</label>
            <input name="phone" value={formData.phone} onChange={handleChange} className={`h-9 w-full rounded border ${errors.phone ? 'border-red-500 bg-red-50' : 'border-slate-300'} px-3 text-sm outline-none focus:border-[#003366]`} />
            {errors.phone && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors.phone}</p>}
          </div>
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">Location *</label>
            <input name="location" value={formData.location} onChange={handleChange} className={`h-9 w-full rounded border ${errors.location ? 'border-red-500 bg-red-50' : 'border-slate-300'} px-3 text-sm outline-none focus:border-[#003366]`} />
            {errors.location && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors.location}</p>}
          </div>
          <div><label className="text-xs font-bold text-slate-800 mb-1 block">Lead From *</label>
            <select name="source" value={formData.source} onChange={handleChange} className={`h-9 w-full rounded border ${errors.source ? 'border-red-500 bg-red-50' : 'border-slate-300'} px-3 text-sm outline-none focus:border-[#003366]`}>
              <option value="">Select Lead Source</option>
              <option>India mart</option><option>Just dial</option><option>Google ads</option><option>Referral</option><option>Website</option><option>Meta (Facebook/Instagram)</option><option>Walk-in</option><option>Other</option>
            </select>
            {errors.source && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors.source}</p>}
          </div>
          <div><label className="text-xs font-bold text-slate-800 mb-1 block">Prospect Type *</label>
            <select name="priority" value={formData.priority} onChange={handleChange} className={`h-9 w-full rounded border ${errors.priority ? 'border-red-500 bg-red-50' : 'border-slate-300'} px-3 text-sm outline-none focus:border-[#003366]`}>
              <option value="">Select Type</option>
              <option>Hot</option><option>Cold</option><option>Expected in next month</option>
            </select>
            {errors.priority && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors.priority}</p>}
          </div>
          <div><label className="text-xs font-bold text-slate-800 mb-1 block">Client Type (For Pricing) *</label>
            <select name="clientType" value={formData.clientType} onChange={handleChange} className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]">
              <option value="Retail">Retail</option>
              <option value="Renewal">Renewal</option>
              <option value="Corporate">Corporate</option>
              <option value="Corporate-Renewal">Corporate-Renewal</option>
              <option value="Agent">Agent</option>
              <option value="Agent-Renewal">Agent-Renewal</option>
            </select>
          </div>
          <div><label className="text-xs font-bold text-slate-800 mb-1 block">Budget</label><input name="budget" value={formData.budget} onChange={handleChange} placeholder="e.g. 5000" className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]" /></div>
          <div><label className="text-xs font-bold text-slate-800 mb-1 block">Follow-up Date *</label><input type="date" name="nextFollowUpDate" value={formData.nextFollowUpDate} onChange={handleChange} className={`h-9 w-full rounded border ${errors.nextFollowUpDate ? 'border-red-500 bg-red-50' : 'border-slate-300'} px-3 text-sm outline-none focus:border-[#003366]`} />
            {errors.nextFollowUpDate && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors.nextFollowUpDate}</p>}
          </div>
          
          <div>
            <label className="text-xs font-bold text-slate-800 mb-2 block">Products / Services Needed *</label>
            {products.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {products.map(p => (
                  <button key={p} type="button" onClick={() => removeProduct(p)} className="px-3 py-1 rounded-full text-xs font-semibold border transition-colors bg-blue-600 text-white border-blue-600 shadow-sm flex items-center gap-1">
                    {p} <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}
            <div className="relative">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={customProduct} 
                  onChange={(e) => {
                    setCustomProduct(e.target.value);
                    setShowSuggestions(true);
                  }} 
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomProduct(e)}
                  placeholder="Type product name to search or add..." 
                  className={`h-9 flex-1 rounded border ${errors.products ? 'border-red-500 bg-red-50' : 'border-slate-300'} px-3 text-sm outline-none focus:border-[#003366]`} 
                />
                <button type="button" onClick={addCustomProduct} className="h-9 px-4 rounded bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors">Add</button>
                <button type="button" onClick={() => setIsCatalogueOpen(true)} className="h-9 px-3 rounded bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors flex items-center gap-1.5 shadow" title="Browse Product Catalogue">
                  <ShoppingBag className="h-4 w-4" /> Catalogue
                </button>
              </div>
              {errors.products && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.products}</p>}
              {showSuggestions && customProduct.trim() && (
                <div className="absolute top-full left-0 right-20 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredProducts.length > 0 ? filteredProducts.map(p => (
                    <div key={p._id} className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-slate-700 font-medium" onMouseDown={(e) => { e.preventDefault(); addCustomProduct(e, p.productName || p.name); }}>
                      <div className="flex justify-between items-center">
                        <span>{p.productName || p.name}</span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded uppercase font-bold text-slate-500">₹{(p.pricingRules?.totalBasePrice || p.basePrice || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  )) : <div className="px-3 py-2 text-sm text-muted-foreground italic">Press "Add" to create custom</div>}
                </div>
              )}
            </div>
          </div>
          <div><label className="text-xs font-bold text-slate-800 mb-1 block">Additional Requirement Notes</label><textarea name="notes" value={formData.notes} onChange={handleChange} className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#003366] min-h-[60px]" placeholder="Specific details..." /></div>
        </div>
        <div className="pt-6 flex justify-between shrink-0">
          <button 
            onClick={() => {
              if (onBack) onBack();
              navigate('/');
            }} 
            className="h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:opacity-90" 
            style={{ background: '#003366' }}
          >
            Back to Dashboard
          </button>
          <button 
            onClick={() => handleFormSubmit()} 
            className="h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:opacity-90" 
            style={{ background: '#003366' }}
          >
            {initialData ? 'Update Prospect' : 'Submit Prospect'}
          </button>
        </div>
        
        <ProductCatalogueModal
          isOpen={isCatalogueOpen}
          onClose={() => setIsCatalogueOpen(false)}
          mode="multiple"
          title="Browse & Select Products"
          selectedIds={predefinedProducts.filter(ap => products.includes(ap.productName || ap.name)).map(ap => ap._id)}
          onSelectMultiple={(selectedProducts) => {
            const names = selectedProducts.map(p => p.productName || p.name);
            const merged = Array.from(new Set([...products, ...names]));
            setProducts(merged);
          }}
        />
      </div>
    </div>
  );
};

// ─── Quotation Modal ────────────────────────────────────────────────────────
export const QuotationModal = ({ prospect, onClose, onSubmit }) => {
  const { user } = useAuth();
  const [productList, setProductList] = useState([]);
  const [variants, setVariants] = useState({}); // { productId: [variants] }
  const [items, setItems] = useState([{ productId: '', variantId: '', name: '', qty: 1, unitPrice: 0, customPrice: false, systemPrice: 0 }]);
  const [isCatalogueOpen, setIsCatalogueOpen] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(null);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [discountType, setDiscountType] = useState('PERCENT'); // FLAT or PERCENT
  const [discountValue, setDiscountValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSelectFromCatalogue = async (product) => {
    if (activeItemIndex !== null) {
      const newItems = [...items];
      newItems[activeItemIndex].productId = product._id;
      newItems[activeItemIndex].variantId = '';
      newItems[activeItemIndex].unitPrice = 0;
      setItems(newItems);
      await fetchVariants(product._id);
    } else {
      const newItem = { productId: product._id, variantId: '', name: '', qty: 1, unitPrice: 0, customPrice: false, systemPrice: 0 };
      let newItemsList;
      if (items.length === 1 && !items[0].productId) {
        newItemsList = [newItem];
      } else {
        newItemsList = [...items, newItem];
      }
      setItems(newItemsList);
      await fetchVariants(product._id);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productApi.list(user.token);
        if (res.success) setProductList(res.data || []);
      } catch (err) { console.error(err); }
    };
    fetchProducts();
  }, [user.token]);

  const fetchVariants = async (productId) => {
    if (variants[productId]) return;
    try {
      const res = await fetch(`/api/products/${productId}`, { 
        headers: { 'Authorization': `Bearer ${user.token}` } 
      }).then(r => r.json());
      if (res.success) {
        setVariants(prev => ({ ...prev, [productId]: res.data.variants }));
      }
    } catch (err) { console.error(err); }
  };

  const updateItem = async (index, field, value) => {
    const newItems = [...items];
    if (field === 'productId') {
      newItems[index].productId = value;
      newItems[index].variantId = '';
      newItems[index].unitPrice = 0;
      await fetchVariants(value);
    } else if (field === 'variantId') {
      const v = variants[newItems[index].productId]?.find(v => v._id === value);
      if (v) {
        newItems[index].variantId = value;
        newItems[index].name = `${productList.find(p => p._id === newItems[index].productId)?.name} (${v.name})`;
        
        // Dynamic Price Fetch
        const clientType = prospect?.clientType || 'Retail';
        const priceRes = await fetch(`/api/products/price-engine?variantId=${value}&clientType=${clientType}`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        }).then(r => r.json());
        
        if (priceRes.success) {
          const systemPrice = priceRes.data.unitPrice;
          newItems[index].unitPrice = systemPrice;
          newItems[index].systemPrice = systemPrice;
          newItems[index].customPrice = false;
        }
      }
    } else if (field === 'unitPrice') {
      newItems[index].unitPrice = value;
      newItems[index].customPrice = value !== newItems[index].systemPrice;
    } else {
      newItems[index][field] = value;
    }
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { productId: '', variantId: '', name: '', qty: 1, unitPrice: 0, customPrice: false, systemPrice: 0 }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  const discountAmount = discountType === 'PERCENT' ? (subtotal * discountValue) / 100 : discountValue;
  const taxableAmount = subtotal - discountAmount;
  const gstAmount = taxEnabled ? (taxableAmount * 0.18) : 0;
  const total = taxableAmount + gstAmount;

  const handleSend = async () => {
    if (items.some(i => !i.productId)) return setError('Select products for all items');
    setLoading(true);
    try {
      const quoteData = {
        prospect: prospect._id || prospect.id,
        items: items.map(i => ({
          product: i.productId, name: i.name, quantity: i.qty,
          unitCost: i.unitPrice, totalCost: i.qty * i.unitPrice,
          isCustomPrice: i.customPrice, originalPrice: i.systemPrice
        })),
        subtotal, discount: { type: discountType, value: discountValue, amount: discountAmount },
        tax: { enabled: taxEnabled, rate: 18, cgst: gstAmount / 2, sgst: gstAmount / 2, amount: gstAmount },
        totalAmount: total, status: 'Sent'
      };

      const res = await quotationApi.create(quoteData, user.token);
      if (res.success) {
        const itemText = items.map(i => `• ${i.name} (x${i.qty}): ₹${(i.qty * i.unitPrice).toLocaleString()}`).join('\n');
        const text = `*QUOTATION: GMS ADS & MARKETING*\n\nHello *${prospect.name}* (${prospect.company}),\n\nFollowing is the estimate for your requirement:\n\n${itemText}\n\n--------------------------\n*Subtotal:* ₹${subtotal.toLocaleString()}\n*Discount:* ₹${discountAmount.toLocaleString()}\n*GST (18%):* ₹${gstAmount.toLocaleString()}\n*TOTAL:* ₹${Math.round(total).toLocaleString()}\n--------------------------\n\nRegards,\n*${user.name}*\nSales Executive`;
        
        window.open(`https://wa.me/${prospect.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
        onSubmit(res.data);
        onClose();
      }
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#f8fafc] w-full max-w-[95vw] lg:max-w-7xl h-[92vh] rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-white border-b px-8 py-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
              <Quote className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Professional Quotation Engine</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5">Enterprise Pricing Module • GMS CRM</p>
            </div>
          </div>
          <button onClick={onClose} className="h-12 w-12 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: Input Configuration */}
          <div className="flex-1 overflow-y-auto p-10 space-y-10 border-r bg-white/50">
            
            {/* Client Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Client Snapshot</label>
                <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><User className="h-4 w-4" /></div>
                    <div><p className="text-xs font-black text-slate-900">{prospect?.name}</p><p className="text-[10px] font-bold text-slate-500">{prospect?.company}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><Phone className="h-4 w-4" /></div>
                    <p className="text-xs font-bold text-slate-700">{prospect?.phone}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Pricing Strategy</label>
                <div className="bg-blue-600 rounded-[1.5rem] p-5 text-white shadow-lg shadow-blue-200">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Selected Category</p>
                  <p className="text-2xl font-black mt-1">{prospect?.clientType || 'Retail'}</p>
                  <p className="text-[11px] font-bold opacity-80 mt-2 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> Price rules applied automatically
                  </p>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Quotation Line Items</h3>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setActiveItemIndex(null);
                      setIsCatalogueOpen(true);
                    }} 
                    className="h-9 px-4 bg-indigo-600 text-white rounded-xl text-[11px] font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow"
                  >
                    <ShoppingBag className="h-4 w-4" /> Catalogue
                  </button>
                  <button onClick={addItem} className="h-9 px-4 bg-slate-900 text-white rounded-xl text-[11px] font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                    <Plus className="h-4 w-4" /> Add Item
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="group bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap md:flex-nowrap gap-4 items-end transition-all hover:shadow-md">
                    <div className="flex-[2] min-w-[200px]">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2 block ml-1">Product</label>
                      <div className="flex gap-2">
                        <select 
                          value={item.productId} onChange={(e) => updateItem(i, 'productId', e.target.value)}
                          className="flex-1 h-12 px-4 bg-slate-50 border-0 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        >
                          <option value="">Select Product...</option>
                          {productList.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                        <button 
                          type="button" 
                          onClick={() => {
                            setActiveItemIndex(i);
                            setIsCatalogueOpen(true);
                          }} 
                          className="h-12 w-12 rounded-2xl bg-indigo-600 text-white transition-colors hover:bg-indigo-700 flex items-center justify-center shrink-0 shadow" 
                          title="Select from Catalogue"
                        >
                          <ShoppingBag className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2 block ml-1">Variant / Size</label>
                      <select 
                        value={item.variantId} onChange={(e) => updateItem(i, 'variantId', e.target.value)}
                        disabled={!item.productId}
                        className="w-full h-12 px-4 bg-slate-50 border-0 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                      >
                        <option value="">Select Size...</option>
                        {variants[item.productId]?.map(v => <option key={v._id} value={v._id}>{v.name} ({v.unit})</option>)}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2 block ml-1">Qty</label>
                      <input 
                        type="number" min="1" value={item.qty} onChange={(e) => updateItem(i, 'qty', +e.target.value)}
                        className="w-full h-12 px-4 bg-slate-50 border-0 rounded-2xl text-xs font-black outline-none text-center"
                      />
                    </div>
                    <div className="w-40">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2 block ml-1">Unit Price (₹)</label>
                      <div className="relative">
                        <input 
                          type="number" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', +e.target.value)}
                          className={`w-full h-12 px-4 bg-slate-50 border-0 rounded-2xl text-xs font-black outline-none transition-all ${item.customPrice ? 'text-amber-600 bg-amber-50' : 'text-slate-900'}`}
                        />
                        {item.customPrice && <AlertTriangle className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" title="Manual Price Override" />}
                      </div>
                    </div>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(i)} className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tax & Discount Section */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Financial Adjustments</h4>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600"><ShieldCheck className="h-5 w-5" /></div>
                    <div><p className="text-xs font-black">Apply GST (18%)</p><p className="text-[9px] font-bold text-slate-400">Standard for Advertisements</p></div>
                  </div>
                  <input type="checkbox" checked={taxEnabled} onChange={e => setTaxEnabled(e.target.checked)} className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-400 ml-1">DISCOUNT VALUE</p>
                  <div className="flex gap-2">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      {['PERCENT', 'FLAT'].map(t => (
                        <button key={t} onClick={() => setDiscountType(t)} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${discountType === t ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>{t === 'PERCENT' ? '%' : '₹'}</button>
                      ))}
                    </div>
                    <input type="number" value={discountValue} onChange={e => setDiscountValue(+e.target.value)} className="flex-1 h-12 px-4 bg-slate-50 border-0 rounded-xl text-xs font-black outline-none" placeholder="0" />
                  </div>
                </div>
              </div>
              <div className="bg-blue-50/30 p-6 rounded-3xl border border-blue-100/50 flex flex-col justify-center text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Dynamic Calculation Engine</p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed italic">Prices are retrieved from the master product registry. Manual overrides are flagged for manager review in the final report.</p>
              </div>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="w-[450px] bg-slate-100 overflow-y-auto p-8 border-l flex flex-col">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 text-center">Live Document Preview</h4>
            
            {/* Document Sheet */}
            <div className="bg-white shadow-2xl rounded-sm aspect-[1/1.414] w-full p-8 flex flex-col border border-slate-200 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-start mb-8">
                <div><h1 className="text-lg font-black text-slate-900 tracking-tighter">GMS ADS & MARKETING</h1><p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Advertising • Branding • Digital</p></div>
                <div className="text-right text-[8px] font-bold text-slate-500 uppercase"><p>Draft Quotation</p><p className="mt-1">{new Date().toLocaleDateString()}</p></div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8 border-y py-4 border-slate-100">
                <div><p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Client Details</p><p className="text-[10px] font-black text-slate-900 mt-1">{prospect?.name}</p><p className="text-[8px] font-bold text-slate-500">{prospect?.company}</p></div>
                <div className="text-right"><p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Contact</p><p className="text-[10px] font-black text-slate-900 mt-1">{prospect?.phone}</p></div>
              </div>

              <div className="flex-1">
                <table className="w-full text-[9px]">
                  <thead><tr className="border-b-2 border-slate-900"><th className="py-2 text-left">SERVICE</th><th className="py-2 text-center">QTY</th><th className="py-2 text-right">TOTAL</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map((it, idx) => (
                      <tr key={idx}><td className="py-2 font-black text-slate-700">{it.name || '---'}</td><td className="py-2 text-center text-slate-500">{it.qty}</td><td className="py-2 text-right font-bold text-slate-900">₹{(it.qty * it.unitPrice).toLocaleString()}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 pt-4 border-t-2 border-slate-100 space-y-2">
                <div className="flex justify-between text-[9px]"><span className="text-slate-400 font-bold uppercase">Subtotal</span><span className="font-black text-slate-900">₹{subtotal.toLocaleString()}</span></div>
                {discountAmount > 0 && <div className="flex justify-between text-[9px] text-rose-500"><span className="font-bold uppercase">Discount</span><span className="font-black">-₹{discountAmount.toLocaleString()}</span></div>}
                {taxEnabled && <div className="flex justify-between text-[9px] text-slate-500"><span className="font-bold uppercase">GST (18%)</span><span className="font-black">₹{gstAmount.toLocaleString()}</span></div>}
                <div className="flex justify-between items-center pt-4 border-t border-slate-900 mt-2">
                  <span className="text-xs font-black uppercase tracking-widest">Total Amount</span>
                  <span className="text-xl font-black text-blue-600">₹{Math.round(total).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-8 space-y-4">
              {error && <p className="text-[10px] text-rose-500 font-black text-center animate-bounce">{error}</p>}
              <button 
                onClick={handleSend} disabled={loading}
                className="w-full h-16 bg-emerald-500 text-white rounded-3xl font-black text-sm flex items-center justify-center gap-3 hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-200/50 disabled:opacity-50"
              >
                <MessageCircle className="h-6 w-6" /> {loading ? 'SENDING...' : 'SEND VIA WHATSAPP'}
              </button>
              <button onClick={onClose} className="w-full h-14 bg-white text-slate-400 rounded-2xl font-black text-xs hover:bg-slate-50 transition-all border border-slate-200">
                DISCARD & CANCEL
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <ProductCatalogueModal
        isOpen={isCatalogueOpen}
        onClose={() => setIsCatalogueOpen(false)}
        mode="single"
        onSelectProduct={handleSelectFromCatalogue}
      />
    </div>
  );
};



// ─── Update Status Modal ────────────────────────────────────────────────────────
export const UpdateStatusModal = ({ prospect, newStatus, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    status: newStatus || prospect?.status || 'In-progress',
    date: prospect?.nextFollowUpDate ? new Date(prospect.nextFollowUpDate).toISOString().split('T')[0] : '',
    remark: prospect?.lastInteractionNote || '',
    reason: prospect?.cancelReason || '',
    orderId: ''
  });
  const handleSubmit = () => onSubmit(formData);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-xl border bg-white shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-slate-900"><X className="h-5 w-5" /></button>
          <h2 className="text-xl font-bold mb-1 text-slate-900">{formData.status === 'In-progress' ? 'Schedule Next Follow-up' : formData.status === 'Canceled' ? 'Cancel Prospect' : 'Close Sale'}</h2>
          <div className="space-y-5 mt-4">
            {formData.status === 'In-progress' && (
              <>
                <div><label className="text-sm font-semibold text-slate-700 mb-1.5 block">Next Contact Date *</label><input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600" /></div>
                <div><label className="text-sm font-semibold text-slate-700 mb-1.5 block">Interaction Note *</label><textarea value={formData.remark} onChange={(e) => setFormData({...formData, remark: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600 min-h-[90px]" placeholder="Briefly describe the conversation..." /></div>
              </>
            )}
            {formData.status === 'Canceled' && (
              <div><label className="text-sm font-semibold text-slate-700 mb-1.5 block">Cancellation Reason *</label><textarea value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-red-600 min-h-[90px]" placeholder="e.g. Budget too low..." /></div>
            )}
            {['Sale Closed', 'Order Confirmed'].includes(formData.status) && (
              <div><label className="text-sm font-semibold text-slate-700 mb-1.5 block">Order ID Reference *</label><input type="text" value={formData.orderId} onChange={(e) => setFormData({...formData, orderId: e.target.value.toUpperCase()})} className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600" placeholder="e.g. ORD-12345" /></div>
            )}
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t flex justify-end gap-3"><button onClick={onClose} className="h-9 px-4 rounded text-slate-600 font-semibold text-sm border bg-white hover:bg-slate-50">Cancel</button><button onClick={handleSubmit} className="h-9 px-6 rounded text-white font-semibold text-sm transition-colors hover:opacity-90 bg-blue-600">Save Update</button></div>
      </div>
    </div>
  );
};

// ─── View Quotation Modal (Premium Preview) ───────────────────────────────────
export const ViewQuotationModal = ({ quotation, onClose }) => {
  if (!quotation) return null;
  const { prospect, items, subtotal, discount, tax, totalAmount, createdAt, quotationId } = quotation;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-100 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        <div className="bg-white border-b px-8 py-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center">
              <Eye className="h-5 w-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Quotation Preview</h2>
          </div>
          <button onClick={onClose} className="h-10 w-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10">
          {/* Document Sheet */}
          <div className="bg-white shadow-xl rounded-sm aspect-[1/1.414] w-full p-10 flex flex-col border border-slate-200">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tighter">{quotation.templateSnapshot?.companyName || 'GMS ADS & MARKETING'}</h1>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{quotation.templateSnapshot?.address || 'Advertising • Branding • Digital'}</p>
                {(quotation.templateSnapshot?.contactEmail || quotation.templateSnapshot?.contactPhone) && (
                  <p className="text-[8px] font-bold text-slate-500 mt-1">
                    {quotation.templateSnapshot?.contactPhone} | {quotation.templateSnapshot?.contactEmail}
                  </p>
                )}
                {quotation.templateSnapshot?.gstin && (
                  <p className="text-[8px] font-bold text-slate-500 mt-0.5">GSTIN: {quotation.templateSnapshot.gstin}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-900 uppercase">#{quotationId || quotation._id.slice(-6).toUpperCase()}</p>
                <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">{new Date(createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-10 border-y py-6 border-slate-100">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Client Details</p>
                <p className="text-[11px] font-black text-slate-900 mt-2">{prospect?.name || 'Client'}</p>
                <p className="text-[9px] font-bold text-slate-500">{prospect?.company || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Contact Information</p>
                <p className="text-[10px] font-black text-slate-900 mt-2">{prospect?.phone}</p>
              </div>
            </div>

            <div className="flex-1">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b-2 border-slate-900">
                    <th className="py-3 text-left">DESCRIPTION</th>
                    <th className="py-3 text-center">QTY</th>
                    <th className="py-3 text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-3 font-black text-slate-700">{it.name}</td>
                      <td className="py-3 text-center text-slate-500">{it.quantity}</td>
                      <td className="py-3 text-right font-bold text-slate-900">₹{(it.totalCost || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-10 pt-6 border-t-2 border-slate-100 space-y-3">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400 font-bold uppercase">Subtotal</span>
                <span className="font-black text-slate-900">₹{(subtotal || 0).toLocaleString()}</span>
              </div>
              {discount?.amount > 0 && (
                <div className="flex justify-between text-[10px] text-rose-500">
                  <span className="font-bold uppercase">Discount ({discount.type === 'PERCENT' ? `${discount.value}%` : 'Flat'})</span>
                  <span className="font-black">-₹{(discount.amount || 0).toLocaleString()}</span>
                </div>
              )}
              {tax?.enabled && (
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span className="font-bold uppercase">GST (18%)</span>
                  <span className="font-black">₹{(tax.amount || 0).toLocaleString()}</span>
                </div>
              )}
              {quotation.additionalCharges?.map((charge, idx) => (
                <div key={idx} className="flex justify-between text-[10px] text-slate-600">
                  <span className="font-bold uppercase">{charge.name}</span>
                  <span className="font-black">₹{(charge.amount || 0).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-6 border-t border-slate-900 mt-4">
                <span className="text-sm font-black uppercase tracking-widest">Grand Total</span>
                <span className="text-2xl font-black text-blue-600">₹{Math.round(totalAmount || 0).toLocaleString()}</span>
              </div>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-6 text-[8px]">
              {quotation.templateSnapshot?.bankDetails && (
                <div>
                  <p className="font-black text-slate-400 uppercase tracking-widest mb-1">Bank Details</p>
                  <p className="font-bold text-slate-900">{quotation.templateSnapshot.bankDetails.accountName}</p>
                  <p className="text-slate-500">A/C: {quotation.templateSnapshot.bankDetails.accountNumber}</p>
                  <p className="text-slate-500">{quotation.templateSnapshot.bankDetails.bankName} - IFSC: {quotation.templateSnapshot.bankDetails.ifscCode}</p>
                </div>
              )}
              {quotation.templateSnapshot?.termsAndConditions?.length > 0 && (
                <div>
                  <p className="font-black text-slate-400 uppercase tracking-widest mb-1">Terms & Conditions</p>
                  <ul className="list-decimal pl-3 space-y-0.5 text-slate-500">
                    {quotation.templateSnapshot.termsAndConditions.map((term, i) => (
                      <li key={i}>{term}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-auto pt-6 text-center border-t border-slate-100">
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">This is a computer-generated quotation. No signature is required.</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-t p-6 flex justify-between shrink-0">
          <div>
            {quotation.requiresApproval && quotation.status === 'Draft' && ['ADMIN', 'SALES_MANAGER', 'MD_CEO'].includes(useAuth().user?.role) && (
              <div className="flex gap-3">
                <button 
                  onClick={async () => {
                    if (window.confirm('Approve this quotation?')) {
                      await quotationApi.updateStatus(quotation._id || quotation.id, { status: 'Approved' }, useAuth().user?.token);
                      onClose(true);
                    }
                  }}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
                >
                  Approve Quotation
                </button>
                <button 
                  onClick={async () => {
                    const reason = window.prompt('Reason for rejection:');
                    if (reason !== null) {
                      await quotationApi.update(quotation._id || quotation.id, { status: 'Rejected', notes: reason }, useAuth().user?.token);
                      onClose(true);
                    }
                  }}
                  className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs hover:bg-rose-100 transition-all"
                >
                  Reject
                </button>
              </div>
            )}
            {quotation.requiresApproval && quotation.status === 'Draft' && !['ADMIN', 'SALES_MANAGER', 'MD_CEO'].includes(useAuth().user?.role) && (
              <p className="text-xs font-bold text-amber-600 mt-3 flex items-center gap-1.5"><AlertCircle className="h-4 w-4"/> Pending Manager Approval</p>
            )}
          </div>
          <button 
            onClick={() => window.print()}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs flex items-center gap-2 hover:scale-105 transition-all"
          >
            <Printer className="h-4 w-4" /> Download PDF / Print
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Order Details Modal ─────────────────────────────────────────────────────
export const OrderDetailsModal = ({ orderId, onClose, onPaymentUpload }) => {
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await orderApi.get(orderId, user.token);
        if (res.success) setOrder(res.data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    if (orderId) fetchOrder();
  }, [orderId, user.token]);

  if (loading) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"><div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4"><div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /><p className="text-sm font-bold text-slate-600">Loading...</p></div></div>;
  if (!order) return null;

  const steps = [
    { label: 'Sales Mgr', status: order.status === 'Pending_Approval' ? 'pending' : 'done' },
    { label: 'Ops Mgr', status: ['Draft', 'Pending_Approval', 'Confirmed'].includes(order.status) ? 'waiting' : (['Delivered', 'Completed'].includes(order.status) ? 'done' : 'current') },
    { label: 'Services', status: ['Completed'].includes(order.status) ? 'done' : (order.status === 'Ready_To_Deliver' ? 'current' : 'waiting') },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-2xl border bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center"><FileText className="h-6 w-6" /></div>
            <div>
              <div className="flex items-center gap-3"><h2 className="text-xl font-bold">{order.orderNumber}</h2><span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${order.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'}`}>{order.status.replace('_', ' ')}</span></div>
              <p className="text-slate-400 text-xs font-medium mt-0.5">Created on {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-6 w-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border shadow-sm h-full">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><span className="h-6 w-1 bg-blue-600 rounded-full" />Client Details</h3>
              <div className="space-y-4">
                <div><p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Business Name</p><p className="text-sm font-bold text-slate-800">{order.clientSnapshot?.company}</p></div>
                <div><p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Contact Person</p><p className="text-sm font-semibold text-slate-700">{order.clientSnapshot?.name}</p><p className="text-xs text-slate-500">{order.clientSnapshot?.phone}</p></div>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-5 rounded-2xl border shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2"><span className="h-6 w-1 bg-emerald-500 rounded-full" />Order Journey</h3>
                <div className="flex items-center justify-between relative px-2">
                  <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-100 -z-0 mx-8" />
                  {steps.map((s, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 z-10">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center border-4 ${s.status === 'done' ? 'bg-emerald-500 border-emerald-100' : s.status === 'current' ? 'bg-blue-600 border-blue-100 animate-pulse' : 'bg-slate-100 border-white'}`}>
                        {s.status === 'done' ? <CheckCircle className="h-5 w-5 text-white" /> : <div className={`h-2 w-2 rounded-full ${s.status === 'current' ? 'bg-white' : 'bg-slate-300'}`} />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-slate-50 flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Service Items</h3></div>
              <div className="divide-y">{order.lineItems?.map((item, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/50"><div><p className="text-sm font-bold text-slate-800">{item.description}</p><p className="text-[10px] text-slate-400">Qty: {item.quantity} · Price: ₹{item.unitPrice}</p></div><div className="text-right"><p className="text-sm font-black text-slate-900">₹{item.amount}</p></div></div>
              ))}</div>
            </div>
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center opacity-60"><span className="text-xs font-bold uppercase tracking-widest">Subtotal</span><span className="text-sm font-bold">₹{order.subtotal}</span></div>
                <div className="flex justify-between items-center opacity-60"><span className="text-xs font-bold uppercase tracking-widest">Tax (GST)</span><span className="text-sm font-bold">₹{order.totalGST}</span></div>
                <div className="h-px bg-white/10 my-4" /><div className="flex justify-between items-end"><span className="text-xs font-black uppercase tracking-widest text-blue-400">Grand Total</span><span className="text-2xl font-black">₹{order.grandTotal}</span></div>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10"><div className="flex justify-between text-xs font-bold mb-1"><span className="text-slate-400">Amount Paid</span><span className="text-emerald-400">₹{order.totalPaid}</span></div><div className="w-full h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (order.totalPaid / order.grandTotal) * 100)}%` }} /></div><p className="text-[10px] text-slate-500 mt-2 text-right uppercase">Balance: ₹{order.balanceDue}</p></div>
            </div>
          </div>
        </div>
        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3"><button onClick={() => window.print()} className="h-9 px-4 rounded-xl border bg-white text-xs font-bold flex items-center gap-2"><Printer className="h-3.5 w-3.5" /> Print Invoice</button><button onClick={onClose} className="h-9 px-8 rounded-xl bg-slate-900 text-white text-xs font-bold">Close View</button></div>
      </div>
    </div>
  );
};

// ─── Payment Upload Modal ───────────────────────────────────────────────────
export const PaymentUploadModal = ({ order, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({ amount: '', method: 'UPI', proofUrl: '', reference: '', paymentType: 'Partial', notes: '' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.proofUrl) return alert('Amount and Proof are required.');
    setLoading(true); try { await onSubmit(formData); } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6 bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b bg-slate-50 flex items-center justify-between"><div><h2 className="text-xl font-black text-slate-900 tracking-tight">Record Payment</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Order: {order?.orderNumber}</p></div><button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-slate-200 flex items-center justify-center"><X className="h-5 w-5 text-slate-500" /></button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-2"><div className="flex justify-between items-center text-[10px] font-black uppercase text-blue-400 mb-1"><span>Remaining Balance</span><span>Total Value</span></div><div className="flex justify-between items-end"><span className="text-2xl font-black text-blue-700">₹{order?.balanceDue}</span><span className="text-sm font-bold text-blue-900 opacity-60">₹{order?.grandTotal}</span></div></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Amount Collected (₹) *</label><input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none" /></div>
            <div><label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Method *</label><select value={formData.method} onChange={e => setFormData({...formData, method: e.target.value})} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none"><option value="UPI">UPI / PhonePe</option><option value="Cash">Cash</option><option value="Bank Transfer">Bank Transfer</option></select></div>
            <div><label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Type</label><select value={formData.paymentType} onChange={e => setFormData({...formData, paymentType: e.target.value})} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none"><option value="Advance">Advance</option><option value="Partial">Partial</option><option value="Final">Final</option></select></div>
          </div>
          <div><label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Proof URL *</label><input type="url" required value={formData.proofUrl} onChange={e => setFormData({...formData, proofUrl: e.target.value})} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none" placeholder="https://..." /></div>
          <div className="pt-4 flex gap-3"><button type="button" onClick={onClose} className="flex-1 h-12 rounded-xl border text-sm font-bold">Cancel</button><button type="submit" disabled={loading} className="flex-[2] h-12 rounded-xl bg-slate-900 text-white font-bold text-sm">{loading ? 'Submitting...' : 'Submit Collection'}</button></div>
        </form>
      </div>
    </div>
  );
};

// ─── Assign Appointment Modal ────────────────────────────────────────────────
export const AssignAppointmentModal = ({ appointment, onClose, onAssigned }) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedId, setSelectedId] = useState('');

  React.useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const res = await employeeApi.list({ status: 'ACTIVE' }, user.token);
        const filtered = (res.employees || res.data || []).filter(e => ['FIELD_EXEC', 'SALES_MANAGER', 'MD_CEO', 'ADMIN'].includes(e.role));
        setEmployees(filtered);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchEmployees();
  }, [user.token]);

  const handleAssign = async () => {
    if (!selectedId) return alert('Please select a person');
    setAssigning(true);
    try {
      const res = await appointmentApi.assign(appointment._id, { assignedTo: selectedId }, user.token);
      if (res.success) { onAssigned?.(); onClose(); }
    } catch (err) { alert(err.message || 'Assignment failed'); } finally { setAssigning(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b bg-slate-900 text-white flex items-center justify-between"><div><h2 className="font-bold text-lg">Assign Personnel</h2><p className="text-slate-400 text-xs">{appointment.businessName}</p></div><button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button></div>
        <div className="p-6 space-y-6">
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="w-full h-12 rounded-xl border bg-white px-4 text-sm font-medium outline-none shadow-sm">
            <option value="">Select person...</option>
            {employees.map(e => {
              const roleName = e.role === 'MD_CEO' ? 'CEO' : e.role === 'FIELD_EXEC' ? 'Field Executive' : e.role === 'SALES_MANAGER' ? 'Sales Manager' : e.role === 'ADMIN' ? 'Admin' : e.role.replace('_', ' ');
              return <option key={e._id} value={e._id}>{e.name} ({roleName})</option>;
            })}
          </select>
          <div className="flex gap-3"><button onClick={onClose} className="h-12 flex-1 rounded-xl border text-sm font-bold">Cancel</button><button onClick={handleAssign} disabled={assigning || !selectedId} className="h-12 flex-1 rounded-xl bg-slate-900 text-white text-sm font-bold">{assigning ? 'Assigning...' : 'Confirm Assignment'}</button></div>
        </div>
      </div>
    </div>
  );
};

// ─── Update Appointment Remark Modal ──────────────────────────────────────────
export const UpdateAppointmentRemarkModal = ({ appointment, onClose, onSaved }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ remark: appointment.remark || '', prospectStatus: appointment.prospect?.status || 'In-progress' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); if (!formData.remark.trim()) return alert('Please enter a remark');
    setLoading(true); try { const res = await appointmentApi.updateRemark(appointment._id, formData, user.token); if (res.success) { onSaved?.(); onClose(); } } catch (err) { alert(err.message || 'Update failed'); } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b bg-emerald-600 text-white flex items-center justify-between"><div><h2 className="font-bold text-lg">Update Visit Outcome</h2><p className="text-emerald-100 text-xs">Appt: {appointment.businessName}</p></div><button onClick={onClose}><X className="h-5 w-5" /></button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Remark / Notes</label><textarea required rows={4} placeholder="Outcome of visit..." value={formData.remark} onChange={e => setFormData({ ...formData, remark: e.target.value })} className="w-full rounded-xl border bg-slate-50 p-4 text-sm outline-none focus:bg-white resize-none" /></div>
          <div><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Update Status</label><select value={formData.prospectStatus} onChange={e => setFormData({ ...formData, prospectStatus: e.target.value })} className="w-full h-12 rounded-xl border bg-white px-4 text-sm font-bold shadow-sm"><option value="In-progress">In-progress</option><option value="Sale Closed">Sale Closed (Won)</option><option value="Canceled">Canceled (Lost)</option></select></div>
          <div className="flex gap-3"><button type="button" onClick={onClose} className="h-12 flex-1 rounded-xl border text-sm font-bold">Cancel</button><button type="submit" disabled={loading} className="h-12 flex-1 rounded-xl bg-emerald-600 text-white text-sm font-bold">{loading ? 'Updating...' : 'Save & Close Visit'}</button></div>
        </form>
      </div>
    </div>
  );
};
