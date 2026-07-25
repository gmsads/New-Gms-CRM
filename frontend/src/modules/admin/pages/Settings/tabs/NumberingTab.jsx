import React from 'react';
import { Hash, AlertCircle } from 'lucide-react';

const NumberingTab = ({ formData, setFormData }) => {
  const updateNumbering = (docType, field, value) => {
    setFormData(prev => ({
      ...prev,
      documentNumbering: {
        ...prev.documentNumbering,
        [docType]: {
          ...(prev.documentNumbering?.[docType] || {}),
          [field]: value
        }
      }
    }));
  };

  const docs = [
    { id: 'quotation', label: 'Quotation' },
    { id: 'order', label: 'Order / Job Card' },
    { id: 'invoice', label: 'Invoice' },
    { id: 'receipt', label: 'Receipt' },
    { id: 'purchaseOrder', label: 'Purchase Order' },
    { id: 'deliveryChallan', label: 'Delivery Challan' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-start border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Document Numbering Engine</h2>
          <p className="text-sm text-slate-500 mt-1">Configure prefixes and starting numbers for all system documents.</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-sm">
        <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
        <div>
          <strong>Important:</strong> Changing the starting number will only affect new documents if the new number is greater than the current sequence. 
          The system auto-formats numbers as <code className="bg-amber-100 px-1 py-0.5 rounded text-xs">[PREFIX][YYYY]-[SEQUENCE]</code> (e.g. QT-2024-001000).
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {docs.map(doc => {
          const config = formData.documentNumbering?.[doc.id] || { prefix: '', startNumber: 1000 };
          return (
            <div key={doc.id} className="border border-slate-200 rounded-xl p-5 bg-slate-50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Hash className="h-4 w-4 text-slate-400" /> {doc.label} Numbering
              </h3>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Prefix</label>
                  <input 
                    value={config.prefix} 
                    onChange={(e) => updateNumbering(doc.id, 'prefix', e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600 font-mono text-sm uppercase bg-white" 
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Start Number</label>
                  <input 
                    type="number"
                    value={config.startNumber} 
                    onChange={(e) => updateNumbering(doc.id, 'startNumber', parseInt(e.target.value) || 0)}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600 font-mono text-sm bg-white" 
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500 font-mono">
                Preview: <span className="font-bold text-indigo-700">{config.prefix}{new Date().getFullYear()}-{String(config.startNumber).padStart(6, '0')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NumberingTab;
