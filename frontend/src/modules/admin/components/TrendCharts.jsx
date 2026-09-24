import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { formatINRConcise } from '../../../utils/numberFormatters';
import { TrendingUp, TrendingDown, Activity, BarChart2 } from 'lucide-react';
import { ResponsiveCard } from '../../../components/ui/ResponsiveComponents';
import clsx from 'clsx';

const glassmorphismTooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.35)',
  padding: '12px 16px',
};

const tooltipLabelStyle = {
  fontWeight: 800,
  color: '#f8fafc',
  marginBottom: '4px',
  fontSize: '13px'
};

const tooltipItemStyle = {
  color: '#cbd5e1',
  fontWeight: 600,
  fontSize: '12px'
};

const formatYAxisLakhs = (tickItem) => {
  if (tickItem === 0) return '0';
  return `${(tickItem / 100000).toFixed(1)}L`;
};

const useTrendData = (rawOrders = [], selectedMonth, selectedYear, filterType) => {
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  
  const targetYear = selectedYear || new Date().getFullYear();
  const isYearly = filterType === 'year' || filterType === 'custom';
  
  let targetMonth = new Date().getMonth();
  if (filterType === 'month' && typeof selectedMonth === 'number' && selectedMonth !== '') {
    targetMonth = selectedMonth;
  } else if (isYearly) {
    targetMonth = targetYear === new Date().getFullYear() ? new Date().getMonth() : 11;
  }
  
  const monthName = monthNames[targetMonth];
  const chart1Title = isYearly ? `Revenue & Orders (${targetYear})` : `Revenue & Orders (${monthName})`;

  const primaryTrends = useMemo(() => {
    if (isYearly) {
      const months = monthNames.map((name, idx) => ({ name, monthVal: idx, revenue: 0, orders: 0 }));
      rawOrders.forEach(o => {
        if (o.status === 'Cancelled' || o.status === 'Canceled') return;
        const d = new Date(o.createdAt || o.date || o.orderDate);
        if (isNaN(d.getTime())) return;
        if (d.getFullYear() === targetYear) {
          months[d.getMonth()].revenue += (o.grandTotal || 0);
          months[d.getMonth()].orders += 1;
        }
      });
      return months;
    } else {
      const weeks = [
        { name: 'Week 1', revenue: 0, orders: 0 },
        { name: 'Week 2', revenue: 0, orders: 0 },
        { name: 'Week 3', revenue: 0, orders: 0 },
        { name: 'Week 4', revenue: 0, orders: 0 },
        { name: 'Week 5', revenue: 0, orders: 0 }
      ];
      rawOrders.forEach(o => {
        if (o.status === 'Cancelled' || o.status === 'Canceled') return;
        const d = new Date(o.createdAt || o.date || o.orderDate);
        if (isNaN(d.getTime())) return;
        if (d.getFullYear() === targetYear && d.getMonth() === targetMonth) {
          const day = d.getDate();
          let weekIdx = 0;
          if (day > 28) weekIdx = 4;
          else if (day > 21) weekIdx = 3;
          else if (day > 14) weekIdx = 2;
          else if (day > 7) weekIdx = 1;
          weeks[weekIdx].revenue += (o.grandTotal || 0);
          weeks[weekIdx].orders += 1;
        }
      });
      return weeks;
    }
  }, [rawOrders, targetYear, targetMonth, isYearly]);

  const monthlyTrends = useMemo(() => {
    const months = [];
    for(let i = 2; i >= 0; i--) {
      const d = new Date(targetYear, targetMonth - i, 1);
      months.push({
        name: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        monthVal: d.getMonth(),
        yearVal: d.getFullYear(),
        revenue: 0,
        orders: 0
      });
    }
    rawOrders.forEach(o => {
      if (o.status === 'Cancelled' || o.status === 'Canceled') return;
      const d = new Date(o.createdAt || o.date || o.orderDate);
      if (isNaN(d.getTime())) return;
      const match = months.find(m => m.monthVal === d.getMonth() && m.yearVal === d.getFullYear());
      if (match) {
        match.revenue += (o.grandTotal || 0);
        match.orders += 1;
      }
    });
    return months;
  }, [rawOrders, targetYear, targetMonth]);

  const primaryRevenue = primaryTrends.reduce((sum, item) => sum + item.revenue, 0);
  const primaryOrders = primaryTrends.reduce((sum, item) => sum + item.orders, 0);

  const threeMonthRevenue = monthlyTrends.reduce((sum, item) => sum + item.revenue, 0);
  const threeMonthOrders = monthlyTrends.reduce((sum, item) => sum + item.orders, 0);
  const avgOrders = Math.round(threeMonthOrders / (monthlyTrends.length || 1));
  
  const lastMonth = monthlyTrends[monthlyTrends.length - 1];
  const prevMonth = monthlyTrends[monthlyTrends.length - 2];
  
  let growthPercentage = 0;
  if (prevMonth && prevMonth.revenue > 0 && lastMonth) {
    growthPercentage = ((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100;
  }

  return {
    isYearly, chart1Title, primaryTrends, primaryRevenue, primaryOrders,
    monthlyTrends, threeMonthOrders, threeMonthRevenue, avgOrders, growthPercentage
  };
};

export const RevenueOrdersChart = ({ rawOrders = [], selectedMonth, selectedYear, filterType }) => {
  const { isYearly, chart1Title, primaryTrends, primaryRevenue, primaryOrders } = useTrendData(rawOrders, selectedMonth, selectedYear, filterType);
  return (
    <ResponsiveCard className="flex flex-col hover:shadow-xl transition-all duration-300 min-w-0 h-full p-4">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2 shrink-0">
        <BarChart2 className="h-4 w-4 text-blue-500 shrink-0" />
        <h3 className="text-sm sm:text-base font-black text-slate-800 tracking-tight truncate">
          {chart1Title}
        </h3>
      </div>
      
      <div className="w-full h-48 sm:h-56 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={primaryTrends} margin={{ top: 10, left: -30, right: -30, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" interval={0} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 700 }} dy={5} angle={-90} textAnchor="end" height={40} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tickFormatter={formatYAxisLakhs} tick={{ fontSize: 10, fill: '#f59e0b', fontWeight: 600 }} />
            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#3b82f6', fontWeight: 600 }} />
            
            <Tooltip contentStyle={glassmorphismTooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={{fill: 'rgba(241, 245, 249, 0.5)'}} />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 700, color: '#475569' }} />
            
            <Bar yAxisId="left" dataKey="revenue" name="Total Revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={isYearly ? 8 : 12} />
            <Bar yAxisId="right" dataKey="orders" name="Total Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={isYearly ? 8 : 12} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full mt-4 border-t border-slate-100 pt-4 flex items-center justify-between">
        <div className="flex flex-col items-center flex-1">
          <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{formatINRConcise(primaryRevenue)}</span>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Total Revenue</span>
        </div>
        <div className="w-px h-8 bg-slate-200"></div>
        <div className="flex flex-col items-center flex-1">
          <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{primaryOrders}</span>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Total Orders</span>
        </div>
      </div>
    </ResponsiveCard>
  );
};

export const Last3MonthsChart = ({ rawOrders = [], selectedMonth, selectedYear, filterType }) => {
  const { monthlyTrends, threeMonthOrders, threeMonthRevenue, avgOrders, growthPercentage } = useTrendData(rawOrders, selectedMonth, selectedYear, filterType);
  return (
    <ResponsiveCard className="flex flex-col hover:shadow-xl transition-all duration-300 min-w-0 h-full p-4 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2 shrink-0">
        <Activity className="h-4 w-4 text-indigo-500 shrink-0" />
        <h3 className="text-sm sm:text-base font-black text-slate-800 tracking-tight truncate">
          Last 3 Months <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded ml-2 align-middle">{monthlyTrends[0]?.name} - {monthlyTrends[monthlyTrends.length - 1]?.name}</span>
        </h3>
      </div>

      <div className="bg-slate-50 rounded-xl p-3 flex justify-between gap-2 w-full mb-4 border border-slate-100/60 shadow-2xs">
        <div className="text-center flex-1 border-r border-slate-200">
          <div className="text-base sm:text-lg font-black text-slate-900">{threeMonthOrders}</div>
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Orders</div>
        </div>
        <div className="text-center flex-1 border-r border-slate-200">
          <div className="text-base sm:text-lg font-black text-emerald-600">{formatINRConcise(threeMonthRevenue)}</div>
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Revenue</div>
        </div>
        <div className="text-center flex-1">
          <div className="text-base sm:text-lg font-black text-slate-900">{avgOrders}</div>
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Monthly Avg</div>
        </div>
      </div>

      <div className="w-full h-32 sm:h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyTrends} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" interval={0} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 700 }} dy={5} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={formatYAxisLakhs} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} />
            <Tooltip contentStyle={glassmorphismTooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={{fill: 'rgba(241, 245, 249, 0.5)'}} />
            <Legend verticalAlign="top" height={24} iconType="square" wrapperStyle={{ fontSize: '10px', fontWeight: 800, color: '#475569' }} />
            
            <Bar dataKey="orders" name="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
            <Bar dataKey="revenue" name="Revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-4 w-full">
        {monthlyTrends.map((month, idx) => (
          <div key={idx} className={clsx("flex-1 p-2 rounded-xl border flex flex-col items-center bg-white", idx === monthlyTrends.length - 1 ? "border-emerald-300 shadow-sm" : "border-slate-200")}>
            <span className="text-[9px] font-black text-slate-500 uppercase">{month.name.split(' ')[0]}</span>
            <span className={clsx("text-sm sm:text-base font-black", idx === monthlyTrends.length - 1 ? "text-emerald-600" : (idx === 1 ? "text-amber-500" : "text-blue-500"))}>
              {month.orders}
            </span>
            <span className="text-[9px] font-bold text-slate-400">{formatINRConcise(month.revenue)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-center w-full">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Growth:</span>
          {growthPercentage >= 0 ? (
            <span className="text-[11px] font-black text-emerald-600 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" />{growthPercentage.toFixed(1)}%</span>
          ) : (
            <span className="text-[11px] font-black text-rose-500 flex items-center"><TrendingDown className="h-3 w-3 mr-0.5" />{Math.abs(growthPercentage).toFixed(1)}%</span>
          )}
        </div>
      </div>
    </ResponsiveCard>
  );
};
