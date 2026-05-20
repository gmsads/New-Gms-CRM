import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical, Image, FileText, Video, Layout, RefreshCw, User, UserPlus, ArrowRight } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const COLUMNS = ['Pending', 'In Progress', 'Demo Shared', 'Approved'];

const typeIcon = { Social: Image, Email: FileText, Print: FileText, Video: Video, Web: Layout, Brand: Image };
const typeColor = {
  Social: 'bg-pink-100 text-pink-700', Email: 'bg-blue-100 text-blue-700',
  Print: 'bg-orange-100 text-orange-700', Video: 'bg-red-100 text-red-700',
  Web: 'bg-purple-100 text-purple-700', Brand: 'bg-cyan-100 text-cyan-700',
};
const priorityDot = { High: 'bg-red-500', Medium: 'bg-yellow-500', Low: 'bg-blue-400' };
const colHeaderColor = {
  Pending: 'border-gray-300', 'In Progress': 'border-blue-400',
  'Demo Shared': 'border-yellow-400', Approved: 'border-green-400',
};

const DesignDashboard = () => {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useApi('/orders?designStatus=Pending,In_Progress,Demo_Shared,Approved');
  const [cards, setCards] = useState({ Pending: [], 'In Progress': [], 'Demo Shared': [], Approved: [] });
  const [designers, setDesigners] = useState([]);
  
  // Modals state
  const [showReassignMenu, setShowReassignMenu] = useState(null); // stores order id
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Fetch available designers for workload transfer
    const fetchDesigners = async () => {
      try {
        const res = await api.get('/employees?role=DESIGNER', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (res.data?.employees) {
          setDesigners(res.data.employees);
        }
      } catch (err) {
        console.error('Failed to load designers', err);
      }
    };
    fetchDesigners();
  }, [user.token]);

  useEffect(() => {
    if (data?.data) {
      const grouped = { Pending: [], 'In Progress': [], 'Demo Shared': [], Approved: [] };
      data.data.forEach(order => {
        const status = order.designStatus === 'Demo_Shared' ? 'Demo Shared' : 
                       order.designStatus === 'In_Progress' ? 'In Progress' : order.designStatus;
        if (grouped[status]) {
          grouped[status].push({
            id: order._id,
            title: order.orderNumber,
            client: order.clientSnapshot?.name || 'Unknown Client',
            company: order.clientSnapshot?.company || '',
            type: 'Brand', // Since not stored in schema currently
            assignee: order.designAssignedTo?.name || 'Unassigned',
            salesExec: order.salesExec?.name || 'Unknown Exec',
            priority: 'Medium',
          });
        }
      });
      setCards(grouped);
    }
  }, [data]);

  const handleUpdateProgress = async (orderId, currentStatus) => {
    let nextStatus = '';
    if (currentStatus === 'Pending') nextStatus = 'Design_InProgress';
    else if (currentStatus === 'In Progress') nextStatus = 'Design_Review';
    else if (currentStatus === 'Demo Shared') nextStatus = 'Design_Approved';
    else return;

    setIsUpdating(true);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: nextStatus }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      refetch();
    } catch (err) {
      console.error('Failed to update progress', err);
      alert('Failed to update progress. ' + (err.response?.data?.message || err.message));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReassign = async (orderId, targetDesignerId) => {
    setIsUpdating(true);
    try {
      // In a real app, you might have a dedicated transfer endpoint. 
      // For now, we update order via PATCH.
      await api.patch(`/orders/${orderId}`, { designAssignedTo: targetDesignerId }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setShowReassignMenu(null);
      refetch();
    } catch (err) {
      console.error('Failed to reassign workload', err);
      alert('Failed to reassign workload. ' + (err.response?.data?.message || err.message));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Design Assets</h1>
          <p className="text-muted-foreground">Manage creative requests, transfer workload, and update progress.</p>
        </div>
        <button onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-slate-800 transition-all active:scale-95">
          <RefreshCw className={`h-4 w-4 ${loading || isUpdating ? 'animate-spin' : ''}`} />
          Refresh Board
        </button>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-6 text-sm text-red-500 bg-red-50 rounded-xl border border-red-200">Error loading designs: {error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {COLUMNS.map(col => (
            <div key={col} className="flex flex-col gap-3">
              <div className={`flex items-center justify-between rounded-lg border-l-4 bg-white px-4 py-3 shadow-sm ${colHeaderColor[col]}`}>
                <span className="font-bold text-sm text-slate-700">{col}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-500">
                  {cards[col]?.length || 0}
                </span>
              </div>

              <div className="space-y-3">
                {cards[col]?.map(card => {
                  const TypeIcon = typeIcon[card.type] || FileText;
                  return (
                    <div key={card.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-all relative group">
                      <div className="flex items-start justify-between mb-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight ${typeColor[card.type] || 'bg-slate-100 text-slate-600'}`}>
                          <TypeIcon className="h-3 w-3" />{card.title}
                        </span>
                        
                        <div className="relative">
                          <button 
                            onClick={() => setShowReassignMenu(showReassignMenu === card.id ? null : card.id)}
                            className="text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 p-1 rounded-md"
                            title="Reassign / Share Work"
                          >
                            <UserPlus className="h-4 w-4" />
                          </button>
                          
                          {showReassignMenu === card.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 shadow-xl rounded-xl z-10 py-1">
                              <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">Transfer Workload</p>
                              {designers.map(d => (
                                <button 
                                  key={d._id} 
                                  onClick={() => handleReassign(card.id, d._id)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium"
                                >
                                  {d.name} {d._id === user._id ? '(You)' : ''}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">{card.client}</h4>
                        {card.company && <p className="text-xs text-slate-500 font-medium">{card.company}</p>}
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 font-semibold bg-indigo-50 inline-flex px-2 py-1 rounded-md">
                          <User className="h-3 w-3" /> Exec: {card.salesExec}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.assignee}</span>
                        {col !== 'Approved' && (
                          <button 
                            onClick={() => handleUpdateProgress(card.id, col)}
                            disabled={isUpdating}
                            className="flex items-center gap-1 text-[10px] font-bold text-white uppercase tracking-widest bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded shadow-sm disabled:opacity-50"
                          >
                            Advance <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {cards[col]?.length === 0 && (
                   <div className="text-center py-12 border-2 border-dashed rounded-xl text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50/50">
                      Empty
                   </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DesignDashboard;
