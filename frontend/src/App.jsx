import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CompanyProfileProvider } from './context/CompanyProfileContext';
import Layout from './components/layout/Layout';
import PerformanceDashboard from './modules/performance/pages/PerformanceDashboard';

// Direct imports to bypass index cycle issues
import UnifiedDashboard from './pages/UnifiedDashboard';
import Login from './pages/Login';
const HR = React.lazy(() => import('./pages/HR'));
const EmployeeLeaves = React.lazy(() => import('./pages/EmployeeLeaves'));

// Modular Page Direct Imports
const Clients = React.lazy(() => import('./modules/sales/pages/ClientPortfolio'));
const Campaigns = React.lazy(() => import('./modules/operations/pages/CampaignManager'));
const Tasks = React.lazy(() => import('./modules/operations/pages/TaskTerminal'));
const DailyReports = React.lazy(() => import('./pages/DailyReports'));
const Field = React.lazy(() => import('./modules/operations/pages/OperationsDashboard'));
const DesignRoutes = React.lazy(() => import('./modules/design/DesignRoutes'));
const ProductionManagerDashboard = React.lazy(() => import('./modules/production/manager/ProductionManagerDashboard'));
const ProductionExecutiveDashboard = React.lazy(() => import('./modules/production/executive/ProductionExecutiveDashboard'));
const ServiceManagerRoutes = React.lazy(() => import('./modules/service/manager/ServiceManagerRoutes'));
const ServiceExecutiveDashboard = React.lazy(() => import('./modules/service/executive/ServiceExecutiveDashboard'));
const Analytics = React.lazy(() => import('./modules/admin/pages/BusinessIntelligence'));
const VendorLayout = React.lazy(() => import('./modules/operations/vendors/layouts/VendorLayout'));
const IT = React.lazy(() => import('./modules/it/pages/ITDashboard'));
const AdminHR = React.lazy(() => import('./modules/admin/pages/AdminHRControl'));
const ProductManagement = React.lazy(() => import('./modules/admin/pages/ProductManagement'));
const CostManagement = React.lazy(() => import('./modules/admin/pages/CostManagement'));
const AdvancePaymentApprovals = React.lazy(() => import('./modules/admin/pages/AdvancePaymentApprovals'));
const OrderVerification = React.lazy(() => import('./modules/admin/pages/OrderVerification'));
const TeamAssignment = React.lazy(() => import('./modules/admin/pages/TeamAssignment'));
const PaymentVerification = React.lazy(() => import('./modules/admin/pages/PaymentVerification'));
const SalesApprovals = React.lazy(() => import('./modules/sales/pages/ApprovalsTerminal'));
const QuotationManagementList = React.lazy(() => import('./modules/admin/pages/QuotationManagementList'));
const QuotationBrandingChanges = React.lazy(() => import('./modules/admin/pages/QuotationBrandingChanges'));
const InvoiceManagementList = React.lazy(() => import('./modules/admin/pages/InvoiceManagementList'));
const SalesManagerWorkspace = React.lazy(() => import('./modules/sales/pages/SalesManagerWorkspace'));
const AuthorityAccess = React.lazy(() => import('./modules/admin/pages/AuthorityAccess'));
const TargetAssignment = React.lazy(() => import('./modules/admin/pages/TargetAssignment'));
const WorkforceTimelineDashboard = React.lazy(() => import('./modules/admin/pages/WorkforceTimelineDashboard'));
import { ErrorBoundary } from './components/ErrorBoundary';
const TeamDataView = React.lazy(() => import('./modules/sales/pages/TeamDataView').then(m => ({ default: m.TeamDataView })));
import ComingSoon from './components/ui/ComingSoon';

// Tele CRM Pages
const LeadDashboard = React.lazy(() => import('./modules/leads/pages/LeadDashboard'));
const LeadPool = React.lazy(() => import('./modules/leads/pages/LeadPool'));
const LeadImport = React.lazy(() => import('./modules/leads/pages/LeadImport'));
const CampaignManagement = React.lazy(() => import('./modules/leads/pages/CampaignManagement'));
const MyLeads = React.lazy(() => import('./modules/leads/pages/MyLeads'));
const CallHistory = React.lazy(() => import('./modules/leads/pages/CallHistory'));
const LeadReports = React.lazy(() => import('./modules/leads/pages/LeadReports'));
const MyReports = React.lazy(() => import('./modules/leads/pages/MyReports'));

// Sales Exec Sub-pages (imported from ExecDashboard)
const ExecDashboard = React.lazy(() => import('./modules/sales/pages/ExecDashboard'));
const SalesProspects = React.lazy(() => import('./modules/sales/pages/ExecDashboard').then(module => ({ default: module.SalesProspects })));
const SalesOrders = React.lazy(() => import('./modules/sales/pages/ExecDashboard').then(module => ({ default: module.SalesOrders })));
const SalesPayments = React.lazy(() => import('./modules/sales/pages/ExecDashboard').then(module => ({ default: module.SalesPayments })));
const SalesFollowups = React.lazy(() => import('./modules/sales/pages/ExecDashboard').then(module => ({ default: module.SalesFollowups })));
const SalesAppointments = React.lazy(() => import('./modules/sales/pages/ExecDashboard').then(module => ({ default: module.SalesAppointments })));
const SalesBrochures = React.lazy(() => import('./modules/sales/pages/ExecDashboard').then(module => ({ default: module.SalesBrochures })));
const SalesQuotations = React.lazy(() => import('./modules/sales/pages/ExecDashboard').then(module => ({ default: module.SalesQuotations })));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">Authenticating...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AuthRoleSwitch = ({ sales, admin }) => {
  const { user } = useAuth();
  if (['ADMIN', 'MD_CEO', 'SALES_MANAGER', 'ACCOUNTS'].includes(user?.role)) return admin;
  return sales;
};

const AdminTeamViewSwitch = ({ viewType, salesElement }) => {
  const { user } = useAuth();
  if (['ADMIN', 'MD_CEO'].includes(user?.role)) {
    return <TeamDataView viewType={viewType} />;
  }
  return salesElement;
};

const AppRoutes = () => {
  React.useEffect(() => {
    const handleGlobalModalClick = (e) => {
      const el = e.target;
      // Identify if the clicked element is strictly a modal backdrop wrapper
      if (
        el.tagName === 'DIV' && 
        typeof el.className === 'string' && 
        el.className.includes('fixed') && 
        el.className.includes('inset-0')
      ) {
        // Prevent closing if a form or action inside the modal is actively loading/submitting
        if (el.querySelector('.animate-spin')) return;

        // Try to find an enabled X (close) button or Cancel button inside this backdrop wrapper
        const buttons = Array.from(el.querySelectorAll('button'));
        let closeBtn = buttons.find(b => !b.disabled && (b.querySelector('svg.lucide-x') || b.querySelector('svg.lucide-close')));
        
        if (!closeBtn) {
          closeBtn = buttons.find(b => {
            if (b.disabled) return false;
            const txt = b.textContent.toLowerCase().trim();
            return txt === 'cancel' || txt === 'close';
          });
        }

        // Programmatically click the close button to close the modal
        if (closeBtn) {
          closeBtn.click();
        }
      }
    };

    window.addEventListener('mousedown', handleGlobalModalClick);
    return () => window.removeEventListener('mousedown', handleGlobalModalClick);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index          element={<UnifiedDashboard />} />
          <Route path="clients"     element={<AdminTeamViewSwitch viewType="prospects" salesElement={<Clients />} />} />
          <Route path="campaigns"   element={<Campaigns />} />
          <Route path="tasks"       element={<Tasks />} />
          <Route path="leaves"      element={<EmployeeLeaves />} />
          <Route path="operations/authority" element={<AuthorityAccess />} />
          
          {/* Enterprise Lead Management & Tele Sales Routes */}
          <Route path="telecrm">
            <Route path="dashboard" element={<LeadDashboard />} />
            <Route path="pool" element={<LeadPool />} />
            <Route path="import" element={<LeadImport />} />
            <Route path="campaigns" element={<CampaignManagement />} />
            <Route path="my-leads" element={<MyLeads />} />
            <Route path="my-reports" element={<MyReports />} />
            <Route path="call-history" element={<CallHistory />} />
            <Route path="reports" element={<LeadReports />} />
          </Route>

          <Route path="hr/*"        element={<HR />} />
          <Route path="field"       element={<Field />} />
          <Route path="daily-reports" element={<DailyReports />} />
          <Route path="workforce-timeline" element={<ErrorBoundary><WorkforceTimelineDashboard /></ErrorBoundary>} />
          <Route path="design/*"    element={<DesignRoutes />} />
          <Route path="production/manager/*" element={<ErrorBoundary><ProductionManagerDashboard /></ErrorBoundary>} />
          <Route path="production/executive/*" element={<ErrorBoundary><ProductionExecutiveDashboard /></ErrorBoundary>} />
          <Route path="service/manager/*" element={<ErrorBoundary><ServiceManagerRoutes /></ErrorBoundary>} />
          <Route path="service/executive/*" element={<ErrorBoundary><ServiceExecutiveDashboard /></ErrorBoundary>} />
          <Route path="analytics"   element={<Analytics />} />
          <Route path="vendors/*"   element={<VendorLayout />} />
          <Route path="it"          element={<IT />} />
          <Route path="admin-hr"    element={<AdminHR />} />
          <Route path="product-management" element={<ProductManagement />} />
          <Route path="cost-management"    element={<CostManagement />} />
          <Route path="quotation-management/list" element={<QuotationManagementList />} />
          <Route path="quotation-management/changes" element={<QuotationBrandingChanges />} />
          <Route path="invoice-management/list" element={<InvoiceManagementList />} />
          <Route path="invoice-management/changes" element={<QuotationBrandingChanges />} />
          <Route path="invoice-management" element={<InvoiceManagementList />} />
          
          <Route path="prospects"   element={<AdminTeamViewSwitch viewType="prospects" salesElement={<SalesProspects />} />} />
          <Route path="orders"      element={<AdminTeamViewSwitch viewType="orders" salesElement={<SalesOrders />} />} />
          <Route path="approvals/order-verification" element={<OrderVerification />} />
          <Route path="approvals/advance-payments" element={<AdvancePaymentApprovals />} />
          <Route path="approvals/payment-verification" element={<PaymentVerification />} />
          <Route path="approvals"   element={<SalesApprovals />} />
          <Route path="payments"    element={<SalesPayments />} />
          <Route path="followups"   element={<SalesFollowups />} />
          <Route path="appointments" element={<AdminTeamViewSwitch viewType="appointments" salesElement={<SalesAppointments />} />} />
          <Route path="assigned-appointments" element={<SalesAppointments isAssignedView={true} />} />
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
          
          {/* Performance Module */}
          <Route path="performance" element={<PerformanceDashboard />} />

          {/* Admin Placeholder Routes */}
          <Route path="operations/targets" element={<ErrorBoundary><TargetAssignment /></ErrorBoundary>} />
          <Route path="operations/teams" element={<ErrorBoundary><TeamAssignment /></ErrorBoundary>} />
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

          <Route path="settings"    element={<QuotationBrandingChanges />} />
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
      <CompanyProfileProvider>
        <AppRoutes />
      </CompanyProfileProvider>
    </AuthProvider>
  );
}

export default App;
