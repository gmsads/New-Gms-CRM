import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import leadApi from '../../../services/lead.api';
import { employeeApi } from '../../../services/api';
import { 
  BarChart3, RefreshCw, ChevronLeft, ChevronRight, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function MyReports() {
  const { user } = useAuth();
  
  const [dateFilter, setDateFilter] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  const isExec = ['SALES_EXEC', 'SR_SALES_EXEC', 'FIELD_EXEC', 'AGENT'].includes(user?.role);
  const isMgmt = !isExec;
  
  const [executiveId, setExecutiveId] = useState('all');
  const [employees, setEmployees] = useState([]);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMgmt) {
      employeeApi.list({ limit: 1000 }, user.token)
        .then(res => {
          const empList = res.data || res.employees || [];
          if (Array.isArray(empList)) {
             const execs = empList.filter(e => ['SALES_EXEC', 'SR_SALES_EXEC', 'FIELD_EXEC', 'AGENT'].includes(e.role));
             setEmployees(execs);
          }
        }).catch(err => console.error("Error fetching employees", err));
    }
  }, [isMgmt, user.token]);

  const fetchReports = () => {
    if (!user?.token) return;
    setLoading(true);

    const params = { filter: dateFilter, page, limit };
    if (dateFilter === 'custom' && customStart && customEnd) {
      params.startDate = customStart;
      params.endDate = customEnd;
    }
    if (isMgmt) {
      params.executiveId = executiveId;
    }

    leadApi.getMyReports(params, user.token)
      .then(res => {
        if (res.success && res.data) {
          setData(res.data);
        } else if (res.data && res.data.success && res.data.data) {
          // In case the backend wrapped it differently
          setData(res.data.data);
        } else {
          setData({ kpis: {}, callActivities: [], pagination: { total: 0, page: 1, pages: 1 } });
        }
      })
      .catch(err => {
        console.error('[MyReports] Fetch error:', err);
        setData({ kpis: {}, callActivities: [], pagination: { total: 0, page: 1, pages: 1 } });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    fetchReports();
  }, [user, dateFilter, executiveId, page, limit]);

  // Handle pagination changes
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= (data?.pagination?.pages || 1)) {
      setPage(newPage);
    }
  };

  // Export handling
  const handleExport = () => {
    if (!data?.callActivities || data.callActivities.length === 0) return;
    const exportData = data.callActivities.map(c => {
       const row = {};
       if (isMgmt) row['Executive Name'] = c.executiveName;
       row['Business Name'] = c.businessName;
       row['Client Name'] = c.clientName;
       row['Mobile Number'] = c.mobileNumber;
       row['Call Start Time'] = new Date(c.callStartTime).toLocaleString();
       row['Call End Time'] = new Date(c.callEndTime).toLocaleString();
       row['Duration (Sec)'] = c.duration;
       row['Disposition'] = c.disposition;
       row['Remarks'] = c.remarks;
       return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Call Activity");
    XLSX.writeFile(wb, `Call_Activity_Report_${dateFilter}.xlsx`);
  };

  const hasData = !!data;

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Page Header & Date Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                {isMgmt ? 'Tele Sales Analytics' : 'My Reports'}
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                {isMgmt ? 'Command Center Overview' : 'Daily operational reporting'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Executive Filter for Management */}
          {isMgmt && (
            <select
              value={executiveId}
              onChange={(e) => {
                setExecutiveId(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-border bg-background text-sm font-semibold"
            >
              <option value="all">All Executives</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.name}</option>
              ))}
            </select>
          )}

          {/* Date Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 bg-card p-1.5 rounded-2xl border border-border shadow-sm">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'custom', label: 'Custom' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => {
                  setDateFilter(f.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dateFilter === f.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {f.label}
              </button>
            ))}
            <button
              onClick={fetchReports}
              title="Refresh Data"
              className="p-1.5 text-muted-foreground hover:text-primary rounded-xl hover:bg-muted/50 transition-all ml-1"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {dateFilter === 'custom' && (
        <div className="flex items-center gap-3 bg-muted/30 p-4 rounded-2xl border border-border animate-in slide-in-from-top-2">
          <span className="text-xs font-bold text-muted-foreground uppercase">Select Range:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="bg-background border rounded-xl px-3 py-1.5 text-xs font-semibold text-foreground"
          />
          <span className="text-muted-foreground text-xs">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="bg-background border rounded-xl px-3 py-1.5 text-xs font-semibold text-foreground"
          />
          <button
            onClick={() => {
              setPage(1);
              fetchReports();
            }}
            className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-xl shadow hover:bg-primary/90 transition-all"
          >
            Apply Range
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-semibold">Aggregating report data...</p>
        </div>
      ) : !hasData ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground bg-card border border-border rounded-2xl shadow-sm">
          <p className="text-base font-semibold">No report data available for the selected date range.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <KpiCard label="Assigned Leads" value={data.kpis?.assignedLeads || 0} />
            <KpiCard label="Created Leads" value={data.kpis?.createdLeads || 0} />
            <KpiCard label="Previous Pending" value={data.kpis?.previousPendingLeads || 0} />
            <KpiCard label="Total Leads" value={data.kpis?.totalLeads || 0} />
            <KpiCard label="Calls Made" value={data.kpis?.callsMade || 0} />
            <KpiCard label="Connected" value={data.kpis?.connected || 0} />
            <KpiCard label="Follow-ups" value={data.kpis?.followups || 0} />
            <KpiCard label="Prospects" value={data.kpis?.prospects || 0} />
            <KpiCard label="Sales" value={data.kpis?.sales || 0} />
            <KpiCard label="Lost" value={data.kpis?.lost || 0} />
            <KpiCard label="Pending" value={data.kpis?.pending || 0} />
            <KpiCard label="Total Calling Time" value={formatDuration(data.kpis?.totalCallingTime)} />
            <KpiCard label="Average Call Duration" value={formatDuration(data.kpis?.averageCallDuration)} />
            <KpiCard label="Productivity %" value={`${data.kpis?.productivity || 0}%`} />
            
            {isMgmt && (
              <KpiCard 
                label="Revenue Generated" 
                value={`₹${(data.kpis?.revenueGenerated || 0).toLocaleString()}`} 
                highlight 
              />
            )}
          </div>

          {/* Call Activity Report Table */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-base font-bold text-foreground">Call Activity Report</h2>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border border-border"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/30">
                  <tr>
                    {isMgmt && <th className="p-3 text-xs font-bold text-muted-foreground whitespace-nowrap">Executive Name</th>}
                    <th className="p-3 text-xs font-bold text-muted-foreground whitespace-nowrap">Business Name</th>
                    <th className="p-3 text-xs font-bold text-muted-foreground whitespace-nowrap">Client Name</th>
                    <th className="p-3 text-xs font-bold text-muted-foreground whitespace-nowrap">Mobile Number</th>
                    <th className="p-3 text-xs font-bold text-muted-foreground whitespace-nowrap">Call Start Time</th>
                    <th className="p-3 text-xs font-bold text-muted-foreground whitespace-nowrap">Call End Time</th>
                    <th className="p-3 text-xs font-bold text-muted-foreground whitespace-nowrap">Duration</th>
                    <th className="p-3 text-xs font-bold text-muted-foreground whitespace-nowrap">Disposition</th>
                    <th className="p-3 text-xs font-bold text-muted-foreground min-w-[150px]">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.callActivities && data.callActivities.length > 0 ? (
                    data.callActivities.map(call => (
                      <tr key={call._id} className="hover:bg-muted/20 transition-all">
                        {isMgmt && <td className="p-3 text-sm text-foreground whitespace-nowrap">{call.executiveName}</td>}
                        <td className="p-3 text-sm text-foreground whitespace-nowrap">{call.businessName}</td>
                        <td className="p-3 text-sm text-foreground whitespace-nowrap">{call.clientName}</td>
                        <td className="p-3 text-sm text-foreground whitespace-nowrap">{call.mobileNumber}</td>
                        <td className="p-3 text-sm text-foreground whitespace-nowrap">{new Date(call.callStartTime).toLocaleString()}</td>
                        <td className="p-3 text-sm text-foreground whitespace-nowrap">{new Date(call.callEndTime).toLocaleString()}</td>
                        <td className="p-3 text-sm text-foreground whitespace-nowrap">{formatDuration(call.duration)}</td>
                        <td className="p-3 text-sm font-semibold whitespace-nowrap">
                          <span className="px-2 py-1 rounded-md bg-muted/50 text-xs">
                            {call.disposition}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground max-w-[250px] truncate" title={call.remarks}>
                          {call.remarks || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isMgmt ? 9 : 8} className="p-6 text-center text-muted-foreground text-sm font-medium">
                        No call activity records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {data.pagination && data.pagination.pages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border bg-muted/10">
                <span className="text-xs text-muted-foreground font-semibold">
                  Showing page {data.pagination.page} of {data.pagination.pages}
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handlePageChange(data.pagination.page - 1)}
                    disabled={data.pagination.page === 1}
                    className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-50 border border-border"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handlePageChange(data.pagination.page + 1)}
                    disabled={data.pagination.page === data.pagination.pages}
                    className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-50 border border-border"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent for KPI Card
function KpiCard({ label, value, highlight }) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border bg-card'} shadow-sm`}>
      <p className={`text-xs font-bold ${highlight ? 'text-emerald-700' : 'text-muted-foreground'}`}>{label}</p>
      <p className={`text-2xl font-black mt-1 ${highlight ? 'text-emerald-600' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}
