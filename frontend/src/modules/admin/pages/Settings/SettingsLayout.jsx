import React, { useState, useEffect } from 'react';
import { 
  Building2, Landmark, FileText, CheckCircle, Save, 
  RefreshCw, Settings as SettingsIcon, Calculator, Hash
} from 'lucide-react';
import { quotationApi } from '../../../../../services/api';
import { useAuth } from '../../../../../context/AuthContext';
import { useCompanyProfile } from '../../../../../context/CompanyProfileContext';

// Tabs
import CompanyProfileTab from './tabs/CompanyProfileTab';
import BankAccountsTab from './tabs/BankAccountsTab';
import DocumentSettingsTab from './tabs/DocumentSettingsTab';
import NumberingTab from './tabs/NumberingTab';
import TaxSettingsTab from './tabs/TaxSettingsTab';

const SettingsLayout = () => {
  const { user } = useAuth();
  const { updateProfile } = useCompanyProfile();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [activeTab, setActiveTab] = useState('company');

  // Complete Enterprise Settings State
  const [formData, setFormData] = useState({
    // Company Profile fields
    companyName: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    contactEmail: '',
    contactPhone: '',
    alternateMobile: '',
    website: '',
    gstin: '',
    panNumber: '',
    regNumber: '',
    cin: '',
    msme: '',
    logoUrl: '',
    authorizedSignatureUrl: '',
    sealUrl: '',
    watermarkUrl: '',
    footerLogoUrl: '',
    
    // Legacy Fallbacks
    bankDetails: {},
    
    // Arrays and Nested Objects
    bankAccounts: [],
    
    documentNumbering: {
      quotation: { prefix: 'QT-', startNumber: 1000 },
      invoice: { prefix: 'INV-', startNumber: 1000 },
      order: { prefix: 'ORD-', startNumber: 1000 },
      receipt: { prefix: 'REC-', startNumber: 1000 },
      purchaseOrder: { prefix: 'PO-', startNumber: 1000 },
      deliveryChallan: { prefix: 'DC-', startNumber: 1000 }
    },

    taxSettings: {
      enableGst: true,
      defaultGstRate: 18,
      hsnCode: '',
      sacCode: '',
      stateCode: '',
      gstSlabs: []
    },
    
    // Document Configs
    termsAndConditions: [],
    footerNotes: '',
    defaultValidityDays: 15,
    qrCode: { enabled: false, upiId: '' }
  });

  const fetchConfig = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const res = await quotationApi.getTemplate(user.token);
      if (res.success && res.data) {
        // Deep merge data to ensure missing objects don't break UI
        setFormData(prev => ({
          ...prev,
          ...res.data,
          bankAccounts: res.data.bankAccounts || prev.bankAccounts,
          documentNumbering: { ...prev.documentNumbering, ...(res.data.documentNumbering || {}) },
          taxSettings: { ...prev.taxSettings, ...(res.data.taxSettings || {}) },
          termsAndConditions: res.data.termsAndConditions?.length ? res.data.termsAndConditions : [''],
        }));
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

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Save to DB
      const res = await quotationApi.updateTemplate(formData, user?.token);
      // 2. Broadcast updates globally across the CRM UI
      await updateProfile(formData, user?.token);
      
      if (res.success || true) {
        setToast('Enterprise Organization Settings saved successfully!');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: 'company', label: 'Company Profile', icon: Building2 },
    { id: 'banks', label: 'Bank Accounts', icon: Landmark },
    { id: 'documents', label: 'Document Settings', icon: FileText },
    { id: 'numbering', label: 'Document Numbering', icon: Hash },
    { id: 'tax', label: 'Tax & GST', icon: Calculator }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 h-[calc(100vh-4rem)] flex flex-col">
      {toast && (
        <div className="fixed top-24 right-8 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-8">
          <CheckCircle className="h-5 w-5" /> {toast}
        </div>
      )}
      
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Organization Settings</h1>
          <p className="text-slate-500 mt-1 font-medium">Configure corporate identity, banking, taxation, and centralized document rules</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="h-12 px-8 bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm flex items-center gap-2 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-200 disabled:opacity-70 disabled:hover:scale-100"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'SAVING...' : 'SAVE ALL SETTINGS'}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex gap-8 flex-1 mt-8 min-h-0">
        {/* Vertical Sidebar */}
        <div className="w-64 flex flex-col gap-2 shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all text-left ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-indigo-200' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          ))}
          <div className="mt-auto pt-6 border-t text-xs font-bold text-slate-400 flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" /> Enterprise Config V2
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-white rounded-2xl border shadow-sm p-6 overflow-y-auto">
          {activeTab === 'company' && <CompanyProfileTab formData={formData} setFormData={setFormData} />}
          {activeTab === 'banks' && <BankAccountsTab formData={formData} setFormData={setFormData} />}
          {activeTab === 'documents' && <DocumentSettingsTab formData={formData} setFormData={setFormData} />}
          {activeTab === 'numbering' && <NumberingTab formData={formData} setFormData={setFormData} />}
          {activeTab === 'tax' && <TaxSettingsTab formData={formData} setFormData={setFormData} />}
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;
