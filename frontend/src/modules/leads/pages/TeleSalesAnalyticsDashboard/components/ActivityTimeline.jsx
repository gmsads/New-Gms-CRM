import React from 'react';
import { Clock, PlusCircle, CheckCircle, TrendingUp, AlertCircle, PhoneCall } from 'lucide-react';

export default function ActivityTimeline({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-card border rounded-xl p-4 shadow-sm h-full max-h-[500px]">
        <h3 className="font-bold text-sm mb-4">Recent Activities</h3>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-muted shrink-0"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-3/4 bg-muted rounded"></div>
                <div className="h-3 w-1/2 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getIconAndColor = (type) => {
    switch (type) {
      case 'Created': return { icon: PlusCircle, bg: 'bg-blue-500/10', color: 'text-blue-500' };
      case 'Sale': return { icon: CheckCircle, bg: 'bg-emerald-500/10', color: 'text-emerald-500' };
      case 'Interested': return { icon: TrendingUp, bg: 'bg-indigo-500/10', color: 'text-indigo-500' };
      case 'Prospect': return { icon: CheckCircle, bg: 'bg-purple-500/10', color: 'text-purple-500' };
      case 'Call': return { icon: PhoneCall, bg: 'bg-teal-500/10', color: 'text-teal-500' };
      default: return { icon: AlertCircle, bg: 'bg-amber-500/10', color: 'text-amber-500' };
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return isNaN(d) ? '' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col max-h-[500px]">
      <div className="border-b pb-3 mb-3 sticky top-0 bg-card z-10">
        <h3 className="font-bold text-sm">Recent Activities Timeline</h3>
      </div>
      <div className="overflow-y-auto flex-1 pr-2 space-y-4">
        {(!data || data.length === 0) ? (
          <div className="text-center text-muted-foreground text-xs py-8">No recent activities found.</div>
        ) : (
          data.map((item, idx) => {
            const { icon: Icon, bg, color } = getIconAndColor(item.type);
            return (
              <div key={idx} className="flex gap-3 relative">
                {idx !== data.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-[-16px] w-px bg-border"></div>
                )}
                <div className={`h-8 w-8 rounded-full ${bg} flex items-center justify-center shrink-0 z-10`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div className="flex-1 pb-1">
                  <div className="text-xs font-bold text-foreground">{item.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{item.description}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {formatTime(item.timestamp)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
