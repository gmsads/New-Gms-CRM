import React, { useEffect, useState } from 'react';
import { useAppointments } from '../hooks/useAppointments';
import { AppointmentsPage } from '../workspaces/AppointmentsPage';
import { useAuth } from '../../../../context/AuthContext';
import { AssignAppointmentModal, UpdateAppointmentRemarkModal } from '../../components/Panels';

export const AppointmentsContainer = ({ globalFilters, isTeamMode }) => {
  const { user } = useAuth();
  const { appointments, loading, fetchAppointments } = useAppointments();
  const [showAssign, setShowAssign] = useState(null);

  useEffect(() => {
    if (!user) return;
    const filters = isTeamMode 
      ? { salesExec: globalFilters?.employee, search: globalFilters?.search }
      : { createdBy: user._id };
      
    fetchAppointments(filters);
  }, [fetchAppointments, globalFilters, isTeamMode, user]);

  const handleAssign = (apt) => setShowAssign(apt);

  return (
    <>
      <AppointmentsPage 
        appointments={appointments} 
        loading={loading} 
        onAssign={handleAssign} 
      />
      {showAssign && (
        <AssignAppointmentModal 
          appointment={showAssign} 
          onClose={() => setShowAssign(null)} 
          onAssigned={() => fetchAppointments()} 
        />
      )}
    </>
  );
};
