import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { CheckCircle, Clock, MapPin, UploadCloud, AlertCircle } from 'lucide-react';
import { calculateDeliveryPriority } from '../../../utils/deliveryUtils';

const ServiceExecutiveDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
      const res = await fetch(`${apiUrl}/api/service/my-tasks`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data.success) {
        const items = [];
        data.data.forEach(order => {
          order.lineItems.forEach(item => {
            if (item.serviceWorkflow && item.serviceWorkflow.serviceExecutiveId === user._id) {
              const deliveryDate = item.deliveryDate || order.deliveryDate;
              items.push({
                ...item,
                orderId: order._id,
                orderNumber: order.orderNumber,
                clientName: order.clientSnapshot?.name || 'Unknown',
                companyName: order.clientSnapshot?.company || 'Unknown',
                deliveryAddress: order.deliveryAddress,
                deliveryDate,
                priorityInfo: calculateDeliveryPriority(deliveryDate),
              });
            }
          });
        });
        setTasks(items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const updateStatus = async (task, newStatus, quantityUpdate = null) => {
    try {
      if (newStatus === 'Client Confirmation Pending') {
        const hasBefore = task.serviceWorkflow?.proofs?.some(p => p.stage === 'Before') || task._localBefore;
        const hasDuring = task.serviceWorkflow?.proofs?.some(p => p.stage === 'During') || task._localDuring;
        const hasAfter = task.serviceWorkflow?.proofs?.some(p => p.stage === 'After') || task._localAfter;
        if (!hasBefore || !hasDuring || !hasAfter) {
          alert('You must upload Before, During, and After photos before finishing the job.');
          return;
        }
      }

      const apiUrl = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
      const payload = { status: newStatus };
      if (quantityUpdate) {
        payload.installedQuantity = quantityUpdate;
      }
      
      const res = await fetch(`${apiUrl}/api/service/status/${task.orderId}/item/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        fetchTasks();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleLocalPhoto = (taskId, stage) => {
    setTasks(tasks.map(t => {
      if (t._id === taskId) {
        return { ...t, [`_local${stage}`]: true };
      }
      return t;
    }));
  };

  const handleQuantityChange = (taskId, val) => {
    setTasks(tasks.map(t => {
      if (t._id === taskId) {
        return { ...t, _localQuantity: parseInt(val, 10) || 0 };
      }
      return t;
    }));
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto min-h-screen bg-slate-50">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Tasks</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Field Operations Execution</p>
      </div>

      {loading ? (
        <div className="text-center p-10 text-slate-500">Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center p-10 bg-white rounded-2xl shadow-sm border text-slate-500 font-medium flex flex-col items-center">
          <CheckCircle className="w-10 h-10 text-slate-300 mb-3" />
          No pending tasks!
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => (
            <div key={task._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b flex justify-between items-start bg-slate-50">
                <div>
                  <span className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-1 block">{task.orderNumber}</span>
                  <h3 className="font-bold text-slate-900 text-lg">{task.companyName}</h3>
                  <p className="text-sm text-slate-600">{task.clientName}</p>
                </div>
                {task.priorityInfo && (
                  <div className={`px-2 py-1 rounded text-[10px] font-bold border whitespace-nowrap ${task.priorityInfo.color}`}>
                    {task.priorityInfo.label}
                  </div>
                )}
              </div>
              
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Service Details</label>
                  <p className="text-sm font-semibold text-slate-800">{task.description}</p>
                  <p className="text-xs text-slate-500">Qty: {task.quantity}</p>
                </div>
                
                {task.deliveryAddress && (
                  <div className="flex gap-2 text-slate-600 items-start">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                    <span className="text-sm font-medium leading-tight">{task.deliveryAddress}</span>
                  </div>
                )}
              </div>

              <div className="p-4 border-t bg-slate-50/50 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Current Status</span>
                  <span className="text-xs font-black text-indigo-600 px-2 py-1 bg-indigo-50 rounded uppercase tracking-wide">
                    {task.serviceWorkflow?.status}
                  </span>
                </div>
                
                <div className="bg-white p-3 rounded-xl border mb-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Partial Completion</h4>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 block mb-1">Ordered Qty</label>
                      <div className="font-bold text-slate-800 bg-slate-50 px-3 py-1.5 rounded">{task.quantity}</div>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 block mb-1">Installed</label>
                      <input 
                        type="number" 
                        min="0"
                        max={task.quantity}
                        value={task._localQuantity !== undefined ? task._localQuantity : (task.installedQuantity || 0)}
                        onChange={(e) => handleQuantityChange(task._id, e.target.value)}
                        className="w-full border rounded px-3 py-1.5 font-bold outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 block mb-1">Remaining</label>
                      <div className="font-bold text-slate-800 bg-slate-50 px-3 py-1.5 rounded">
                        {task.quantity - (task._localQuantity !== undefined ? task._localQuantity : (task.installedQuantity || 0))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-100 p-3 rounded-xl mb-3 flex justify-between gap-2">
                  {['Before', 'During', 'After'].map(stage => {
                    const hasProof = task.serviceWorkflow?.proofs?.some(p => p.stage === stage) || task[`_local${stage}`];
                    return (
                      <button 
                        key={stage}
                        onClick={() => handleLocalPhoto(task._id, stage)}
                        className={`flex-1 py-2 rounded flex flex-col items-center justify-center gap-1 border transition-colors ${
                          hasProof ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-white border-dashed border-slate-300 text-slate-500 hover:border-slate-400'
                        }`}
                      >
                        {hasProof ? <CheckCircle className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
                        <span className="text-[10px] font-bold">{stage} Photo</span>
                      </button>
                    )
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button 
                    onClick={() => updateStatus(task, 'In Transit')}
                    disabled={task.serviceWorkflow?.status === 'In Transit'}
                    className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition disabled:opacity-50"
                  >
                    Start Transit
                  </button>
                  <button 
                    onClick={() => updateStatus(task, 'Installation Started')}
                    disabled={task.serviceWorkflow?.status === 'Installation Started'}
                    className="w-full py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold text-xs rounded-xl transition disabled:opacity-50"
                  >
                    Start Work
                  </button>
                  <button 
                    onClick={() => updateStatus(task, 'Installation In Progress')}
                    disabled={task.serviceWorkflow?.status === 'Installation In Progress'}
                    className="w-full py-3 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-bold text-xs rounded-xl transition disabled:opacity-50"
                  >
                    In Progress
                  </button>
                  <button 
                    onClick={() => updateStatus(task, 'Client Confirmation Pending', task._localQuantity)}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
                  >
                    Finish Job & OTP
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceExecutiveDashboard;
