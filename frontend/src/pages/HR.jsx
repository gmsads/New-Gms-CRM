import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useApi from '../hooks/useApi';

import { 
  HRDashboard, 
  HREmployees, 
  HRRecruitment, 
  HRPerformance, 
  HRAttendance, 
  HRPayroll,
  HRDocuments,
  HRCompensation,
  HRLeave,
  HRTraining,
  HRExitManagement,
  HRReports,
  EmployeeProfile
} from '../modules/hr';

const HR = () => {
  const { data, loading, error, refetch } = useApi('/employees');
  const employees = data?.employees || [];

  if (loading) return <div className="flex h-[calc(100vh-120px)] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  if (error) return <div className="flex h-[calc(100vh-120px)] items-center justify-center text-red-500 font-bold bg-red-50 rounded-[2rem] border border-red-100">Error: {error}</div>;

  return (
    <div className="w-full h-full pb-8">
      <Routes>
        <Route path="dashboard"   element={<HRDashboard employees={employees} />} />
        <Route path="employees"   element={<HREmployees employees={employees} onRefresh={refetch} />} />
        <Route path="employees/:id" element={<EmployeeProfile employees={employees} />} />
        <Route path="recruitment" element={<HRRecruitment />} />
        <Route path="documents"   element={<HRDocuments />} />
        <Route path="compensation" element={<HRCompensation employees={employees} />} />
        <Route path="attendance"  element={<HRAttendance />} />
        <Route path="leave"       element={<HRLeave />} />
        <Route path="payroll"     element={<HRPayroll />} />
        <Route path="performance" element={<HRPerformance />} />
        <Route path="training"    element={<HRTraining />} />
        <Route path="exit"        element={<HRExitManagement />} />
        <Route path="reports"     element={<HRReports />} />
        
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default HR;
