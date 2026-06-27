import React from 'react';
import { Phone, MessageCircle, Eye, MessageSquare, Calendar, Building2, MapPin, Tag, Clock } from 'lucide-react';

/**
 * LeadCard.jsx
 * Mobile-First Premium Responsive Lead Card
 * Supports touch gestures and quick actions.
 */
export const LeadCard = ({ lead, onCall, onWhatsApp, onDetails, onRemark, onFollowup }) => {
  const priorityColors = {
    Urgent: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
    High: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    Medium: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    Low: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };

  const statusColors = {
    New: 'bg-emerald-500/10 text-emerald-500',
    Calling: 'bg-blue-500/10 text-blue-500 animate-pulse',
    Connected: 'bg-teal-500/10 text-teal-500',
    Busy: 'bg-amber-500/10 text-amber-500',
    Interested: 'bg-purple-500/10 text-purple-500 font-semibold',
    Converted: 'bg-emerald-600 text-white font-bold',
    Lost: 'bg-rose-500/10 text-rose-500',
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3 relative overflow-hidden group">
      {/* Top Row: Company & Priority Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-xs font-mono text-muted-foreground">{lead.leadNumber}</span>
          <h3 className="font-bold text-base text-foreground leading-tight mt-0.5">
            {lead.companyName || lead.contactPerson}
          </h3>
          {lead.companyName && (
            <p className="text-xs text-muted-foreground font-medium">{lead.contactPerson}</p>
          )}
        </div>
        <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-bold shrink-0 ${priorityColors[lead.priority] || priorityColors.Medium}`}>
          {lead.priority || 'Medium'}
        </span>
      </div>

      {/* Middle Row: Attributes */}
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground my-1 py-2 border-y border-border/60">
        <div className="flex items-center gap-1.5 truncate">
          <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-mono text-foreground font-medium truncate">{lead.phone}</span>
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate">{lead.city || lead.state || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <Tag className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate">{lead.source || 'Excel'}</span>
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate">
            {lead.lastFollowUpDate ? new Date(lead.lastFollowUpDate).toLocaleDateString() : 'No Followup'}
          </span>
        </div>
      </div>

      {/* Status Badge & Campaign */}
      <div className="flex items-center justify-between text-xs">
        <span className={`px-2 py-0.5 rounded-md font-medium ${statusColors[lead.currentStatus] || 'bg-secondary text-secondary-foreground'}`}>
          {lead.currentStatus || 'New'}
        </span>
        {lead.campaign && (
          <span className="text-muted-foreground text-[11px] italic truncate max-w-[130px]">
            📢 {lead.campaign.name || 'Campaign'}
          </span>
        )}
      </div>

      {/* Bottom Row: Quick Action Touch Buttons */}
      <div className="grid grid-cols-5 gap-1.5 mt-2 pt-2 border-t border-border">
        <button
          onClick={() => onCall(lead)}
          className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white active:scale-95 transition-all"
          title="Call Customer"
        >
          <Phone className="h-4 w-4" />
          <span className="text-[10px] font-bold">Call</span>
        </button>

        <button
          onClick={() => onWhatsApp(lead)}
          className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg bg-teal-500/10 text-teal-500 hover:bg-teal-500 hover:text-white active:scale-95 transition-all"
          title="WhatsApp"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-[10px] font-bold">Chat</span>
        </button>

        <button
          onClick={() => onRemark(lead)}
          className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white active:scale-95 transition-all"
          title="Add Remark"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="text-[10px] font-bold">Remark</span>
        </button>

        <button
          onClick={() => onFollowup(lead)}
          className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-white active:scale-95 transition-all"
          title="Schedule Followup"
        >
          <Calendar className="h-4 w-4" />
          <span className="text-[10px] font-bold">Remind</span>
        </button>

        <button
          onClick={() => onDetails(lead)}
          className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all"
          title="View Details"
        >
          <Eye className="h-4 w-4" />
          <span className="text-[10px] font-bold">Details</span>
        </button>
      </div>
    </div>
  );
};

export default LeadCard;
