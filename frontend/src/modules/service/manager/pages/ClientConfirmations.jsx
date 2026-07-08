import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { CheckCircle, Download, Eye, RefreshCw, FileSignature } from 'lucide-react';

const ClientConfirmations = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
      // Fetch completed and pending confirmation
      const res = await fetch(`${apiUrl}/api/service/completed`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data.success) {
        const items = [];
        data.data.forEach(order => {
          order.lineItems.forEach(item => {
            if (item.serviceWorkflow && ['Client Confirmation Pending', 'Service Completed'].includes(item.serviceWorkflow.status)) {
              items.push({
                ...item,
                orderId: order._id,
                orderNumber: order.orderNumber,
                clientName: order.clientSnapshot?.name || 'Unknown',
                companyName: order.clientSnapshot?.company || 'Unknown'
              });
            }
          });
        });
        setJobs(items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Client Confirmations</h1>
          <p className="text-slate-500 mt-1">Review signatures, OTP validations, and digital acceptances.</p>
        </div>
        <button onClick={fetchJobs} className="p-2 border rounded-lg hover:bg-slate-50">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 font-semibold text-slate-600 border-b">
            <tr>
              <th className="px-6 py-4">Order / Client</th>
              <th className="px-6 py-4">Service</th>
              <th className="px-6 py-4">Confirmation Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {jobs.map(job => (
              <tr key={job._id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{job.orderNumber}</div>
                  <div className="text-xs text-slate-500">{job.companyName}</div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-800">{job.description}</td>
                <td className="px-6 py-4">
                  {job.serviceWorkflow?.clientConfirmation?.type || 'Digital Signature'}
                </td>
                <td className="px-6 py-4">
                  {job.serviceWorkflow?.status === 'Service Completed' ? (
                     <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-xs font-bold"><CheckCircle className="w-3.5 h-3.5"/> Verified</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded text-xs font-bold border border-amber-200">Pending</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition-colors">
                      <FileSignature className="w-3.5 h-3.5" /> View Auth
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && !loading && (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No confirmations to review.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientConfirmations;
