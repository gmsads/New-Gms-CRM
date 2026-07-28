import React, { useMemo } from 'react';
import { RefreshCw, PhoneCall, Map, CheckCircle2 } from 'lucide-react';
import { SharedAppointmentCard } from '../ui/SharedAppointmentCard';
import { AppointmentEmptyState } from '../ui/AppointmentEmptyState';

export const AssignedAppointmentsPage = ({ appointments, loading, onUpdateRemark }) => {
  const grouped = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const map = {
      today: [],
      upcoming: [],
      overdue: [],
      completed: []
    };

    appointments.forEach(apt => {
      const aptDate = apt.date ? new Date(apt.date).toISOString().split('T')[0] : null;
      if (['COMPLETED', 'SALE_CONFIRMED', 'CANCELLED', 'LOST'].includes(apt.status)) {
        if (aptDate === today) map.completed.push(apt);
      } else if (aptDate === today) {
        map.today.push(apt);
      } else if (aptDate && aptDate < today) {
        map.overdue.push(apt);
      } else {
        map.upcoming.push(apt);
      }
    });

    return map;
  }, [appointments]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const renderActions = (apt) => (
    <div className="grid grid-cols-2 gap-2 w-full mt-2">
      <a 
        href={`tel:${apt.phone || apt.prospect?.phone || ''}`}
        className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
      >
        <PhoneCall className="h-4 w-4" /> Call
      </a>
      <a 
        href={`https://maps.google.com/?q=${encodeURIComponent(apt.venue || '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
      >
        <Map className="h-4 w-4" /> Navigate
      </a>
      {['COMPLETED', 'SALE_CONFIRMED', 'CANCELLED', 'LOST'].includes(apt.status) ? (
        <div className="col-span-2 flex items-center justify-center gap-2 bg-slate-50 text-slate-400 py-2.5 rounded-xl text-xs font-bold border border-slate-100">
           Closed
        </div>
      ) : (
        <button 
          onClick={() => onUpdateRemark(apt)} 
          className="col-span-2 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200"
        >
          <CheckCircle2 className="h-4 w-4" /> Update Status & Remark
        </button>
      )}
    </div>
  );

  const Section = ({ title, data, countColor }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">{title}</h2>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${countColor}`}>
          {data.length}
        </span>
      </div>
      {data.length === 0 ? (
        <div className="py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs font-bold text-slate-400">
          No records found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map(apt => (
            <SharedAppointmentCard 
              key={apt._id} 
              appointment={apt} 
              showAssignee={false}
              showCreator={true}
              renderActions={renderActions}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-10">
      <div className="bg-slate-900 rounded-[2rem] p-6 sm:p-8 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight relative z-10">Daily Field Execution</h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2 relative z-10">Your Assigned Visits</p>
      </div>

      <Section 
        title="Today's Visits" 
        data={grouped.today} 
        countColor="bg-blue-100 text-blue-700" 
      />
      <Section 
        title="Overdue Follow-ups" 
        data={grouped.overdue} 
        countColor="bg-red-100 text-red-700" 
      />
      <Section 
        title="Upcoming Visits" 
        data={grouped.upcoming} 
        countColor="bg-amber-100 text-amber-700" 
      />
      {grouped.completed.length > 0 && (
        <Section 
          title="Completed Today" 
          data={grouped.completed} 
          countColor="bg-emerald-100 text-emerald-700" 
        />
      )}
    </div>
  );
};
