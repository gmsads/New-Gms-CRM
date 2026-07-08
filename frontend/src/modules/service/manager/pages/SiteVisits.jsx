import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { MapPin, Camera, CheckCircle, RefreshCw } from 'lucide-react';

const SiteVisits = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
      // Using active queue for site visits
      const res = await fetch(`${apiUrl}/api/service/active`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data.success) {
        const items = [];
        data.data.forEach(order => {
          order.lineItems.forEach(item => {
            if (item.serviceWorkflow) {
              items.push({
                ...item,
                orderId: order._id,
                orderNumber: order.orderNumber,
                clientName: order.clientSnapshot?.name || 'Unknown',
                companyName: order.clientSnapshot?.company || 'Unknown',
                address: order.shippingAddress?.address || 'Address not provided'
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
          <h1 className="text-3xl font-black text-slate-900">Site Visits</h1>
          <p className="text-slate-500 mt-1">Track pre-installation site readiness and recce visits.</p>
        </div>
        <button onClick={fetchJobs} className="p-2 border rounded-lg hover:bg-slate-50">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 font-semibold text-slate-600 border-b">
            <tr>
              <th className="px-6 py-4">Client & Order</th>
              <th className="px-6 py-4">Site Address</th>
              <th className="px-6 py-4">Service</th>
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
                <td className="px-6 py-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-slate-700">{job.address}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-800">{job.description}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    {job.serviceWorkflow?.status || 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">
                      <Camera className="w-3.5 h-3.5" /> Upload Photos
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5" /> Mark Ready
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && !loading && (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No active site visits pending.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SiteVisits;
