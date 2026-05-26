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
import VendorLayout from './modules/operations/vendors/layouts/VendorLayout';
import IT from './modules/it/pages/ITDashboard';
import AdminHR from './modules/admin/pages/AdminHRControl';
import ProductManagement from './modules/admin/pages/ProductManagement';
import CostManagement from './modules/admin/pages/CostManagement';
import AdminApprovals from './modules/admin/pages/ApprovalsTerminal';
import SalesApprovals from './modules/sales/pages/ApprovalsTerminal';
import QuotationManagementList from './modules/admin/pages/QuotationManagementList';
import QuotationBrandingChanges from './modules/admin/pages/QuotationBrandingChanges';
import SalesManagerWorkspace from './modules/sales/pages/SalesManagerWorkspace';
import AuthorityAccess from './modules/admin/pages/AuthorityAccess';
import TargetAssignment from './modules/admin/pages/TargetAssignment';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TeamDataView } from './modules/sales/pages/TeamDataView';
import ComingSoon from './components/ui/ComingSoon';

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
  if (['ADMIN', 'MD_CEO', 'SALES_MANAGER', 'ACCOUNTS'].includes(user.role)) return admin;
  return sales;
};

const AdminTeamViewSwitch = ({ viewType, salesElement }) => {
  const { user } = useAuth();
  if (!user) return null;
  if (['ADMIN', 'MD_CEO'].includes(user.role)) {
    return <TeamDataView viewType={viewType} />;
  }
  return salesElement;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index          element={<UnifiedDashboard />} />
          <Route path="clients"     element={<AdminTeamViewSwitch viewType="prospects" salesElement={<Clients />} />} />
          <Route path="campaigns"   element={<Campaigns />} />
          <Route path="tasks"       element={<Tasks />} />
          <Route path="operations/authority" element={<AuthorityAccess />} />
          <Route path="hr/*"        element={<HR />} />
          <Route path="field"       element={<Field />} />
          <Route path="design"      element={<Design />} />
          <Route path="analytics"   element={<Analytics />} />
          <Route path="vendors/*"   element={<VendorLayout />} />
          <Route path="it"          element={<IT />} />
          <Route path="admin-hr"    element={<AdminHR />} />
          <Route path="product-management" element={<ProductManagement />} />
          <Route path="cost-management"    element={<CostManagement />} />
          <Route path="quotation-management/list" element={<QuotationManagementList />} />
          <Route path="quotation-management/changes" element={<QuotationBrandingChanges />} />
          
          <Route path="prospects"   element={<AdminTeamViewSwitch viewType="prospects" salesElement={<SalesProspects />} />} />
          <Route path="orders"      element={<AdminTeamViewSwitch viewType="orders" salesElement={<SalesOrders />} />} />
          <Route path="approvals"   element={<AuthRoleSwitch admin={<AdminApprovals />} sales={<SalesApprovals />} />} />
          <Route path="payments"    element={<SalesPayments />} />
          <Route path="followups"   element={<SalesFollowups />} />
          <Route path="appointments" element={<AdminTeamViewSwitch viewType="appointments" salesElement={<SalesAppointments />} />} />
          <Route path="brochures"   element={<SalesBrochures />} />
          <Route path="quotations"  element={<AdminTeamViewSwitch viewType="quotations" salesElement={<SalesQuotations />} />} />

          {/* Sales Manager Specific Routes */}
          <Route path="manager">
            <Route index element={<SalesManagerWorkspace />} />
            {/* My Work Aliases */}
            <Route path="my-followups" element={<SalesFollowups />} />
            <Route path="my-appointments" element={<SalesAppointments />} />
            <Route path="my-prospects" element={<SalesProspects />} />
            <Route path="my-orders" element={<SalesOrders />} />
            <Route path="my-approvals" element={<SalesApprovals />} />
            <Route path="my-brochures" element={<SalesBrochures />} />
            <Route path="my-quotations" element={<SalesQuotations />} />
            <Route path="my-payments" element={<SalesPayments />} />
            <Route path="my-tasks" element={<Tasks />} />
            <Route path="my-leaves" element={<div className="p-6">Leaves Module</div>} />
            
            {/* Team Data Views */}
            <Route path="team" element={<TeamDataView viewType="overview" />} />
            <Route path="team-prospects" element={<TeamDataView viewType="prospects" />} />
            <Route path="team-orders" element={<TeamDataView viewType="orders" />} />
            <Route path="team-followups" element={<TeamDataView viewType="followups" />} />
            <Route path="team-approvals" element={<TeamDataView viewType="approvals" />} />
            <Route path="team-appointments" element={<TeamDataView viewType="appointments" />} />
            <Route path="team-catalogue" element={<TeamDataView viewType="catalogue" />} />
            <Route path="team-quotations" element={<TeamDataView viewType="quotations" />} />
            <Route path="team-leaves" element={<TeamDataView viewType="leaves" />} />
            <Route path="team-performance" element={<TeamDataView viewType="performance" />} />
            <Route path="team-targets" element={<TeamDataView viewType="targets" />} />
            <Route path="escalations" element={<TeamDataView viewType="escalations" />} />
            <Route path="lead-allocation" element={<TeamDataView viewType="allocation" />} />
          </Route>
          
          {/* Admin Placeholder Routes */}
          <Route path="operations/targets" element={<ErrorBoundary><TargetAssignment /></ErrorBoundary>} />
          <Route path="finance/transactions" element={<ComingSoon title="Transactions" />} />
          <Route path="finance/refunds" element={<ComingSoon title="Refunds" />} />
          <Route path="hr/inactive" element={<ComingSoon title="Inactive Employees" />} />
          <Route path="analytics/revenue" element={<ComingSoon title="Revenue Reports" />} />
          <Route path="analytics/workflow" element={<ComingSoon title="Workflow Reports" />} />
          <Route path="analytics/conversion" element={<ComingSoon title="Conversion Analytics" />} />
          <Route path="audit/activity" element={<ComingSoon title="Activity Logs" />} />
          <Route path="audit/changes" element={<ComingSoon title="Change History" />} />
          <Route path="audit/logins" element={<ComingSoon title="Login History" />} />
          <Route path="audit/approvals" element={<ComingSoon title="Approval History" />} />
          <Route path="communications/whatsapp" element={<ComingSoon title="WhatsApp Integration" />} />
          <Route path="communications/email" element={<ComingSoon title="Email Campaigns" />} />
          <Route path="communications/sms" element={<ComingSoon title="SMS Integration" />} />
          <Route path="communications/notifications" element={<ComingSoon title="Notifications Center" />} />

          <Route path="settings"    element={<ComingSoon title="Settings" />} />
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
