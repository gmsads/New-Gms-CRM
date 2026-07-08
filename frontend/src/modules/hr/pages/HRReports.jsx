import React, { useState } from 'react';
import { Download, FileText, Users, Calendar, IndianRupee, PieChart, Filter } from 'lucide-react';

const reportTypes = [
  { id: 'workforce', name: 'Workforce Demographics', icon: Users, desc: 'Headcount, diversity, and role distribution.' },
  { id: 'attendance', name: 'Attendance & Leave', icon: Calendar, desc: 'Absenteeism, late marks, and leave balances.' },
  { id: 'recruitment', name: 'Recruitment Analytics', icon: FileText, desc: 'Time-to-hire, source effectiveness, and offer rates.' },
  { id: 'compensation', name: 'Compensation & Benefits', icon: IndianRupee, desc: 'Salary bands, incentives, and bonus payouts.' },
  { id: 'performance', name: 'Performance & Training', icon: PieChart, desc: 'Appraisal ratings, goal completion, and skill matrix.' }
];

const HRReports = () => {
  const [selectedReport, setSelectedReport] = useState('workforce');

  const handleExport = (format) => {
    // Placeholder for actual export logic
    alert(`Exporting ${selectedReport} report as ${format.toUpperCase()}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="py-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">HR Reports & Analytics</h1>
          <p className="text-slate-500 font-medium mt-2">Generate and export comprehensive workforce data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Selection */}
        <div className="space-y-3 lg:col-span-1">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2">Report Categories</p>
          {reportTypes.map(report => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all ${
                selectedReport === report.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-white hover:bg-slate-50 border border-slate-100 text-slate-700 hover:shadow-sm'
              }`}
            >
              <div className={`p-2 rounded-xl ${selectedReport === report.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                <report.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">{report.name}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Report Preview & Configuration */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">
                  {reportTypes.find(r => r.id === selectedReport)?.name}
                </h2>
                <p className="text-slate-500 font-medium">
                  {reportTypes.find(r => r.id === selectedReport)?.desc}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filters Section */}
            <div className="grid grid-cols-3 gap-4 mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date Range</label>
                <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500">
                  <option>Last 30 Days</option>
                  <option>This Quarter</option>
                  <option>Year to Date</option>
                  <option>Custom Range...</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Department</label>
                <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500">
                  <option>All Departments</option>
                  <option>Sales</option>
                  <option>Engineering</option>
                  <option>Marketing</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500">
                  <option>Active Employees</option>
                  <option>All Records</option>
                </select>
              </div>
            </div>

            {/* Export Actions */}
            <div className="border-t border-slate-100 pt-8 flex gap-4">
              <button 
                onClick={() => handleExport('csv')}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
              <button 
                onClick={() => handleExport('excel')}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold hover:bg-emerald-100 transition-colors"
              >
                <Download className="w-4 h-4" /> Export Excel
              </button>
              <button 
                onClick={() => handleExport('pdf')}
                className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-bold hover:bg-rose-100 transition-colors"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
            
            <div className="mt-8 flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl text-sm font-medium">
              <PieChart className="w-5 h-5" />
              <span>Report generation may take a few moments for large datasets. A notification will be sent when your export is ready.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRReports;
