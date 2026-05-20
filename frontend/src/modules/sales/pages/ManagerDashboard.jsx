import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import useApi from '../../../hooks/useApi';
import StatCard from '../../../components/ui/StatCard';
import { Users, TrendingUp, Calendar as CalendarIcon, Quote } from 'lucide-react';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { data: prospectData, loading: l1 } = useApi('/prospects');
  const { data: orderData,    loading: l2 } = useApi('/orders/stats');
  const { data: apptData,     loading: l3 } = useApi('/appointments/stats');
  const { data: quoteData,    loading: l4 } = useApi('/quotations');

  const prospects = prospectData?.data || [];
  const stats     = orderData?.data || {};
  const apptStats = apptData || {};
  const quotes    = quoteData?.data || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Prospects" value={Array.isArray(prospects)?prospects.length:(prospectData?.total||0)} icon={Users} color="primary" loading={l1} />
        <StatCard title="Order Revenue" value={stats.totalRevenue?`₹${stats.totalRevenue.toLocaleString()}`:'₹0'} icon={TrendingUp} color="green" loading={l2} />
        <StatCard 
          title="Team Quotations" 
          value={quotes.length} 
          icon={Quote} 
          color="blue" 
          loading={l4} 
          onClick={() => navigate('/quotations')}
        />
        <StatCard 
          title="Pending Appts" 
          value={apptStats.pendingCount || 0} 
          icon={CalendarIcon} 
          color="amber" 
          loading={l3} 
          onClick={() => navigate('/appointments')}
        />
      </div>
    </div>
  );
};

export default ManagerDashboard;
