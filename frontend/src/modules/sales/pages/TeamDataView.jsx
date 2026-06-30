import React, { useState } from 'react';
import { Users, ShoppingCart, Clock, Quote, Target, ShieldCheck, Eye, Search, AlertCircle, RefreshCw, FileSpreadsheet } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { orderApi } from '../../../services/api';
import ImportExcelModal from '../../../components/ui/ImportExcelModal';
import * as XLSX from 'xlsx';
import { downloadOrderTemplate as downloadTemplateHelper } from '../../../utils/orderExcel';
import { SalesProspects, SalesOrders, SalesFollowups, SalesAppointments, SalesQuotations } from './ExecDashboard';

const EmptyState = ({ title, desc }) => (
  <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
    <Search className="h-10 w-10 text-slate-300 mb-4" />
    <h3 className="text-lg font-black text-slate-700 tracking-tight">{title}</h3>
    <p className="text-sm font-semibold text-slate-400 mt-1">{desc}</p>
  </div>
);

export const TeamDataView = ({ viewType = 'orders' }) => {
  const { user } = useAuth();
  const [showImportModal, setShowImportModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
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

  const downloadOrderTemplate = () => {
    downloadTemplateHelper('GMS_Historical_Orders_Template.xlsx');
  };

  const handleOrderImport = async (data) => {
    const res = await orderApi.bulkImport(data, user?.token);
    if (!res.success) throw new Error(res.message || 'Import failed');
    if (res.failedCount > 0 && res.successCount === 0) {
      const errDetails = (res.errors || []).slice(0, 5).map(e => `Order ${e.orderNumber}: ${e.error}`).join('\n');
      throw new Error(`Failed to import all ${res.failedCount} orders.\nReasons:\n${errDetails}`);
    } else if (res.failedCount > 0) {
      alert(`Imported ${res.successCount} orders successfully. ${res.failedCount} skipped/failed.\nFirst error: ${res.errors?.[0]?.error || ''}`);
    } else {
      alert(`Successfully imported ${res.successCount || data.length} orders!`);
    }
    setRefreshKey(prev => prev + 1);
  };

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
      case 'escalations': return <AlertCircle className="h-6 w-6" />;
      case 'performance': return <Eye className="h-6 w-6" />;
      case 'targets': return <Target className="h-6 w-6" />;
      default: return <Users className="h-6 w-6" />;
    }
  };

  return (
    <div className="space-y-6">
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
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {viewType === 'orders' && ['ADMIN', 'MD_CEO', 'SALES_MANAGER', 'SR_SALES_MANAGER'].includes(user?.role) && (
            <button
              onClick={() => setShowImportModal(true)}
              className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex justify-center items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FileSpreadsheet className="h-4 w-4" /> Import from Excel
            </button>
          )}
          <button onClick={() => setRefreshKey(prev => prev + 1)} className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 shadow-sm flex justify-center items-center gap-2 hover:bg-slate-50 transition-colors">
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
        <div className="mt-8">
          {viewType === 'orders' && <SalesOrders key={refreshKey} isTeamMode={true} globalFilters={filters} />}
          {viewType === 'prospects' && <SalesProspects isTeamMode={true} globalFilters={filters} />}
          {viewType === 'followups' && <SalesFollowups isTeamMode={true} globalFilters={filters} />}
          {viewType === 'appointments' && <SalesAppointments isTeamMode={true} globalFilters={filters} />}
          {viewType === 'quotations' && <SalesQuotations isTeamMode={true} globalFilters={filters} />}
        </div>
      )}
      <ImportExcelModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleOrderImport}
        title="Import Historical Orders"
        onDownloadTemplate={downloadOrderTemplate}
      />
    </div>
  );
};
