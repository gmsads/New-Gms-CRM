import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Briefcase, Calendar, FileText, IndianRupee, Activity, Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { employeeApi } from '../../../services/api';

const EmployeeProfile = ({ employees }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Basic info from context/props if available
  const [employee, setEmployee] = useState(employees?.find(e => e._id === id || e.username === id) || null);
  const [masterData, setMasterData] = useState(null);
  const [loading, setLoading] = useState(!employee);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    const fetchMasterProfile = async () => {
      try {
        setLoading(true);
        // If real endpoint isn't fully baked, this might fail or return mock, 
        // we'll handle gracefully.
        const res = await employeeApi.masterProfile(id, user?.token);
        if (res.success && res.data) {
           setMasterData(res.data);
           if (!employee) setEmployee(res.data.employee); // Fallback if not found in props
        }
      } catch (err) {
        console.error('Failed to fetch master profile', err);
        // Mock data fallback if API fails
        setMasterData({
          attendance: { presentDays: 22, leaveDays: 2, lateMarks: 1 },
          performance: { rating: '4.5/5', goalsCompleted: 12, pendingGoals: 3 },
          compensation: { salary: '₹ 45,000', nextAppraisal: 'Jan 2027' },
          documents: [
            { name: 'Offer Letter.pdf', type: 'PDF' },
            { name: 'ID Proof.jpg', type: 'Image' }
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    fetchMasterProfile();
  }, [id, user]);

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  }

  if (!employee) {
    return <div className="p-8 text-center text-red-500">Employee not found.</div>;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">Personal Information</h2>
            <div className="grid grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm font-semibold">{employee.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                <p className="text-sm font-semibold">{employee.phone || 'N/A'}</p>
              </div>
            </div>
          </div>
        );
      case 'employment':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">Employment Details</h2>
            <div className="grid grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${employee.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {employee.status || 'UNKNOWN'}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Join Date</p>
                <p className="text-sm font-semibold">{employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </div>
        );
      case 'attendance':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">Attendance & Leave</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase">Present Days</p>
                <p className="text-2xl font-black mt-1">{masterData?.attendance?.presentDays || 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase">Leave Days</p>
                <p className="text-2xl font-black mt-1 text-rose-600">{masterData?.attendance?.leaveDays || 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase">Late Marks</p>
                <p className="text-2xl font-black mt-1 text-amber-600">{masterData?.attendance?.lateMarks || 0}</p>
              </div>
            </div>
          </div>
        );
      case 'performance':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">Performance Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-xs font-bold text-blue-500 uppercase">Rating</p>
                <p className="text-2xl font-black mt-1 text-blue-700">{masterData?.performance?.rating || 'N/A'}</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-xs font-bold text-emerald-500 uppercase">Goals Completed</p>
                <p className="text-2xl font-black mt-1 text-emerald-700">{masterData?.performance?.goalsCompleted || 0}</p>
              </div>
            </div>
          </div>
        );
      case 'compensation':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">Compensation Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-lg">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current Salary</p>
                <p className="text-3xl font-black">{masterData?.compensation?.salary || 'N/A'}</p>
              </div>
              <div className="p-6 rounded-2xl border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Next Appraisal</p>
                <p className="text-xl font-bold text-slate-800">{masterData?.compensation?.nextAppraisal || 'N/A'}</p>
              </div>
            </div>
          </div>
        );
      case 'documents':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">Employee Documents</h2>
            <div className="space-y-3">
              {masterData?.documents?.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl border hover:border-blue-200 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <span className="font-semibold text-slate-700">{doc.name}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded text-slate-500">{doc.type}</span>
                </div>
              ))}
              {!masterData?.documents?.length && <p className="text-slate-500 italic">No documents uploaded yet.</p>}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center gap-4 py-4 border-b">
        <button onClick={() => navigate('/hr/employees')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900">{employee.name || 'Employee Profile'}</h1>
          <p className="text-slate-500 font-medium">{employee.role?.replace(/_/g, ' ')} • {employee.department}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="space-y-2 border-r pr-4">
          {[
            { id: 'personal', label: 'Personal Info', icon: User },
            { id: 'employment', label: 'Employment', icon: Briefcase },
            { id: 'attendance', label: 'Attendance & Leave', icon: Calendar },
            { id: 'performance', label: 'Performance', icon: Activity },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'compensation', label: 'Compensation', icon: IndianRupee },
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-blue-700 shadow-sm' : 'hover:bg-slate-50 text-slate-600'}`}
            >
              <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-3xl border p-8 shadow-sm min-h-[400px]">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
