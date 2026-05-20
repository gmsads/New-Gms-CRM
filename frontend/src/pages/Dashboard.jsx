import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap } from 'lucide-react';

// Direct path imports
import AdminDashboard from '../modules/admin/pages/AdminDashboard';
import HRDashboard from '../modules/hr/pages/HRDashboard';
import ExecDashboard from '../modules/sales/pages/ExecDashboard';
import ManagerDashboard from '../modules/sales/pages/ManagerDashboard';
import DesignDashboard from '../modules/design/pages/DesignDashboard';
import ITDashboard from '../modules/it/pages/ITDashboard';
import OperationsDashboard from '../modules/operations/pages/OperationsDashboard';

const Dashboard = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role || '';

  const renderDashboard = () => {
    switch (role) {
      case 'ADMIN':
      case 'MD_CEO':
        return <AdminDashboard />;
      case 'HR':
        return <HRDashboard />;
      case 'SALES_EXEC':
        return <ExecDashboard />;
      case 'SALES_MANAGER':
        return <ManagerDashboard />;
      case 'DESIGNER':
        return <DesignDashboard />;
      case 'IT_ADMIN':
        return <ITDashboard />;
      case 'OPS_MANAGER':
      case 'OPS_EXEC':
      case 'FIELD_EXEC':
        return <OperationsDashboard />;
      default:
        return (
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-20 text-center shadow-sm">
            <div className="mx-auto mb-6 h-20 w-20 rounded-3xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-inner">
              <Zap className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Welcome, {user?.name}</h3>
            <p className="text-slate-500 font-semibold mt-2 uppercase tracking-widest text-[10px]">Portal Access: {role.replace(/_/g,' ')}</p>
            <p className="text-sm text-slate-400 mt-6 max-w-xs mx-auto">Your specialized module interface is ready. Use the navigation terminal to begin operations.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
          {role.toLowerCase().split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Dashboard
        </h1>
        <h2 className="text-xl font-bold text-slate-500">
          Welcome back, <span className="text-blue-600">{user?.name}</span>
        </h2>
      </div>

      {renderDashboard()}
    </div>
  );
};

export default Dashboard;
