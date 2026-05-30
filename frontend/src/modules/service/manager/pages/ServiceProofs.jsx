import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { Image as ImageIcon, Eye, RefreshCw, Upload, CheckCircle } from 'lucide-react';

const ServiceProofs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
      const res = await fetch(`${apiUrl}/api/service/active`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data.success) {
        const items = [];
        data.data.forEach(order => {
          order.lineItems.forEach(item => {
            if (item.serviceWorkflow && ['Installation Started', 'Installation In Progress', 'Installation Completed', 'Client Confirmation Pending', 'Service Completed'].includes(item.serviceWorkflow.status)) {
              items.push({
                ...item,
                orderId: order._id,
                orderNumber: order.orderNumber,
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

  const hasProof = (proofs = [], stage) => proofs.some(p => p.stage === stage);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Service Proofs</h1>
          <p className="text-slate-500 mt-1">Verify before, during, and after installation photos.</p>
        </div>
        <button onClick={fetchJobs} className="p-2 border rounded-lg hover:bg-slate-50">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 font-semibold text-slate-600 border-b">
            <tr>
              <th className="px-6 py-4">Order / Service</th>
              <th className="px-6 py-4 text-center">Before Photo</th>
              <th className="px-6 py-4 text-center">During Photo</th>
              <th className="px-6 py-4 text-center">After Photo</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {jobs.map(job => (
              <tr key={job._id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{job.orderNumber} - {job.description}</div>
                  <div className="text-xs text-slate-500">{job.companyName}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  {hasProof(job.serviceWorkflow?.proofs, 'Before') ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold"><CheckCircle className="w-3.5 h-3.5"/> Verified</span>
                  ) : (
                    <span className="text-slate-300 text-xs font-semibold">Pending</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {hasProof(job.serviceWorkflow?.proofs, 'During') ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold"><CheckCircle className="w-3.5 h-3.5"/> Verified</span>
                  ) : (
                    <span className="text-slate-300 text-xs font-semibold">Pending</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {hasProof(job.serviceWorkflow?.proofs, 'After') ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold"><CheckCircle className="w-3.5 h-3.5"/> Verified</span>
                  ) : (
                    <span className="text-slate-300 text-xs font-semibold">Pending</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors" title="View Gallery">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-bold transition-colors">
                      <Upload className="w-3.5 h-3.5" /> Upload
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && !loading && (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No active installations require proofs right now.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ServiceProofs;
