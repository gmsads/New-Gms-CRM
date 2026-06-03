import React, { useState } from 'react';
import { DollarSign, CheckCircle, Clock, XCircle, TrendingUp, Briefcase, FileText, ChevronRight, Plus } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';

const AddCompensationModal = ({ onClose, onRefresh }) => {
  const { request } = useApi();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    employee: '', type: 'Incentives', amount: '', date: '', reason: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await request('POST', '/hr-compensation', form);
      onRefresh();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Add Compensation Entry" size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-slate-50">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Employee Name</label>
          <input required value={form.employee} onChange={e => setForm({...form, employee: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Compensation Type</label>
          <select required value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none bg-white">
            <option value="Incentives">Incentives</option>
            <option value="Commissions">Commissions</option>
            <option value="Bonus">Bonus</option>
            <option value="Deductions">Deductions</option>
            <option value="Reimbursements">Reimbursements</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Amount (₹)</label>
            <input type="number" required value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Date</label>
            <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-600 hover:bg-white transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const StatusBadge = ({ status }) => {
  const getStyle = () => {
    switch (status) {
      case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Manager Approval': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'HR Approval': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Submitted': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStyle()} flex items-center gap-1.5 w-max`}>
      {status === 'Approved' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
      {status}
    </span>
  );
};

const HRCompensation = () => {
  const [activeTab, setActiveTab] = useState('Incentives');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const tabs = ['Incentives', 'Commissions', 'Bonus', 'Deductions', 'Reimbursements'];

  const { data: response, loading, refetch } = useApi('/hr-compensation');
  const compensationData = response?.compensationData || response || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-6 md:p-8">
      <div className="pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Compensation Management</h1>
          <p className="text-slate-500 font-medium mt-2">Manage employee incentives, bonuses, deductions, and reimbursements.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-br from-slate-800 to-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:from-slate-700 hover:to-slate-800 transition-colors shadow-lg flex items-center gap-2">
          <Plus className="w-5 h-5" /> New Entry
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-2xl font-black text-sm transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 shadow-sm'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-2xl font-black text-slate-900">{activeTab} Records</h2>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">Loading {activeTab.toLowerCase()} records...</div>
        ) : (!compensationData[activeTab] || compensationData[activeTab].length === 0) ? (
          <div className="py-12">
             <EmptyState 
                icon={FileText} 
                title={`No ${activeTab} Records`} 
                description={`There are no ${activeTab.toLowerCase()} records found for your organization.`} 
             />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Workflow</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {compensationData[activeTab].map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-900">{record.employee}</div>
                      <div className="text-[10px] font-black text-indigo-500 tracking-widest uppercase mt-0.5">EMP-{1000 + record.id}</div>
                    </td>
                    <td className="px-8 py-5 font-black text-slate-800 text-lg">
                      ₹{record.amount.toLocaleString()}
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-600">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-5">
                      <StatusBadge status={record.status} />
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        <span className="text-slate-400">Sub</span> <ChevronRight className="w-3 h-3" /> 
                        <span className={record.status === 'Submitted' ? 'text-slate-300' : 'text-amber-500'}>Mgr</span> <ChevronRight className="w-3 h-3" />
                        <span className={record.status === 'Approved' ? 'text-emerald-500' : (record.status === 'HR Approval' ? 'text-blue-500' : 'text-slate-300')}>HR</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="px-5 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-xl font-bold text-xs transition-colors border border-slate-200 hover:border-indigo-200 shadow-sm">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && <AddCompensationModal onClose={() => setIsModalOpen(false)} onRefresh={refetch} />}
    </div>
  );
};

export default HRCompensation;
