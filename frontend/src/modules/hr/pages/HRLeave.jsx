import React, { useState } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import EmptyState from '../../../components/ui/EmptyState';

const HRLeave = () => {
  const [activeTab, setActiveTab] = useState('PENDING');
  const { data, loading, error, refetch } = useApi(`/leaves?status=${activeTab}`);
  const { request } = useApi();

  const leaves = data?.leaves || data || [];

  const handleAction = async (id, action) => {
    try {
      await request('PUT', `/leaves/${id}/hr-review`, { action });
      refetch();
    } catch (e) {
      alert(e.message || 'Failed to update leave request');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'PENDING') return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md">PENDING</span>;
    if (status.includes('APPROVED')) return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md">APPROVED</span>;
    if (status.includes('REJECTED')) return <span className="px-2 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-md">REJECTED</span>;
    return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">{status}</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Leave Management</h1>
          <p className="text-slate-500 font-medium">Review and process employee leave requests.</p>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-max shadow-inner">
        {['PENDING', 'HR_APPROVED', 'HR_REJECTED'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.replace('HR_', '')}
          </button>
        ))}
      </div>

      <div className="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">Loading leave requests...</div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500 font-bold">Failed to load leaves: {error}</div>
        ) : leaves.length === 0 ? (
          <div className="py-12">
            <EmptyState 
              icon={CheckCircle} 
              title={`No ${activeTab.replace('HR_', '')} Requests`} 
              description="You are all caught up!" 
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Leave Details</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map(l => (
                  <tr key={l._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{l.employee?.name || 'Unknown'}</div>
                      <div className="text-xs font-medium text-slate-500">{l.employee?.role?.replace(/_/g, ' ') || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700">{l.leaveType}</div>
                      <div className="text-xs font-medium text-slate-500 mt-1">
                        {new Date(l.fromDate).toLocaleDateString()} to {new Date(l.toDate).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] font-black tracking-widest text-blue-500 uppercase mt-0.5">
                        {l.totalDays || Math.floor((new Date(l.toDate) - new Date(l.fromDate))/(1000*60*60*24)) + 1} Days
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate" title={l.reason}>
                      {l.reason || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(l.status)}
                    </td>
                    <td className="px-6 py-4">
                      {l.status === 'PENDING' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleAction(l._id, 'APPROVE')}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-xs font-bold transition-colors"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleAction(l._id, 'REJECT')}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-xs font-bold transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-xs font-bold text-slate-400">Processed</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRLeave;
