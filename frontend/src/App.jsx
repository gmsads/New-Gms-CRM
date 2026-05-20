import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';

// Direct imports to bypass index cycle issues
import UnifiedDashboard from './pages/UnifiedDashboard';
import Login from './pages/Login';
import HR from './pages/HR';

// Modular Page Direct Imports
import Clients from './modules/sales/pages/ClientPortfolio';
import Campaigns from './modules/operations/pages/CampaignManager';
import Tasks from './modules/operations/pages/TaskTerminal';
import Field from './modules/operations/pages/OperationsDashboard';
import Design from './modules/design/pages/DesignDashboard';
import Analytics from './modules/admin/pages/BusinessIntelligence';
import Vendors from './modules/operations/pages/VendorPortal';
import IT from './modules/it/pages/ITDashboard';
import AdminHR from './modules/admin/pages/AdminHRControl';
import ProductManagement from './modules/admin/pages/ProductManagement';
import CostManagement from './modules/admin/pages/CostManagement';
import AdminApprovals from './modules/admin/pages/ApprovalsTerminal';
import SalesApprovals from './modules/sales/pages/ApprovalsTerminal';

// Sales Exec Sub-pages (imported from ExecDashboard)
import ExecDashboard, { 
  SalesProspects, 
  SalesOrders, 
  SalesPayments, 
  SalesFollowups, 
  SalesAppointments,
  SalesBrochures,
  SalesQuotations
} from './modules/sales/pages/ExecDashboard';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">Authenticating...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AuthRoleSwitch = ({ sales, admin }) => {
  const { user } = useAuth();
  if (!user) return null;
  if (['ADMIN', 'MD_CEO', 'SALES_MANAGER'].includes(user.role)) return admin;
  return sales;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index          element={<UnifiedDashboard />} />
          <Route path="clients"     element={<Clients />} />
          <Route path="campaigns"   element={<Campaigns />} />
          <Route path="tasks"       element={<Tasks />} />
          <Route path="hr/*"        element={<HR />} />
          <Route path="field"       element={<Field />} />
          <Route path="design"      element={<Design />} />
          <Route path="analytics"   element={<Analytics />} />
          <Route path="vendors"     element={<Vendors />} />
          <Route path="it"          element={<IT />} />
          <Route path="admin-hr"    element={<AdminHR />} />
          <Route path="product-management" element={<ProductManagement />} />
          <Route path="cost-management"    element={<CostManagement />} />
          
          <Route path="prospects"   element={<SalesProspects />} />
          <Route path="orders"      element={<SalesOrders />} />
          <Route path="approvals"   element={<AuthRoleSwitch admin={<AdminApprovals />} sales={<SalesApprovals />} />} />
          <Route path="payments"    element={<SalesPayments />} />
          <Route path="followups"   element={<SalesFollowups />} />
          <Route path="appointments" element={<SalesAppointments />} />
          <Route path="brochures"   element={<SalesBrochures />} />
          <Route path="quotations"  element={<SalesQuotations />} />
          
          <Route path="settings"    element={<div className="p-6 text-muted-foreground">Settings – Coming Soon</div>} />
          <Route path="*"           element={<div className="p-6 text-muted-foreground">Page not found.</div>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
