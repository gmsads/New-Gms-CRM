import { useState, useEffect } from 'react';
import { dashboardApi } from '../services/dashboardService';
import { useAuth } from '../../../../../context/AuthContext';

export function useDashboardData(filters) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    kpis: null,
    executives: [],
    charts: null,
    sources: [],
    timeline: []
  });

  const fetchAllData = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      // Parallel independent fetches for modularity and speed
      const [kpisRes, execsRes, chartsRes, sourcesRes, timelineRes] = await Promise.all([
        dashboardApi.getKpis(filters, user.token).catch(() => ({ data: null })),
        dashboardApi.getExecutives(filters, user.token).catch(() => ({ data: [] })),
        dashboardApi.getCharts(filters, user.token).catch(() => ({ data: null })),
        dashboardApi.getSources(filters, user.token).catch(() => ({ data: [] })),
        dashboardApi.getTimeline(filters, user.token).catch(() => ({ data: [] }))
      ]);

      setData({
        kpis: kpisRes.data,
        executives: execsRes.data || [],
        charts: chartsRes.data,
        sources: sourcesRes.data || [],
        timeline: timelineRes.data || []
      });
    } catch (err) {
      console.error("Dashboard fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [filters, user]);

  return { data, loading, refetch: fetchAllData };
}
