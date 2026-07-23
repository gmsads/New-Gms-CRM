import React, { useState } from 'react';
import { Bell, Search, Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCompanyProfile } from '../../context/CompanyProfileContext';
import { useNavigate, Link } from 'react-router-dom';
import { getRoleDashboardPath } from './Sidebar';

const ROLE_COLORS = {
  MD_CEO:           '#7c3aed',
  CEO:              '#7c3aed',
  COO:              '#6366f1',
  BRANCH_HEAD:      '#3b82f6',
  ADMIN:            '#dc2626',
  SALES_EXEC:       '#1d4ed8',
  SALES_MANAGER:    '#0369a1',
  FIELD_EXEC:       '#15803d',
  HR:               '#b45309',
  DESIGNER:         '#db2777',
  OPERATION_EXEC:   '#0f766e',
  OPERATION_MANAGER:'#0e7490',
  PRODUCTION_EXEC:  '#ea580c',
  PRODUCTION_MANAGER:'#c2410c',
  AGENT:            '#6d28d9',
  VENDOR:           '#92400e',
  IT:               '#374151',
  ACCOUNTS:         '#be185d',
};

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { profile } = useCompanyProfile();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const initials = user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const roleColor = ROLE_COLORS[user.role] || '#1d4ed8';

  const handleLogout = () => { 
    logout(); 
    navigate('/login'); 
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/95 px-2 sm:px-4 md:px-6 backdrop-blur-sm sticky top-0 z-40">
      {/* Left */}
      <div className="flex items-center gap-1 sm:gap-3 flex-1 md:flex-none overflow-hidden">
        <button onClick={onMenuClick} className="md:hidden p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted/50 transition-colors active:scale-95 shrink-0" aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>
        <Link to={getRoleDashboardPath(user?.role)} className="md:hidden flex items-center cursor-pointer ml-1 shrink-0">
          <img src={profile?.logoUrl || '/logo.png'} alt={profile?.companyName || 'CRM Logo'} className="h-8 sm:h-10 w-auto object-contain" />
        </Link>
        <div className="relative hidden sm:flex flex-1 max-w-[200px] items-center">
          <Search className="absolute left-3 w-3.5 h-3.5 text-muted-foreground" />
          <input type="search" placeholder="Search..."
            className="h-[34px] w-full pl-8 pr-3 rounded-lg border border-border bg-muted/50 text-[13px] outline-none text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/20" />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 sm:gap-3 md:gap-4 relative shrink-0">
        {/* Search Mobile (Optional Icon) */}
        <button className="sm:hidden relative text-muted-foreground p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors active:scale-95 shrink-0" aria-label="Search">
          <Search className="w-5 h-5" />
        </button>

        {/* Bell */}
        <button className="relative text-muted-foreground p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors active:scale-95 shrink-0" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 border-[1.5px] border-white" />
        </button>

        <div className="w-[1px] h-5 bg-border hidden md:block shrink-0" />

        {/* Desktop Profile Info (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {/* Avatar */}
          <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ background: roleColor, border: `2px solid ${roleColor}40` }}>
            {initials}
          </div>
          {/* Name + role */}
          <div className="leading-tight max-w-[120px]">
            <div className="text-[13px] font-semibold truncate">{user.name}</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.05em] truncate" style={{ color: roleColor }}>
              {user.role?.replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        {/* Mobile Profile Trigger (hidden on desktop) */}
        <button 
          className="md:hidden w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0 active:scale-95 transition-transform ml-1" 
          style={{ background: roleColor, border: `2px solid ${roleColor}40` }}
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          aria-label="Profile menu"
        >
          {initials}
        </button>

        {/* Desktop Logout Button (hidden on mobile) */}
        <button
          onClick={handleLogout}
          title="Logout"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors bg-transparent cursor-pointer shrink-0"
        >
          <LogOut className="w-[13px] h-[13px]" /> Logout
        </button>

        {/* Mobile Dropdown Menu Overlay */}
        {showProfileMenu && (
          <>
            {/* Invisible backdrop to close the menu when clicking outside */}
            <div className="fixed inset-0 z-[45] md:hidden" onClick={() => setShowProfileMenu(false)} />
            
            <div className="absolute top-full right-0 mt-2 w-[calc(100vw-1rem)] max-w-xs sm:w-56 bg-white rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] border border-slate-100 p-4 md:hidden flex flex-col gap-3 z-[50] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm" style={{ background: roleColor }}>
                  {initials}
                </div>
                <div className="flex flex-col overflow-hidden min-w-0">
                  <span className="text-sm font-bold text-slate-800 truncate">{user.name}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: roleColor }}>
                    {user.role?.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-slate-500 mt-0.5 font-medium truncate">{user.username}</span>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg text-sm font-bold transition-colors active:scale-95"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
