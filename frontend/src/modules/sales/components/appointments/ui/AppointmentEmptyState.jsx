import React from 'react';
import { CalendarIcon } from 'lucide-react';

export const AppointmentEmptyState = ({ message = "No appointments scheduled" }) => (
  <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300">
    <CalendarIcon className="h-10 w-10 mx-auto text-slate-300 mb-3" />
    <p className="text-slate-500 font-bold">{message}</p>
  </div>
);
