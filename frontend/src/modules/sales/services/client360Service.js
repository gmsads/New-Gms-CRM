import { useAuth } from '../../../context/AuthContext';
import { useState, useCallback } from 'react';

export const useClient360 = () => {
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const buildQuery = (params) => {
    const parts = [];
    for (const [key, value] of Object.entries(params)) {
      if (value) parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
    return parts.length > 0 ? `?${parts.join('&')}` : '';
  };

  const fetchLedger = useCallback(async (phone, company = null) => {
    setLoading(true);
    try {
      const q = buildQuery({ company });
      const response = await authFetch(`/clients/mobile/${phone}/ledger${q}`);
      const res = await response.json();
      if (res.success) return res.data;
      throw new Error(res.message || 'Error fetching ledger');
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  const fetchPaginated = useCallback(async (phone, endpoint, page = 1, limit = 10, company = null) => {
    setLoading(true);
    try {
      const q = buildQuery({ page, limit, company });
      const response = await authFetch(`/clients/mobile/${phone}/${endpoint}${q}`);
      const res = await response.json();
      if (res.success) return res;
      throw new Error(res.message || `Error fetching ${endpoint}`);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  return {
    loading,
    error,
    fetchLedger,
    fetchPaginated
  };
};
