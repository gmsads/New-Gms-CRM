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
      let json = {};
      const text = await res.text();
      if (text) {
        try {
          json = JSON.parse(text);
        } catch (e) {
          json = { message: text };
        }
      }
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('gms_user');
          window.location.href = '/login';
          return;
        }
        setError(json.message || `HTTP ${res.status}`);
        return;
      }
      setData(json);
      return json;
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
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
    let json = {};
    const text = await res.text();
    if (text) {
      try {
        json = JSON.parse(text);
      } catch (e) {
        json = { message: text };
      }
    }
    if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
    return json;
  }, [token]);

  return { data, loading, error, refetch: fetchData, request };
};

export default useApi;
