import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { prospectApi, orderApi, appointmentApi } from '../services/api';
import { 
  Users, UserPlus, PhoneCall, Package, CheckCircle, Clock, Calendar, Briefcase, TrendingUp, ShieldCheck 
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const UnifiedDashboard = () => {
  const { user } = useAuth();
  if (!user) return null;

  const [stats, setStats] = useState({
    myProspects: 0,
    myFollowups: 0,
    myAppointments: 0,
    teamProspects: 0,
    teamOrders: 0,
    paymentPendings: 0,
    pendingProduction: 0,
    assignedOrders: 0,
    installationQueue: 0,
    loading: true
  });

  const fetchDashboardData = async () => {
    try {
      const [prospects, orders, appointments] = await Promise.all([
        prospectApi.list({}, user.token).catch(() => ({ data: [] })),
        orderApi.list({ limit: 50 }, user.token).catch(() => ({ data: [] })),
        appointmentApi.list(user.token).catch(() => ({ data: [] }))
      ]);

      const pData = prospects.data || [];
      const oData = orders.data || [];
      const aData = appointments.data || [];

      // Determine visibility based on hierarchy/role
      const isSalesExec = user.role === 'SALES_EXEC';
      const isSrSalesExec = user.role === 'SR_SALES_EXEC';
      const isManager = ['SALES_MANAGER', 'SR_SALES_MANAGER', 'ADMIN', 'MD_CEO'].includes(user.role);
      const isOpsManager = ['OPERATION_MANAGER', 'ADMIN', 'MD_CEO'].includes(user.role);
      const isOpsExec = ['OPERATION_EXEC', 'FIELD_EXEC'].includes(user.role);
      const isDesigner = ['DESIGNER'].includes(user.role);

      setStats({
        myProspects: pData.length,
        myFollowups: pData.filter(p => p.status === 'In-progress' && p.nextFollowUpDate).length,
        myAppointments: aData.length,
        
        teamProspects: isManager ? pData.length : 0, // Using same data for mock, ideally backend filters
        teamOrders: isManager ? oData.length : 0,
        paymentPendings: isManager ? oData.filter(o => o.paymentStatus !== 'Paid').length : 0,

        pendingProduction: isOpsManager ? oData.filter(o => o.status === 'In_Production').length : 0,
        assignedOrders: (isOpsExec || isDesigner) ? oData.length : 0,
        installationQueue: isOpsManager ? oData.filter(o => o.status === 'Ready_To_Deliver').length : 0,
        
        loading: false
      });
    } catch (err) {
      console.error(err);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const Widget = ({ title, value, icon: Icon, colorClass, delay }) => (
    <div className={`animate-in fade-in slide-in-from-bottom-4 duration-700 bg-white border border-slate-100 shadow-sm rounded-3xl p-6 hover:-translate-y-1 hover:shadow-xl transition-all delay-${delay}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClass}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div>
        <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h3>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">{title}</p>
      </div>
    </div>
  );

  if (stats.loading) return <div className="text-center p-20 text-slate-400 font-bold">Loading Unified Workspace...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="bg-slate-900 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">Unified Workspace</h1>
            <p className="text-lg text-slate-400 font-medium mt-2">
              Welcome back, <span className="text-blue-400">{user.name}</span>. 
            </p>
            <div className="flex items-center gap-3 mt-4">
              <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-slate-300 uppercase tracking-widest border border-white/5">{(user.role || '').replace(/_/g, ' ')}</span>
              <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-slate-300 uppercase tracking-widest border border-white/5">LEVEL {user.hierarchyLevel || 'N/A'}</span>
              <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-slate-300 uppercase tracking-widest border border-white/5">{user.department || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Widget Rendering based on Scope */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Sales Exec Scope */}
        {['SALES_EXEC', 'SR_SALES_EXEC', 'SALES_MANAGER', 'SR_SALES_MANAGER', 'ADMIN', 'MD_CEO'].includes(user.role) && (
          <>
            <Widget title="My Prospects" value={stats.myProspects} icon={Users} colorClass="bg-blue-50 text-blue-600 border border-blue-100" delay="100" />
            <Widget title="My Follow-ups" value={stats.myFollowups} icon={PhoneCall} colorClass="bg-amber-50 text-amber-600 border border-amber-100" delay="200" />
            <Widget title="Appointments" value={stats.myAppointments} icon={Calendar} colorClass="bg-indigo-50 text-indigo-600 border border-indigo-100" delay="300" />
          </>
        )}

        {/* Manager Scope */}
        {['SALES_MANAGER', 'SR_SALES_MANAGER', 'ADMIN', 'MD_CEO'].includes(user.role) && (
          <>
            <Widget title="Team Prospects" value={stats.teamProspects} icon={Users} colorClass="bg-purple-50 text-purple-600 border border-purple-100" delay="400" />
            <Widget title="Team Orders" value={stats.teamOrders} icon={Package} colorClass="bg-emerald-50 text-emerald-600 border border-emerald-100" delay="500" />
            <Widget title="Payment Pendings" value={stats.paymentPendings} icon={Clock} colorClass="bg-rose-50 text-rose-600 border border-rose-100" delay="600" />
          </>
        )}

        {/* Operations Scope */}
        {['OPERATION_MANAGER', 'ADMIN', 'MD_CEO'].includes(user.role) && (
          <>
            <Widget title="Pending Production" value={stats.pendingProduction} icon={Briefcase} colorClass="bg-orange-50 text-orange-600 border border-orange-100" delay="400" />
            <Widget title="Installation Queue" value={stats.installationQueue} icon={CheckCircle} colorClass="bg-teal-50 text-teal-600 border border-teal-100" delay="500" />
          </>
        )}

        {/* Operations/Designer Execution Scope */}
        {['OPERATION_EXEC', 'FIELD_EXEC', 'DESIGNER'].includes(user.role) && (
          <>
            <Widget title="Assigned Orders" value={stats.assignedOrders} icon={Package} colorClass="bg-cyan-50 text-cyan-600 border border-cyan-100" delay="100" />
          </>
        )}

      </div>
    </div>
  );
};

export default UnifiedDashboard;
