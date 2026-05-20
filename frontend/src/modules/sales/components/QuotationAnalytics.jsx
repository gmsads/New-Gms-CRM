import React, { useMemo } from 'react';
import { BarChartIcon, TrendingUp, DollarSign, CheckCircle2, Clock } from 'lucide-react';

export const QuotationAnalytics = ({ quotations }) => {
  const stats = useMemo(() => {
    const total = quotations.length;
    const pending = quotations.filter(q => q.status === 'Draft' || q.status === 'Sent' || q.status === 'Viewed').length;
    const approved = quotations.filter(q => q.status === 'Approved' || q.status === 'Converted to Order').length;
    const rejected = quotations.filter(q => q.status === 'Rejected').length;
    
    const totalValue = quotations.reduce((acc, q) => acc + (q.totalAmount || 0), 0);
    const approvedValue = quotations.filter(q => q.status === 'Approved' || q.status === 'Converted to Order')
                                    .reduce((acc, q) => acc + (q.totalAmount || 0), 0);
                                    
    const conversionRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    const avgDealSize = total > 0 ? Math.round(totalValue / total) : 0;

    return { total, pending, approved, rejected, totalValue, approvedValue, conversionRate, avgDealSize };
  }, [quotations]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Conversion Rate</p>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-900">{stats.conversionRate}%</p>
            <p className="text-xs font-bold text-slate-500 mt-1">{stats.approved} out of {stats.total} quotes converted</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Approved Value</p>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-900">₹{stats.approvedValue.toLocaleString()}</p>
            <p className="text-xs font-bold text-slate-500 mt-1">From total ₹{stats.totalValue.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Pending Quotes</p>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-900">{stats.pending}</p>
            <p className="text-xs font-bold text-slate-500 mt-1">Awaiting client response or approval</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <BarChartIcon className="h-5 w-5" />
            </div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Avg Deal Size</p>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-900">₹{stats.avgDealSize.toLocaleString()}</p>
            <p className="text-xs font-bold text-slate-500 mt-1">Across all generated quotes</p>
          </div>
        </div>
      </div>
    </div>
  );
};
