import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, UploadCloud, MessageSquare, CheckCircle2, User, Phone, FileText, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const ServiceDetails = () => {
  const { orderId, itemIndex } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Skeleton implementation for the left/center/right panels defined in requirements
  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 border rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Service Details</h1>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                In Progress
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1">Order #{orderId} • Item #{itemIndex}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors text-slate-700 shadow-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Request Info
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Update Status
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0 overflow-hidden">
        {/* LEFT PANEL - Client & Info */}
        <div className="w-80 shrink-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
          <div className="bg-white border rounded-xl shadow-sm p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Client Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">John Doe</p>
                  <p className="text-xs text-slate-500">Acme Corp</p>
                </div>
              </div>
              <div className="pt-3 border-t">
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  +91 98765 43210
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-xl shadow-sm p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Service Info</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Priority</p>
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">Urgent</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Deadline</p>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Oct 25, 2026
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Assigned By</p>
                <p className="text-sm font-medium text-slate-800">Sales Exec Name</p>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER PANEL - Workspace */}
        <div className="flex-1 bg-white border rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="flex border-b shrink-0">
            {['Requirements', 'Files & Assets', 'Review History'].map((tab, i) => (
              <button key={tab} className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${i === 0 ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {tab}
              </button>
            ))}
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Logo Design Requirements</h2>
            <div className="prose prose-sm max-w-none text-slate-600">
              <p>The client wants a minimalist, modern logo. They prefer blue and silver colors. No gradients.</p>
              <p>Brand values: Trust, Speed, Innovation.</p>
            </div>
            
            <div className="mt-8">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                Uploaded Files
              </h3>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="font-medium text-slate-700 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-500">SVG, PNG, JPG, or PDF (max. 50MB)</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Timeline */}
        <div className="w-80 shrink-0 bg-white border rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b shrink-0 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800">Activity Timeline</h3>
          </div>
          <div className="p-5 flex-1 overflow-y-auto custom-scrollbar relative">
            <div className="absolute left-[29px] top-5 bottom-5 w-px bg-slate-200"></div>
            
            <div className="space-y-6 relative z-10">
              {/* Timeline Item */}
              <div className="flex gap-4">
                <div className="w-5 h-5 rounded-full bg-blue-100 border-2 border-white text-blue-600 flex items-center justify-center mt-0.5 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Status changed to In Progress</p>
                  <p className="text-xs text-slate-500 mt-1">2 hours ago by You</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-5 h-5 rounded-full bg-slate-100 border-2 border-white text-slate-500 flex items-center justify-center mt-0.5 shrink-0">
                  <User className="w-3 h-3" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Service Assigned</p>
                  <p className="text-xs text-slate-500 mt-1">Oct 20, 2026 by Sales Exec</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;
