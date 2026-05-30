import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Megaphone, CheckSquare, Settings,
  PieChart, Briefcase, FileText, Palette, Truck, Server, X, ShieldCheck,
  Clock, ShoppingCart, Calendar, IndianRupee, BarChart2, Search, AlertCircle, CheckCircle,
  ChevronDown, ChevronRight, UserPlus, Quote, Package, Target, Bell, Eye,
  Image as ImageIcon, MapPin, Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { prospectApi, orderApi, appointmentApi, approvalApi, paymentApi } from '../../services/api';

const menuConfig = [
  { title: 'Dashboard',        icon: LayoutDashboard, path: '/',          roles: ['ALL'] },
  { title: 'Clients & Leads',  icon: Users,           path: '/clients',   roles: ['ADMIN','SALES_MANAGER','SR_SALES_MANAGER','AGENT'] },
  { title: 'Campaigns',        icon: Megaphone,       path: '/campaigns', roles: ['ADMIN','SALES_MANAGER','OPERATION_MANAGER','AGENT'] },
  { title: 'Field Operations', icon: Truck,           path: '/field',     roles: ['ADMIN','FIELD_EXEC','OPERATION_MANAGER'] },
  { title: 'Design Assets',    icon: Palette,         path: '/design',    roles: ['ADMIN','DESIGNER','OPERATION_EXEC'] },
  { title: 'Tasks',            icon: CheckSquare,     path: '/tasks',     roles: ['ALL'] },
  { 
    title: 'HR & Team',        
    icon: Briefcase,        
    path: '/hr',        
    roles: ['ADMIN','MD_CEO','HR'],
    subItems: [
      { title: 'Dashboard',   path: '/hr/dashboard',   icon: LayoutDashboard },
      { title: 'Employees',   path: '/hr/employees',   icon: Users },
      { title: 'Recruitment', path: '/hr/recruitment', icon: UserPlus },
      { title: 'Documents',   path: '/hr/documents',   icon: FileText },
      { title: 'Compensation',path: '/hr/compensation',icon: IndianRupee },
      { title: 'Attendance',  path: '/hr/attendance',  icon: Calendar },
      { title: 'Leave',       path: '/hr/leave',       icon: Calendar },
      { title: 'Performance', path: '/hr/performance', icon: BarChart2 },
      { title: 'Training',    path: '/hr/training',    icon: CheckSquare },
      { title: 'Exit Mgmt',   path: '/hr/exit',        icon: Users },
      { title: 'Reports',     path: '/hr/reports',     icon: PieChart }
    ]
  },
  { title: 'Orders',           icon: ShoppingCart,    path: '/orders',    roles: ['ADMIN','MD_CEO','SALES_MANAGER','SR_SALES_MANAGER','ACCOUNTS'] },
  { title: 'Approvals',        icon: ShieldCheck,     path: '/approvals', roles: ['ADMIN','MD_CEO','SALES_MANAGER','SR_SALES_MANAGER','ACCOUNTS'] },
  { title: 'Appointments',     icon: Calendar,        path: '/appointments', roles: ['ADMIN','MD_CEO','SALES_MANAGER','SR_SALES_MANAGER','FIELD_EXEC'] },
  { 
    title: 'Product Management',   
    icon: Package,         
    path: '/product-management', 
    roles: ['ADMIN','SALES_MANAGER','SR_SALES_MANAGER','MD_CEO'],
    subItems: [
      { title: 'Product Catalog', path: '/product-management', icon: Package },
      { title: 'Cost Master',    path: '/cost-management',    icon: IndianRupee },
    ]
  },
  { 
    title: 'Quotation Management',   
    icon: Quote,         
    path: '/quotation-management', 
    roles: ['ADMIN','MD_CEO'],
    subItems: [
      { title: 'Quotations', path: '/quotation-management/list', icon: FileText },
      { title: 'Quotation Changes', path: '/quotation-management/changes', icon: Settings },
    ]
  },
  { title: 'Catalog',          icon: FileText,        path: '/brochures',   roles: ['ADMIN','MD_CEO','SALES_MANAGER','SR_SALES_MANAGER','SALES_EXEC','SR_SALES_EXEC'] },
  { title: 'Quotations',       icon: Quote,           path: '/quotations',  roles: ['ADMIN','MD_CEO','SALES_MANAGER','SR_SALES_MANAGER','FIELD_EXEC','AGENT'] },
  { title: 'HR Control Panel', icon: ShieldCheck,     path: '/admin-hr',  roles: ['ADMIN','MD_CEO'] },
  { title: 'Vendor Portal',    icon: FileText,        path: '/vendors',   roles: ['ADMIN','VENDOR','OPERATION_MANAGER'] },
  { title: 'Analytics',        icon: PieChart,        path: '/analytics', roles: ['ADMIN','SALES_MANAGER','SR_SALES_MANAGER','OPERATION_MANAGER'] },
  { title: 'IT & Systems',     icon: Server,          path: '/it',        roles: ['ADMIN','IT'] },
  { title: 'Settings',         icon: Settings,        path: '/settings',  roles: ['ALL'] },
];

const adminMenuConfig = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { 
    title: 'Sales Management',
    icon: Users,
    path: '/sales-management',
    subItems: [
      { title: 'Prospects', path: '/clients', icon: Users },
      { title: 'Orders', path: '/orders', icon: ShoppingCart },
      { title: 'Appointments', path: '/appointments', icon: Calendar },
      { title: 'Quotations', path: '/quotations', icon: Quote }
    ]
  },
  {
    title: 'Operations',
    icon: CheckSquare,
    path: '/operations',
    subItems: [
      { title: 'Authority Access', path: '/operations/authority', icon: ShieldCheck },
      { title: 'Target Assignment', path: '/operations/targets', icon: Target },
      { title: 'Order Verification', path: '/approvals/order-verification', icon: ShieldCheck },
      { title: 'Task Assignments', path: '/tasks', icon: CheckSquare },
      { title: 'Vendor Management', path: '/vendors', icon: Truck },
      { title: 'Quotation Management', path: '/quotation-management/list', icon: FileText }
    ]
  },
  {
    title: 'Inventory & Catalog',
    icon: Package,
    path: '/inventory',
    subItems: [
      { title: 'Product Catalog', path: '/product-management', icon: Package },
      { title: 'Cost Master', path: '/cost-management', icon: IndianRupee },
      { title: 'Catalogs', path: '/brochures', icon: FileText }
    ]
  },
  {
    title: 'Finance',
    icon: IndianRupee,
    path: '/finance',
    subItems: [
      { title: 'Payment Verification', path: '/approvals/payment-verification', icon: ShieldCheck },
      { title: 'Advance Payment Approvals', path: '/approvals/advance-payments', icon: ShieldCheck },
      { title: 'Transactions', path: '/finance/transactions', icon: IndianRupee },
      { title: 'Refunds', path: '/finance/refunds', icon: IndianRupee }
    ]
  },
  {
    title: 'HR & Employees',
    icon: Briefcase,
    path: '/hr',
    subItems: [
      { title: 'Employees', path: '/hr/employees', icon: Users },
      { title: 'Recruitment', path: '/hr/recruitment', icon: UserPlus },
      { title: 'Documents', path: '/hr/documents', icon: FileText },
      { title: 'Compensation', path: '/hr/compensation', icon: IndianRupee },
      { title: 'Attendance', path: '/hr/attendance', icon: Calendar },
      { title: 'Leave Management', path: '/hr/leave', icon: Calendar },
      { title: 'Performance', path: '/hr/performance', icon: BarChart2 },
      { title: 'Training', path: '/hr/training', icon: CheckSquare },
      { title: 'Exit Mgmt', path: '/hr/exit', icon: Users },
      { title: 'Reports', path: '/hr/reports', icon: PieChart }
    ]
  },
  {
    title: 'Reports & Analytics',
    icon: BarChart2,
    path: '/analytics-center',
    subItems: [
      { title: 'Sales Reports', path: '/analytics', icon: PieChart },
      { title: 'Revenue Reports', path: '/analytics/revenue', icon: IndianRupee },
      { title: 'Team Performance', path: '/hr/performance', icon: Target },
      { title: 'Workflow Reports', path: '/analytics/workflow', icon: CheckSquare },
      { title: 'Conversion Analytics', path: '/analytics/conversion', icon: BarChart2 }
    ]
  },
  {
    title: 'Audit & Logs',
    icon: FileText,
    path: '/audit',
    subItems: [
      { title: 'Activity Logs', path: '/audit/activity', icon: Clock },
      { title: 'Change History', path: '/audit/changes', icon: Settings },
      { title: 'Login History', path: '/audit/logins', icon: UserPlus },
      { title: 'Approval History', path: '/audit/approvals', icon: ShieldCheck }
    ]
  },
  { title: 'Designs', icon: Palette, path: '/design' },
  {
    title: 'Communication Center',
    icon: Megaphone,
    path: '/communications',
    subItems: [
      { title: 'WhatsApp', path: '/communications/whatsapp', icon: Megaphone },
      { title: 'Email', path: '/communications/email', icon: FileText },
      { title: 'SMS', path: '/communications/sms', icon: Megaphone },
      { title: 'Notifications', path: '/communications/notifications', icon: Bell }
    ]
  },
  { title: 'Settings', icon: Settings, path: '/settings' }
];

// We will define this dynamically inside the component now

const NavItem = ({ item, setOpen, level = 0 }) => {
  const location = useLocation();
  const hasSubItems = item.subItems && item.subItems.length > 0;
  
  const currentPathWithSearch = location.pathname + (location.search || '');
  let isExactPathActive = currentPathWithSearch === item.path;
  
  // Special case: /followups defaults to prospects tab
  if (item.path === '/followups?tab=prospects' && currentPathWithSearch === '/followups') {
    isExactPathActive = true;
  }

  const isPathActive = isExactPathActive || location.pathname === item.path || (hasSubItems && location.pathname.startsWith(item.path.split('?')[0]));
  const [expanded, setExpanded] = useState(isPathActive);

  const handleClick = (e) => {
    if (hasSubItems) {
      e.preventDefault();
      setExpanded(!expanded);
    } else {
      setOpen(false);
    }
  };

  return (
    <div className="mb-1">
      <NavLink
        to={item.path}
        end={item.path === '/'}
        onClick={handleClick}
        className={() => `
          flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200
          ${(!hasSubItems && isExactPathActive) || (hasSubItems && isPathActive) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
        `}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{item.title}</span>
        
        {item.badge && (
          <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
            {item.badge}
          </span>
        )}
        
        {hasSubItems && (
          expanded ? <ChevronDown className="h-4 w-4 opacity-50" /> : <ChevronRight className="h-4 w-4 opacity-50" />
        )}
      </NavLink>

      {hasSubItems && expanded && (
        <div className="mt-1 space-y-1 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {item.subItems.map(sub => (
            <NavItem key={sub.path} item={sub} setOpen={setOpen} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ isOpen, setOpen }) => {
  const { user } = useAuth();
  
  const [prospectCount, setProspectCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [appointmentFollowupCount, setAppointmentFollowupCount] = useState(0);
  const [approvalCount, setApprovalCount] = useState(0);
  const [paymentPendingCount, setPaymentPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const token = user.token;

    const fetchStats = () => {
      // ── Approvals (Combined Orders + Payments)
      if (['ADMIN', 'MD_CEO', 'SALES_MANAGER', 'SR_SALES_MANAGER', 'SALES_EXEC', 'SR_SALES_EXEC'].includes(user.role)) {
        approvalApi.stats(token).then(res => {
          if (res.success) setApprovalCount(res.pendingCount);
        }).catch(console.error);
      }

      // ── Pending Payments (Accountant dashboard badge)
      if (['ACCOUNTS', 'ADMIN', 'MD_CEO', 'SALES_MANAGER', 'SR_SALES_MANAGER'].includes(user.role)) {
        paymentApi.pending(token).then(res => {
          if (res.success) setPaymentPendingCount(res.count || res.data?.length || 0);
        }).catch(console.error);
      }

      // ── Appointments
      if (['ADMIN', 'MD_CEO', 'SALES_MANAGER', 'SR_SALES_MANAGER', 'FIELD_EXEC', 'SALES_EXEC', 'SR_SALES_EXEC', 'AGENT'].includes(user.role)) {
        if (['ADMIN', 'MD_CEO', 'SALES_MANAGER', 'SR_SALES_MANAGER'].includes(user.role)) {
          appointmentApi.stats(token).then(res => {
            if (res.success) setAppointmentCount(res.pendingCount);
          }).catch(console.error);
        } else {
          appointmentApi.list(token).then(res => {
            if (res.success) setAppointmentCount(res.data.filter(a => !a.remark).length);
          }).catch(console.error);
        }
      }

      // ── Follow-ups (Sales/Field Exec only)
      if (['SALES_EXEC', 'SR_SALES_EXEC', 'FIELD_EXEC'].includes(user.role)) {
        prospectApi.list({}, token).then(res => {
          if (res.success) setProspectCount(res.data.filter(p => p.nextFollowUpDate && p.stage !== 'Won' && p.stage !== 'Lost' && p.status !== 'Canceled' && p.status !== 'Order Confirmed' && p.status !== 'Sale Confirmed').length);
        }).catch(console.error);
        
        orderApi.list({}, token).then(res => {
          if (res.success) setOrderCount(res.data.length);
        }).catch(console.error);

        appointmentApi.list(token).then(res => {
          if (res.success) {
            setAppointmentFollowupCount(res.data.filter(a => a.status !== 'SALE_CONFIRMED' && a.status !== 'LOST' && a.status !== 'CANCELLED').length);
          }
        }).catch(console.error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [user]);

  

  const isSalesOrFieldExec = ['SALES_EXEC', 'SR_SALES_EXEC', 'FIELD_EXEC'].includes(user.role);
  const isAccountant = user.role === 'ACCOUNTS';

  const dynamicExecMenu = [
    { title: 'Dashboard',     icon: LayoutDashboard, path: '/',            badge: null },
    ...(user.role === 'FIELD_EXEC' ? [{ title: 'Field Visits', icon: Truck, path: '/field', badge: null }] : []),
    { title: 'Prospects',     icon: Users,           path: '/prospects',   badge: null },
    { 
      title: 'Follow-ups',    
      icon: Clock,           
      path: '/followups',   
      badge: prospectCount + orderCount + appointmentFollowupCount > 0 ? (prospectCount + orderCount + appointmentFollowupCount).toString() : null,
      subItems: [
        { title: 'Prospect Follow-ups', path: '/followups?tab=prospects', icon: Users, badge: prospectCount || null },
        { title: 'Order Follow-ups', path: '/followups?tab=orders', icon: ShoppingCart, badge: orderCount || null },
        { title: 'Appointment Follow-ups', path: '/followups?tab=appointments', icon: Calendar, badge: appointmentFollowupCount || null }
      ]
    },
    { title: 'Appointments',  icon: Calendar,        path: '/appointments',badge: appointmentCount > 0 ? appointmentCount.toString() : null },
    { title: 'Orders',        icon: ShoppingCart,    path: '/orders',      badge: null },
    { title: 'Approvals',     icon: ShieldCheck,     path: '/approvals',   badge: approvalCount > 0 ? approvalCount.toString() : null },
    { title: 'Catalog',       icon: FileText,        path: '/brochures',   badge: null },
    { title: 'Quotations',    icon: Quote,           path: '/quotations',  badge: null },
    { title: 'Leaves',        icon: Calendar,        path: '/payments',    badge: null },
    { title: 'Performance',   icon: BarChart2,       path: '/performance', badge: null },
    { title: 'Settings',      icon: Settings,        path: '/settings',    badge: null },
  ];

  const dynamicAccountantMenu = [
    { title: 'Dashboard',     icon: LayoutDashboard, path: '/',           badge: null },
    { title: 'Orders',        icon: ShoppingCart,    path: '/orders',     badge: null },
    { title: 'Payments',      icon: IndianRupee,     path: '/approvals',  badge: paymentPendingCount > 0 ? paymentPendingCount.toString() : null },
    { title: 'Tasks',         icon: CheckSquare,     path: '/tasks',      badge: null },
    { title: 'Settings',      icon: Settings,        path: '/settings',   badge: null },
  ];

  const dynamicDesignerMenu = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/design' },
    { 
      title: 'My Work', 
      icon: CheckSquare, 
      path: '/design/work',
      subItems: [
        { title: 'Assigned Services', path: '/design/work?tab=assigned', icon: FileText },
        { title: 'In Progress', path: '/design/work?tab=progress', icon: Clock },
        { title: 'Waiting Client Response', path: '/design/work?tab=waiting', icon: Clock },
        { title: 'Revisions', path: '/design/work?tab=revisions', icon: FileText },
        { title: 'Completed Services', path: '/design/work?tab=completed', icon: CheckSquare }
      ]
    },
    { 
      title: 'Service Workflow', 
      icon: Target, 
      path: '/design/workflow'
    },
    { 
      title: 'Design Assets', 
      icon: Palette, 
      path: '/design/assets',
      subItems: [
        { title: 'Logos', path: '/design/assets?category=Logos', icon: ImageIcon },
        { title: 'Templates', path: '/design/assets?category=Templates', icon: FileText },
        { title: 'Fonts', path: '/design/assets?category=Fonts', icon: FileText },
        { title: 'Brand Kits', path: '/design/assets?category=Brand+Kits', icon: Palette },
        { title: 'Approved Designs Archive', path: '/design/work?tab=completed', icon: Package }
      ]
    },
    { 
      title: 'Communication', 
      icon: Megaphone, 
      path: '/design/communications',
      subItems: [
        { title: 'Client Interactions', path: '/design/communications/client', icon: Users },
        { title: 'Approval Proofs', path: '/design/communications/proofs', icon: ShieldCheck }
      ]
    },
    { 
      title: 'Reports', 
      icon: BarChart2, 
      path: '/design/reports',
      subItems: [
        { title: 'My Performance', path: '/design/reports/performance', icon: Target },
        { title: 'Productivity', path: '/design/reports/productivity', icon: BarChart2 }
      ]
    },
    { title: 'Notifications', icon: Bell, path: '/design/notifications' },
    { title: 'Profile', icon: Settings, path: '/settings' }
  ];

  const dynamicProductionManagerMenu = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/production/manager' },
    { 
      title: 'Production Management', 
      icon: Target, 
      path: '/production/manager/management',
      subItems: [
        { title: 'Production Queue', path: '/production/manager/queue', icon: Target },
        { title: 'Active (Printing)', path: '/production/manager/printing', icon: Clock },
        { title: 'Quality Control', path: '/production/manager/qc', icon: ShieldCheck },
        { title: 'Issues & Delayed', path: '/production/manager/issues', icon: AlertCircle }
      ]
    },
    { title: 'Completed Jobs', path: '/production/manager/completed', icon: Briefcase },
    { 
      title: 'Design & Files', 
      icon: Palette, 
      path: '/production/manager/designs',
      subItems: [
        { title: 'Approved Designs', path: '/production/manager/designs/approved', icon: FileText },
        { title: 'Production Assets', path: '/production/manager/assets', icon: Package }
      ]
    },
    { title: 'Service Handover', icon: Truck, path: '/production/manager/handover' },
    { title: 'Reports', icon: BarChart2, path: '/production/manager/reports' },
    { title: 'Notifications', icon: Bell, path: '/production/manager/notifications' },
    { title: 'Profile', icon: Settings, path: '/settings' }
  ];

  const dynamicProductionExecMenu = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/production/executive' },
    { 
      title: 'My Production Work', 
      icon: CheckSquare, 
      path: '/production/executive/work',
      subItems: [
        { title: 'Assigned Jobs', path: '/production/executive/assigned', icon: FileText },
        { title: 'Active Production', path: '/production/executive/active', icon: Clock },
        { title: 'Completed Tasks', path: '/production/executive/completed', icon: CheckSquare }
      ]
    },
    { title: 'Design & Files', icon: Palette, path: '/production/executive/designs' },
    { title: 'Issue Reporting', icon: Megaphone, path: '/production/executive/issues' },
    { title: 'Quantity Tracking', icon: BarChart2, path: '/production/executive/quantity' },
    { title: 'Notifications', icon: Bell, path: '/production/executive/notifications' },
    { title: 'Profile', icon: Settings, path: '/settings' }
  ];

  const dynamicServiceManagerMenu = [
    { 
      title: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/service/manager',
      subItems: [
        { title: 'Service Overview', path: '/service/manager/overview', icon: LayoutDashboard },
        { title: 'Due Today', path: '/service/manager/due-today', icon: Clock },
        { title: 'Overdue Services', path: '/service/manager/overdue', icon: AlertCircle },
        { title: 'Delivery Risk Alerts', path: '/service/manager/risks', icon: ShieldCheck }
      ]
    },
    { 
      title: 'Service Management', 
      icon: Target, 
      path: '/service/manager/management',
      subItems: [
        { title: 'Service Queue', path: '/service/manager/queue', icon: Target },
        { title: 'Scheduled Services', path: '/service/manager/scheduled', icon: Calendar },
        { title: 'Active Services', path: '/service/manager/active', icon: Clock },
        { title: 'Delayed Services', path: '/service/manager/delayed', icon: AlertCircle },
        { title: 'Completed Services', path: '/service/manager/completed', icon: CheckSquare }
      ]
    },
    { 
      title: 'Resource Management', 
      icon: Users, 
      path: '/service/manager/resources',
      subItems: [
        { title: 'Labour Management', path: '/service/manager/labour', icon: Users },
        { title: 'Vendor Management', path: '/service/manager/vendors', icon: Truck },
        { title: 'Vehicle Management', path: '/service/manager/vehicles', icon: Truck }
      ]
    },
    { 
      title: 'Field Operations', 
      icon: MapPin, 
      path: '/service/manager/field',
      subItems: [
        { title: 'Site Visits', path: '/service/manager/site-visits', icon: MapPin },
        { title: 'Installation Tracking', path: '/service/manager/tracking', icon: Activity || FileText },
        { title: 'Client Confirmations', path: '/service/manager/confirmations', icon: CheckCircle },
        { title: 'Service Proofs', path: '/service/manager/proofs', icon: ImageIcon }
      ]
    },
    { 
      title: 'Reports & Analytics', 
      icon: BarChart2, 
      path: '/service/manager/reports',
      subItems: [
        { title: 'Service Performance', path: '/service/manager/reports/service', icon: BarChart2 },
        { title: 'Labour Performance', path: '/service/manager/reports/labour', icon: Users },
        { title: 'Vendor Performance', path: '/service/manager/reports/vendor', icon: Truck },
        { title: 'Delivery Compliance', path: '/service/manager/reports/compliance', icon: CheckCircle },
        { title: 'Delay Analysis', path: '/service/manager/reports/delays', icon: AlertCircle }
      ]
    },
    { 
      title: 'Notifications', 
      icon: Bell, 
      path: '/service/manager/notifications',
      subItems: [
        { title: 'Alerts', path: '/service/manager/alerts', icon: Bell },
        { title: 'Escalations', path: '/service/manager/escalations', icon: AlertCircle }
      ]
    }
  ];

  const dynamicServiceExecMenu = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/service/executive' },
    { title: 'My Tasks', icon: CheckSquare, path: '/service/executive/tasks' },
    { title: 'Active Services', icon: Clock, path: '/service/executive/active' },
    { title: 'Completed Services', icon: CheckCircle, path: '/service/executive/completed' },
    { title: 'Upload Proofs', icon: ImageIcon, path: '/service/executive/proofs' },
    { title: 'Client Confirmation', icon: CheckCircle, path: '/service/executive/confirmation' },
    { title: 'Notifications', icon: Bell, path: '/service/executive/notifications' },
    { title: 'Profile', icon: Settings, path: '/settings' }
  ];

  const dynamicHRMenu = [
    { title: 'Dashboard', path: '/hr/dashboard', icon: LayoutDashboard },
    { title: 'Employees', path: '/hr/employees', icon: Users },
    { title: 'Recruitment', path: '/hr/recruitment', icon: UserPlus },
    { title: 'Documents', path: '/hr/documents', icon: FileText },
    { title: 'Compensation', path: '/hr/compensation', icon: IndianRupee },
    { title: 'Attendance', path: '/hr/attendance', icon: Calendar },
    { title: 'Leave Management', path: '/hr/leave', icon: Calendar },
    { title: 'Performance', path: '/hr/performance', icon: BarChart2 },
    { title: 'Training', path: '/hr/training', icon: CheckSquare },
    { title: 'Exit Mgmt', path: '/hr/exit', icon: Users },
    { title: 'Reports', path: '/hr/reports', icon: PieChart },
    { title: 'Settings', icon: Settings, path: '/settings' }
  ];

  const isSalesManager = user.role === 'SALES_MANAGER' || user.role === 'SR_SALES_MANAGER';
  const isAdminOrCeo = user.role === 'ADMIN' || user.role === 'MD_CEO';

  const smMyWorkMenu = [
    { title: 'Dashboard',     icon: LayoutDashboard, path: '/manager',            badge: null },
    { title: 'Prospects',     icon: Users,           path: '/prospects',   badge: null },
    { 
      title: 'Follow-ups',    
      icon: Clock,           
      path: '/followups',   
      badge: prospectCount + orderCount + appointmentFollowupCount > 0 ? (prospectCount + orderCount + appointmentFollowupCount).toString() : null,
      subItems: [
        { title: 'Prospect Follow-ups', path: '/followups?tab=prospects', icon: Users, badge: prospectCount || null },
        { title: 'Order Follow-ups', path: '/followups?tab=orders', icon: ShoppingCart, badge: orderCount || null },
        { title: 'Appointment Follow-ups', path: '/followups?tab=appointments', icon: Calendar, badge: appointmentFollowupCount || null }
      ]
    },
    { title: 'Appointments',  icon: Calendar,        path: '/appointments',badge: appointmentCount > 0 ? appointmentCount.toString() : null },
    { title: 'Orders',        icon: ShoppingCart,    path: '/orders',      badge: null },
    { title: 'Approvals',     icon: ShieldCheck,     path: '/manager/my-approvals',   badge: approvalCount > 0 ? approvalCount.toString() : null },
    { title: 'Catalog',       icon: FileText,        path: '/brochures',   badge: null },
    { title: 'Quotations',    icon: Quote,           path: '/quotations',  badge: null },
    { title: 'Leaves',        icon: Calendar,        path: '/payments',    badge: null },
    { title: 'Performance',   icon: BarChart2,       path: '/performance', badge: null }
  ];

  const smTeamMenu = [
    { 
      title: 'Team Follow-ups', 
      icon: Clock,         
      path: '/manager/team-followups',
      subItems: [
        { title: 'Team Prospect Follow-ups', path: '/manager/team-followups?tab=prospects', icon: Users },
        { title: 'Team Order Follow-ups', path: '/manager/team-followups?tab=orders', icon: ShoppingCart },
        { title: 'Team Appointment Follow-ups', path: '/manager/team-followups?tab=appointments', icon: Calendar }
      ]
    },
    { title: 'Team Approvals',  icon: ShieldCheck,   path: '/manager/team-approvals' },
    { title: 'Team Appointments', icon: Calendar,    path: '/manager/team-appointments' },
    { title: 'Team Prospects',  icon: Users,         path: '/manager/team-prospects' },
    { title: 'Team Orders',     icon: ShoppingCart,  path: '/manager/team-orders' },
    { title: 'Team Catalogue Usage', icon: FileText, path: '/manager/team-catalogue' },
    { title: 'Team Quotations', icon: Quote,         path: '/manager/team-quotations' },
    { title: 'Team Leaves',     icon: Calendar,      path: '/manager/team-leaves' },
    { title: 'Team Performance',icon: BarChart2,     path: '/manager/team-performance' },
    { title: 'Team Targets',    icon: Target,        path: '/manager/team-targets' },
    { title: 'Escalations',     icon: Eye,           path: '/manager/escalations' },
    { title: 'Lead Allocation', icon: UserPlus,      path: '/manager/lead-allocation' },
  ];

  const permissionMapping = {
    'Target Assignment': 'TARGET_ASSIGNMENT',
    'Order Verification': 'ORDER_VERIFICATION',
    'Task Assignments': 'TASK_ASSIGNMENT',
    'Vendor Management': 'VENDOR_MANAGEMENT',
    'Quotation Management': 'QUOTATION_MANAGEMENT',
    'Payment Verification': 'PAYMENT_VERIFICATION',
    'Advance Payment Approvals': 'ADVANCE_APPROVAL',
    'Sales Reports': 'REPORTS_ACCESS',
    'Revenue Reports': 'REPORTS_ACCESS',
    'Product Catalog': 'INVENTORY_CATALOG',
    'Cost Master': 'INVENTORY_CATALOG',
    'Catalogs': 'INVENTORY_CATALOG',
    'Team Performance': 'REPORTS_ACCESS',
    'Workflow Reports': 'REPORTS_ACCESS',
    'Conversion Analytics': 'REPORTS_ACCESS',
  };

  const userPermKeys = user?.permissions?.map(p => p.key) || [];
  let dynamicPermissionsModules = [];

  if (!isAdminOrCeo && userPermKeys.length > 0) {
    adminMenuConfig.forEach(adminModule => {
      if (adminModule.subItems) {
        const permittedSubItems = adminModule.subItems.filter(sub => {
           const requiredPerm = permissionMapping[sub.title];
           return requiredPerm && userPermKeys.includes(requiredPerm);
        });
        
        if (permittedSubItems.length > 0) {
          // Avoid duplicating badge injection logic by reusing it here if needed,
          // but mostly these are simple links.
          dynamicPermissionsModules.push({
            ...adminModule,
            subItems: permittedSubItems
          });
        }
      }
    });
  }

  const filteredMenu = isAdminOrCeo 
    ? adminMenuConfig.map(item => {
        // Inject badges if needed
        if (item.title === 'Finance') {
          return {
            ...item,
            subItems: item.subItems.map(sub => {
              if (sub.title === 'Payment Verification') return { ...sub, badge: paymentPendingCount > 0 ? paymentPendingCount.toString() : null };
              if (sub.title === 'Advance Payment Approvals') return { ...sub, badge: approvalCount > 0 ? approvalCount.toString() : null };
              return sub;
            })
          };
        }
        if (item.title === 'Operations') {
          return {
            ...item,
            subItems: item.subItems.map(sub => {
              if (sub.title === 'Order Verification') return { ...sub, badge: approvalCount > 0 ? approvalCount.toString() : null }; // Shared badge for now
              return sub;
            })
          };
        }
        return item;
      })
    : isSalesOrFieldExec
    ? dynamicExecMenu
    : isAccountant
    ? dynamicAccountantMenu
    : user.role === 'DESIGNER'
    ? dynamicDesignerMenu
    : user.role === 'PRODUCTION_MANAGER'
    ? dynamicProductionManagerMenu
    : user.role === 'PRODUCTION_EXEC'
    ? dynamicProductionExecMenu
    : user.role === 'SERVICE_MANAGER'
    ? dynamicServiceManagerMenu
    : user.role === 'SERVICE_EXEC'
    ? dynamicServiceExecMenu
    : user.role === 'HR'
    ? dynamicHRMenu
    : menuConfig
        .filter(item => item.roles.includes('ALL') || item.roles.includes(user.role))
        .map(item => {
          // Inject badges into main menuConfig items for Managers
          if (item.title === 'Approvals') return { ...item, badge: approvalCount > 0 ? approvalCount.toString() : null };
          if (item.title === 'Appointments') return { ...item, badge: appointmentCount > 0 ? appointmentCount.toString() : null };
          return item;
        });

  
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`w-64 min-w-[256px] flex flex-col h-full border-r bg-card relative z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'max-lg:-translate-x-full max-lg:fixed max-lg:inset-y-0 max-lg:left-0'}`}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
              G
            </div>
            <span className="font-bold text-[17px] tracking-tight">GMS Ad Agency</span>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {isSalesManager ? (
            <>
              <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground px-3 mb-3 mt-2">
                My Work
              </p>
              {smMyWorkMenu.map((item) => (
                <NavItem key={item.title} item={item} setOpen={setOpen} />
              ))}
              <div className="h-4"></div>
              <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground px-3 mb-3 mt-4 border-t pt-6">
                Team Data
              </p>
              {smTeamMenu.map((item) => (
                <NavItem key={item.title} item={item} setOpen={setOpen} />
              ))}
              <div className="h-4"></div>
              <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground px-3 mb-3 mt-4 border-t pt-6">
                System
              </p>
              <NavItem item={{ title: 'Settings', icon: Settings, path: '/settings' }} setOpen={setOpen} />
              
              {dynamicPermissionsModules.length > 0 && (
                <>
                  <div className="h-4"></div>
                  <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-indigo-500 px-3 mb-3 mt-4 border-t pt-6">
                    Authorized Access
                  </p>
                  {dynamicPermissionsModules.map((item) => (
                    <NavItem key={'auth_'+(item.path || item.title)} item={item} setOpen={setOpen} />
                  ))}
                </>
              )}
            </>
          ) : (
            <>
              <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground px-3 mb-3">
                {isSalesOrFieldExec ? 'Execution' : isAccountant ? 'Accounts & Finance' : 'Menu'}
              </p>
              {filteredMenu.map((item) => (
                <NavItem key={item.path || item.title} item={item} setOpen={setOpen} />
              ))}
              {dynamicPermissionsModules.length > 0 && (
                <>
                  <div className="h-4"></div>
                  <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-indigo-500 px-3 mb-3 mt-4 border-t pt-6">
                    Authorized Access
                  </p>
                  {dynamicPermissionsModules.map((item) => (
                    <NavItem key={'auth_'+(item.path || item.title)} item={item} setOpen={setOpen} />
                  ))}
                </>
              )}
            </>
          )}
        </nav>

        <div className="p-4 border-t shrink-0">
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground border">
            Signed in as <strong className="text-foreground">{(user.role || '').replace(/_/g, ' ')}</strong>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
