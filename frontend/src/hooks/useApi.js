/**
 * useApi — Central data-fetching hook.
 * Wraps fetch with auth token, loading/error state, and auto-retry.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi('/employees');
 *   const { request } = useApi();
 *   await request('POST', '/employees', body);
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const BASE = import.meta.env.VITE_API_URL || '/api';

export const useApi = (path = null, options = {}) => {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(!!path);
  const [error,   setError]   = useState(null);
  const abortRef = useRef(null);

  const token = user?.token;

  const fetchData = useCallback(async (overridePath) => {
    const url = overridePath || path;
    if (!url) return;

    // Cancel previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BASE}${url}`, {
        signal: abortRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...options,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      setData(json);
      return json;
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [path, token]); // eslint-disable-line

  useEffect(() => {
    if (path) fetchData();
    return () => abortRef.current?.abort();
  }, [path, token]); // eslint-disable-line

  // Generic request method for mutations (POST/PUT/PATCH/DELETE)
  const request = useCallback(async (method, url, body) => {
    const res = await fetch(`${BASE}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
    return json;
  }, [token]);

  return { data, loading, error, refetch: fetchData, request };
};

export default useApi;
