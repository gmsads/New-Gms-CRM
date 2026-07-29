import React from 'react';
import { RefreshCw } from 'lucide-react';
import { SharedAppointmentCard } from '../ui/SharedAppointmentCard';
import { AppointmentEmptyState } from '../ui/AppointmentEmptyState';

export const AppointmentsPage = ({ appointments, loading, onAssign, onCreateOrder }) => {
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const renderActions = (apt) => (
    <>
      {!apt.assignedTo && (
        <button 
          onClick={() => onAssign(apt)} 
          className="flex-1 bg-slate-900 text-white py-2 rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors"
        >
          Assign
        </button>
      )}
      {apt.assignedTo && apt.status === 'FOLLOWUP_REQUIRED' && (
        <button 
          onClick={() => onAssign(apt)} 
          className="flex-1 bg-amber-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors"
        >
          Reassign
        </button>
      )}
      {apt.status === 'SALE_CONFIRMED' && !apt.linkedOrderId && (
        <button 
          onClick={() => onCreateOrder(apt)} 
          className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
        >
          Create Order
        </button>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Appointments Management</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Appointments Created By Me</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appointments.length === 0 ? (
          <AppointmentEmptyState message="No appointments scheduled" />
        ) : (
          appointments.map(apt => (
            <SharedAppointmentCard 
              key={apt._id} 
              appointment={apt} 
              showAssignee={true} 
              showCreator={true}
              renderActions={renderActions}
            />
          ))
        )}
      </div>
    </div>
  );
};
