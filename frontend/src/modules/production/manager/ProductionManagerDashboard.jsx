import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Briefcase, CheckCircle, RefreshCw, AlertCircle, FileText, Printer, Download, Upload } from 'lucide-react';
import { calculateDeliveryPriority } from '../../../utils/deliveryUtils';

const ProductionManagerDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract tab from URL if present (e.g. /production/manager/qc -> 'qc')
  const getTabFromUrl = () => {
    const pathParts = location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart === 'manager') return 'dashboard';
    return ['queue', 'printing', 'qc', 'issues', 'completed'].includes(lastPart) ? lastPart : 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getTabFromUrl());
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync tab when URL changes via sidebar
  useEffect(() => {
    setActiveTab(getTabFromUrl());
  }, [location.pathname]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/production/manager/${tabId}`);
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
      const res = await fetch(`${apiUrl}/api/production/jobs`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data.success) {
        setJobs(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleStatusChange = async (job, newStatus) => {
    // Revert if no change
    if (newStatus === job.productionWorkflow?.status && !job.isDelayed) return;

    // Validation for QC Check
    if (newStatus === 'QC Check') {
      const hasProof = job.productionWorkflow?.proofs?.length > 0;
      if (!hasProof) {
        alert("upload printing pic");
        return;
      }
    }

    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
      const { orderId, itemIndex } = job;

      // Handle Delay / Issues
      if (newStatus === 'Issues/Delayed') {
        const delayReason = window.prompt("Enter reason for issue/delay:");
        if (!delayReason) {
          setLoading(false);
          return; // Cancelled
        }
        const delayRes = await fetch(`${apiUrl}/api/production/jobs/${orderId}/${itemIndex}/delay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
          body: JSON.stringify({ isDelayed: true, delayReason, remarks: 'Flagged from dashboard' })
        });
        if ((await delayRes.json()).success) await fetchJobs();
        return;
      }

      // If it was delayed and we are moving to a normal status, clear the delay first
      if (job.isDelayed) {
        await fetch(`${apiUrl}/api/production/jobs/${orderId}/${itemIndex}/delay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
          body: JSON.stringify({ isDelayed: false, delayReason: '' })
        });
      }

      // Update Normal Status
      const res = await fetch(`${apiUrl}/api/production/jobs/${orderId}/${itemIndex}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await res.json();
      if (data.success) {
        await fetchJobs();
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (job, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
        const res = await fetch(`${apiUrl}/api/production/jobs/${job.orderId}/${job.itemIndex}/proofs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
          body: JSON.stringify({ type: 'PRINTING_PIC', url: reader.result })
        });
        const data = await res.json();
        if (data.success) {
          await fetchJobs();
        } else {
          alert('Failed to upload pic: ' + data.message);
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

  const getFilteredJobs = () => {
    return jobs.filter(job => {
      const st = job.productionWorkflow?.status || 'Pending Production';
      const isDelayed = job.isDelayed;
      
      if (activeTab === 'issues') return isDelayed || st === 'Rework In Progress';
      if (activeTab === 'queue' || activeTab === 'dashboard') return st === 'Pending Production' && !isDelayed;
      if (activeTab === 'printing') return ['Scheduled', 'Printing Started', 'Printing', 'Fabrication In Progress', 'Production In Progress'].includes(st) && !isDelayed;
      if (activeTab === 'qc') return ['QC Check', 'QC Pending'].includes(st) && !isDelayed;
      if (activeTab === 'completed') return ['Completed', 'Production Completed', 'Ready For Service'].includes(st);
      return true;
    });
  };

  const filtered = getFilteredJobs();
  
  const pendingCount = jobs.filter(j => (j.productionWorkflow?.status || 'Pending Production') === 'Pending Production').length;
  const readyCount = jobs.filter(j => ['Completed', 'Production Completed', 'Ready For Service'].includes(j.productionWorkflow?.status)).length;

  const tabs = [
    { id: 'queue', label: 'Queue', icon: FileText },
    { id: 'printing', label: 'Printing', icon: Printer },
    { id: 'qc', label: 'Pending QC', icon: CheckCircle },
    { id: 'issues', label: 'Issues/Delayed', icon: AlertCircle },
    { id: 'completed', label: 'Completed', icon: Briefcase }
  ];

  const headerContent = {
    dashboard: { 
      title: <>Welcome, <span className="text-blue-600">{user.name?.split(' ')[0]}!</span></>, 
      desc: '"Seamless operations are the backbone of success. Keep the gears turning."' 
    },
    queue: { title: 'Production Queue', desc: 'View and manage orders waiting to begin production.' },
    printing: { title: 'Active (Printing)', desc: 'Monitor orders currently in the printing and fabrication phase.' },
    qc: { title: 'Quality Control', desc: 'Verify completed production items before they are sent for installation.' },
    issues: { title: 'Issues & Delayed', desc: 'Track and resolve orders that have been flagged with issues or delays.' },
    completed: { title: 'Completed Jobs', desc: 'View the history of successfully completed production orders.' }
  };

  const currentHeader = headerContent[activeTab] || headerContent.dashboard;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="mb-10 flex justify-between items-start">
        <div>
          <h1 className="text-[32px] font-extrabold text-slate-900 tracking-tight">
            {currentHeader.title}
          </h1>
          <p className="text-slate-500 italic mt-2 text-[15px]">
            {currentHeader.desc}
          </p>
        </div>
        <button onClick={fetchJobs} className="p-2 border rounded-lg hover:bg-slate-50 transition-colors">
          <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Cards Section (Hidden if not viewing 'dashboard') */}
      {activeTab === 'dashboard' && (
        <div className="flex flex-wrap gap-6 mb-10">
          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-100 w-full sm:w-64 transition-transform hover:-translate-y-1 duration-300">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-6">
              <Briefcase className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-4xl font-extrabold text-slate-900 leading-none">{pendingCount}</span>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-3">
                Pending Production
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-100 w-full sm:w-64 transition-transform hover:-translate-y-1 duration-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6">
              <CheckCircle className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-4xl font-extrabold text-slate-900 leading-none">{readyCount}</span>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-3">
                Installation Queue
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs (Hidden if viewing 'dashboard' default) */}
      {activeTab !== 'dashboard' && (
        <div className="flex border-b overflow-x-auto custom-scrollbar mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 text-slate-600 font-semibold border-b">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Employee Name</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Delivery Date</th>
                {activeTab !== 'queue' && <th className="px-6 py-4">Action / Upload</th>}
                <th className="px-6 py-4">Remark</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'queue' ? 7 : 8} className="px-6 py-10 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading jobs...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'queue' ? 7 : 8} className="px-6 py-10 text-center text-slate-500">
                    No jobs found in this category.
                  </td>
                </tr>
              ) : (
                filtered.map((job) => (
                  <tr key={`${job.orderId}-${job.itemIndex}`} className="border-b hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{job.orderNumber}</td>
                    <td className="px-6 py-4 text-slate-700">{job.salesExecName}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{job.clientName}</p>
                      <p className="text-xs text-slate-500">{job.companyName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-800 font-medium">{job.description}</p>
                      <p className="text-xs text-slate-500">Qty: {job.quantity} {job.unit}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <p className="font-semibold text-slate-800">
                        {job.deliveryDate ? new Date(job.deliveryDate).toLocaleDateString('en-GB') : 'Not Set'}
                      </p>
                      {job.deliveryDate && (
                        <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${calculateDeliveryPriority(job.deliveryDate).color}`}>
                          {calculateDeliveryPriority(job.deliveryDate).label}
                        </div>
                      )}
                    </td>
                    
                    {activeTab !== 'queue' && (
                      <td className="px-6 py-4">
                        {/* Show uploaded proofs if any */}
                        {job.productionWorkflow?.proofs?.length > 0 && (
                          <div className="flex gap-2 mb-2 flex-wrap max-w-[150px]">
                            {job.productionWorkflow.proofs.map((proof, i) => (
                              <a key={i} href={proof.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                                <Download className="w-3 h-3" /> Pic {i+1}
                              </a>
                            ))}
                          </div>
                        )}
                        
                        {/* Upload button only available in Printing tab for this flow */}
                        {activeTab === 'printing' && (
                          <label className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg cursor-pointer text-xs font-semibold transition-colors mt-1">
                            <Upload className="w-3 h-3" /> Upload Pic
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(job, e)} />
                          </label>
                        )}
                      </td>
                    )}

                    <td className="px-6 py-4 text-slate-700">
                      {job.isDelayed && job.delayReason ? (
                         <div className="text-xs text-red-600 font-semibold bg-red-50 p-2 rounded break-words max-w-[200px]">
                           {job.delayReason}
                         </div>
                      ) : (
                         <span className="text-xs text-slate-400 italic">No remarks</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={job.isDelayed ? 'Issues/Delayed' : (job.productionWorkflow?.status || 'Pending Production')}
                        onChange={(e) => handleStatusChange(job, e.target.value)}
                        className="text-xs font-medium border rounded px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-sm w-full max-w-[150px]"
                      >
                        <option value="Pending Production">Pending Production</option>
                        <option value="Printing">Printing</option>
                        <option value="QC Check">QC Check</option>
                        <option value="Issues/Delayed">Issues/Delayed</option>
                        <option value="Completed">Completed</option>
                      </select>
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

export default ProductionManagerDashboard;
