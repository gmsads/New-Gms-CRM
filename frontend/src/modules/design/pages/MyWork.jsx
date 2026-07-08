import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw, FileText, Clock, CheckSquare, Search, Download, Phone, MessageCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const MyWork = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'assigned';
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  
  const fetchServices = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
      const res = await fetch(`${apiUrl}/api/design/services`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data.success) {
        setServices(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const handleStatusChange = async (orderId, itemIndex, newStatus, srv) => {
    // Validation checks
    if (activeTab === 'waiting') {
      const hasApprovalProof = srv.serviceFiles?.some(f => f.type === 'APPROVAL_PROOF');
      if (!hasApprovalProof) {
        alert('Please upload Approval Pic first.');
        return;
      }
    }

    if (activeTab === 'revisions') {
      if (newStatus === 'Completed') {
        const hasFinal = srv.serviceFiles?.some(f => f.type === 'FINAL');
        if (!hasFinal) {
          alert('First upload Final design.');
          return;
        }
      } else if (newStatus === 'Demo Shared') {
        const hasApprovalProof = srv.serviceFiles?.some(f => f.type === 'APPROVAL_PROOF');
        if (!hasApprovalProof) {
          alert('Please upload Approval Pic first.');
          return;
        }
      }
    }

    if (newStatus === 'Completed') {
      if (srv.designerWorkflow?.workflowType !== 'CLIENT_UPLOADED') {
        const hasFinal = srv.serviceFiles?.some(f => f.type === 'FINAL');
        if (!hasFinal) {
          alert(`Please upload Final Design first before marking as ${newStatus}.`);
          return;
        }
      }
    }

    let note = '';
    let rejectionReason = '';
    
    if (newStatus === 'Client-Design Rejected') {
      rejectionReason = window.prompt('Please enter a reason for rejecting the client design:');
      if (rejectionReason === null) return; // user cancelled prompt
    }
    
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
      const res = await fetch(`${apiUrl}/api/design/services/${orderId}/${itemIndex}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}` 
        },
        body: JSON.stringify({ status: newStatus, note, rejectionReason })
      });
      const data = await res.json();
      if (data.success) {
        fetchServices();
      } else {
        alert(data.message || 'Failed to update status');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
      setLoading(false);
    }
  };

  const handleFileUpload = async (orderId, itemIndex, type, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
        const res = await fetch(`${apiUrl}/api/design/services/${orderId}/${itemIndex}/files`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}` 
          },
          body: JSON.stringify({ type, fileUrl: reader.result, notes: `Uploaded ${type}` })
        });
        const data = await res.json();
        if (data.success) {
          await fetchServices();
        } else {
          alert('Failed to upload file: ' + data.message);
        }
      } catch (err) {
        console.error(err);
        alert('Upload failed');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const getFilteredServices = () => {
    return services.filter(srv => {
      const st = srv.designerWorkflow?.currentStatus;
      switch (activeTab) {
        case 'assigned': return st === 'Assigned';
        case 'progress': return st === 'In Progress';
        case 'waiting': return st === 'Demo Shared';
        case 'revisions': return st === 'Revision Requested';
        case 'completed': return st === 'Completed' || st === 'Client-Design Approved' || st === 'Client-Design Rejected';
        default: return true;
      }
    });
  };

  const filtered = getFilteredServices();
  const showUploadColumns = !['assigned', 'progress'].includes(activeTab);
  const colSpanCount = showUploadColumns ? 10 : 8;

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  const tabs = [
    { id: 'assigned', label: 'Assigned', icon: FileText },
    { id: 'progress', label: 'In Progress', icon: Clock },
    { id: 'waiting', label: 'Waiting Client', icon: Clock },
    { id: 'revisions', label: 'Revisions', icon: FileText },
    { id: 'completed', label: 'Completed', icon: CheckSquare }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Work</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your assigned design services.</p>
        </div>
        <button onClick={fetchServices} className="p-2 border rounded-lg hover:bg-slate-50 transition-colors">
          <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex border-b overflow-x-auto custom-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search client or service..." 
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
              <tr>
                <th className="px-6 py-3">Employee Name</th>
                <th className="px-6 py-3">Order ID</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Service</th>
                <th className="px-6 py-3">Design</th>
                <th className="px-6 py-3">Delivery Date</th>
                {showUploadColumns && <th className="px-6 py-3">Approval Pic</th>}
                <th className="px-6 py-3">Status</th>
                {showUploadColumns && <th className="px-6 py-3">Final Design</th>}
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colSpanCount} className="px-6 py-10 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading services...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={colSpanCount} className="px-6 py-10 text-center text-slate-500">
                    No services found in this category.
                  </td>
                </tr>
              ) : (
                filtered.map((srv, idx) => (
                  <tr key={`${srv.orderId}-${srv.itemIndex}`} className="border-b hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{srv.salesExecName}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{srv.orderNumber}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{srv.clientName}</p>
                      <p className="text-xs text-slate-500">{srv.companyName}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{srv.description}</td>
                    <td className="px-6 py-4">
                      {srv.designerWorkflow?.workflowType === 'CLIENT_UPLOADED' ? (
                        <div className="flex flex-col items-start gap-1">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                            Design Provided
                          </span>
                          {srv.serviceFiles?.filter(f => f.type === 'CLIENT_UPLOAD').map((file, i) => (
                            <a key={i} href={file.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                              <Download className="w-3 h-3" /> Download
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">
                          Need Design
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {srv.deliveryDate ? new Date(srv.deliveryDate).toLocaleDateString('en-GB') : 'Not Set'}
                    </td>
                    {showUploadColumns && (
                      <td className="px-6 py-4">
                        {srv.serviceFiles?.filter(f => f.type === 'APPROVAL_PROOF').map((file, i) => (
                          <a key={i} href={file.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mb-1">
                            <Download className="w-3 h-3" /> View Pic
                          </a>
                        ))}
                        <label className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded cursor-pointer hover:bg-indigo-100 transition-colors inline-block mt-1">
                          Upload Pic
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(srv.orderId, srv.itemIndex, 'APPROVAL_PROOF', e)} />
                        </label>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <select
                        value={srv.designerWorkflow?.currentStatus}
                        onChange={(e) => handleStatusChange(srv.orderId, srv.itemIndex, e.target.value, srv)}
                        className="text-xs font-medium border rounded px-2 py-1.5 text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer hover:bg-white"
                      >
                        <option value="Assigned">Assigned</option>
                        {srv.designerWorkflow?.workflowType === 'CLIENT_UPLOADED' ? (
                          <>
                            <option value="Client-Design Approved">Client-Design Approved</option>
                            <option value="Client-Design Rejected">Client-Design Rejected</option>
                          </>
                        ) : (
                          <>
                            <option value="In Progress">In Progress</option>
                            <option value="Demo Shared">Waiting for Client</option>
                            <option value="Revision Requested">Revision Requested</option>
                            <option value="Completed">Completed</option>
                          </>
                        )}
                      </select>
                    </td>
                    {showUploadColumns && (
                      <td className="px-6 py-4">
                        {srv.serviceFiles?.filter(f => f.type === 'FINAL').map((file, i) => (
                          <a key={i} href={file.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mb-1">
                            <Download className="w-3 h-3" /> View Final
                          </a>
                        ))}
                        <label className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded cursor-pointer hover:bg-emerald-100 transition-colors inline-block mt-1">
                          Upload Final
                          <input type="file" className="hidden" onChange={(e) => handleFileUpload(srv.orderId, srv.itemIndex, 'FINAL', e)} />
                        </label>
                      </td>
                    )}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-3">
                        <a href={`tel:${srv.clientPhone}`} className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-sm transition-all flex items-center justify-center" title="Call Client">
                          <Phone className="w-4 h-4" />
                        </a>
                        <a href={`https://wa.me/${(srv.clientPhone || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:shadow-sm transition-all flex items-center justify-center" title="WhatsApp Client">
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyWork;
