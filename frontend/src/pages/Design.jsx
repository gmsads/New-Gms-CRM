import React, { useState } from 'react';
import { Plus, MoreVertical, Image, FileText, Video, Layout } from 'lucide-react';

const COLUMNS = ['Requested', 'In Progress', 'Review', 'Delivered'];

const initialCards = {
  Requested: [
    { id: 1, title: 'Social Media Kit – Acme Corp', client: 'Acme Corp', type: 'Social', assignee: 'Bob K.', priority: 'High' },
    { id: 2, title: 'Email Header – Stark Ind.', client: 'Stark Industries', type: 'Email', assignee: 'Unassigned', priority: 'Medium' },
    { id: 3, title: 'Print Brochure – Wayne Ent.', client: 'Wayne Enterprises', type: 'Print', assignee: 'Unassigned', priority: 'Low' },
  ],
  'In Progress': [
    { id: 4, title: 'YouTube Thumbnail Set – Acme', client: 'Acme Corp', type: 'Video', assignee: 'Bob K.', priority: 'High' },
    { id: 5, title: 'Banner Ads – Global Tech', client: 'Global Tech', type: 'Social', assignee: 'Priya R.', priority: 'Medium' },
  ],
  Review: [
    { id: 6, title: 'Landing Page Mockup – Acme', client: 'Acme Corp', type: 'Web', assignee: 'Bob K.', priority: 'High' },
  ],
  Delivered: [
    { id: 7, title: 'Logo Refresh – Stark Ind.', client: 'Stark Industries', type: 'Brand', assignee: 'Priya R.', priority: 'High' },
    { id: 8, title: 'Standee Design – Acme', client: 'Acme Corp', type: 'Print', assignee: 'Bob K.', priority: 'Low' },
  ],
};

const typeIcon = { Social: Image, Email: FileText, Print: FileText, Video: Video, Web: Layout, Brand: Image };
const typeColor = {
  Social: 'bg-pink-100 text-pink-700', Email: 'bg-blue-100 text-blue-700',
  Print: 'bg-orange-100 text-orange-700', Video: 'bg-red-100 text-red-700',
  Web: 'bg-purple-100 text-purple-700', Brand: 'bg-cyan-100 text-cyan-700',
};
const priorityDot = { High: 'bg-red-500', Medium: 'bg-yellow-500', Low: 'bg-blue-400' };
const colHeaderColor = {
  Requested: 'border-gray-300', 'In Progress': 'border-blue-400',
  Review: 'border-yellow-400', Delivered: 'border-green-400',
};

const Design = () => {
  const [cards] = useState(initialCards);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Design Assets</h1>
          <p className="text-muted-foreground">Manage creative requests with a Kanban board.</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="mr-2 h-4 w-4" /> New Request
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map(col => (
          <div key={col} className="flex flex-col gap-3">
            {/* Column Header */}
            <div className={`flex items-center justify-between rounded-lg border-l-4 bg-card px-4 py-3 shadow-sm ${colHeaderColor[col]}`}>
              <span className="font-semibold text-sm">{col}</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                {cards[col].length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {cards[col].map(card => {
                const TypeIcon = typeIcon[card.type] || FileText;
                return (
                  <div key={card.id} className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${typeColor[card.type]}`}>
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
                        <div className={`h-2 w-2 rounded-full ${priorityDot[card.priority]}`} />
                        <span className="text-xs text-muted-foreground">{card.priority}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Add Card Button */}
              <button className="w-full rounded-xl border border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" /> Add card
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Design;
