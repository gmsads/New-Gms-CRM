import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Briefcase, Calendar, CheckCircle, RefreshCw, AlertCircle, FileText, Truck, Users, LayoutDashboard, Clock, ShieldCheck, Grid, Palette, Clock3 } from 'lucide-react';
import { calculateDeliveryPriority } from '../../../utils/deliveryUtils';

const ServiceManagerDashboard = ({ initialTab = 'queue' }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
      // Fetch queue, active, delayed, completed
      let endpoint = '/api/service/queue';
      if (activeTab === 'scheduled' || activeTab === 'active' || activeTab === 'delayed') {
        endpoint = '/api/service/active';
      } else if (activeTab === 'completed') {
        endpoint = '/api/service/completed';
      }
      
      const res = await fetch(`${apiUrl}${endpoint}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Flatten orders to line items for view
        const items = [];
        data.data.forEach(order => {
          order.lineItems.forEach(item => {
            if (item.serviceWorkflow || ['Ready For Service', 'Production Completed', 'Completed'].includes(item.productionWorkflow?.status)) {
              const deliveryDate = item.deliveryDate || order.deliveryDate;
              items.push({
                ...item,
                orderId: order._id,
                orderNumber: order.orderNumber,
                salesExecName: order.salesExec?.name || 'Unknown',
                clientName: order.clientSnapshot?.name || 'Unknown',
                companyName: order.clientSnapshot?.company || 'Unknown',
                deliveryDate,
                priorityInfo: calculateDeliveryPriority(deliveryDate),
                totalPaid: order.totalPaid,
                grandTotal: order.grandTotal
              });
            }
          });
        });
        setJobs(items);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    fetchJobs();
  }, [activeTab]);

  const handleStatusChange = async (job, newStatus) => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');

      const res = await fetch(`${apiUrl}/api/service/status/${job.orderId}/item/${job._id}`, {
        method: 'PUT',
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'queue', label: 'Service Queue', icon: FileText },
    { id: 'scheduled', label: 'Scheduled', icon: Calendar },
    { id: 'active', label: 'Active Services', icon: Briefcase },
    { id: 'delayed', label: 'Delayed', icon: AlertCircle },
    { id: 'completed', label: 'Completed', icon: CheckCircle },
    { id: 'due-today', label: 'Due Today', icon: Clock },
    { id: 'overdue', label: 'Overdue', icon: AlertCircle },
    { id: 'risks', label: 'Risk Alerts', icon: ShieldCheck }
  ];

  const filteredJobs = jobs.filter(job => {
    const st = job.serviceWorkflow?.status;
    if (activeTab === 'queue') return st === 'Pending Service' || !st;
    if (activeTab === 'scheduled') return st === 'Scheduled' || st === 'Labour Assigned' || st === 'Vendor Assigned';
    if (activeTab === 'active') return ['In Transit', 'Installation Started', 'Installation In Progress', 'Client Confirmation Pending'].includes(st);
    if (activeTab === 'delayed') return st === 'Issues/Delayed';
    if (activeTab === 'completed') return st === 'Service Completed';
    if (activeTab === 'due-today') return job.priorityInfo?.priority === 'CRITICAL' && st !== 'Service Completed';
    if (activeTab === 'overdue') return job.priorityInfo?.priority === 'OVERDUE' && st !== 'Service Completed';
    if (activeTab === 'risks') return ['HIGH', 'CRITICAL', 'OVERDUE'].includes(job.priorityInfo?.priority) && st !== 'Service Completed';
    // overview shows all active basically
    if (activeTab === 'overview') return st !== 'Service Completed';
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {activeTab === 'overview' && (
        <div className="mb-10 flex justify-between items-start">
          <div>
            <h1 className="text-[32px] font-extrabold text-slate-900 tracking-tight">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{user.name}!</span>
            </h1>
            <p className="text-slate-500 italic mt-2 text-[15px]">
              "Ensure every service is completed before the committed Delivery Date."
            </p>
          </div>
          <button onClick={fetchJobs} className="p-2 border rounded-lg hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}
      
      {activeTab !== 'overview' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl w-fit">
            {tabs.filter(t => t.id !== 'overview').map(t => (
              <button
                key={t.id}
                onClick={() => {
                  window.history.pushState(null, '', `/service/manager/${t.id}`);
                  setActiveTab(t.id);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === t.id 
                    ? 'bg-white text-blue-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={fetchJobs} className="shrink-0 h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
      )}
      
      {activeTab === 'overview' ? (
        <div className="space-y-6">
          {/* Top 6 Stat Cards mimicking the reference image */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            
            {/* 0. Pending Services (Queue) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-start">
                <span className="text-sm font-bold text-slate-700 leading-snug w-20">Pending<br/>Services</span>
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-orange-500" />
                </div>
              </div>
              <span className="text-3xl font-black text-slate-900 mt-4">
                {jobs.filter(j => j.serviceWorkflow?.status === 'Pending Service' || !j.serviceWorkflow?.status).length}
              </span>
            </div>

            {/* 1. Services Assigned */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-start">
                <span className="text-sm font-bold text-slate-700 leading-snug w-20">Services<br/>Assigned</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Grid className="w-4 h-4 text-blue-500" />
                </div>
              </div>
              <span className="text-3xl font-black text-slate-900 mt-4">
                {jobs.filter(j => j.serviceWorkflow?.status === 'Scheduled' || j.serviceWorkflow?.status === 'Labour Assigned' || j.serviceWorkflow?.status === 'Vendor Assigned').length}
              </span>
            </div>

            {/* 2. Active Services */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-start">
                <span className="text-sm font-bold text-slate-700 leading-snug w-20">Active<br/>Services</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  <Clock3 className="w-4 h-4 text-indigo-500" />
                </div>
              </div>
              <span className="text-3xl font-black text-slate-900 mt-4">
                {jobs.filter(j => ['In Transit', 'Installation Started', 'Installation In Progress'].includes(j.serviceWorkflow?.status)).length}
              </span>
            </div>

            {/* 3. Pending Confirmations */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-start">
                <span className="text-sm font-bold text-slate-700 leading-snug w-24">Pending<br/>Confirmations</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                </div>
              </div>
              <span className="text-3xl font-black text-slate-900 mt-4">
                {jobs.filter(j => j.serviceWorkflow?.status === 'Client Confirmation Pending').length}
              </span>
            </div>

            {/* 4. Service Issues */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-start">
                <span className="text-sm font-bold text-slate-700 leading-snug w-20">Service<br/>Issues</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                  <Palette className="w-4 h-4 text-rose-500" />
                </div>
              </div>
              <span className="text-3xl font-black text-slate-900 mt-4">
                {jobs.filter(j => j.serviceWorkflow?.status === 'Issues/Delayed').length}
              </span>
            </div>

            {/* 5. Completed Today */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-start">
                <span className="text-sm font-bold text-slate-700 leading-snug w-20">Completed<br/>Services</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <span className="text-3xl font-black text-slate-900 mt-4">
                {jobs.filter(j => j.serviceWorkflow?.status === 'Service Completed').length}
              </span>
            </div>

            {/* 6. Overdue Services */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-start">
                <span className="text-sm font-bold text-slate-700 leading-snug w-20">Overdue<br/>Services</span>
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
              </div>
              <span className="text-3xl font-black text-slate-900 mt-4">
                {jobs.filter(j => j.priorityInfo?.priority === 'OVERDUE').length}
              </span>
            </div>

          </div>

          {/* Two Panels Below */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Panel: Alerts */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 min-h-[300px] shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6">Service Escalations</h3>
              <p className="text-sm font-medium text-slate-600">
                You have {jobs.filter(j => j.serviceWorkflow?.status === 'Issues/Delayed').length} services requiring immediate attention.
              </p>
              
              <div className="mt-6 space-y-3">
                {jobs.filter(j => j.serviceWorkflow?.status === 'Issues/Delayed').slice(0, 3).map(job => (
                  <div key={job._id} className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{job.orderNumber} - {job.companyName}</p>
                      <p className="text-xs font-medium text-slate-600 mt-1">{job.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel: Recent Activities */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 min-h-[300px] shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-full flex justify-start mb-auto">
                <h3 className="text-lg font-black text-slate-900">Recent Activities</h3>
              </div>
              <div className="flex flex-col items-center justify-center my-auto">
                <Clock3 className="w-12 h-12 text-slate-200 mb-4" strokeWidth={1.5} />
                <p className="text-slate-500 font-medium text-sm">Activity timeline coming soon.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="px-6 py-4">Order Details</th>
                  <th className="px-6 py-4">Service Details</th>
                  <th className="px-6 py-4">Delivery Deadline</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4">Status / Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading...
                    </td>
                  </tr>
                ) : filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                      No services found in this category.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => {
                    const paidPct = job.grandTotal > 0 ? (job.totalPaid / job.grandTotal) * 100 : 0;
                    return (
                      <tr key={job._id} className="border-b hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{job.orderNumber}</p>
                          <p className="text-xs font-semibold text-slate-700 mt-1">{job.companyName}</p>
                          <p className="text-xs text-slate-500">{job.clientName}</p>
                          <p className="text-[10px] text-slate-400 mt-1">Exec: {job.salesExecName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-800">{job.description}</p>
                          <p className="text-xs text-slate-500 mt-1">Qty: {job.quantity} {job.unit}</p>
                          <p className="text-xs text-slate-500 mt-1">Installed: {job.installedQuantity || 0}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">
                            {job.deliveryDate ? new Date(job.deliveryDate).toLocaleDateString('en-GB') : 'Not Set'}
                          </p>
                          {job.priorityInfo && (
                            <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${job.priorityInfo.color}`}>
                              {job.priorityInfo.label}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-full bg-slate-200 rounded-full h-2.5 mb-1 max-w-[120px]">
                            <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${Math.min(100, paidPct)}%` }}></div>
                          </div>
                          <p className="text-[10px] font-bold text-slate-600">{paidPct.toFixed(0)}% Paid</p>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={job.serviceWorkflow?.status || 'Pending Service'}
                            onChange={(e) => handleStatusChange(job, e.target.value)}
                            className="text-xs font-medium border rounded px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-sm w-full max-w-[180px]"
                          >
                            <option value="Pending Service">Pending Service</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Labour Assigned">Labour Assigned</option>
                            <option value="Vendor Assigned">Vendor Assigned</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Installation Started">Installation Started</option>
                            <option value="Installation In Progress">Installation In Progress</option>
                            <option value="Client Confirmation Pending">Client Confirmation Pending</option>
                            <option value="Service Completed">Service Completed</option>
                            <option value="Issues/Delayed">Issues/Delayed</option>
                          </select>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagerDashboard;
