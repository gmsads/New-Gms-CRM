import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Megaphone, CheckSquare, Settings,
  PieChart, Briefcase, FileText, Palette, Truck, Server, X, ShieldCheck,
  Clock, ShoppingCart, Calendar, IndianRupee, BarChart2, Search,
  ChevronDown, ChevronRight, UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { prospectApi, orderApi, appointmentApi } from '../../services/api';

const menuConfig = [
  { title: 'Dashboard',        icon: LayoutDashboard, path: '/',          roles: ['ALL'] },
  { title: 'Clients & Leads',  icon: Users,           path: '/clients',   roles: ['ADMIN','SALES_MANAGER','AGENT'] },
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
      { title: 'Attendance',  path: '/hr/attendance',  icon: Calendar },
      { title: 'Payroll',     path: '/hr/payroll',     icon: IndianRupee },
      { title: 'Performance', path: '/hr/performance', icon: BarChart2 }
    ]
  },
  { title: 'HR Control Panel', icon: ShieldCheck,     path: '/admin-hr',  roles: ['ADMIN','MD_CEO'] },
  { title: 'Vendor Portal',    icon: FileText,        path: '/vendors',   roles: ['ADMIN','VENDOR','OPERATION_MANAGER'] },
  { title: 'Analytics',        icon: PieChart,        path: '/analytics', roles: ['ADMIN','SALES_MANAGER','OPERATION_MANAGER'] },
  { title: 'IT & Systems',     icon: Server,          path: '/it',        roles: ['ADMIN','IT'] },
  { title: 'Settings',         icon: Settings,        path: '/settings',  roles: ['ALL'] },
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

  useEffect(() => {
    if (user?.role === 'SALES_EXEC') {
      prospectApi.list({}, user.token).then(res => {
        if (res.success) setProspectCount(res.data.filter(p => p.status === 'In-progress' && p.nextFollowUpDate).length);
      }).catch(console.error);
      
      orderApi.list({}, user.token).then(res => {
        if (res.success) setOrderCount(res.data.length);
      }).catch(console.error);

      appointmentApi.list(user.token).then(res => {
        if (res.success) setAppointmentCount(res.data.filter(a => !a.remark).length);
      }).catch(console.error);
    }
  }, [user]);

  if (!user) return null;

  const isSalesExec = user.role === 'SALES_EXEC';

  const dynamicSalesExecMenu = [
    { title: 'Dashboard',     icon: LayoutDashboard, path: '/',            badge: null },
    { title: 'Prospects',     icon: Users,           path: '/prospects',   badge: null },
    { 
      title: 'Follow-ups',    
      icon: Clock,           
      path: '/followups',   
      badge: prospectCount + orderCount > 0 ? (prospectCount + orderCount).toString() : null,
      subItems: [
        { title: 'Prospect Follow-ups', path: '/followups?tab=prospects', icon: Users, badge: prospectCount || null },
        { title: 'Order Follow-ups', path: '/followups?tab=orders', icon: ShoppingCart, badge: orderCount || null }
      ]
    },
    { title: 'Appointments',  icon: Calendar,        path: '/appointments',badge: appointmentCount > 0 ? appointmentCount.toString() : null },
    { title: 'Orders',        icon: ShoppingCart,    path: '/orders',      badge: null },
    { title: 'Payments',      icon: IndianRupee,      path: '/payments',    badge: null },
    { title: 'Performance',   icon: BarChart2,       path: '/performance', badge: null },
    { title: 'Settings',      icon: Settings,        path: '/settings',    badge: null },
  ];

  const filteredMenu = isSalesExec
    ? dynamicSalesExecMenu
    : menuConfig.filter(item => item.roles.includes('ALL') || item.roles.includes(user.role));

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
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground px-3 mb-3">
            {isSalesExec ? 'Sales Execution' : 'Menu'}
          </p>
          {filteredMenu.map((item) => (
            <NavItem key={item.path} item={item} setOpen={setOpen} />
          ))}
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
