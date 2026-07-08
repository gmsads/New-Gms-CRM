import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Briefcase, CheckCircle } from 'lucide-react';
import ComingSoon from '../../../components/ui/ComingSoon';

const ProductionExecutiveDashboard = () => {
  const { user } = useAuth();
  
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-[32px] font-extrabold text-slate-900 tracking-tight">
          Production Dashboard
        </h1>
        <p className="text-sm sm:text-[15px] text-slate-500 font-medium mt-1 sm:mt-2">
          Monitor your active production jobs and installation queue.
        </p>
      </div>
      
      {/* Cards Section */}
      <div className="flex flex-wrap gap-6">
        {/* Pending Production Card */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-100 w-full sm:w-64 transition-transform hover:-translate-y-1 duration-300">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-6">
            <Briefcase className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-extrabold text-slate-900 leading-none">7</span>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-3">
              Pending Production
            </span>
          </div>
        </div>

        {/* Installation Queue Card */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-100 w-full sm:w-64 transition-transform hover:-translate-y-1 duration-300">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6">
            <CheckCircle className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-extrabold text-slate-900 leading-none">0</span>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-3">
              Installation Queue
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-12">
        <ComingSoon title="My Tasks & Active Jobs" />
      </div>
    </div>
  );
};

export default ProductionExecutiveDashboard;
