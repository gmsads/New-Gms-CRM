import React from 'react';
import { Bell, Search, Menu, LogOut, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ROLE_COLORS = {
  MD_CEO:           '#7c3aed',
  ADMIN:            '#dc2626',
  SALES_EXEC:       '#1d4ed8',
  SALES_MANAGER:    '#0369a1',
  FIELD_EXEC:       '#15803d',
  HR:               '#b45309',
  DESIGNER:         '#db2777',
  OPERATION_EXEC:   '#0f766e',
  OPERATION_MANAGER:'#0e7490',
  AGENT:            '#6d28d9',
  VENDOR:           '#92400e',
  IT:               '#374151',
  ACCOUNTS:         '#be185d',
};

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const initials = user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const roleColor = ROLE_COLORS[user.role] || '#1d4ed8';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header style={{
      display: 'flex', height: 64, flexShrink: 0,
      alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid hsl(var(--border))',
      background: 'hsl(var(--card) / 0.95)',
      padding: '0 24px', backdropFilter: 'blur(8px)',
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onMenuClick} className="lg:hidden"
          style={{ padding: 6, borderRadius: 6, color: 'hsl(var(--muted-foreground))', cursor: 'pointer', background: 'transparent', border: 'none' }}>
          <Menu style={{ width: 20, height: 20 }} />
        </button>
        {/* <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: 14 }}>G</div>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em' }}>GMS</span>
        </div> */}
        {/* <div style={{ width: 1, height: 20, background: 'hsl(var(--border))' }} /> */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search style={{ position: 'absolute', left: 10, width: 14, height: 14, color: 'hsl(var(--muted-foreground))' }} />
          <input type="search" placeholder="Search..."
            style={{ height: 34, width: 200, paddingLeft: 30, paddingRight: 12, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted)/0.5)', fontSize: 13, outline: 'none', color: 'hsl(var(--foreground))' }} />
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Bell */}
        <button style={{ position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', padding: 6, borderRadius: 6 }}>
          <Bell style={{ width: 18, height: 18 }} />
          <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '1.5px solid white' }} />
        </button>

        <div style={{ width: 1, height: 20, background: 'hsl(var(--border))' }} />

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Avatar */}
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: roleColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
            border: `2px solid ${roleColor}40`,
          }}>
            {initials}
          </div>
          {/* Name + role */}
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: roleColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {user.role?.replace(/_/g, ' ')} · {user.username}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Logout"
          style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: 'transparent', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <LogOut style={{ width: 13, height: 13 }} /> Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
