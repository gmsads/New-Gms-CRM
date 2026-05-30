import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DesignerDashboard from './pages/DesignerDashboard';
import MyWork from './pages/MyWork';
import ServiceWorkflow from './pages/ServiceWorkflow';
import DesignAssets from './pages/DesignAssets';
import ServiceDetails from './pages/ServiceDetails';
import ComingSoon from '../../components/ui/ComingSoon';

const DesignRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<DesignerDashboard />} />
      <Route path="work" element={<MyWork />} />
      <Route path="workflow" element={<ServiceWorkflow />} />
      <Route path="assets" element={<DesignAssets />} />
      <Route path="services/:orderId/:itemIndex" element={<ServiceDetails />} />
      
      {/* Communication placeholders */}
      <Route path="communications/client" element={<ComingSoon title="Client Interactions" />} />
      <Route path="communications/proofs" element={<ComingSoon title="Approval Proofs" />} />
      
      {/* Reports placeholders */}
      <Route path="reports/performance" element={<ComingSoon title="My Performance" />} />
      <Route path="reports/productivity" element={<ComingSoon title="Productivity Reports" />} />
      
      <Route path="notifications" element={<ComingSoon title="Notifications Center" />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/design" replace />} />
    </Routes>
  );
};

export default DesignRoutes;
