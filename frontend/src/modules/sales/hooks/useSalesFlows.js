import { useState } from 'react';
import { prospectApi, orderApi, paymentApi, brochureApi } from '../../../services/api';

export const useProspectFlow = (user, onSaved) => {
  const [showPhoneSearch, setShowPhoneSearch] = useState(false);
  const [showProspectDetails, setShowProspectDetails] = useState(null);
  const [showCreateProspect, setShowCreateProspect] = useState(null);
  const [showQuotation, setShowQuotation] = useState(null);
  const [showUpdateStatus, setShowUpdateStatus] = useState(null);
  const [showScheduleAppointment, setShowScheduleAppointment] = useState(null);
  const [showBrochureSelector, setShowBrochureSelector] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const handlePhoneSearch = async (searchParams) => {
    setShowPhoneSearch(false);
    try {
      const res = await prospectApi.searchPhone(searchParams, user?.token);
      if (res.found && res.data) {
        setShowProspectDetails(res.data);
      } else {
        setShowCreateProspect({ phone: searchParams.phone, company: searchParams.company });
      }
    } catch (err) {
      setToastMsg('Error searching prospect');
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleProspectSubmit = async (formData) => {
    try {
      const payload = {
        name: formData.name,
        company: formData.company,
        phone: formData.phone,
        source: formData.source,
        priority: formData.priority,
        clientType: formData.clientType,
        requirement: { 
          service: formData.products ? formData.products.join(', ') : '', 
          notes: formData.notes, 
          location: formData.location, 
          budget: formData.budget 
        },
        nextFollowUpDate: formData.nextFollowUpDate || undefined,
      };

      if (showCreateProspect?._id || showCreateProspect?.id) {
        await prospectApi.update(showCreateProspect._id || showCreateProspect.id, payload, user?.token);
        setToastMsg('Prospect updated successfully!');
      } else {
        await prospectApi.create(payload, user?.token);
        setToastMsg('Prospect submitted successfully!');
      }
      setShowCreateProspect(null);
      setTimeout(() => setToastMsg(null), 3000);
      if (onSaved) onSaved();
    } catch (err) {
      setToastMsg(err.message || 'Failed to save prospect');
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const handleUpdateStage = async (id, val, field, p) => {
    if (field === 'status') {
      setShowUpdateStatus({ ...p, newStatus: val });
      return;
    }
    // Handle other status updates if needed
  };

  const handleStatusSubmit = async (formData) => {
    try {
      await prospectApi.moveStage(showUpdateStatus._id || showUpdateStatus.id, formData, user?.token);
      setToastMsg('Status updated!');
      setShowUpdateStatus(null);
      setTimeout(() => setToastMsg(null), 3000);
      if (onSaved) onSaved();
    } catch (err) {
      setToastMsg(err.message || 'Failed to update status');
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const handleDeleteProspect = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prospect?')) return;
    try {
      await prospectApi.delete(id, user?.token);
      setToastMsg('Prospect deleted');
      setTimeout(() => setToastMsg(null), 3000);
      if (onSaved) onSaved();
    } catch (err) {
      setToastMsg('Error deleting prospect');
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleQuotationSubmit = async (data) => {
    try {
      // In real app, this might call an API to generate PDF or just log the interaction
      // For now, we simulate WhatsApp trigger as per legacy
      const text = `Hi ${data.prospect.name}, Please find the quotation for your requirement. Total: ₹${data.total}.`;
      window.open(`https://wa.me/${data.prospect.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
      
      await prospectApi.addInteraction(data.prospect._id || data.prospect.id, {
        type: 'WhatsApp',
        notes: `Sent Quotation: ₹${data.total}`,
        action: 'Quotation'
      }, user?.token);
      
      setToastMsg('Quotation sent & logged!');
      setShowQuotation(null);
      setTimeout(() => setToastMsg(null), 3000);
      if (onSaved) onSaved();
    } catch (err) {
      setToastMsg('Error sending quotation');
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleBrochureSend = async (brochure, prospect) => {
    try {
      await brochureApi.send({ 
        brochureId: brochure._id, 
        clientPhone: prospect.phone,
        clientName: prospect.name 
      }, user?.token);
      
      setToastMsg(`Catalog "${brochure.title}" sent successfully!`);
      setShowBrochureSelector(null);
      setTimeout(() => setToastMsg(null), 3000);
      if (onSaved) onSaved();
    } catch (err) {
      setToastMsg('Failed to send catalog');
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  return { 
    showPhoneSearch, setShowPhoneSearch, 
    showProspectDetails, setShowProspectDetails, 
    showCreateProspect, setShowCreateProspect, 
    showQuotation, setShowQuotation, 
    showUpdateStatus, setShowUpdateStatus, 
    showScheduleAppointment, setShowScheduleAppointment, 
    showBrochureSelector, setShowBrochureSelector,
    toastMsg, setToastMsg,
    handlePhoneSearch, handleProspectSubmit, handleUpdateStage, handleStatusSubmit, handleQuotationSubmit, handleDeleteProspect, handleBrochureSend
  };
};

export const useOrderFlow = (user, onSaved) => {
  const [showOrderSearch, setShowOrderSearch] = useState(false);
  const [showOrderClientDetails, setShowOrderClientDetails] = useState(null);
  const [showCreateOrder, setShowCreateOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const handleOrderSearch = async (searchParams) => {
    setShowOrderSearch(false);
    try {
      const res = await orderApi.searchClient(searchParams, user?.token);
      if (res && res.found && res.data) {
        setShowOrderClientDetails(res.data);
      } else {
        setShowCreateOrder(searchParams);
      }
    } catch (err) {
      setShowCreateOrder(searchParams);
    }
  };

  const handleOrderSubmit = async (formData) => {
    try {
      await orderApi.create(formData, user?.token);
      setToastMsg('Order created successfully!');
      setShowCreateOrder(null);
      setTimeout(() => setToastMsg(null), 3000);
      if (onSaved) onSaved();
    } catch (err) {
      console.error('[ORDER_SUBMIT_ERROR]', err);
      setToastMsg(err.message || 'Failed to create order');
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handlePaymentSubmit = async (paymentData) => {
    try {
      await paymentApi.create({
        orderId: paymentOrder._id || paymentOrder.id,
        ...paymentData
      }, user?.token);
      setToastMsg('Payment submitted for verification!');
      setPaymentOrder(null);
      setTimeout(() => setToastMsg(null), 3000);
      if (onSaved) onSaved();
    } catch (err) {
      setToastMsg(err.message || 'Payment submission failed');
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  return { 
    showOrderSearch, setShowOrderSearch, 
    showOrderClientDetails, setShowOrderClientDetails, 
    showCreateOrder, setShowCreateOrder, 
    selectedOrder, setSelectedOrder, 
    paymentOrder, setPaymentOrder, 
    toastMsg, setToastMsg,
    handleOrderSearch, handleOrderSubmit, handlePaymentSubmit
  };
};
