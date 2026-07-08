import React from 'react';
import { BarChart2, PieChart, Target, AlertCircle, Clock, Truck, Users, CheckCircle } from 'lucide-react';

const ReportCard = ({ title, icon: Icon, value, subtitle, color }) => (
  <div className="bg-white border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
    <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider">{title}</h3>
    <div className="mt-2 text-3xl font-black text-slate-800">{value}</div>
    {subtitle && <p className="text-xs font-medium text-slate-400 mt-2">{subtitle}</p>}
  </div>
);

const ServiceReports = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Reports & Analytics</h1>
        <p className="text-slate-500 mt-1">Real-time performance and delivery compliance metrics.</p>
      </div>

      <div className="mb-10">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-500" /> Key Performance Indicators
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ReportCard title="Delivery Compliance" value="92%" subtitle="Orders Completed Before Deadline" icon={CheckCircle} color="bg-emerald-500" />
          <ReportCard title="Average Delay" value="1.2 Days" subtitle="Across all delayed orders" icon={Clock} color="bg-amber-500" />
          <ReportCard title="Labour Utilization" value="78%" subtitle="Active deployment rate" icon={Users} color="bg-blue-500" />
          <ReportCard title="Vendor Efficiency" value="94%" subtitle="SLA adherence rate" icon={Truck} color="bg-purple-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
            <AlertCircle className="w-4 h-4 text-rose-500" /> Delay Analysis
          </h3>
          <div className="space-y-4">
            {[
              { reason: 'Labour Unavailable', pct: '35%', color: 'bg-rose-500' },
              { reason: 'Vendor Delay', pct: '25%', color: 'bg-amber-500' },
              { reason: 'Site Not Ready', pct: '20%', color: 'bg-orange-500' },
              { reason: 'Client Delay', pct: '15%', color: 'bg-blue-500' },
              { reason: 'Weather Issue', pct: '5%', color: 'bg-slate-400' }
            ].map(item => (
              <div key={item.reason}>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                  <span>{item.reason}</span>
                  <span>{item.pct}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className={`${item.color} h-2 rounded-full`} style={{ width: item.pct }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-slate-400">
           <BarChart2 className="w-16 h-16 mb-4 opacity-20" />
           <p className="font-semibold text-slate-500">Service Performance Chart</p>
           <p className="text-sm mt-1">Detailed graphical view rendering module.</p>
        </div>
      </div>
    </div>
  );
};

export default ServiceReports;
