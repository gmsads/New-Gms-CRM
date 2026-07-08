import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import useApi from '../../hooks/useApi';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

const HRAttendance = () => {
  const [activeView, setActiveView] = useState('attendance');
  const today = new Date().toISOString().split('T')[0];
  
  const { data: attData, loading: attLoading, error: attError } = useApi(`/attendance?date=${today}`);
  const { data: leaveData, loading: leaveLoading, error: leaveError, refetch: refetchLeaves } = useApi('/leaves?status=PENDING');
  const { request } = useApi();

  const attendanceRecords = attData?.records || attData?.attendance || (Array.isArray(attData) ? attData : []);
  const leaves = leaveData?.leaves || leaveData || [];

  const handleLeaveAction = async (id, action) => {
    try {
      await request('PUT', `/leaves/${id}/hr-review`, { action: action.toUpperCase() });
      refetchLeaves();
    } catch (e) { alert(e.message); }
  };

  // Mock Late Logins for demo purposes
  const lateLogins = attendanceRecords.filter(r => {
    if (!r.loginTime) return false;
    const [h, m] = r.loginTime.split(':').map(Number);
    return h > 9 || (h === 9 && m > 15);
  }).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance & Leaves</h2>
          <p className="text-muted-foreground text-sm">Monitor daily attendance, working hours, and leave requests.</p>
        </div>
        <div className="flex bg-muted/50 p-1 rounded-lg border">
          <button onClick={() => setActiveView('attendance')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeView === 'attendance' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Today's Attendance</button>
          <button onClick={() => setActiveView('leaves')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeView === 'leaves' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Leave Requests {leaves.length > 0 && <span className="ml-1.5 inline-flex items-center justify-center bg-red-100 text-red-600 rounded-full h-5 w-5 text-[10px]">{leaves.length}</span>}</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Present Today</p>
            <h3 className="text-2xl font-bold">{attendanceRecords.length}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Late Logins</p>
            <h3 className="text-2xl font-bold text-yellow-600">{lateLogins}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Pending Leaves</p>
            <h3 className="text-2xl font-bold">{leaves.length}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <CalendarIcon className="h-5 w-5" />
          </div>
        </div>
      </div>

      {activeView === 'attendance' && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/10 flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Today's Log ({new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })})
            </h3>
          </div>
          {attLoading ? <div className="p-8 text-center text-muted-foreground">Loading...</div> : attError ? <div className="p-4 text-red-500">{attError}</div> : attendanceRecords.length === 0 ? (
            <EmptyState icon={CalendarIcon} title="No records" description="Attendance hasn't been marked yet today." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground bg-muted/30 border-b">
                  <tr>{['Employee','Status','Login Time','Logout Time','Hours Logged'].map(h => <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attendanceRecords.map((r, i) => (
                    <tr key={r._id || i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4 font-medium">{r.employee?.name || r.employeeName || '—'}</td>
                      <td className="px-5 py-4"><Badge value={r.status} /></td>
                      <td className="px-5 py-4 font-mono text-xs">{r.loginTime || '—'}</td>
                      <td className="px-5 py-4 font-mono text-xs">{r.logoutTime || '—'}</td>
                      <td className="px-5 py-4">
                        {r.loginTime && r.logoutTime ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-semibold">
                            9.5 hrs
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeView === 'leaves' && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/10 flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" /> Pending Leave Approvals
            </h3>
          </div>
          {leaveLoading ? <div className="p-8 text-center text-muted-foreground">Loading...</div> : leaveError ? <div className="p-4 text-red-500">{leaveError}</div> : leaves.length === 0 ? (
            <EmptyState icon={CheckCircle} title="All Caught Up" description="No pending leave requests awaiting approval." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground bg-muted/30 border-b">
                  <tr>{['Employee','Type','Duration','Reason','Actions'].map(h => <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leaves.map(l => (
                    <tr key={l._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4 font-medium">{l.employee?.name || '—'}</td>
                      <td className="px-5 py-4 text-xs font-mono">{l.leaveType || l.type}</td>
                      <td className="px-5 py-4 text-xs">
                        <div className="text-foreground">{l.startDate ? new Date(l.startDate).toLocaleDateString() : '—'}</div>
                        <div className="text-muted-foreground mt-0.5">to {l.endDate ? new Date(l.endDate).toLocaleDateString() : '—'} ({l.totalDays} days)</div>
                      </td>
                      <td className="px-5 py-4 max-w-[200px] truncate text-muted-foreground">{l.reason || '—'}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleLeaveAction(l._id, 'approve')} className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-medium transition-colors shadow-sm">Approve</button>
                          <button onClick={() => handleLeaveAction(l._id, 'reject')} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-md text-xs font-medium transition-colors shadow-sm">Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HRAttendance;
