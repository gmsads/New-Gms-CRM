import React, { useState, useEffect } from 'react';
import { 
  Building2, Landmark, FileText, CheckCircle, Save, 
  RefreshCw, Upload, Sparkles, QrCode, Calendar, Info
} from 'lucide-react';
import { quotationApi } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const QuotationBrandingChanges = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  
  // -- Branding Settings Form --
  const [formData, setFormData] = useState({
    companyName: 'GMS CRM Ltd.',
    address: '123 Business Avenue, Tech Park',
    contactEmail: 'billing@gms.com',
    contactPhone: '+91 98765 43210',
    website: 'www.gms.com',
    gstin: '27AABCU9603R1ZX',
    panNumber: 'AABCU9603R',
    logoUrl: '',
    authorizedSignatureUrl: '',
    bankDetails: {
      accountName: 'GMS ADVERTISING PRIVATE LIMITED',
      accountNumber: '50200088735232',
      bankName: 'HDFC BANK',
      ifscCode: 'HDFC0000047',
      branch: 'S.P Road Branch'
    },
    qrCode: {
      enabled: true,
      upiId: 'gms@upi'
    },
    termsAndConditions: [
      '50% Advance payment required',
      'Delivery within 10 working days'
    ],
    footerNotes: 'Thank you for your business!',
    defaultValidityDays: 15
  });

  // -- Load Config --
  const fetchConfig = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const res = await quotationApi.getTemplate(user.token);
      if (res.success && res.data) {
        setFormData({
          ...res.data,
          bankDetails: res.data.bankDetails || formData.bankDetails,
          qrCode: res.data.qrCode || formData.qrCode,
          termsAndConditions: res.data.termsAndConditions?.length ? res.data.termsAndConditions : [''],
          defaultValidityDays: res.data.defaultValidityDays || 15
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [user]);

  // -- Upload Simulation helper --
  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          [field]: reader.result // Base64 encoding for logo/signature
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // -- Save --
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await quotationApi.updateTemplate(formData, user?.token);
      if (res.success) {
        setToast('Global quotation branding saved successfully!');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save settings: ' + err.message);
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
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // Mock items list for preview sheet
  const previewItems = [
    { name: 'Branding & Identity Package', quantity: 1, unitCost: 45000, totalCost: 45000 },
    { name: 'Corporate Website Development', quantity: 1, unitCost: 35000, totalCost: 35000 },
    { name: 'Social Media Management (1 Month)', quantity: 1, unitCost: 15000, totalCost: 15000 }
  ];
  const subtotal = previewItems.reduce((acc, i) => acc + i.totalCost, 0);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {toast && (
        <div className="fixed top-24 right-8 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-8">
          <CheckCircle className="h-5 w-5" /> {toast}
        </div>
      )}
      
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Quotation Template Config</h1>
          <p className="text-slate-500 mt-1 font-medium">Configure corporate identity headers, logotypes, payment bank keys, and defaults globally</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="h-12 px-8 bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm flex items-center gap-2 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-200 disabled:opacity-70 disabled:hover:scale-100"
        >
          <Save className="h-5 w-5" /> {saving ? 'Saving...' : 'Save Branding Changes'}
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* Left Side: Fields Config Form */}
        <div className="flex-[3] space-y-8 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
          
          {/* Section 1: Company Identity */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Corporate Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Company Name</label>
                <input 
                  type="text" 
                  value={formData.companyName} 
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                  className="w-full h-11 bg-slate-50 border-0 rounded-2xl px-4 text-xs font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner" 
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Address</label>
                <input 
                  type="text" 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full h-11 bg-slate-50 border-0 rounded-2xl px-4 text-xs font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner" 
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">GSTIN Number</label>
                <input 
                  type="text" 
                  value={formData.gstin} 
                  onChange={e => setFormData({...formData, gstin: e.target.value})}
                  className="w-full h-11 bg-slate-50 border-0 rounded-2xl px-4 text-xs font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner" 
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">PAN Number</label>
                <input 
                  type="text" 
                  value={formData.panNumber} 
                  onChange={e => setFormData({...formData, panNumber: e.target.value})}
                  className="w-full h-11 bg-slate-50 border-0 rounded-2xl px-4 text-xs font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner" 
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Contact Email</label>
                <input 
                  type="email" 
                  value={formData.contactEmail || formData.email} 
                  onChange={e => setFormData({...formData, contactEmail: e.target.value, email: e.target.value})}
                  className="w-full h-11 bg-slate-50 border-0 rounded-2xl px-4 text-xs font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner" 
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Contact Phone</label>
                <input 
                  type="text" 
                  value={formData.contactPhone || formData.mobile} 
                  onChange={e => setFormData({...formData, contactPhone: e.target.value, mobile: e.target.value})}
                  className="w-full h-11 bg-slate-50 border-0 rounded-2xl px-4 text-xs font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner" 
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Corporate Website</label>
                <input 
                  type="text" 
                  value={formData.website} 
                  onChange={e => setFormData({...formData, website: e.target.value})}
                  className="w-full h-11 bg-slate-50 border-0 rounded-2xl px-4 text-xs font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner" 
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Default Validity (Days)</label>
                <input 
                  type="number" 
                  value={formData.defaultValidityDays} 
                  onChange={e => setFormData({...formData, defaultValidityDays: Number(e.target.value)})}
                  className="w-full h-11 bg-slate-50 border-0 rounded-2xl px-4 text-xs font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner" 
                />
              </div>
            </div>

            {/* Logo and Signature upload fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="border border-dashed border-slate-200 rounded-3xl p-6 bg-slate-55/20 flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Corporate Logo</span>
                {formData.logoUrl ? (
                  <div className="relative mb-3 group">
                    <img src={formData.logoUrl} alt="Logo" className="h-16 object-contain border rounded-xl p-2 bg-white" />
                    <button 
                      onClick={() => setFormData({...formData, logoUrl: ''})}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-3">
                    <Upload className="h-6 w-6" />
                  </div>
                )}
                <label className="h-9 px-4 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-indigo-100 transition-colors">
                  Choose Image
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logoUrl')} />
                </label>
              </div>

              <div className="border border-dashed border-slate-200 rounded-3xl p-6 bg-slate-55/20 flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Signatory Signature</span>
                {formData.authorizedSignatureUrl ? (
                  <div className="relative mb-3 group">
                    <img src={formData.authorizedSignatureUrl} alt="Signature" className="h-16 object-contain border rounded-xl p-2 bg-white" />
                    <button 
                      onClick={() => setFormData({...formData, authorizedSignatureUrl: ''})}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-3">
                    <Upload className="h-6 w-6" />
                  </div>
                )}
                <label className="h-9 px-4 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-indigo-100 transition-colors">
                  Choose Image
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'authorizedSignatureUrl')} />
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Bank Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Landmark className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Banking Particulars</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/10 p-6 rounded-3xl border border-emerald-100/50">
              <div className="col-span-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Account Beneficiary Name</label>
                <input 
                  type="text" 
                  value={formData.bankDetails.accountName} 
                  onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails, accountName: e.target.value}})}
                  className="w-full h-11 bg-white border border-slate-200 rounded-2xl px-4 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm" 
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Account Number</label>
                <input 
                  type="text" 
                  value={formData.bankDetails.accountNumber} 
                  onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails, accountNumber: e.target.value}})}
                  className="w-full h-11 bg-white border border-slate-200 rounded-2xl px-4 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm" 
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Bank Name</label>
                <input 
                  type="text" 
                  value={formData.bankDetails.bankName} 
                  onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails, bankName: e.target.value}})}
                  className="w-full h-11 bg-white border border-slate-200 rounded-2xl px-4 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm" 
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">IFSC Code</label>
                <input 
                  type="text" 
                  value={formData.bankDetails.ifscCode} 
                  onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails, ifscCode: e.target.value}})}
                  className="w-full h-11 bg-white border border-slate-200 rounded-2xl px-4 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm" 
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Branch</label>
                <input 
                  type="text" 
                  value={formData.bankDetails.branch} 
                  onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails, branch: e.target.value}})}
                  className="w-full h-11 bg-white border border-slate-200 rounded-2xl px-4 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm" 
                />
              </div>
            </div>
          </div>

          {/* Section 3: QR Code & Terms */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900">QR Code & Terms</h3>
            </div>

            <div className="space-y-4 bg-amber-50/10 p-6 rounded-3xl border border-amber-100/50">
              <div className="flex items-center gap-4 border-b pb-4">
                <label className="flex items-center gap-2 font-bold text-slate-800 text-xs cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.qrCode.enabled} 
                    onChange={e => setFormData({...formData, qrCode: {...formData.qrCode, enabled: e.target.checked}})}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600" 
                  />
                  Enable Scan-to-pay UPI QR on document
                </label>
              </div>
              {formData.qrCode.enabled && (
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">UPI ID for Pay QR</label>
                  <input 
                    type="text" 
                    value={formData.qrCode.upiId} 
                    onChange={e => setFormData({...formData, qrCode: {...formData.qrCode, upiId: e.target.value}})}
                    className="w-full h-11 bg-white border border-slate-200 rounded-2xl px-4 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500/20 transition-all" 
                  />
                </div>
              )}
            </div>

            {/* Terms array */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Terms and Conditions</h4>
                <button onClick={addTerm} className="text-xs font-bold text-indigo-600 hover:underline">
                  + Add Condition Row
                </button>
              </div>
              <div className="space-y-3">
                {formData.termsAndConditions.map((term, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="h-10 w-6 flex items-center justify-center font-black text-slate-400 text-xs">{index + 1}.</span>
                    <input 
                      type="text" 
                      value={term} 
                      onChange={e => updateTerm(index, e.target.value)} 
                      className="flex-1 h-11 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-xs font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/25" 
                      placeholder="Enter legal terms..."
                    />
                    {formData.termsAndConditions.length > 1 && (
                      <button 
                        onClick={() => removeTerm(index)} 
                        className="h-11 w-11 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center font-bold"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Footer Notes</label>
              <textarea 
                value={formData.footerNotes} 
                onChange={e => setFormData({...formData, footerNotes: e.target.value})}
                className="w-full h-20 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/25 resize-none shadow-inner" 
                placeholder="Include friendly signature notes or greeting..."
              />
            </div>
          </div>
        </div>

        {/* Right Side: Centralized A4 Live Document Preview Panel */}
        <div className="flex-[2] bg-slate-100 p-8 rounded-[2.5rem] border border-slate-200/50 flex flex-col items-center">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 text-center">Live Preview Sheet</h4>
          
          <div className="bg-white shadow-2xl rounded-sm aspect-[1/1.414] w-full p-8 flex flex-col border border-slate-200 text-[10px]">
            {/* Header branding */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-3 items-start">
                {formData.logoUrl && (
                  <img src={formData.logoUrl} alt="Logo" className="h-10 object-contain max-w-[80px]" />
                )}
                <div>
                  <h1 className="text-lg font-black text-slate-900 tracking-tighter">{formData.companyName || 'COMPANY NAME'}</h1>
                  <p className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{formData.address || 'COMPANY ADDRESS'}</p>
                  <p className="text-[7px] font-bold text-slate-500 mt-1">
                    {formData.contactEmail || 'EMAIL'} | {formData.contactPhone || 'PHONE'} | {formData.website || 'WEBSITE'}
                  </p>
                  {formData.gstin && (
                    <p className="text-[7px] font-bold text-slate-500 mt-0.5">GSTIN: {formData.gstin}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-900 uppercase">#PREVIEW</p>
                <p className="text-[7px] font-bold text-slate-400 uppercase mt-0.5">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Client address template */}
            <div className="grid grid-cols-2 gap-4 mb-6 border-y py-4 border-slate-100 text-[9px]">
              <div>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Client Details</p>
                <p className="text-[9px] font-black text-slate-900 mt-1">Client Entity Name</p>
                <p className="text-[8px] font-bold text-slate-500">Corporate Office Address</p>
              </div>
              <div className="text-right">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Contact Person</p>
                <p className="text-[9px] font-black text-slate-900 mt-1">+91 98765 43210</p>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1">
              <table className="w-full text-[9px]">
                <thead>
                  <tr className="border-b-2 border-slate-900">
                    <th className="py-2 text-left">DESCRIPTION</th>
                    <th className="py-2 text-center">QTY</th>
                    <th className="py-2 text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {previewItems.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-black text-slate-700">{it.name}</td>
                      <td className="py-2 text-center text-slate-500">{it.quantity}</td>
                      <td className="py-2 text-right font-bold text-slate-900">₹{it.totalCost.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-[9px]">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase">Subtotal</span>
                <span className="font-black text-slate-900">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-900 mt-2">
                <span className="text-xs font-black uppercase tracking-widest">Total Amount</span>
                <span className="text-lg font-black text-blue-600">₹{subtotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Signature Block & Bank Details */}
            <div className="mt-6 grid grid-cols-3 gap-4 text-[7px] border-t pt-4 border-slate-100">
              {formData.bankDetails ? (
                <div>
                  <p className="font-black text-slate-400 uppercase tracking-widest mb-1">Bank details</p>
                  <p className="font-bold text-slate-800">{formData.bankDetails.accountName}</p>
                  <p className="text-slate-500">A/C: {formData.bankDetails.accountNumber}</p>
                  <p className="text-slate-500">{formData.bankDetails.bankName} - IFSC: {formData.bankDetails.ifscCode}</p>
                </div>
              ) : <div />}
              
              {formData.termsAndConditions?.length ? (
                <div>
                  <p className="font-black text-slate-400 uppercase tracking-widest mb-1">Terms & Conditions</p>
                  <p className="text-slate-500 whitespace-pre-line leading-relaxed">
                    {formData.termsAndConditions.filter(t => t.trim()).map((t, i) => `${i + 1}. ${t}`).join('\n')}
                  </p>
                </div>
              ) : <div />}

              <div className="text-right flex flex-col items-end justify-end">
                <p className="font-black text-slate-400 uppercase tracking-widest mb-1">Authorized Signatory</p>
                {formData.authorizedSignatureUrl ? (
                  <img src={formData.authorizedSignatureUrl} alt="Signature" className="h-8 object-contain my-1" />
                ) : (
                  <div className="h-8" />
                )}
                <p className="font-bold text-slate-800">For {formData.companyName}</p>
              </div>
            </div>

            {/* Footer notes */}
            {formData.footerNotes && (
              <div className="mt-4 pt-4 border-t text-center text-slate-400 text-[6px] font-bold uppercase tracking-wide">
                {formData.footerNotes}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationBrandingChanges;
