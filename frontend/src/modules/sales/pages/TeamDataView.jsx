import React, { useState } from 'react';
import { Users, ShoppingCart, Clock, Quote, Target, ShieldCheck, Eye, Search, AlertCircle, RefreshCw } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { useLocation } from 'react-router-dom';
import { SalesProspects, SalesOrders, SalesFollowups, SalesAppointments, SalesQuotations } from './ExecDashboard';

const EmptyState = ({ title, desc }) => (
  <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
    <Search className="h-10 w-10 text-slate-300 mb-4" />
    <h3 className="text-lg font-black text-slate-700 tracking-tight">{title}</h3>
    <p className="text-sm font-semibold text-slate-400 mt-1">{desc}</p>
  </div>
);

export const TeamDataView = ({ viewType = 'orders' }) => {
  const [filters, setFilters] = useState({
    search: '',
    employee: '',
    team: '',
    branch: '',
    dateRange: 'month'
  });

  // Example placeholder for fetching team data
  const loading = false;
  const error = null;

  const getTitle = () => {
    switch(viewType) {
      case 'orders': return 'Team Orders';
      case 'prospects': return 'Team Prospects';
      case 'followups': return 'Team Follow-ups';
      case 'approvals': return 'Team Approvals';
      case 'quotations': return 'Team Quotations';
      case 'escalations': return 'Escalations';
      case 'performance': return 'Team Performance';
      case 'targets': return 'Team Targets';
      default: return 'Team Data';
    }
  };

  const getIcon = () => {
    switch(viewType) {
      case 'orders': return <ShoppingCart className="h-6 w-6" />;
      case 'prospects': return <Users className="h-6 w-6" />;
      case 'followups': return <Clock className="h-6 w-6" />;
      case 'approvals': return <ShieldCheck className="h-6 w-6" />;
      case 'quotations': return <Quote className="h-6 w-6" />;
      case 'escalations': return <Eye className="h-6 w-6" />;
      case 'performance': return <Target className="h-6 w-6" />;
      default: return <Users className="h-6 w-6" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200">
            {getIcon()}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{getTitle()}</h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
              Read-Only Monitoring Mode
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-colors">
            <RefreshCw className="h-4 w-4" /> Sync
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-6 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-bold">{error}</span>
        </div>
      ) : (
        <div className="mt-8 [&_h1]:hidden [&_p]:hidden">
          {viewType === 'orders' && <SalesOrders isTeamMode={true} globalFilters={filters} />}
          {viewType === 'prospects' && <SalesProspects isTeamMode={true} globalFilters={filters} />}
          {viewType === 'followups' && <SalesFollowups isTeamMode={true} globalFilters={filters} />}
          {viewType === 'appointments' && <SalesAppointments isTeamMode={true} globalFilters={filters} />}
          {viewType === 'quotations' && <SalesQuotations isTeamMode={true} globalFilters={filters} />}
        </div>
      )}
    </div>
  );
};
