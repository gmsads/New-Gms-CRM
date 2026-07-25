import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const DocumentSettingsTab = ({ formData, setFormData }) => {
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const updateTerm = (index, value) => {
    const newTerms = [...(formData.termsAndConditions || [])];
    newTerms[index] = value;
    setFormData(prev => ({ ...prev, termsAndConditions: newTerms }));
  };

  const addTerm = () => setFormData(prev => ({ ...prev, termsAndConditions: [...(prev.termsAndConditions || []), ''] }));
  const removeTerm = (index) => setFormData(prev => ({ ...prev, termsAndConditions: prev.termsAndConditions.filter((_, i) => i !== index) }));

  return (
    <div className="space-y-8 animate-in fade-in">
      <h2 className="text-xl font-bold text-slate-900 border-b pb-4">Document Settings</h2>
      
      {/* Quotation Defaults */}
      <div>
        <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider">Defaults</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Default Quotation Validity (Days)</label>
            <input 
              type="number"
              name="defaultValidityDays" 
              value={formData.defaultValidityDays || 15} 
              onChange={handleChange} 
              className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Footer Notes (Global)</label>
            <input 
              name="footerNotes" 
              value={formData.footerNotes || ''} 
              onChange={handleChange} 
              placeholder="e.g. This is a computer generated document"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600" 
            />
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Default Terms & Conditions</h3>
          <button 
            onClick={addTerm}
            className="h-8 px-3 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black flex items-center gap-2 hover:bg-indigo-100 transition-colors"
          >
            <Plus className="h-3 w-3" /> ADD TERM
          </button>
        </div>
        
        <div className="space-y-3">
          {(formData.termsAndConditions || []).map((term, index) => (
            <div key={index} className="flex gap-3 items-start group">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 mt-2">
                {index + 1}
              </span>
              <textarea
                value={term}
                onChange={(e) => updateTerm(index, e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 p-3 text-sm min-h-[60px] outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 resize-y"
                placeholder="Enter term or condition..."
              />
              <button 
                onClick={() => removeTerm(index)}
                className="mt-2 p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-red-50"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
          {(!formData.termsAndConditions || formData.termsAndConditions.length === 0) && (
            <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed rounded-xl">
              No default terms added.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentSettingsTab;
