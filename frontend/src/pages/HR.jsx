import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useApi from '../hooks/useApi';

import { 
  HRDashboard, 
  HREmployees, 
  HRRecruitment, 
  HRPerformance, 
  HRAttendance, 
  HRPayroll 
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
        <Route path="recruitment" element={<HRRecruitment />} />
        <Route path="attendance"  element={<HRAttendance />} />
        <Route path="payroll"     element={<HRPayroll />} />
        <Route path="performance" element={<HRPerformance />} />
        
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default HR;
