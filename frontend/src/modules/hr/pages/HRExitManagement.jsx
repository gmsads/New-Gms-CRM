import React, { useState } from 'react';
import { UserMinus, CheckCircle, Clock, FileText, ChevronRight, AlertCircle, Inbox } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';

const workflowSteps = ['Submitted', 'Manager', 'HR', 'Interview', 'Settlement'];

const ProgressBar = ({ progress }) => (
  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-3 shadow-inner">
    <div 
      className={`h-full rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gradient-to-r from-blue-400 to-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`} 
      style={{ width: `${progress}%` }} 
    />
  </div>
);

const InitiateExitModal = ({ onClose, onRefresh }) => {
  const { request } = useApi();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    employee: '', department: '', lastDay: '', reason: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await request('POST', '/hr-exit', form);
      onRefresh();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Initiate Exit Process" size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-slate-50">
        <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-rose-700">Initiating an exit process will notify the employee's manager and begin the clearance workflow.</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Employee Name</label>
            <input required value={form.employee} onChange={e => setForm({...form, employee: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-rose-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Department</label>
            <input required value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-rose-500 outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Last Working Day</label>
          <input type="date" required value={form.lastDay} onChange={e => setForm({...form, lastDay: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-rose-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Reason for Exit</label>
          <textarea required value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:border-rose-500 outline-none min-h-[100px]" placeholder="Briefly describe..." />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-600 hover:bg-white transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-lg bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 transition-colors disabled:opacity-50">
            {loading ? 'Initiating...' : 'Initiate Exit'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const HRExitManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: response, loading, refetch } = useApi('/hr-exit');
  
  const exitRecords = response?.exitRecords || response || [];
  const stats = response?.stats || { pendingResignations: 0, exitInterviews: 0, pendingSettlements: 0, completedMTD: 0 };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-6 md:p-8">
      <div className="pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Exit Management</h1>
          <p className="text-slate-500 font-medium mt-2">Manage resignations, exit interviews, and final settlements.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-br from-rose-50 to-red-50 text-rose-600 px-6 py-3 rounded-xl font-bold hover:from-rose-100 hover:to-red-100 transition-colors border border-rose-200 flex items-center gap-2 shadow-sm">
          <UserMinus className="w-5 h-5" /> Initiate Exit Process
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {[
          { label: 'Pending Resignations', value: stats.pendingResignations, color: 'amber' },
          { label: 'Exit Interviews', value: stats.exitInterviews, color: 'blue' },
          { label: 'Pending Settlements', value: stats.pendingSettlements, color: 'rose' },
          { label: 'Completed (MTD)', value: stats.completedMTD, color: 'emerald' },
        ].map((stat, i) => (
          <div key={i} className={`bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow border-l-[6px] border-l-${stat.color}-500`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className="text-4xl font-black text-slate-900 leading-tight mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-2xl font-black text-slate-900">Active Exit Workflows</h2>
        </div>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12 text-slate-500 font-medium">Loading exit workflows...</div>
        ) : exitRecords.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <EmptyState icon={Inbox} title="No Active Exits" description="There are no active employee exit workflows at the moment." />
          </div>
        ) : (
          <div className="p-8 space-y-6 bg-slate-50/30">
            {exitRecords.map((record) => (
              <div key={record._id || record.id} className="bg-white border border-slate-200 rounded-[2rem] p-8 hover:shadow-xl hover:shadow-slate-200/50 transition-all group hover:border-slate-300">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xl font-black text-slate-500 shadow-inner border border-slate-200">
                      {record.employee?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{record.employee}</h3>
                      <p className="text-sm font-bold text-slate-500 mt-1 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">{record.department}</span> 
                        Last Day: {new Date(record.lastDay).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black border shadow-sm ${record.progress === 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {record.status}
                    </span>
                    <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                      Review
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                    <span>Workflow Progress</span>
                    <span className={record.progress === 100 ? 'text-emerald-500' : 'text-blue-500'}>{record.progress}%</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {workflowSteps.map((step, index) => {
                      const stepProgress = (index + 1) * 20;
                      const isCompleted = record.progress >= stepProgress;
                      const isCurrent = record.progress > (index * 20) && record.progress < stepProgress;
                      return (
                        <div key={step} className="flex flex-col items-center gap-3 flex-1 relative">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center z-10 border-[3px] transition-all shadow-sm ${
                            isCompleted ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-200' : 
                            isCurrent ? 'bg-white border-blue-500 text-blue-500 shadow-blue-100' : 'bg-slate-50 border-slate-200 text-slate-300'
                          }`}>
                            {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest text-center ${isCompleted ? 'text-emerald-700' : isCurrent ? 'text-blue-700' : 'text-slate-400'}`}>
                            {step}
                          </span>
                          {index !== workflowSteps.length - 1 && (
                            <div className={`absolute top-5 left-[50%] w-full h-[3px] -z-0 ${
                               record.progress > stepProgress ? 'bg-emerald-500' : 'bg-slate-200'
                            }`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6">
                    <ProgressBar progress={record.progress} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && <InitiateExitModal onClose={() => setIsModalOpen(false)} onRefresh={refetch} />}
    </div>
  );
};

export default HRExitManagement;
