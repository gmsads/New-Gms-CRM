import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import leadApi from '../../../services/lead.api';
import { BarChart3, PieChart, TrendingUp, Users, PhoneCall, Award, Layers, Download } from 'lucide-react';

/**
 * LeadReports.jsx
 * Enterprise Analytics Deck (Phase 5)
 * Covers 9 Core Acquisition & Calling Reports.
 */
export default function LeadReports() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('source');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const reports = [
    { id: 'source', title: '1. Lead Source Conversion Analytics', icon: PieChart, desc: 'Acquisition volume & conversion rate across channels.' },
    { id: 'performance', title: '2. Executive Tele Performance', icon: PhoneCall, desc: 'Talk time, call volume, and connected ratio by agent.' },
    { id: 'funnel', title: '3. Tele Sales Pipeline Funnel', icon: Layers, desc: 'Lead -> Interested -> Prospect -> Appointment bridge drop-off.' },
    { id: 'campaign', title: '4. Campaign ROI & Throughput', icon: TrendingUp, desc: 'Expected quota vs actual dialed throughput.' },
  ];

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    leadApi.getReports(reportType, user.token)
      .then(res => {
        if (res.success) setData(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, reportType]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enterprise Lead Analytics & Reports</h1>
          <p className="text-xs text-muted-foreground">Deep dive audit charts and executive acquisition BI.</p>
        </div>
        <button className="px-3.5 py-2 border rounded-xl text-xs font-semibold hover:bg-muted flex items-center gap-1.5">
          <Download className="h-4 w-4" /> Export Report Data
        </button>
      </div>

      {/* Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {reports.map(rep => (
          <div
            key={rep.id}
            onClick={() => setReportType(rep.id)}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-2 ${
              reportType === rep.id ? 'bg-primary/10 border-primary font-bold text-primary shadow-sm' : 'bg-card hover:bg-muted text-foreground'
            }`}
          >
            <div className="flex items-center justify-between">
              <rep.icon className="h-5 w-5" />
              <span className="text-[10px] font-mono uppercase text-muted-foreground">Report</span>
            </div>
            <div>
              <h4 className="text-xs">{rep.title}</h4>
              <p className="text-[10px] text-muted-foreground font-normal mt-0.5 line-clamp-2">{rep.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Report Results Box */}
      <div className="bg-card border rounded-2xl p-6 shadow-sm min-h-[300px]">
        <h3 className="font-bold text-base mb-4 border-b pb-3">Report View: {reports.find(r=>r.id===reportType)?.title}</h3>
        {loading ? (
          <div className="py-16 text-center text-muted-foreground animate-pulse">Generating Analytical Aggregations...</div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">No aggregated analytics available for this date range.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/50 border-b font-mono">
                  <th className="p-3">Dimension / Metric Category</th>
                  <th className="p-3">Total Volume</th>
                  <th className="p-3">Conversion Ratio / Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((item, idx) => (
                  <tr key={idx} className="hover:bg-muted/20">
                    <td className="p-3 font-bold">{item._id || item.callerName || 'Category'}</td>
                    <td className="p-3 font-mono">{item.count || item.totalCalls || 0} units</td>
                    <td className="p-3 font-mono text-emerald-600 font-bold">
                      {item.converted !== undefined ? `${item.converted} converted` : `${item.connected || 0} connected`}
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
}
