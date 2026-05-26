import React from 'react';
import { Search, Filter, Calendar, Users, MapPin, Briefcase } from 'lucide-react';

export const GlobalFilterBar = ({ 
  filters, 
  setFilters, 
  showEmployee = true, 
  showTeam = true, 
  showBranch = true,
  showDateRange = true 
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 sticky top-2 z-30">
      <div className="flex flex-wrap items-center gap-4">
        
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search across team data..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        {/* Dynamic Filters */}
        <div className="flex items-center gap-3">
          
          {showEmployee && (
            <div className="relative group">
              <select 
                className="appearance-none bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:border-blue-500 hover:bg-slate-50 cursor-pointer"
                value={filters.employee || ''}
                onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
              >
                <option value="">All Employees</option>
                <option value="exec1">John Doe</option>
                <option value="exec2">Jane Smith</option>
              </select>
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          )}

          {showTeam && (
            <div className="relative group">
              <select 
                className="appearance-none bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:border-blue-500 hover:bg-slate-50 cursor-pointer"
                value={filters.team || ''}
                onChange={(e) => setFilters({ ...filters, team: e.target.value })}
              >
                <option value="">All Teams</option>
                <option value="alpha">Team Alpha</option>
                <option value="beta">Team Beta</option>
              </select>
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          )}

          {showBranch && (
            <div className="relative group">
              <select 
                className="appearance-none bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:border-blue-500 hover:bg-slate-50 cursor-pointer"
                value={filters.branch || ''}
                onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
              >
                <option value="">All Branches</option>
                <option value="hq">Headquarters</option>
                <option value="north">North Branch</option>
              </select>
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          )}

          {showDateRange && (
            <div className="relative group">
              <select 
                className="appearance-none bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:border-blue-500 hover:bg-slate-50 cursor-pointer"
                value={filters.dateRange || ''}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range...</option>
              </select>
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          )}

          <button className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors" title="More Filters">
            <Filter className="h-5 w-5" />
          </button>
        </div>

      </div>
    </div>
  );
};
