import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical, Image, FileText, Video, Layout } from 'lucide-react';
import useApi from '../hooks/useApi';

const COLUMNS = ['Pending', 'In Progress', 'Demo Shared', 'Approved'];

const typeIcon = { Social: Image, Email: FileText, Print: FileText, Video: Video, Web: Layout, Brand: Image };
const typeColor = {
  Social: 'bg-pink-100 text-pink-700', Email: 'bg-blue-100 text-blue-700',
  Print: 'bg-orange-100 text-orange-700', Video: 'bg-red-100 text-red-700',
  Web: 'bg-purple-100 text-purple-700', Brand: 'bg-cyan-100 text-cyan-700',
};
const priorityDot = { High: 'bg-red-500', Medium: 'bg-yellow-500', Low: 'bg-blue-400' };
const colHeaderColor = {
  Pending: 'border-gray-300', 'In Progress': 'border-blue-400',
  'Demo Shared': 'border-yellow-400', Approved: 'border-green-400',
};

const Design = () => {
  const { data, loading, error, refetch } = useApi('/orders?designStatus=Pending,In_Progress,Demo_Shared,Approved');
  const [cards, setCards] = useState({ Pending: [], 'In Progress': [], 'Demo Shared': [], Approved: [] });

  useEffect(() => {
    if (data?.data) {
      const grouped = { Pending: [], 'In Progress': [], 'Demo Shared': [], Approved: [] };
      data.data.forEach(order => {
        const status = order.designStatus === 'Demo_Shared' ? 'Demo Shared' : 
                       order.designStatus === 'In_Progress' ? 'In Progress' : order.designStatus;
        if (grouped[status]) {
          grouped[status].push({
            id: order._id,
            title: order.orderNumber + ' - ' + (order.clientSnapshot?.company || 'No Company'),
            client: order.clientSnapshot?.name || 'Unknown Client',
            type: 'Social', // Default type as backend doesn't have it explicitly per order yet
            assignee: order.designAssignedTo?.name || 'Unassigned',
            priority: 'Medium', // Placeholder
          });
        }
      });
      setCards(grouped);
    }
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Design Assets</h1>
          <p className="text-muted-foreground">Manage creative requests with a Kanban board.</p>
        </div>
        <button onClick={() => refetch()} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          Refresh Board
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : error ? (
        <div className="p-6 text-sm text-red-500 bg-red-50 rounded-xl border border-red-200">Error loading designs: {error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {COLUMNS.map(col => (
            <div key={col} className="flex flex-col gap-3">
              {/* Column Header */}
              <div className={`flex items-center justify-between rounded-lg border-l-4 bg-card px-4 py-3 shadow-sm ${colHeaderColor[col]}`}>
                <span className="font-semibold text-sm">{col}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                  {cards[col]?.length || 0}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {cards[col]?.map(card => {
                  const TypeIcon = typeIcon[card.type] || FileText;
                  return (
                    <div key={card.id} className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                      <div className="flex items-start justify-between mb-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${typeColor[card.type] || 'bg-muted text-muted-foreground'}`}>
                          <TypeIcon className="h-3 w-3" />{card.type}
                        </span>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                      <h4 className="text-sm font-medium leading-snug mb-2">{card.title}</h4>
                      <p className="text-xs text-muted-foreground mb-3">{card.client}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{card.assignee}</span>
                        <div className="flex items-center gap-1.5">
                          <div className={`h-2 w-2 rounded-full ${priorityDot[card.priority] || 'bg-gray-400'}`} />
                          <span className="text-xs text-muted-foreground">{card.priority}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {cards[col]?.length === 0 && (
                   <div className="text-center py-8 border border-dashed rounded-xl text-xs text-muted-foreground bg-muted/5">
                      No items in {col}
                   </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Design;

