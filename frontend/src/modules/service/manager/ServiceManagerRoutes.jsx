import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ServiceManagerDashboard from './ServiceManagerDashboard';
import LabourManagement from './pages/LabourManagement';
import VehicleManagement from './pages/VehicleManagement';
import SiteVisits from './pages/SiteVisits';
import ServiceProofs from './pages/ServiceProofs';
import ClientConfirmations from './pages/ClientConfirmations';
import ServiceReports from './pages/ServiceReports';
import ServiceNotifications from './pages/ServiceNotifications';

const ServiceManagerRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="overview" replace />} />
      <Route path="overview" element={<ServiceManagerDashboard initialTab="overview" />} />
      <Route path="due-today" element={<ServiceManagerDashboard initialTab="due-today" />} />
      <Route path="overdue" element={<ServiceManagerDashboard initialTab="overdue" />} />
      <Route path="risks" element={<ServiceManagerDashboard initialTab="risks" />} />

      <Route path="management" element={<Navigate to="../queue" replace />} />
      <Route path="queue" element={<ServiceManagerDashboard initialTab="queue" />} />
      <Route path="scheduled" element={<ServiceManagerDashboard initialTab="scheduled" />} />
      <Route path="active" element={<ServiceManagerDashboard initialTab="active" />} />
      <Route path="delayed" element={<ServiceManagerDashboard initialTab="delayed" />} />
      <Route path="completed" element={<ServiceManagerDashboard initialTab="completed" />} />

      <Route path="labour" element={<LabourManagement />} />
      <Route path="vehicles" element={<VehicleManagement />} />
      {/* For vendors, we reuse the existing Vendor page or redirect, but since they clicked a sidebar link we should have a view */}
      {/* Assuming Vendor portal is at /vendors */}

      <Route path="site-visits" element={<SiteVisits />} />
      <Route path="tracking" element={<ServiceManagerDashboard initialTab="active" />} />
      <Route path="confirmations" element={<ClientConfirmations />} />
      <Route path="proofs" element={<ServiceProofs />} />

      <Route path="reports/*" element={<ServiceReports />} />
      
      <Route path="notifications" element={<ServiceNotifications />} />
      <Route path="alerts" element={<ServiceNotifications />} />
      <Route path="escalations" element={<ServiceNotifications />} />

      <Route path="*" element={<ServiceManagerDashboard initialTab="queue" />} />
    </Routes>
  );
};

export default ServiceManagerRoutes;
