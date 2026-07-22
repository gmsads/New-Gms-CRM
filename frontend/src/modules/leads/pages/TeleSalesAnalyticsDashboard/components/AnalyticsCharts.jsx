import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

export function StatusAnalyticsChart({ data, loading }) {
  if (loading || !data?.statusDistribution) return <div className="h-64 bg-card border rounded-xl animate-pulse"></div>;
  
  return (
    <div className="bg-card border rounded-xl p-4 shadow-sm">
      <h3 className="font-bold text-sm mb-4">Lead Status Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {data.statusDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ConversionFunnelChart({ data, loading }) {
  if (loading || !data?.conversionFunnel) return <div className="h-64 bg-card border rounded-xl animate-pulse"></div>;
  
  return (
    <div className="bg-card border rounded-xl p-4 shadow-sm">
      <h3 className="font-bold text-sm mb-4">Conversion Funnel</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.conversionFunnel} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis dataKey="stage" type="category" />
            <Tooltip cursor={{fill: 'transparent'}} />
            <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
              {data.conversionFunnel.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CallingTrendChart({ data, loading }) {
  if (loading || !data?.callsTrend) return <div className="h-64 bg-card border rounded-xl animate-pulse"></div>;

  return (
    <div className="bg-card border rounded-xl p-4 shadow-sm">
      <h3 className="font-bold text-sm mb-4">Daily Calling Trends</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.callsTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorConn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{fontSize: 10}} />
            <YAxis tick={{fontSize: 10}} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="calls" name="Total Calls" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCalls)" />
            <Area type="monotone" dataKey="connected" name="Connected" stroke="#10b981" fillOpacity={1} fill="url(#colorConn)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SourceAnalysisChart({ data, loading }) {
  if (loading || !data) return <div className="h-64 bg-card border rounded-xl animate-pulse"></div>;

  return (
    <div className="bg-card border rounded-xl p-4 shadow-sm">
      <h3 className="font-bold text-sm mb-4">Lead Source Performance</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="source" tick={{fontSize: 10}} />
            <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" tick={{fontSize: 10}} />
            <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{fontSize: 10}} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="leads" name="Total Leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="sales" name="Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
