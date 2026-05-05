import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useApi from '../hooks/useApi';

import HRDashboard from '../modules/hr/HRDashboard';
import HREmployees from '../modules/hr/HREmployees';
import HRRecruitment from '../modules/hr/HRRecruitment';
import HRPerformance from '../modules/hr/HRPerformance';
import HRAttendance from '../modules/hr/HRAttendance';
import HRPayroll from '../modules/hr/HRPayroll';

const HR = () => {
  const { data, loading, error, refetch } = useApi('/employees');
  const employees = data?.employees || [];
  const location = useLocation();

  if (loading) return <div className="flex h-[calc(100vh-120px)] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (error) return <div className="flex h-[calc(100vh-120px)] items-center justify-center text-red-500 font-medium bg-red-50 rounded-xl border border-red-200">Error: {error}</div>;

  return (
    <div className="w-full h-full pb-8">
      {/* Remove the nested inner sidebar, render the route directly */}
      <Routes>
        <Route path="dashboard"   element={<HRDashboard employees={employees} />} />
        <Route path="employees"   element={<HREmployees employees={employees} onRefresh={refetch} />} />
        <Route path="recruitment" element={<HRRecruitment />} />
        <Route path="attendance"  element={<HRAttendance />} />
        <Route path="payroll"     element={<HRPayroll />} />
        <Route path="performance" element={<HRPerformance />} />
        
        {/* Redirect /hr to /hr/dashboard by default */}
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default HR;
