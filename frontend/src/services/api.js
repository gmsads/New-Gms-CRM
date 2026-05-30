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

  let data = {};
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { message: text };
    }
  }
  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.code   = data.code;
    err.data   = data;
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
  updateTarget:   (id, data, token) =>
    api.patch(`/employees/${id}/target`, data, token),
  masterProfile:  (id, token)       => api.get(`/employees/${id}/master-profile`, token),
  delete:         (id, token)       => api.delete(`/employees/${id}`, token),
};

// Prospects (Sales)
export const prospectApi = {
  list:        (params, token)   => api.get(`/prospects?${new URLSearchParams(params)}`, token),
  stats:       (p1, p2) => {
    const token = typeof p1 === 'string' ? p1 : p2;
    const params = typeof p1 === 'string' ? {} : (p1 || {});
    return api.get(`/prospects/stats?${new URLSearchParams(params)}`, token);
  },
  searchPhone: (params, token)   => api.get(`/prospects/search?${new URLSearchParams(params)}`, token),
  create:      (data, token)     => api.post('/prospects', data, token),
  update:      (id, data, token) => api.patch(`/prospects/${id}`, data, token),
  moveStage:   (id, data, token) => api.patch(`/prospects/${id}/stage`, data, token),
  addInteraction: (id, data, token) => api.post(`/prospects/${id}/interactions`, data, token),
  delete:      (id, token)       => api.delete(`/prospects/${id}`, token),
};

// Follow-ups
export const followupApi = {
  list:     (params, token)   => api.get(`/followups?${new URLSearchParams(params)}`, token),
  create:   (data, token)     => api.post('/followups', data, token),
  complete: (id, data, token) => api.patch(`/followups/${id}/complete`, data, token),
};


// Orders
export const orderApi = {
  list:           (params, token)   => api.get(`/orders?${new URLSearchParams(params)}`, token),
  searchClient:   (params, token)    => api.get(`/orders/search?${new URLSearchParams(params)}`, token),
  get:            (id, token)       => api.get(`/orders/${id}`, token),
  stats:          (p1, p2) => {
    const token = typeof p1 === 'string' ? p1 : p2;
    const params = typeof p1 === 'string' ? {} : (p1 || {});
    return api.get(`/orders/stats?${new URLSearchParams(params)}`, token);
  },
  create:         (data, token)     => api.post('/orders', data, token),
  confirm:        (id, token)       => api.post(`/orders/${id}/confirm`, {}, token),
  updateStatus:   (id, data, token) => api.patch(`/orders/${id}/status`, data, token),
  approveAdvance: (id, token)       => api.post(`/orders/${id}/approve-advance`, {}, token),
  addPayment:     (id, data, token) => api.post(`/orders/${id}/payments`, data, token),
  updateLineItem: (id, itemIndex, data, token) => api.patch(`/orders/${id}/line-items/${itemIndex}`, data, token),
  deleteLineItem: (id, itemIndex, token) => api.delete(`/orders/${id}/line-items/${itemIndex}`, token),
  verify:         (id, token)       => api.post(`/orders/${id}/verify`, {}, token),
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
  list:         (p1, p2) => {
    const token = typeof p1 === 'string' ? p1 : p2;
    const params = typeof p1 === 'string' ? {} : (p1 || {});
    return api.get(`/appointments?${new URLSearchParams(params)}`, token);
  },
  stats:        (p1, p2) => {
    const token = typeof p1 === 'string' ? p1 : p2;
    const params = typeof p1 === 'string' ? {} : (p1 || {});
    return api.get(`/appointments/stats?${new URLSearchParams(params)}`, token);
  },
  create:       (data, token)     => api.post('/appointments', data, token),
  assign:       (id, data, token) => api.patch(`/appointments/${id}/assign`, data, token),
  updateRemark: (id, data, token) => api.post(`/appointments/${id}/remarks`, data, token),
};


// Approvals (Low Advance)
export const approvalApi = {
  list:    (params, token)   => api.get(`/approvals?${new URLSearchParams(params)}`, token),
  stats:   (token)           => api.get('/approvals/stats', token),
  approve: (id, data, token) => api.post(`/approvals/${id}/approve`, data, token),
  reject:  (id, data, token) => api.post(`/approvals/${id}/reject`, data, token),
};

// Leaves
export const leaveApi = {
  list:          (params, token) => api.get(`/leaves?${new URLSearchParams(params)}`, token),
  hrReview:      (id, data, token) => api.put(`/leaves/${id}/hr-review`, data, token),
  adminOverride: (id, data, token) => api.put(`/leaves/${id}/admin-override`, data, token),
};

export const analyticsApi = {
  getStats: (params, token) => api.get(`/analytics/stats?${new URLSearchParams(params)}`, token),
};

export const targetApi = {
  list:           (params, token)   => api.get(`/targets?${new URLSearchParams(params)}`, token),
  analytics:      (params, token)   => api.get(`/targets/analytics?${new URLSearchParams(params)}`, token),
  assign:         (data, token)     => api.post('/targets', data, token),
  update:         (id, data, token) => api.patch(`/targets/${id}`, data, token),
  updateProgress: (id, data, token) => api.patch(`/targets/${id}/progress`, data, token),
};

export const permissionApi = {
  available: (token) => api.get('/permissions/available', token),
  assigned:  (token) => api.get('/permissions/assigned', token),
  getUserPermissions: (userId, token) => api.get(`/permissions/user/${userId}`, token),
  assign:    (data, token) => api.post('/permissions/assign', data, token),
  revoke:    (id, token)   => api.delete(`/permissions/revoke/${id}`, token),
};

export const brochureApi = {
  list:       (params, token) => api.get(`/brochures?${new URLSearchParams(params)}`, token),
  categories: (token)         => api.get('/brochures/categories', token),
  history:    (token)         => api.get('/brochures/history', token),
  create:     (data, token)   => api.post('/brochures', data, token),
  update:     (id, data, token) => api.patch(`/brochures/${id}`, data, token),
  delete:     (id, token)     => api.delete(`/brochures/${id}`, token),
  send:       (data, token)   => api.post('/brochures/send', data, token),
};

export const productApi = {
  list:   (token)       => api.get('/products', token),
  getCategories: (token) => api.get('/products/categories', token),
  create: (data, token) => api.post('/products', data, token),
  getClientTypes: (token) => api.get('/products/client-types', token),
  createClientType: (data, token) => api.post('/products/client-types', data, token),
  deleteClientType: (id, token) => api.delete(`/products/client-types/${id}`, token),
  update: (id, data, token) => api.patch(`/products/${id}`, data, token),
};

export const quotationApi = {
  list:           (params, token) => api.get(`/quotations?${new URLSearchParams(params)}`, token),
  create:         (data, token)   => api.post('/quotations', data, token),
  getTemplate:    (token)         => api.get('/quotations/template', token),
  updateTemplate: (data, token)   => api.post('/quotations/template', data, token),
  getById:        (id, token)     => api.get(`/quotations/${id}`, token),
  update:         (id, data, token) => api.patch(`/quotations/${id}`, data, token),
  updateStatus:   (id, data, token) => api.patch(`/quotations/${id}/status`, data, token),
};

// ── Vendors ───────────────────────────────────────────────────────────────────
export const vendorApi = {
  list:     (params, token)   => api.get(`/vendors?${new URLSearchParams(params)}`, token),
  get:      (id, token)       => api.get(`/vendors/${id}`, token),
  create:   (data, token)     => api.post('/vendors', data, token),
  update:   (id, data, token) => api.patch(`/vendors/${id}`, data, token),
  delete:   (id, token)       => api.delete(`/vendors/${id}`, token),
};

export const vendorCategoryApi = {
  list:     (token)           => api.get('/vendors/categories', token),
  create:   (data, token)     => api.post('/vendors/categories', data, token),
  update:   (id, data, token) => api.patch(`/vendors/categories/${id}`, data, token),
  delete:   (id, token)       => api.delete(`/vendors/categories/${id}`, token),
};

export const vendorAssignmentApi = {
  list:     (params, token)   => api.get(`/vendors/assignments?${new URLSearchParams(params)}`, token),
  create:   (data, token)     => api.post('/vendors/assignments', data, token),
  update:   (id, data, token) => api.patch(`/vendors/assignments/${id}`, data, token),
  delete:   (id, token)       => api.delete(`/vendors/assignments/${id}`, token),
};

export const vendorPaymentApi = {
  list:     (params, token)   => api.get(`/vendors/payments?${new URLSearchParams(params)}`, token),
  create:   (data, token)     => api.post('/vendors/payments', data, token),
  update:   (id, data, token) => api.patch(`/vendors/payments/${id}`, data, token),
  delete:   (id, token)       => api.delete(`/vendors/payments/${id}`, token),
};

export default api;
