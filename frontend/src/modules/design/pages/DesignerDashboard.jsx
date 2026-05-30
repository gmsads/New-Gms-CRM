import React, { useState, useEffect } from 'react';
import { Palette, Clock, CheckSquare, AlertCircle, RefreshCw, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const StatCard = ({ title, value, icon: Icon, colorClass, loading }) => (
  <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-slate-600">{title}</h3>
      <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
        <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
    </div>
    <p className="text-3xl font-bold text-slate-800">{loading ? '-' : value}</p>
  </div>
);

const DesignerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    assigned: 0,
    inProgress: 0,
    waitingApproval: 0,
    revisionsPending: 0,
    completed: 0,
    delayed: 0
  });
  
  const fetchStats = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
      const res = await fetch(`${apiUrl}/api/design/services`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      
      if (data.success && data.data) {
        let assigned = 0, inProgress = 0, waiting = 0, revisions = 0, completed = 0, delayed = 0;
        
        data.data.forEach(srv => {
          const st = srv.designerWorkflow?.currentStatus;
          if (st === 'Assigned') assigned++;
          if (st === 'In Progress') inProgress++;
          if (st === 'Demo Shared') waiting++;
          if (st === 'Revision Requested') revisions++;
          if (st === 'Completed') completed++;
          
          if (srv.deliveryDate && new Date(srv.deliveryDate) < new Date() && st !== 'Completed') {
            delayed++;
          }
        });
        
        setStats({ assigned, inProgress, waitingApproval: waiting, revisionsPending: revisions, completed, delayed });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{user?.name?.split(' ')[0] || 'Designer'}!</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium mt-2 italic">
            "Design is silent ambassador of your brand. Keep creating masterpieces."
          </p>
        </div>
        <button onClick={fetchStats} className="shrink-0 h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Sync
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title="Assigned Today" value={stats.assigned} icon={LayoutDashboard} colorClass="bg-blue-500" loading={loading} />
          <StatCard title="In Progress" value={stats.inProgress} icon={Clock} colorClass="bg-indigo-500" loading={loading} />
          <StatCard title="Waiting Approval" value={stats.waitingApproval} icon={AlertCircle} colorClass="bg-amber-500" loading={loading} />
          <StatCard title="Revisions" value={stats.revisionsPending} icon={Palette} colorClass="bg-rose-500" loading={loading} />
          <StatCard title="Completed" value={stats.completed} icon={CheckSquare} colorClass="bg-emerald-500" loading={loading} />
          <StatCard title="Delayed Tasks" value={stats.delayed} icon={AlertCircle} colorClass="bg-red-600" loading={loading} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Revision Alerts</h2>
          {stats.revisionsPending === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <CheckSquare className="w-12 h-12 mb-3 opacity-20" />
              <p>No pending revisions.</p>
            </div>
          ) : (
            <p className="text-slate-600">You have {stats.revisionsPending} tasks requiring revisions.</p>
          )}
        </div>

        <div className="bg-white border rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Activities</h2>
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Clock className="w-12 h-12 mb-3 opacity-20" />
            <p>Activity timeline coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignerDashboard;
