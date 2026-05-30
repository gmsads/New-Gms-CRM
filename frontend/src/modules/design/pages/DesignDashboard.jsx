import React, { useState, useEffect } from 'react';
import { Palette, RefreshCw, ChevronDown, ChevronUp, Image as ImageIcon, FileText, CheckCircle2, Link as LinkIcon, UploadCloud, XCircle, Send } from 'lucide-react';
import { orderApi } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const DESIGN_STATUSES = [
  'Pending',
  'In Progress',
  'Demo Shared to Client',
  'Client Approved Design',
  'Design Completed',
  'Design Provided - Approved',
  'Design Provided - Not Clear'
];

const DesignDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  
  // File upload state for line items
  const [uploadingItem, setUploadingItem] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await orderApi.list({ designStatus: 'Pending,In_Progress,Demo_Shared' }, user.token);
      if (res.success) setOrders(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateStatus = async (orderId, itemIndex, newStatus) => {
    try {
      const res = await orderApi.updateLineItem(orderId, itemIndex, { designerStatus: newStatus }, user.token);
      if (res.success) {
        // Refetch to get updated order and potential auto-transition
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleFileUpload = async (orderId, itemIndex) => {
    if (!selectedFile) return;
    
    setUploadingItem(`${orderId}-${itemIndex}`);
    try {
      // Create FormData to send to an S3 upload endpoint, but we don't have a specific file upload endpoint defined.
      // Usually it's handled via a separate upload endpoint that returns a URL, then we patch the line item.
      // For now, we simulate the upload or prompt the user if they want to enter a link.
      
      const fileUrl = URL.createObjectURL(selectedFile); // Mock URL for demonstration
      const res = await orderApi.updateLineItem(orderId, itemIndex, { designFileUrl: fileUrl }, user.token);
      
      if (res.success) {
        setSelectedFile(null);
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to upload file');
    } finally {
      setUploadingItem(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedOrder(expandedOrder === id ? null : id);
  };

  

  
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Design Studio Workspace</h1>
          <p className="text-sm font-semibold text-slate-500">
            Manage your design tasks, update progress for individual services, and attach proofs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm transition-all active:scale-95">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading && orders.length === 0 ? (
           <div className="flex h-64 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
            <Palette className="h-10 w-10 mx-auto text-slate-200 mb-3" />
            <p className="text-slate-500 font-bold">No pending design tasks assigned to you right now.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order._id} className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden transition-all duration-300">
              
              {/* Order Header (Always Visible) */}
              <div 
                onClick={() => toggleExpand(order._id)}
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-6">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
                    <Palette className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase tracking-wider">{order.orderNumber}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {order.lineItems?.length || 0} Services
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{order.clientSnapshot?.name || 'Client'}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">{order.clientSnapshot?.company}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="hidden md:block text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sales Exec</p>
                    <p className="text-sm font-bold text-slate-700">{order.salesExec?.name || '—'}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                    {expandedOrder === order._id ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                  </div>
                </div>
              </div>

              {/* Order Details & Services (Expanded View) */}
              {expandedOrder === order._id && (
                <div className="border-t border-slate-50 bg-slate-50/30 p-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="mb-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Design Services ({order.lineItems?.length || 0})</h4>
                    <div className="space-y-3">
                      {order.lineItems?.map((item, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center shadow-sm">
                          
                          {/* Item Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">Item {idx + 1}</span>
                              <h5 className="font-bold text-slate-900 text-lg">{item.description}</h5>
                            </div>
                            <p className="text-xs font-semibold text-slate-500">Qty: {item.quantity} {item.unit || 'pcs'}</p>
                          </div>

                          {/* Controls */}
                          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                            {/* Status Dropdown */}
                            <div className="w-full sm:w-64">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Update Status</label>
                              <select 
                                value={item.designerStatus || 'Pending'} 
                                onChange={(e) => handleUpdateStatus(order._id, idx, e.target.value)}
                                className={`w-full h-11 rounded-xl border-2 px-3 text-xs font-bold outline-none focus:border-indigo-500 transition-colors ${
                                  ['Design Completed', 'Design Provided - Approved'].includes(item.designerStatus) 
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                    : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                {DESIGN_STATUSES.map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>

                            {/* Proof Upload / Display */}
                            <div className="w-full sm:w-auto">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Design Proof</label>
                              
                              {item.designFileUrl ? (
                                <div className="flex items-center gap-2">
                                  <a href={item.designFileUrl} target="_blank" rel="noreferrer" 
                                    className="h-11 px-4 flex items-center gap-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-colors">
                                    <ImageIcon className="h-4 w-4" /> View Proof
                                  </a>
                                  {/* Quick replace button */}
                                  <label className="h-11 w-11 flex items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all">
                                    <RefreshCw className="h-4 w-4" />
                                    <input type="file" className="hidden" onChange={(e) => { setSelectedFile(e.target.files[0]); handleFileUpload(order._id, idx); }} />
                                  </label>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {uploadingItem === `${order._id}-${idx}` ? (
                                    <div className="h-11 px-4 flex items-center gap-2 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs">
                                      <RefreshCw className="h-4 w-4 animate-spin" /> Uploading...
                                    </div>
                                  ) : (
                                    <>
                                      <label className="h-11 px-4 flex items-center gap-2 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 cursor-pointer transition-colors shadow-lg shadow-slate-200">
                                        <UploadCloud className="h-4 w-4" /> Upload File
                                        <input type="file" className="hidden" onChange={(e) => { setSelectedFile(e.target.files[0]); }} />
                                      </label>
                                      {selectedFile && (
                                        <button onClick={() => handleFileUpload(order._id, idx)} className="h-11 px-4 rounded-xl bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 hover:bg-emerald-600">
                                          <Send className="h-3 w-3" /> Save File
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Status Indicator for the whole order */}
                  <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-indigo-900">Auto-Transition Enabled</p>
                      <p className="text-[10px] font-medium text-indigo-600/80 mt-0.5">When all services are marked as "Design Completed" or "Design Provided - Approved", this order will automatically move to Operations.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DesignDashboard;
