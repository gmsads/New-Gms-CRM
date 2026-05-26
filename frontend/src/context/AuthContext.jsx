import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const ROLES = {
  MD_CEO:             'MD_CEO',
  ADMIN:              'ADMIN',
  SALES_EXEC:         'SALES_EXEC',
  SALES_MANAGER:      'SALES_MANAGER',
  FIELD_EXEC:         'FIELD_EXEC',
  HR:                 'HR',
  DESIGNER:           'DESIGNER',
  OPERATION_EXEC:     'OPERATION_EXEC',
  OPERATION_MANAGER:  'OPERATION_MANAGER',
  AGENT:              'AGENT',
  VENDOR:             'VENDOR',
  IT:                 'IT',
  ACCOUNTS:           'ACCOUNTS',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // checking localStorage on mount
  const [error, setError]     = useState(null);

  // ── Restore session from localStorage on mount ──────────────────
  useEffect(() => {
    const stored = localStorage.getItem('gms_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  // ── Login ────────────────────────────────────────────────────────
  const login = useCallback(async (loginId, password) => {
    setError(null);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ login: loginId, password }),
      });
      let data = {};
      const text = await res.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = { message: text };
        }
      }
      if (!res.ok) throw new Error(data.message || 'Login failed.');

      localStorage.setItem('gms_user', JSON.stringify(data));
      setUser(data);
      return { success: true, mustChangePassword: data.mustChangePassword };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // ── Logout ───────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('gms_user');
    setUser(null);
  }, []);

  // ── Change password (first-login or voluntary) ───────────────────
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    setError(null);
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      let data = {};
      const text = await res.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = { message: text };
        }
      }
      if (!res.ok) throw new Error(data.message || 'Failed to change password.');

      // Clear mustChangePassword flag locally
      const updated = { ...user, mustChangePassword: false };
      localStorage.setItem('gms_user', JSON.stringify(updated));
      setUser(updated);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [user]);

  // ── Refresh profile from server ──────────────────────────────────
  const refreshProfile = useCallback(async () => {
    if (!user?.token) return;
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      if (res.ok) {
        let data = {};
        const text = await res.text();
        if (text) {
          try {
            data = JSON.parse(text);
          } catch (e) {
            data = { message: text };
          }
        }
        const updated = { ...user, ...data };
        localStorage.setItem('gms_user', JSON.stringify(updated));
        setUser(updated);
      }
    } catch {}
  }, [user]);

  // ── Convenience: authenticated fetch ────────────────────────────
  const authFetch = useCallback((url, options = {}) => {
    return fetch(`${API}${url}`, {
      ...options,
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${user?.token}`,
        ...(options.headers || {}),
      },
    });
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, loading, error,
      login, logout, changePassword, refreshProfile, authFetch,
      ROLES,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
