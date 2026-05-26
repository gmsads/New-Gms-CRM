import React from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Package, Truck, LayoutDashboard, CalendarClock, Briefcase, CreditCard, Users, Settings } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

import VendorDashboard from '../pages/VendorDashboard';
import VendorList from '../pages/VendorList';
import VendorCategories from '../pages/VendorCategories';
import AddVendor from '../pages/AddVendor';
import VendorDetails from '../pages/VendorDetails';
import VendorAssignments from '../pages/VendorAssignments';
import VendorPayments from '../pages/VendorPayments';

const VendorLayout = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isManagerOrAdmin = ['SALES_MANAGER', 'SR_SALES_MANAGER', 'OPERATION_MANAGER', 'ADMIN', 'MD_CEO'].includes(user.role);

  const tabs = [
    { name: 'Overview', path: '/vendors', end: true, icon: LayoutDashboard },
    { name: 'Categories', path: '/vendors/categories', icon: Package, restrict: true },
    { name: 'Vendor Directory', path: '/vendors/list', icon: Users },
    { name: 'Active Assignments', path: '/vendors/assignments', icon: Briefcase },
    { name: 'Financials', path: '/vendors/payments', icon: CreditCard, restrict: true },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Truck className="h-8 w-8 text-blue-600" />
            Vendor Management
          </h1>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400 mt-1">
            Enterprise Campaign Execution Partners
          </p>
        </div>
      </div>

      {/* Internal Navigation Tabs (Glassmorphism) */}
      <div className="bg-slate-900/5 backdrop-blur-md rounded-2xl p-1.5 flex flex-wrap gap-2 border border-slate-200/50">
        {tabs.map((tab) => {
          if (tab.restrict && !isManagerOrAdmin && user.role !== 'ACCOUNTS') return null;
          
          return (
            <NavLink
              key={tab.name}
              to={tab.path}
              end={tab.end}
              className={({ isActive }) => `
                flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
                ${isActive 
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}
              `}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </NavLink>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="bg-transparent rounded-3xl min-h-[500px]">
        <Routes>
          <Route index element={<VendorDashboard />} />
          <Route path="list" element={<VendorList />} />
          <Route path="add" element={<AddVendor />} />
          <Route path="categories" element={<VendorCategories />} />
          <Route path="assignments" element={<VendorAssignments />} />
          <Route path="payments" element={<VendorPayments />} />
          <Route path=":id" element={<VendorDetails />} />
          <Route path="*" element={<Navigate to="/vendors" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default VendorLayout;
