import React, { useEffect, useState } from 'react';
import { useAppointments } from '../hooks/useAppointments';
import { AssignedAppointmentsPage } from '../workspaces/AssignedAppointmentsPage';
import { useAuth } from '../../../../context/AuthContext';
import { UpdateAppointmentRemarkModal } from '../../components/Panels';

export const AssignedAppointmentsContainer = ({ globalFilters, isTeamMode }) => {
  const { user } = useAuth();
  const { appointments, loading, fetchAppointments } = useAppointments();
  const [showRemark, setShowRemark] = useState(null);

  useEffect(() => {
    if (!user) return;
    const filters = { assignedTo: user._id };
    fetchAppointments(filters);
  }, [fetchAppointments, user]);

  const handleUpdateRemark = (apt) => setShowRemark(apt);

  return (
    <>
      <AssignedAppointmentsPage 
        appointments={appointments} 
        loading={loading} 
        onUpdateRemark={handleUpdateRemark} 
      />
      {showRemark && (
        <UpdateAppointmentRemarkModal 
          appointment={showRemark} 
          onClose={() => setShowRemark(null)} 
          onSaved={() => fetchAppointments({ assignedTo: user._id })} 
        />
      )}
    </>
  );
};
