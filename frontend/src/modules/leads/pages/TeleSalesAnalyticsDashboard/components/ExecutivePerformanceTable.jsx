import React, { useState } from 'react';
import { Search, ChevronRight, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ExecutivePerformanceTable({ data, loading, onRowClick }) {
  const [search, setSearch] = useState('');
  
  if (loading) {
    return (
      <div className="bg-card border rounded-xl p-4 shadow-sm min-h-[300px] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="h-6 w-32 bg-muted rounded"></div>
          <div className="text-sm text-muted-foreground">Loading Executives Data...</div>
        </div>
      </div>
    );
  }

  const filtered = (data || []).filter(e => e.employee?.toLowerCase().includes(search.toLowerCase()));

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0s';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${secs % 60}s`;
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map(e => ({
      'Employee': e.employee,
      'Assigned': e.assignedLeads,
      'Calls Made': e.callsMade,
      'Connected': e.connected,
      'Interested': e.interested,
      'Prospects': e.prospects,
      'Sales': e.sales,
      'Total Call Time': formatTime(e.totalCallTime),
      'Avg Call Time': formatTime(e.averageCallTime),
      'Conversion %': e.conversionPercent + '%'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Executives");
    XLSX.writeFile(wb, `Executive_Performance_${Date.now()}.xlsx`);
  };

  return (
    <div className="bg-card border rounded-xl shadow-sm flex flex-col max-h-[500px]">
      <div className="p-4 border-b flex flex-wrap items-center justify-between gap-3 sticky top-0 bg-card z-10 rounded-t-xl">
        <h3 className="font-bold text-base flex items-center gap-2">Executive Productivity</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search executive..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-background border rounded-lg text-xs w-48"
            />
          </div>
          <button onClick={handleExport} className="p-1.5 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-muted/50 text-muted-foreground font-semibold sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3">Employee</th>
              <th className="p-3">Assigned</th>
              <th className="p-3">Calls</th>
              <th className="p-3">Connected</th>
              <th className="p-3">Interested</th>
              <th className="p-3">Prospects</th>
              <th className="p-3 text-emerald-600">Sales</th>
              <th className="p-3">Lost</th>
              <th className="p-3">Total Talk</th>
              <th className="p-3">Avg Call</th>
              <th className="p-3 text-primary">Conv %</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr><td colSpan={12} className="p-8 text-center text-muted-foreground">No executive records found.</td></tr>
            ) : (
              filtered.map(exec => (
                <tr key={exec.id} onClick={() => onRowClick(exec)} className="hover:bg-muted/30 cursor-pointer group transition-colors">
                  <td className="p-3 font-bold">{exec.employee}</td>
                  <td className="p-3">{exec.assignedLeads}</td>
                  <td className="p-3">{exec.callsMade}</td>
                  <td className="p-3 font-medium text-emerald-600">{exec.connected}</td>
                  <td className="p-3">{exec.interested}</td>
                  <td className="p-3 text-indigo-600 font-medium">{exec.prospects}</td>
                  <td className="p-3 text-emerald-600 font-bold">{exec.sales}</td>
                  <td className="p-3 text-rose-500">{exec.lost}</td>
                  <td className="p-3 text-muted-foreground">{formatTime(exec.totalCallTime)}</td>
                  <td className="p-3 text-muted-foreground">{formatTime(exec.averageCallTime)}</td>
                  <td className="p-3 font-bold text-primary">{exec.conversionPercent}%</td>
                  <td className="p-3">
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
