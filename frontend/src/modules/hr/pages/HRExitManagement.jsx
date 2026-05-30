import React from 'react';
import { UserMinus, CheckCircle, Clock, FileText, ChevronRight, AlertCircle } from 'lucide-react';

const exitRecords = [
  { id: 1, employee: 'Tom Hardy', department: 'Engineering', lastDay: '2026-06-15', status: 'Exit Interview', progress: 80 },
  { id: 2, employee: 'Sarah Connor', department: 'Marketing', lastDay: '2026-06-30', status: 'Manager Review', progress: 40 },
  { id: 3, employee: 'John Doe', department: 'Sales', lastDay: '2026-05-25', status: 'Settlement', progress: 100 },
];

const workflowSteps = ['Submitted', 'Manager', 'HR', 'Interview', 'Settlement'];

const ProgressBar = ({ progress }) => (
  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
    <div 
      className={`h-full rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`} 
      style={{ width: `${progress}%` }} 
    />
  </div>
);

const HRExitManagement = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="py-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Exit Management</h1>
          <p className="text-slate-500 font-medium mt-2">Manage resignations, exit interviews, and final settlements.</p>
        </div>
        <button className="bg-rose-50 text-rose-600 px-6 py-3 rounded-full font-bold hover:bg-rose-100 transition-colors border border-rose-200 flex items-center gap-2">
          <UserMinus className="w-5 h-5" /> Initiate Exit Process
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {[
          { label: 'Pending Resignations', value: 2, color: 'amber' },
          { label: 'Exit Interviews', value: 5, color: 'blue' },
          { label: 'Pending Settlements', value: 3, color: 'rose' },
          { label: 'Completed (MTD)', value: 8, color: 'emerald' },
        ].map((stat, i) => (
          <div key={i} className={`bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm border-l-4 border-l-${stat.color}-500`}>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 leading-tight mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-2xl font-black text-slate-900">Active Exit Workflows</h2>
        </div>
        <div className="p-8 space-y-6">
          {exitRecords.map((record) => (
            <div key={record.id} className="border border-slate-100 rounded-[1.5rem] p-6 hover:shadow-lg hover:shadow-slate-100 transition-all">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-500">
                    {record.employee.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{record.employee}</h3>
                    <p className="text-sm font-medium text-slate-500">{record.department} • Last Day: {record.lastDay}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${record.progress === 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                    {record.status}
                  </span>
                  <button className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
                    Review
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  <span>Workflow Progress</span>
                  <span className={record.progress === 100 ? 'text-emerald-500' : 'text-blue-500'}>{record.progress}%</span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  {workflowSteps.map((step, index) => {
                    const stepProgress = (index + 1) * 20;
                    const isCompleted = record.progress >= stepProgress;
                    const isCurrent = record.progress > (index * 20) && record.progress < stepProgress;
                    return (
                      <div key={step} className="flex flex-col items-center gap-2 flex-1 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 transition-colors ${
                          isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 
                          isCurrent ? 'bg-white border-blue-500 text-blue-500' : 'bg-slate-50 border-slate-200 text-slate-300'
                        }`}>
                          {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider text-center ${isCompleted ? 'text-emerald-700' : isCurrent ? 'text-blue-700' : 'text-slate-400'}`}>
                          {step}
                        </span>
                        {index !== workflowSteps.length - 1 && (
                          <div className={`absolute top-4 left-[50%] w-full h-[2px] -z-0 ${
                             record.progress > stepProgress ? 'bg-emerald-500' : 'bg-slate-100'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <ProgressBar progress={record.progress} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HRExitManagement;
