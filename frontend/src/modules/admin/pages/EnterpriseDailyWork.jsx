import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { dailyWorkApi } from '../../../services/api';
import { 
  ResponsivePage, 
  PageHeader, 
  FilterToolbar, 
  EmptyState, 
  ResponsiveCard 
} from '../../../components/ui/ResponsiveComponents';
import { 
  Briefcase, 
  Users,
  CheckCircle,
  Clock,
  Layout,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';

const EnterpriseDailyWork = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState('All');
  
  const [expandedRows, setExpandedRows] = useState({});

  const fetchDailyWork = async () => {
    try {
      setLoading(true);
      setError('');
      // Always fetch for the department if selected, employee filtering is done frontend side 
      // since the API fetches all employees for the scope and it's heavily grouped.
      const params = { date: selectedDate };
      if (selectedDepartment !== 'All') {
        params.department = selectedDepartment;
      }
      
      const res = await dailyWorkApi.getEnterpriseDailyWork(params, user.token);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to fetch data');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching the report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyWork();
    // Reset selected employee if department changes
    setSelectedEmployee('All');
    setExpandedRows({});
  }, [selectedDate, selectedDepartment]);

  const allDepartments = [
    'All',
    'Sales',
    'Operations',
    'Production',
    'Design & Creative',
    'Field',
    'SERVICE_OPERATIONS',
    'Accounts'
  ];

  // Flatten the grouped data into a single array for the table
  const flattenedEmployees = useMemo(() => {
    if (!data) return [];
    let list = [];
    data.departments.forEach(dept => {
      dept.employees.forEach(emp => {
        list.push({ ...emp, mappedDepartment: dept.department });
      });
    });

    if (selectedEmployee !== 'All') {
      list = list.filter(emp => emp.employeeId === selectedEmployee);
    }

    return list;
  }, [data, selectedEmployee]);

  // Unique list of employees for the dropdown based on current department filter
  const employeeOptions = useMemo(() => {
    if (!data) return [];
    const list = [];
    data.departments.forEach(dept => {
      dept.employees.forEach(emp => {
        list.push(emp);
      });
    });
    // Sort alphabetically
    return list.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  }, [data]);

  const toggleRow = (empId) => {
    setExpandedRows(prev => ({ ...prev, [empId]: !prev[empId] }));
  };

  const renderEmployeeDetails = (emp) => {
    const m = emp.metrics;
    let details = [];

    if (emp.mappedDepartment === 'Sales') {
      details.push({ label: 'Calls Made', value: m.callsMade || 0 });
      details.push({ label: 'Calls Connected', value: m.callsConnected || 0 });
      details.push({ label: 'Orders Created', value: m.ordersCreated || 0 });
    } else if (emp.mappedDepartment === 'Field') {
      details.push({ label: 'Total Visits', value: m.totalVisits || 0 });
      details.push({ label: 'Completed Visits', value: m.visitsCompleted || 0 });
      details.push({ label: 'In Progress Visits', value: m.visitsInProgress || 0 });
    } else if (emp.mappedDepartment === 'Production') {
      details.push({ label: 'Jobs Started', value: m.productionStarted || 0 });
      details.push({ label: 'Jobs Completed', value: m.productionCompleted || 0 });
      details.push({ label: 'QC Completed', value: m.qcCompleted || 0 });
    } else if (emp.mappedDepartment === 'Design & Creative') {
      details.push({ label: 'Designs Started', value: m.designsStarted || 0 });
      details.push({ label: 'Designs Completed', value: m.designsCompleted || 0 });
    } else if (emp.mappedDepartment === 'SERVICE_OPERATIONS') {
      details.push({ label: 'Services Started', value: m.serviceStarted || 0 });
      details.push({ label: 'Services Completed', value: m.serviceCompleted || 0 });
    } else if (emp.mappedDepartment === 'Accounts') {
      details.push({ label: 'Payments Collected', value: m.paymentsCollected || 0 });
      details.push({ label: 'Payments Verified', value: m.paymentsVerified || 0 });
    }

    if (details.length === 0) {
      return <p className="text-sm text-slate-500">No specific daily metrics defined for this department yet.</p>;
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
        {details.map((d, i) => (
          <div key={i} className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.label}</span>
            <span className="text-lg font-bold text-slate-800">{d.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsivePage className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title={
          <div className="flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-black text-slate-900 tracking-tight">Employee Daily Reports</span>
          </div>
        }
        description="View daily work reports for all employees organization-wide"
      />

      <FilterToolbar className="flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex-1 min-w-[150px]">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Report Date</label>
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50/80 font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Department</label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50/80 font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            {allDepartments.map(dept => (
              <option key={dept} value={dept}>{dept === 'SERVICE_OPERATIONS' ? 'Service' : dept}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Employee</label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50/80 font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            disabled={loading || !data}
          >
            <option value="All">All Employees</option>
            {employeeOptions.map(emp => (
              <option key={emp.employeeId} value={emp.employeeId}>{emp.employeeName}</option>
            ))}
          </select>
        </div>
      </FilterToolbar>

      {loading ? (
        <div className="text-center p-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm font-bold text-slate-400">Loading daily reports...</p>
        </div>
      ) : error ? (
        <EmptyState title="Error Loading Report" description={error} />
      ) : !data || flattenedEmployees.length === 0 ? (
        <EmptyState title="No Data Found" description="There are no active employees or activity found for the selected filters." />
      ) : (
        <div className="space-y-6">
          
          {selectedEmployee === 'All' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ResponsiveCard className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h3 className="text-[11px] font-black uppercase text-blue-800 tracking-wider">Total Employees</h3>
                </div>
                <p className="text-3xl font-black text-slate-900">{data.summary.totalEmployees}</p>
              </ResponsiveCard>
              
              <ResponsiveCard className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-[11px] font-black uppercase text-emerald-800 tracking-wider">Completed Activities</h3>
                </div>
                <p className="text-3xl font-black text-slate-900">{data.summary.completedWork}</p>
              </ResponsiveCard>
              
              <ResponsiveCard className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <h3 className="text-[11px] font-black uppercase text-amber-800 tracking-wider">In Progress</h3>
                </div>
                <p className="text-3xl font-black text-slate-900">{data.summary.inProgressWork}</p>
              </ResponsiveCard>
              
              <ResponsiveCard className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Layout className="h-5 w-5 text-purple-600" />
                  <h3 className="text-[11px] font-black uppercase text-purple-800 tracking-wider">Employees W/ Activity</h3>
                </div>
                <p className="text-3xl font-black text-slate-900">{data.summary.employeesWithActivity}</p>
              </ResponsiveCard>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-3 w-8"></th>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Completed</th>
                    <th className="px-4 py-3">Pending/In Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {flattenedEmployees.map(emp => {
                    const isExpanded = !!expandedRows[emp.employeeId];
                    return (
                      <React.Fragment key={emp.employeeId}>
                        <tr 
                          onClick={() => toggleRow(emp.employeeId)}
                          className={`cursor-pointer transition-colors ${!emp.hasActivity ? 'opacity-60 hover:bg-slate-50/50' : 'hover:bg-blue-50/50'} ${isExpanded ? 'bg-blue-50/30' : ''}`}
                        >
                          <td className="px-4 py-4">
                            <button className="text-slate-400 hover:text-blue-600 transition-colors">
                              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-bold text-slate-800 block">{emp.employeeName}</span>
                            <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">{emp.role}</span>
                            {!emp.hasActivity && <span className="text-[10px] font-bold text-rose-500 mt-0.5 block">No Activity Recorded</span>}
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-medium text-slate-600 text-xs">
                              {emp.mappedDepartment === 'SERVICE_OPERATIONS' ? 'Service' : emp.mappedDepartment}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs">
                              {emp.commonCompleted}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-md bg-amber-100 text-amber-800 font-bold text-xs">
                              {emp.commonInProgress}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/30 border-b-0">
                            <td colSpan={5} className="px-4 py-4">
                              <div className="pl-8 pr-4">
                                <h4 className="text-sm font-black text-slate-700 mb-3">{emp.employeeName}'s Work Details</h4>
                                {renderEmployeeDetails(emp)}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </ResponsivePage>
  );
};

export default EnterpriseDailyWork;
