export const dashboardApi = {
  getKpis: async (filters, token) => {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/telecrm/dashboard-enterprise/kpis?${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },
  getExecutives: async (filters, token) => {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/telecrm/dashboard-enterprise/executives?${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },
  getCharts: async (filters, token) => {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/telecrm/dashboard-enterprise/charts?${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },
  getSources: async (filters, token) => {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/telecrm/dashboard-enterprise/sources?${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },
  getTimeline: async (filters, token) => {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/telecrm/dashboard-enterprise/timeline?${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  }
};
