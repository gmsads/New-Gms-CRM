import React from 'react';
import { CalendarIcon, UserPlus, Phone, MapPin, Clock } from 'lucide-react';

export const SharedAppointmentCard = ({ appointment: apt, renderActions, showAssignee = true, showCreator = true }) => {
  return (
    <div className="bg-white border rounded-[2rem] p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-lg text-slate-900">{apt.businessName || apt.prospect?.company || apt.prospect?.name}</h3>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          apt.status === 'SALE_CONFIRMED' ? 'bg-green-100 text-green-700' :
          apt.status === 'LOST' || apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
          apt.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
          apt.status === 'FOLLOWUP_REQUIRED' ? 'bg-amber-100 text-amber-700' :
          'bg-purple-50 text-purple-600'
        }`}>{
          apt.status === 'SALE_CONFIRMED' ? 'Sale Confirmed' :
          apt.status === 'IN_PROGRESS' ? 'In Progress' :
          apt.status === 'FOLLOWUP_REQUIRED' ? 'Follow-up Required' :
          apt.status === 'CLIENT_NOT_AVAILABLE' ? 'Client N/A' :
          apt.status === 'CANCELLED' ? 'Cancelled' :
          (apt.status || 'Unknown').charAt(0) + (apt.status || 'Unknown').slice(1).toLowerCase()
        }</span>
      </div>
      <div className="text-sm space-y-2">
        <div className="flex items-center gap-2 text-slate-500">
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span className="font-bold text-slate-700">{apt.date ? new Date(apt.date).toLocaleDateString() : 'N/A'}</span> at <span className="font-bold text-slate-700">{apt.time || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <UserPlus className="h-4 w-4 shrink-0" />
          <span className="font-bold text-slate-700 truncate">{apt.contactPerson || apt.prospect?.name || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Phone className="h-4 w-4 shrink-0" />
          <span className="font-bold text-slate-700">{apt.phone || apt.prospect?.phone || 'N/A'}</span>
        </div>
        <div className="flex items-start gap-2 text-slate-500">
          <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="font-bold text-slate-700 line-clamp-2">{apt.venue || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Clock className="h-4 w-4 shrink-0" />
          <span className="font-bold text-slate-700">{apt.meetingType || apt.purpose || 'N/A'}</span>
        </div>
        {apt.nextFollowUpDate && (
          <div className="flex items-center gap-2 text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-100">
            <CalendarIcon className="h-4 w-4 shrink-0 text-red-500" />
            Next Follow-up: <span>{new Date(apt.nextFollowUpDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
      <div className="pt-4 border-t flex flex-col gap-3">
         {showCreator && (
           <div className="flex items-center justify-between">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Created By</span>
             <span className="text-xs font-bold text-slate-600">{apt.createdBy?.name || 'Unknown'}</span>
           </div>
         )}
         {showAssignee && (
           <div className="flex items-center justify-between">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignee</span>
             <span className="text-xs font-bold text-blue-600">{apt.assignedTo?.name || 'Pending Allocation'}</span>
           </div>
         )}
         
         <div className="space-y-1">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Executive Remark</span>
           <div className="bg-slate-50 text-slate-700 text-xs p-2.5 rounded-xl border border-slate-100 italic">
             "{apt.executiveRemark || apt.remark || '-'}"
           </div>
         </div>

         {apt.assignedTo && (
           <div className="space-y-1">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignee Remark</span>
             {apt.assigneeRemark ? (
               <div className="bg-green-50 text-green-800 text-xs p-2.5 rounded-xl border border-green-100 italic">
                 "{apt.assigneeRemark}"
               </div>
             ) : (
               <p className="text-[11px] text-slate-400 italic">Waiting for assignee updates...</p>
             )}
           </div>
         )}

         {/* Extensible Action Container */}
         {renderActions && (
           <div className="flex gap-2 mt-2 w-full">
             {renderActions(apt)}
           </div>
         )}
      </div>
    </div>
  );
};
