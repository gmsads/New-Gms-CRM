import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { RefreshCw, Clock, MessageSquare, Paperclip, MoreVertical } from 'lucide-react';

// KanBan columns mapped to designerWorkflow.currentStatus
const KANBAN_COLUMNS = [
  { id: 'Assigned', label: 'Assigned', color: 'border-slate-300', bg: 'bg-slate-50' },
  { id: 'In Progress', label: 'In Progress', color: 'border-blue-300', bg: 'bg-blue-50' },
  { id: 'Demo Shared', label: 'Demo Shared', color: 'border-indigo-300', bg: 'bg-indigo-50' },
  { id: 'Revision Requested', label: 'Revisions', color: 'border-amber-300', bg: 'bg-amber-50' },
  { id: 'Client Approved', label: 'Approved', color: 'border-emerald-300', bg: 'bg-emerald-50' },
  { id: 'Completed', label: 'Completed', color: 'border-green-400', bg: 'bg-green-50' }
];

const ServiceWorkflow = () => {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
      const res = await fetch(`${apiUrl}/api/design/services`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data.success) setServices(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  // Update status
  const handleDragEnd = async (e, targetStatus) => {
    // A real app would use react-beautiful-dnd, implementing basic mock for now.
    // Real implementation would parse e.dataTransfer.getData('serviceId') 
    // and call /api/design/services/:orderId/:itemId/status
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Service Workflow</h1>
          <p className="text-slate-500 text-sm mt-1">Kanban board for tracking independent services.</p>
        </div>
        <button onClick={fetchServices} className="p-2 border rounded-lg hover:bg-slate-50 transition-colors">
          <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
        <div className="flex gap-4 h-full min-w-max">
          {KANBAN_COLUMNS.map(col => {
            const colServices = services.filter(s => s.designerWorkflow?.currentStatus === col.id);
            
            return (
              <div key={col.id} className={`w-80 flex flex-col rounded-xl border ${col.bg} ${col.color}`}>
                <div className="p-3 border-b border-inherit bg-white/50 rounded-t-xl flex justify-between items-center shrink-0">
                  <h3 className="font-semibold text-slate-700">{col.label}</h3>
                  <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-500 border shadow-sm">
                    {colServices.length}
                  </span>
                </div>
                
                <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                  {colServices.map(srv => (
                    <div 
                      key={`${srv.orderId}-${srv.itemIndex}`}
                      className="bg-white p-3.5 rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-400">{srv.orderNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          srv.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                          srv.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {srv.priority || 'Normal'}
                        </span>
                      </div>
                      
                      <h4 className="font-semibold text-slate-800 text-sm mb-1 leading-snug">{srv.description}</h4>
                      <p className="text-xs text-slate-500 mb-3 truncate">{srv.clientName} - {srv.companyName}</p>
                      
                      <div className="flex items-center justify-between mt-auto pt-3 border-t">
                        <div className="flex gap-3 text-slate-400">
                          {srv.serviceFiles?.length > 0 && (
                            <div className="flex items-center gap-1 text-xs" title="Files Attached">
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>{srv.serviceFiles.length}</span>
                            </div>
                          )}
                          {srv.designerWorkflow?.revisionCount > 0 && (
                            <div className="flex items-center gap-1 text-xs text-amber-500" title="Revisions">
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{srv.designerWorkflow.revisionCount}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 border border-white flex items-center justify-center text-[10px] font-bold text-indigo-700" title="Assigned Designer">
                            {user.name.charAt(0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {colServices.length === 0 && !loading && (
                    <div className="h-20 flex items-center justify-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                      No services
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ServiceWorkflow;
