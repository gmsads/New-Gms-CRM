import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { dailyWorkApi } from '../../../services/api';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Briefcase, CheckCircle, Clock, Users, ArrowRight } from 'lucide-react';

const TodayWorkWidget = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTodayWork = async () => {
      try {
        setLoading(true);
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        // Let the backend automatically scope it to the current user
        const res = await dailyWorkApi.getEnterpriseDailyWork({ date: todayStr }, user.token);
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.message || 'Failed to load today\'s work');
        }
      } catch (err) {
        setError('Error loading today\'s work');
      } finally {
        setLoading(false);
      }
    };
    fetchTodayWork();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center justify-center min-h-[150px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Today's Work...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-rose-100 p-6 flex flex-col items-center justify-center min-h-[150px]">
        <p className="text-sm font-bold text-rose-500 mb-1">Could not load today's work</p>
        <p className="text-xs text-slate-500">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const isAdmin = ['ADMIN', 'MD_CEO'].includes(user.role);
  const isManager = user.role.includes('MANAGER') || user.role === 'HR';

  // Find the exact employee object for normal employees
  let myData = null;
  if (!isAdmin && !isManager) {
    data.departments.forEach(dept => {
      const me = dept.employees.find(e => e.employeeId === user._id);
      if (me) myData = { ...me, mappedDepartment: dept.department };
    });
  }

  const renderMetric = (label, value) => (
    <div className="flex flex-col p-3 bg-slate-50 rounded-xl border border-slate-100">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-xl font-black text-slate-800">{value}</span>
    </div>
  );

  if (isAdmin) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/50 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-black text-blue-900 tracking-tight uppercase">Organization Today</h3>
          </div>
          <Link to="/admin/enterprise-daily-work" className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider flex items-center gap-1 transition-colors">
            Full Report <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {renderMetric('Active Employees', data.summary.employeesWithActivity)}
          {renderMetric('Completed', data.summary.completedWork)}
          {renderMetric('In Progress', data.summary.inProgressWork)}
          {renderMetric('Active Depts', data.departments.filter(d => d.summary.employeesWithActivity > 0).length)}
        </div>
      </div>
    );
  }

  if (isManager) {
    // Collect all employees in the manager's authorized team
    const teamEmployees = [];
    data.departments.forEach(dept => {
      dept.employees.forEach(emp => {
        // Optional: exclude the manager themselves from the "team list" if desired, but fine to include
        teamEmployees.push({ ...emp, mappedDepartment: dept.department });
      });
    });

    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100/50 p-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-600" />
          <h3 className="text-sm font-black text-emerald-900 tracking-tight uppercase">My Team — Today</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-3 mb-4">
            {renderMetric('Team Size', data.summary.totalEmployees)}
            {renderMetric('Active Today', data.summary.employeesWithActivity)}
            {renderMetric('Completed', data.summary.completedWork)}
            {renderMetric('In Progress', data.summary.inProgressWork)}
          </div>
          
          {teamEmployees.length > 0 && (
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/80 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  <tr>
                    <th className="px-3 py-2">Employee</th>
                    <th className="px-3 py-2">Completed</th>
                    <th className="px-3 py-2">Pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamEmployees.sort((a,b) => b.commonCompleted - a.commonCompleted).map(emp => (
                    <tr key={emp.employeeId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-2 text-xs font-bold text-slate-800">{emp.employeeName}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {emp.commonCompleted}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {emp.commonInProgress}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Normal Employee
  if (!myData) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center justify-center h-full min-h-[150px]">
        <CheckCircle className="h-8 w-8 text-slate-200 mb-2" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Activity Recorded Today</p>
      </div>
    );
  }

  const m = myData.metrics;
  const dept = myData.mappedDepartment;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/50 p-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-blue-600" />
        <h3 className="text-sm font-black text-blue-900 tracking-tight uppercase">My Today's Work</h3>
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {dept === 'Sales' && (
          <>
            {renderMetric('Calls Made', m.callsMade || 0)}
            {renderMetric('Connected', m.callsConnected || 0)}
            {renderMetric('Orders', m.ordersCreated || 0)}
            {renderMetric('Rev (₹)', (m.revenueGenerated || 0).toLocaleString())}
          </>
        )}
        {dept === 'Field' && (
          <>
            {renderMetric('Total Visits', m.totalVisits || 0)}
            {renderMetric('Completed', m.visitsCompleted || 0)}
            {renderMetric('In Progress', m.visitsInProgress || 0)}
          </>
        )}
        {dept === 'Production' && (
          <>
            {renderMetric('Jobs Started', m.productionStarted || 0)}
            {renderMetric('Jobs Completed', m.productionCompleted || 0)}
            {renderMetric('QC Completed', m.qcCompleted || 0)}
          </>
        )}
        {dept === 'Design & Creative' && (
          <>
            {renderMetric('Designs Started', m.designsStarted || 0)}
            {renderMetric('Designs Completed', m.designsCompleted || 0)}
          </>
        )}
        {dept === 'SERVICE_OPERATIONS' && (
          <>
            {renderMetric('Services Started', m.serviceStarted || 0)}
            {renderMetric('Services Completed', m.serviceCompleted || 0)}
          </>
        )}
        {dept === 'Accounts' && (
          <>
            {renderMetric('Payments Collected', m.paymentsCollected || 0)}
            {renderMetric('Payments Verified', m.paymentsVerified || 0)}
          </>
        )}
        
        {/* Fallback if no specific metrics mapped above */}
        {!['Sales', 'Field', 'Production', 'Design & Creative', 'SERVICE_OPERATIONS', 'Accounts'].includes(dept) && (
          <>
            {renderMetric('Completed', myData.commonCompleted || 0)}
            {renderMetric('Pending', myData.commonInProgress || 0)}
          </>
        )}
      </div>
    </div>
  );
};

export default TodayWorkWidget;
