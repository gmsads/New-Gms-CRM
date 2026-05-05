/**
 * api.js — Central API service layer
 * All backend calls go through here.
 * Usage: import api from '../services/api';
 *        const data = await api.get('/prospects', token);
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const request = async (method, path, body, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.code   = data.code;
    throw err;
  }
  return data;
};

const api = {
  get:    (path, token)        => request('GET',    path, null, token),
  post:   (path, body, token)  => request('POST',   path, body, token),
  put:    (path, body, token)  => request('PUT',    path, body, token),
  patch:  (path, body, token)  => request('PATCH',  path, body, token),
  delete: (path, token)        => request('DELETE', path, null, token),
};

// ── Named endpoint helpers ────────────────────────────────────────────────────

// Auth
export const authApi = {
  login:          (login, password) => api.post('/auth/login', { login, password }),
  me:             (token)           => api.get('/auth/me', token),
  changePassword: (currentPassword, newPassword, token) =>
    api.post('/auth/change-password', { currentPassword, newPassword }, token),
  resetPassword:  (employeeId, token) =>
    api.post(`/auth/reset-password/${employeeId}`, {}, token),
};

// Employees (HR)
export const employeeApi = {
  list:           (params, token)   => api.get(`/employees?${new URLSearchParams(params)}`, token),
  get:            (id, token)       => api.get(`/employees/${id}`, token),
  create:         (data, token)     => api.post('/employees', data, token),
  update:         (id, data, token) => api.put(`/employees/${id}`, data, token),
  changeStatus:   (id, status, reason, token) =>
    api.put(`/employees/${id}/status`, { status, reason }, token),
  resetPassword:  (id, token)       =>
    api.post(`/employees/${id}/reset-password`, {}, token),
  delete:         (id, token)       => api.delete(`/employees/${id}`, token),
};

// Prospects (Sales)
export const prospectApi = {
  list:        (params, token)   => api.get(`/prospects?${new URLSearchParams(params)}`, token),
  searchPhone: (phone, token)    => api.get(`/prospects/search?phone=${phone}`, token),
  create:      (data, token)     => api.post('/prospects', data, token),
  update:      (id, data, token) => api.patch(`/prospects/${id}`, data, token),
  moveStage:   (id, data, token) => api.patch(`/prospects/${id}/stage`, data, token),
  delete:      (id, token)       => api.delete(`/prospects/${id}`, token),
};

// Follow-ups
export const followupApi = {
  list:     (params, token)   => api.get(`/followups?${new URLSearchParams(params)}`, token),
  create:   (data, token)     => api.post('/followups', data, token),
  complete: (id, data, token) => api.patch(`/followups/${id}/complete`, data, token),
};

// Quotations
export const quotationApi = {
  list:         (params, token)   => api.get(`/quotations?${new URLSearchParams(params)}`, token),
  create:       (data, token)     => api.post('/quotations', data, token),
  update:       (id, data, token) => api.patch(`/quotations/${id}`, data, token),
  updateStatus: (id, data, token) => api.patch(`/quotations/${id}/status`, data, token),
};

// Orders
export const orderApi = {
  list:           (params, token)   => api.get(`/orders?${new URLSearchParams(params)}`, token),
  searchClient:   (query, token)    => api.get(`/orders/search?q=${encodeURIComponent(query)}`, token),
  get:            (id, token)       => api.get(`/orders/${id}`, token),
  stats:          (token)           => api.get('/orders/stats', token),
  create:         (data, token)     => api.post('/orders', data, token),
  confirm:        (id, token)       => api.post(`/orders/${id}/confirm`, {}, token),
  updateStatus:   (id, data, token) => api.patch(`/orders/${id}/status`, data, token),
  approveAdvance: (id, token)       => api.post(`/orders/${id}/approve-advance`, {}, token),
};

// Payments
export const paymentApi = {
  list:     (params, token)   => api.get(`/payments?${new URLSearchParams(params)}`, token),
  pending:  (token)           => api.get('/payments/pending', token),
  get:      (id, token)       => api.get(`/payments/${id}`, token),
  create:   (data, token)     => api.post('/payments', data, token),
  verify:   (id, token)       => api.post(`/payments/${id}/verify`, {}, token),
  reject:   (id, note, token) => api.post(`/payments/${id}/reject`, { rejectionNote: note }, token),
};

// Appointments
export const appointmentApi = {
  list:         (token)           => api.get('/appointments', token),
  create:       (data, token)     => api.post('/appointments', data, token),
  assign:       (id, data, token) => api.patch(`/appointments/${id}/assign`, data, token),
  updateRemark: (id, data, token) => api.patch(`/appointments/${id}/remark`, data, token),
};

export default api;
