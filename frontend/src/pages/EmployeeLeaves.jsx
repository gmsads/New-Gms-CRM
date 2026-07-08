import React, { useState } from 'react';
import { Calendar, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import useApi from '../hooks/useApi';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';

const LeaveRequestModal = ({ isOpen, onClose, onSuccess }) => {
  const { request } = useApi();
  const [formData, setFormData] = useState({
    leaveType: 'SICK',
    fromDate: '',
    toDate: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await request('POST', '/leaves', formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Request Leave">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
        
        <div>
          <label className="block text-sm font-medium mb-1">Leave Type</label>
          <select 
            value={formData.leaveType} 
            onChange={(e) => setFormData({...formData, leaveType: e.target.value})}
            className="w-full rounded-md border px-3 py-2"
          >
            <option value="SICK">Sick Leave</option>
            <option value="CASUAL">Casual Leave</option>
            <option value="ANNUAL">Annual Leave</option>
            <option value="UNPAID">Unpaid Leave</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">From Date</label>
            <input 
              type="date" 
              required
              value={formData.fromDate}
              onChange={(e) => setFormData({...formData, fromDate: e.target.value})}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To Date</label>
            <input 
              type="date" 
              required
              value={formData.toDate}
              onChange={(e) => setFormData({...formData, toDate: e.target.value})}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Reason</label>
          <textarea 
            required
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
            className="w-full rounded-md border px-3 py-2 h-24"
            placeholder="Briefly describe the reason for your leave..."
          />
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md">Cancel</button>
          <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const EmployeeLeaves = () => {
  const { data, loading, error, refetch } = useApi('/leaves');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const leaves = data?.leaves || data || [];

  const getStatusIcon = (status) => {
    switch(status) {
      case 'PENDING': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'HR_APPROVED':
      case 'ADMIN_APPROVED': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'HR_REJECTED':
      case 'ADMIN_REJECTED': return <XCircle className="h-4 w-4 text-rose-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">My Leaves</h2>
          <p className="text-muted-foreground text-sm font-medium">Manage your leave requests and track approvals.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Request Leave
        </button>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading your leaves...</div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500">Failed to load leaves.</div>
        ) : leaves.length === 0 ? (
          <EmptyState 
            icon={Calendar} 
            title="No Leave History" 
            description="You haven't requested any leaves yet." 
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left">Leave Type</th>
                  <th className="px-6 py-4 text-left">Duration</th>
                  <th className="px-6 py-4 text-left">Reason</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Applied On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{l.leaveType}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                      <div>{new Date(l.fromDate).toLocaleDateString()}</div>
                      <div className="text-slate-400 mt-0.5">to {new Date(l.toDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate">{l.reason}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(l.status)}
                        <span className={`text-xs font-bold ${
                          l.status === 'PENDING' ? 'text-amber-600' :
                          l.status.includes('APPROVED') ? 'text-emerald-600' :
                          l.status.includes('REJECTED') ? 'text-rose-600' : 'text-slate-600'
                        }`}>
                          {l.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {new Date(l.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LeaveRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={refetch}
      />
    </div>
  );
};

export default EmployeeLeaves;
