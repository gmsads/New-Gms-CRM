import React, { useState, useEffect } from 'react';
import { Filter, Download, Calendar, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';

export default function DashboardFilters({ filters, updateFilter, resetFilters, onExport }) {
  const { user } = useAuth();
  const [executives, setExecutives] = useState([]);
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i + 1); // 2027 to 2023
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const presets = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month', 'Custom'];

  useEffect(() => {
    if (!user?.token) return;
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/employees`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(res => res.json())
      .then(data => {
        const list = data.employees || data.data || [];
        setExecutives(list.filter(u => ['SALES_EXEC', 'SR_SALES_EXEC', 'FIELD_EXEC', 'AGENT'].includes(u.role)));
      }).catch(console.error);
  }, [user]);

  return (
    <div className="bg-card border-b sticky top-0 z-30 shadow-sm p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Preset Dates */}
        <select value={filters.presetDate || (filters.fromDate ? 'Custom' : '')} onChange={e => updateFilter('presetDate', e.target.value)} className="bg-background border rounded-lg px-3 py-1.5 text-xs font-semibold">
          <option value="">Select Date Range</option>
          {presets.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        {filters.presetDate === 'Custom' && (
          <div className="flex items-center gap-2 border rounded-lg px-2 bg-background">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <input type="date" value={filters.fromDate} onChange={e => updateFilter('fromDate', e.target.value)} className="bg-transparent border-none py-1 text-xs outline-none" />
            <span className="text-muted-foreground text-xs">to</span>
            <input type="date" value={filters.toDate} onChange={e => updateFilter('toDate', e.target.value)} className="bg-transparent border-none py-1 text-xs outline-none" />
          </div>
        )}

        {/* Year / Month if not using presets */}
        {!filters.presetDate && !filters.fromDate && (
          <div className="flex items-center gap-2">
            <select value={filters.year} onChange={e => updateFilter('year', e.target.value)} className="bg-background border rounded-lg px-3 py-1.5 text-xs font-semibold">
              <option value="">All Years</option>
              {years.map(y => <option key={y} value={y.toString()}>{y}</option>)}
            </select>
            <select value={filters.month} onChange={e => updateFilter('month', e.target.value)} className="bg-background border rounded-lg px-3 py-1.5 text-xs font-semibold">
              <option value="">All Months</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}

        <div className="h-6 w-px bg-border mx-1"></div>

        <select value={filters.executive} onChange={e => updateFilter('executive', e.target.value)} className="bg-background border rounded-lg px-3 py-1.5 text-xs font-semibold">
          <option value="">All Executives</option>
          {executives.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
        </select>

        <select value={filters.source} onChange={e => updateFilter('source', e.target.value)} className="bg-background border rounded-lg px-3 py-1.5 text-xs font-semibold">
          <option value="">All Sources</option>
          <option value="Website">Website</option>
          <option value="Facebook">Facebook</option>
          <option value="Google Ads">Google Ads</option>
          <option value="Reference">Reference</option>
          <option value="Manual Entry">Manual Entry</option>
        </select>

        <select value={filters.status} onChange={e => updateFilter('status', e.target.value)} className="bg-background border rounded-lg px-3 py-1.5 text-xs font-semibold">
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="Calling">Calling</option>
          <option value="Interested">Interested</option>
          <option value="Qualified">Qualified</option>
          <option value="Converted">Converted</option>
          <option value="Lost">Lost</option>
        </select>

        <div className="flex-1"></div>

        <button onClick={resetFilters} className="px-3 py-1.5 border rounded-lg text-xs font-semibold hover:bg-muted flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Reset
        </button>
        <button onClick={onExport} className="px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg shadow hover:opacity-90 text-xs flex items-center gap-1.5">
          <Download className="h-3.5 w-3.5" /> Export
        </button>
      </div>
    </div>
  );
}
