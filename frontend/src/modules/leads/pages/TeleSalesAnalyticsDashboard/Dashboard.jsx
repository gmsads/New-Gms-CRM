import React, { useState } from 'react';
import { useDashboardFilters } from './hooks/useDashboardFilters';
import { useDashboardData } from './hooks/useDashboardData';

import DashboardFilters from './components/DashboardFilters';
import KPICards from './components/KPICards';
import ExecutivePerformanceTable from './components/ExecutivePerformanceTable';
import { StatusAnalyticsChart, ConversionFunnelChart, CallingTrendChart, SourceAnalysisChart } from './components/AnalyticsCharts';
import ActivityTimeline from './components/ActivityTimeline';

import * as XLSX from 'xlsx';

export default function TeleSalesAnalyticsDashboard() {
  const { filters, updateFilter, resetFilters } = useDashboardFilters();
  const { data, loading } = useDashboardData(filters);

  // Executive Drill Down State
  const [selectedExec, setSelectedExec] = useState(null);

  const handleExportAll = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    
    // KPIs
    if (data.kpis) {
      const kpiSheet = XLSX.utils.json_to_sheet([data.kpis]);
      XLSX.utils.book_append_sheet(wb, kpiSheet, "KPIs");
    }

    // Executives
    if (data.executives?.length > 0) {
      const execSheet = XLSX.utils.json_to_sheet(data.executives.map(e => ({
        Employee: e.employee,
        Assigned: e.assignedLeads,
        Calls: e.callsMade,
        Connected: e.connected,
        Interested: e.interested,
        Prospects: e.prospects,
        Sales: e.sales,
        'Conversion %': e.conversionPercent
      })));
      XLSX.utils.book_append_sheet(wb, execSheet, "Executive Performance");
    }

    // Sources
    if (data.sources?.length > 0) {
      const sourceSheet = XLSX.utils.json_to_sheet(data.sources);
      XLSX.utils.book_append_sheet(wb, sourceSheet, "Source Performance");
    }

    XLSX.writeFile(wb, `TeleSales_Enterprise_Report_${Date.now()}.xlsx`);
  };

  return (
    <div className="flex flex-col h-full bg-background min-h-screen">
      <DashboardFilters 
        filters={filters} 
        updateFilter={updateFilter} 
        resetFilters={resetFilters} 
        onExport={handleExportAll} 
      />

      <div className="p-4 md:p-6 max-w-[1600px] mx-auto w-full space-y-6">
        
        {/* Header Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Enterprise Tele Sales Analytics</h1>
            <p className="text-xs text-muted-foreground mt-1">Real-time performance metrics, conversion funnels, and executive productivity.</p>
          </div>
        </div>

        {/* Section 2: KPIs */}
        <KPICards data={data?.kpis} loading={loading} />

        {/* Top Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CallingTrendChart data={data?.charts} loading={loading} />
          </div>
          <div>
            <StatusAnalyticsChart data={data?.charts} loading={loading} />
          </div>
        </div>

        {/* Middle Charts & Table Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <ExecutivePerformanceTable data={data?.executives} loading={loading} onRowClick={setSelectedExec} />
            <SourceAnalysisChart data={data?.sources} loading={loading} />
          </div>
          <div className="space-y-6">
            <ConversionFunnelChart data={data?.charts} loading={loading} />
            <ActivityTimeline data={data?.timeline} loading={loading} />
          </div>
        </div>

      </div>

      {/* Drill Down Drawer Placeholder (if an exec is clicked) */}
      {selectedExec && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-card w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
            <div className="p-4 border-b flex justify-between items-center bg-muted/20">
              <div>
                <h2 className="font-bold text-lg">{selectedExec.employee}</h2>
                <p className="text-xs text-muted-foreground">Executive Performance Drill Down</p>
              </div>
              <button onClick={() => setSelectedExec(null)} className="p-2 hover:bg-muted rounded-full">✕</button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-3 rounded-lg"><div className="text-xs text-muted-foreground">Assigned Leads</div><div className="font-bold text-lg">{selectedExec.assignedLeads}</div></div>
                <div className="bg-muted/30 p-3 rounded-lg"><div className="text-xs text-muted-foreground">Calls Made</div><div className="font-bold text-lg">{selectedExec.callsMade}</div></div>
                <div className="bg-muted/30 p-3 rounded-lg"><div className="text-xs text-muted-foreground">Connected</div><div className="font-bold text-lg">{selectedExec.connected}</div></div>
                <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20"><div className="text-xs text-emerald-700">Total Sales</div><div className="font-bold text-lg text-emerald-700">{selectedExec.sales}</div></div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-bold text-xs text-muted-foreground mb-2 uppercase tracking-wider">Time Analytics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 hover:bg-muted/30 rounded"><span>Total Call Time</span><span className="font-mono">{selectedExec.totalCallTime}s</span></div>
                  <div className="flex justify-between p-2 hover:bg-muted/30 rounded"><span>Avg Call Time</span><span className="font-mono">{selectedExec.averageCallTime}s</span></div>
                  <div className="flex justify-between p-2 hover:bg-muted/30 rounded"><span>Conversion %</span><span className="font-bold text-primary">{selectedExec.conversionPercent}%</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
