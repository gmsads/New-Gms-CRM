import React from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';

const BankAccountsTab = ({ formData, setFormData }) => {
  const accounts = formData.bankAccounts || [];

  const addAccount = () => {
    setFormData(prev => ({
      ...prev,
      bankAccounts: [
        ...accounts,
        {
          accountName: '', bankName: '', branch: '', accountNumber: '', 
          ifsc: '', upiId: '', active: true, isDefault: accounts.length === 0
        }
      ]
    }));
  };

  const removeAccount = (index) => {
    const newAccounts = accounts.filter((_, i) => i !== index);
    // If we removed the default, make the first one default
    if (accounts[index]?.isDefault && newAccounts.length > 0) {
      newAccounts[0].isDefault = true;
    }
    setFormData(prev => ({ ...prev, bankAccounts: newAccounts }));
  };

  const updateAccount = (index, field, value) => {
    const newAccounts = [...accounts];
    newAccounts[index][field] = value;
    
    // Handle radio button for default
    if (field === 'isDefault' && value === true) {
      newAccounts.forEach((acc, i) => {
        if (i !== index) acc.isDefault = false;
      });
    }
    
    setFormData(prev => ({ ...prev, bankAccounts: newAccounts }));
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-bold text-slate-900">Bank Accounts</h2>
        <button 
          onClick={addAccount}
          className="h-9 px-4 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-black flex items-center gap-2 hover:bg-emerald-100 transition-colors"
        >
          <Plus className="h-4 w-4" /> ADD BANK ACCOUNT
        </button>
      </div>

      <div className="space-y-6">
        {accounts.length === 0 ? (
          <div className="text-center py-12 text-slate-500 border-2 border-dashed rounded-xl">
            No bank accounts added yet. Add one to show on invoices and quotations.
          </div>
        ) : (
          accounts.map((acc, index) => (
            <div key={index} className={`p-5 rounded-2xl border-2 transition-all ${acc.isDefault ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 bg-white'}`}>
              <div className="flex justify-between items-start mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="defaultBank" 
                    checked={acc.isDefault} 
                    onChange={() => updateAccount(index, 'isDefault', true)}
                    className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className={`text-sm font-bold ${acc.isDefault ? 'text-emerald-700' : 'text-slate-600'}`}>
                    Default Account {acc.isDefault && <CheckCircle2 className="inline h-4 w-4 ml-1" />}
                  </span>
                </label>
                
                <button onClick={() => removeAccount(index)} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Name</label>
                  <input 
                    value={acc.accountName} 
                    onChange={(e) => updateAccount(index, 'accountName', e.target.value)}
                    placeholder="e.g. GMS CRM Ltd"
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600 bg-white" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                  <input 
                    value={acc.bankName} 
                    onChange={(e) => updateAccount(index, 'bankName', e.target.value)}
                    placeholder="e.g. HDFC Bank"
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600 bg-white" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
                  <input 
                    value={acc.accountNumber} 
                    onChange={(e) => updateAccount(index, 'accountNumber', e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600 bg-white font-mono" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
                  <input 
                    value={acc.ifsc} 
                    onChange={(e) => updateAccount(index, 'ifsc', e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600 bg-white uppercase font-mono" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Branch</label>
                  <input 
                    value={acc.branch} 
                    onChange={(e) => updateAccount(index, 'branch', e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600 bg-white" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID</label>
                  <input 
                    value={acc.upiId} 
                    onChange={(e) => updateAccount(index, 'upiId', e.target.value)}
                    placeholder="e.g. gms@okhdfcbank"
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600 bg-white" 
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BankAccountsTab;
