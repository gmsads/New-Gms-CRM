import React, { useEffect, useState } from 'react';
import { useAppointments } from '../../../hooks/useAppointments';
import { AppointmentsPage } from '../workspaces/AppointmentsPage';
import { useAuth } from '../../../../../context/AuthContext';
import { AssignAppointmentModal, UpdateAppointmentRemarkModal, CreateOrderModal } from '../../Panels';
import { orderApi } from '../../../../../services/api';
import { appointmentApi } from '../../../../../services/api';

export const AppointmentsContainer = ({ globalFilters, isTeamMode }) => {
  const { user } = useAuth();
  const { appointments, loading, fetchAppointments } = useAppointments();
  const [showAssign, setShowAssign] = useState(null);
  const [showCreateOrder, setShowCreateOrder] = useState(null);

  useEffect(() => {
    if (!user) return;
    const filters = isTeamMode 
      ? { salesExec: globalFilters?.employee, search: globalFilters?.search }
      : { createdBy: user._id };
      
    fetchAppointments(filters);
  }, [fetchAppointments, globalFilters, isTeamMode, user]);

  const handleAssign = (apt) => setShowAssign(apt);
  const handleCreateOrder = (apt) => setShowCreateOrder(apt);

  const handleOrderSubmit = async (orderData) => {
    try {
      const res = await orderApi.create(orderData, user.token);
      if (res.success && res.order) {
        await appointmentApi.linkOrder(showCreateOrder._id, { orderId: res.order._id }, user.token);
        setShowCreateOrder(null);
        fetchAppointments();
      }
    } catch (err) {
      alert(err.message || 'Failed to create order');
    }
  };

  return (
    <>
      <AppointmentsPage 
        appointments={appointments} 
        loading={loading} 
        onAssign={handleAssign} 
        onCreateOrder={handleCreateOrder}
      />
      {showAssign && (
        <AssignAppointmentModal 
          appointment={showAssign} 
          onClose={() => setShowAssign(null)} 
          onAssigned={() => fetchAppointments()} 
        />
      )}
      {showCreateOrder && (
        <CreateOrderModal 
          client={showCreateOrder.prospect}
          executiveName={showCreateOrder.assignedTo?.name || user.name}
          onClose={() => setShowCreateOrder(null)}
          onSubmit={handleOrderSubmit}
        />
      )}
    </>
  );
};
