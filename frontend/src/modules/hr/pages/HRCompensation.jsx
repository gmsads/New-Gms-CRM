import React, { useState } from 'react';
import { DollarSign, CheckCircle, Clock, XCircle, TrendingUp, Briefcase, FileText, ChevronRight } from 'lucide-react';

const compensationData = {
  Incentives: [
    { id: 1, employee: 'Alice Smith', amount: 500, date: '2026-05-15', status: 'Manager Approval' },
    { id: 2, employee: 'Bob Jones', amount: 300, date: '2026-05-20', status: 'Submitted' },
  ],
  Commissions: [
    { id: 3, employee: 'Charlie Brown', amount: 1200, date: '2026-05-22', status: 'HR Approval' },
  ],
  Bonus: [
    { id: 4, employee: 'Diana Prince', amount: 2000, date: '2026-05-25', status: 'Approved' },
  ],
  Deductions: [
    { id: 5, employee: 'Evan Wright', amount: 150, date: '2026-05-28', status: 'Submitted' },
  ],
  Reimbursements: [
    { id: 6, employee: 'Fiona Gallagher', amount: 450, date: '2026-05-29', status: 'Manager Approval' },
  ]
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
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStyle()} flex items-center gap-1.5 w-max`}>
      {status === 'Approved' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
      {status}
    </span>
  );
};

const HRCompensation = () => {
  const [activeTab, setActiveTab] = useState('Incentives');
  const tabs = ['Incentives', 'Commissions', 'Bonus', 'Deductions', 'Reimbursements'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="py-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Compensation Management</h1>
          <p className="text-slate-500 font-medium mt-2">Manage employee incentives, bonuses, deductions, and reimbursements.</p>
        </div>
        <button className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
          + New Entry
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-full font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-2xl font-black text-slate-900">{activeTab} Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Employee</th>
                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status Workflow</th>
                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(compensationData[activeTab] || []).map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-900">{record.employee}</div>
                    <div className="text-xs text-slate-500 font-medium">EMP-{1000 + record.id}</div>
                  </td>
                  <td className="px-8 py-5 font-black text-slate-800">
                    ${record.amount.toLocaleString()}
                  </td>
                  <td className="px-8 py-5 text-sm font-medium text-slate-600">
                    {record.date}
                  </td>
                  <td className="px-8 py-5">
                    <StatusBadge status={record.status} />
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                      <span>Sub</span> <ChevronRight className="w-3 h-3" /> 
                      <span className={record.status === 'Submitted' ? 'text-slate-300' : 'text-amber-500'}>Mgr</span> <ChevronRight className="w-3 h-3" />
                      <span className={record.status === 'Approved' ? 'text-emerald-500' : (record.status === 'HR Approval' ? 'text-blue-500' : 'text-slate-300')}>HR</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors">
                      Review
                    </button>
                  </td>
                </tr>
              ))}
              {(!compensationData[activeTab] || compensationData[activeTab].length === 0) && (
                <tr>
                  <td colSpan="5" className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <FileText className="w-12 h-12 mb-3 text-slate-200" />
                      <p className="font-bold text-lg text-slate-600">No records found</p>
                      <p className="text-sm font-medium">There are no {activeTab.toLowerCase()} records to display.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HRCompensation;
