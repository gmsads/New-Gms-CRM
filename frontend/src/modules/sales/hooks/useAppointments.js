import { useState, useCallback } from 'react';
import { appointmentApi } from '../../../services/api';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

export const useAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAppointments = useCallback(async (filters = {}) => {
    if (!user?.token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentApi.list(filters, user.token);
      if (res.success) {
        setAppointments(res.data || []);
      } else {
        setError(res.message || 'Failed to fetch appointments');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching appointments');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateRemark = useCallback(async (id, data) => {
    if (!user?.token) return false;
    try {
      const res = await appointmentApi.updateRemark(id, data, user.token);
      return res.success;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, [user]);

  const assignAppointment = useCallback(async (id, data) => {
    if (!user?.token) return false;
    try {
      const res = await appointmentApi.assign(id, data, user.token);
      return res.success;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, [user]);

  // Handle rescheduling
  const rescheduleAppointment = useCallback(async (id, data) => {
    if (!user?.token) return false;
    try {
      const res = await api.patch(`/appointments/${id}/reschedule`, data, user.token);
      return res.success;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, [user]);

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    updateRemark,
    assignAppointment,
    rescheduleAppointment,
  };
};
