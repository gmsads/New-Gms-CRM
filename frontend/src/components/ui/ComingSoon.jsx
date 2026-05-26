import React from 'react';
import { Hammer, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ComingSoon = ({ title = "Feature Under Development", description = "We are currently building this module. It will be available in an upcoming update." }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
        <Hammer className="h-10 w-10 text-blue-500 animate-pulse" />
      </div>
      
      <h1 className="text-3xl font-black text-slate-900 tracking-tight text-center mb-3">
        {title}
      </h1>
      
      <p className="text-slate-500 font-medium text-center max-w-md mb-8">
        {description}
      </p>

      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-200"
      >
        <ArrowLeft className="h-5 w-5" />
        Go Back
      </button>
    </div>
  );
};

export default ComingSoon;
