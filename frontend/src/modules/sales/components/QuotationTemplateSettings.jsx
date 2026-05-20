import React, { useState, useEffect } from 'react';
import { Building2, Landmark, FileText, CheckCircle, Save, RefreshCw } from 'lucide-react';
import { quotationApi } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

export const QuotationTemplateSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    gstin: '',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      branch: ''
    },
    termsAndConditions: ['']
  });

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const res = await quotationApi.getTemplate(user?.token);
      if (res.success && res.data) {
        setFormData({
          ...res.data,
          bankDetails: res.data.bankDetails || formData.bankDetails,
          termsAndConditions: res.data.termsAndConditions?.length ? res.data.termsAndConditions : ['']
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await quotationApi.updateTemplate(formData, user?.token);
      if (res.success) {
        setToast('Template settings saved successfully!');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const updateTerm = (index, value) => {
    const newTerms = [...formData.termsAndConditions];
    newTerms[index] = value;
    setFormData(prev => ({ ...prev, termsAndConditions: newTerms }));
  };

  const addTerm = () => setFormData(prev => ({ ...prev, termsAndConditions: [...prev.termsAndConditions, ''] }));
  const removeTerm = (index) => setFormData(prev => ({ ...prev, termsAndConditions: prev.termsAndConditions.filter((_, i) => i !== index) }));

  if (loading) {
    return <div className="flex justify-center items-center h-64"><RefreshCw className="h-8 w-8 text-blue-600 animate-spin" /></div>;
  }

  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden p-10 animate-in fade-in duration-500">
      {toast && (
        <div className="fixed top-24 right-8 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-8">
          <CheckCircle className="h-5 w-5" /> {toast}
        </div>
      )}
      
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">PDF Template Settings</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Configure company details and banking info used in generated quotations</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="h-12 px-8 bg-blue-600 text-white rounded-[1.5rem] font-black text-sm flex items-center gap-2 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-200 disabled:opacity-70 disabled:hover:scale-100"
        >
          <Save className="h-5 w-5" /> {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Company Details */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Company Identity</h3>
          </div>
          
          <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Company Name</label>
              <input type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full h-12 bg-white border border-slate-200 rounded-2xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Address</label>
              <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none min-h-[80px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Contact Email</label>
                <input type="email" value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} className="w-full h-12 bg-white border border-slate-200 rounded-2xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Contact Phone</label>
                <input type="text" value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} className="w-full h-12 bg-white border border-slate-200 rounded-2xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Website</label>
                <input type="text" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="w-full h-12 bg-white border border-slate-200 rounded-2xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">GSTIN</label>
                <input type="text" value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} className="w-full h-12 bg-white border border-slate-200 rounded-2xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </div>
            </div>
          </div>
        </div>

        {/* Banking & Terms */}
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Landmark className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Bank Details</h3>
            </div>
            
            <div className="space-y-4 bg-emerald-50/30 p-6 rounded-3xl border border-emerald-100/50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Account Name</label>
                  <input type="text" value={formData.bankDetails.accountName} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails, accountName: e.target.value}})} className="w-full h-12 bg-white border border-slate-200 rounded-2xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Account Number</label>
                  <input type="text" value={formData.bankDetails.accountNumber} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails, accountNumber: e.target.value}})} className="w-full h-12 bg-white border border-slate-200 rounded-2xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Bank Name</label>
                  <input type="text" value={formData.bankDetails.bankName} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails, bankName: e.target.value}})} className="w-full h-12 bg-white border border-slate-200 rounded-2xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">IFSC Code</label>
                  <input type="text" value={formData.bankDetails.ifscCode} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails, ifscCode: e.target.value}})} className="w-full h-12 bg-white border border-slate-200 rounded-2xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Branch</label>
                  <input type="text" value={formData.bankDetails.branch} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails, branch: e.target.value}})} className="w-full h-12 bg-white border border-slate-200 rounded-2xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Terms & Conditions</h3>
              </div>
              <button onClick={addTerm} className="text-xs font-bold text-blue-600 hover:underline">
                + Add Term
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.termsAndConditions.map((term, index) => (
                <div key={index} className="flex gap-2">
                  <span className="h-12 w-8 flex items-center justify-center text-xs font-black text-slate-400">{index + 1}.</span>
                  <input 
                    type="text" 
                    value={term} 
                    onChange={e => updateTerm(index, e.target.value)} 
                    className="flex-1 h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500/20 transition-all" 
                    placeholder="Enter condition..."
                  />
                  {formData.termsAndConditions.length > 1 && (
                    <button onClick={() => removeTerm(index)} className="h-12 w-12 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-all">
                      X
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
