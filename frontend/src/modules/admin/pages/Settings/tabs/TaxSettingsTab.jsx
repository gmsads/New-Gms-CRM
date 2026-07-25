import React from 'react';
import { Percent, Check, AlertCircle } from 'lucide-react';

const TaxSettingsTab = ({ formData, setFormData }) => {
  const tax = formData.taxSettings || {
    enableGst: true,
    defaultGstRate: 18,
    hsnCode: '',
    sacCode: '',
    stateCode: '',
    gstSlabs: []
  };

  const updateTax = (field, value) => {
    setFormData(prev => ({
      ...prev,
      taxSettings: {
        ...(prev.taxSettings || {}),
        [field]: value
      }
    }));
  };

  const toggleSlab = (index) => {
    const newSlabs = [...(tax.gstSlabs || [])];
    newSlabs[index].active = !newSlabs[index].active;
    updateTax('gstSlabs', newSlabs);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-start border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Tax & GST Configuration</h2>
          <p className="text-sm text-slate-500 mt-1">Manage global tax rates, default slabs, and HSN/SAC codes.</p>
        </div>
        
        <label className="flex items-center gap-3 cursor-pointer bg-slate-50 p-2 pr-4 rounded-xl border">
          <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${tax.enableGst ? 'bg-indigo-600' : 'bg-slate-300'}`}>
            <input type="checkbox" className="sr-only" checked={tax.enableGst} onChange={(e) => updateTax('enableGst', e.target.checked)} />
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${tax.enableGst ? 'translate-x-6' : 'translate-x-1'}`} />
          </div>
          <span className="text-sm font-bold text-slate-700">Enable GST Engine</span>
        </label>
      </div>

      <div className={`transition-opacity duration-300 ${tax.enableGst ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        
        {/* Basic Tax Config */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Default GST Rate (%)</label>
            <div className="relative">
              <Percent className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input 
                type="number" 
                value={tax.defaultGstRate} 
                onChange={(e) => updateTax('defaultGstRate', parseFloat(e.target.value) || 0)}
                className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 outline-none focus:border-indigo-600 font-mono bg-white" 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Company State Code (e.g., 27 for MH)</label>
            <input 
              value={tax.stateCode} 
              onChange={(e) => updateTax('stateCode', e.target.value)}
              placeholder="27"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600 font-mono bg-white" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Default HSN/SAC Code</label>
            <input 
              value={tax.hsnCode} 
              onChange={(e) => updateTax('hsnCode', e.target.value)}
              placeholder="e.g. 9983"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600 font-mono bg-white" 
            />
          </div>
        </div>

        {/* GST Slabs */}
        <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider border-b pb-2">Active Tax Slabs</h3>
        <p className="text-xs text-slate-500 mb-4">Select which GST slabs should be available in dropdowns across the CRM.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(tax.gstSlabs || []).map((slab, index) => (
            <div 
              key={index} 
              onClick={() => toggleSlab(index)}
              className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${
                slab.active 
                  ? 'border-indigo-600 bg-indigo-50 shadow-sm shadow-indigo-100' 
                  : 'border-slate-200 bg-white hover:border-indigo-300'
              }`}
            >
              <div className={`h-6 w-6 rounded-full flex items-center justify-center ${slab.active ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-transparent'}`}>
                <Check className="h-4 w-4" />
              </div>
              <div className="text-center">
                <div className={`font-black text-xl ${slab.active ? 'text-indigo-900' : 'text-slate-400'}`}>
                  {slab.rate}%
                </div>
                <div className={`text-xs font-semibold ${slab.active ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {slab.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {tax.gstSlabs?.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-xl text-sm flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              No Tax Slabs are currently defined in the database. The system will seed default Indian GST slabs (0%, 5%, 12%, 18%, 28%) upon saving if the backend provides them.
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TaxSettingsTab;
