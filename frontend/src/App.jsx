import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Clients from './pages/Clients'
import Campaigns from './pages/Campaigns'
import Tasks from './pages/Tasks'
import HR from './pages/HR'
import Field from './pages/Field'
import Design from './pages/Design'
import Analytics from './pages/Analytics'
import Vendors from './pages/Vendors'
import IT from './pages/IT'
import AdminHR from './pages/AdminHR'
import Approvals from './pages/Approvals'
import { SalesProspects, SalesOrders, SalesPayments, SalesFollowups, SalesAppointments } from './pages/SalesExec/index'

// ── Protected Route ────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Wait for localStorage restore before deciding
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #1d4ed8', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// ── Routes ──────────────────────────────────────────────────────────────────────
const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index          element={<Dashboard />} />
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
          
          {/* Sales Executive Specific Routes */}
          <Route path="prospects"   element={<SalesProspects />} />
          <Route path="orders"      element={<SalesOrders />} />
          <Route path="approvals"   element={<Approvals />} />
          <Route path="payments"    element={<SalesPayments />} />
          <Route path="followups"   element={<SalesFollowups />} />
          <Route path="appointments" element={<SalesAppointments />} />
          <Route path="performance" element={<div className="p-6">Performance Module</div>} />
          
          <Route path="settings"    element={<div className="p-6 text-muted-foreground">Settings – Coming Soon</div>} />
          <Route path="*"           element={<div className="p-6 text-muted-foreground">Page not found.</div>} />
        </Route>

        {/* Redirect root to login if not authenticated */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

// ── CSS for spinner ────────────────────────────────────────────────────────────
const spinStyle = document.createElement('style');
spinStyle.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(spinStyle);

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
