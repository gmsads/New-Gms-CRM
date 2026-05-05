/**
 * StatCard — Reusable KPI card for all dashboards.
 * Shows a metric, icon, optional trend, and optional loading skeleton.
 */
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  trendLabel = 'vs last month',
  loading = false,
  color = 'primary',
  onClick,
}) => {
  const colorMap = {
    primary:  'bg-primary/10 text-primary',
    green:    'bg-green-100 text-green-600',
    yellow:   'bg-yellow-100 text-yellow-600',
    red:      'bg-red-100 text-red-600',
    blue:     'bg-blue-100 text-blue-600',
    purple:   'bg-purple-100 text-purple-600',
    orange:   'bg-orange-100 text-orange-600',
  };

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-8 w-16 rounded bg-muted" />
          </div>
          <div className="h-12 w-12 rounded-full bg-muted" />
        </div>
        <div className="mt-4 h-3 w-20 rounded bg-muted" />
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight">{value ?? '—'}</h3>
        </div>
        {Icon && (
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${colorMap[color] || colorMap.primary}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className={`mt-4 flex items-center gap-1.5 text-sm ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
          {trendUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          <span className="font-medium">{trend}</span>
          <span className="text-muted-foreground">{trendLabel}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
