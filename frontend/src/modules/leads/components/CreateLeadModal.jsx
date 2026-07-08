import React, { useState, useEffect } from 'react';
import { X, Building2, User, Phone, Mail, MapPin, Tag, Flag, Megaphone, FileText, PhoneCall, Check } from 'lucide-react';

/**
 * CreateLeadModal.jsx
 * Professional Enterprise Modal for creating a new Lead.
 * Consistent with existing CRM design system.
 */
export default function CreateLeadModal({ isOpen, onClose, onSave, campaigns = [] }) {
  const initialForm = {
    companyName: '',
    contactPerson: '',
    phone: '',
    alternatePhone: '',
    email: '',
    businessName: '',
    businessCategory: '',
    address: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    source: 'Website',
    priority: 'Medium',
    campaign: '',
    remark: ''
  };

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(initialForm);
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e, callAfter = false) => {
    e.preventDefault();
    if (!form.contactPerson || !form.phone) {
      alert('Please fill in mandatory fields: Contact Person and Mobile Number (*)');
      return;
    }

    setSubmitting(true);
    try {
      await onSave(form, callAfter);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Create New Lead</h2>
              <p className="text-[11px] text-muted-foreground">Add customer acquisition record to your desk</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6 text-xs">
          
          {/* Section 1: Lead Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-1.5 border-b pb-1.5">
              <User className="h-3.5 w-3.5 text-primary" /> Lead Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-foreground">Company Name</label>
                <input type="text" name="companyName" value={form.companyName} onChange={handleChange} placeholder="e.g. Acme Corp (Optional)" className="w-full mt-1 p-2 border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/30 outline-none" />
              </div>

              <div>
                <label className="font-semibold text-foreground">Contact Person *</label>
                <input required type="text" name="contactPerson" value={form.contactPerson} onChange={handleChange} placeholder="e.g. John Doe" className="w-full mt-1 p-2 border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/30 outline-none" />
              </div>

              <div>
                <label className="font-semibold text-foreground">Mobile Number *</label>
                <input required type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="10 digit mobile" className="w-full mt-1 p-2 border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/30 outline-none font-mono" />
              </div>

              <div>
                <label className="font-medium text-muted-foreground">Alternate Mobile</label>
                <input type="tel" name="alternatePhone" value={form.alternatePhone} onChange={handleChange} placeholder="Optional number" className="w-full mt-1 p-2 border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/30 outline-none font-mono" />
              </div>

              <div>
                <label className="font-medium text-muted-foreground">Email Address</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="customer@company.com" className="w-full mt-1 p-2 border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/30 outline-none" />
              </div>

              <div>
                <label className="font-medium text-muted-foreground">Business Name</label>
                <input type="text" name="businessName" value={form.businessName} onChange={handleChange} placeholder="Registered entity" className="w-full mt-1 p-2 border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/30 outline-none" />
              </div>

              <div>
                <label className="font-medium text-muted-foreground">Business Category</label>
                <input type="text" name="businessCategory" value={form.businessCategory} onChange={handleChange} placeholder="e.g. Manufacturing, Retail" className="w-full mt-1 p-2 border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/30 outline-none" />
              </div>

              <div>
                <label className="font-semibold text-foreground">Lead Source</label>
                <select name="source" value={form.source} onChange={handleChange} className="w-full mt-1 p-2 border rounded-xl bg-background text-foreground font-medium outline-none">
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Cold Call">Cold Call</option>
                  <option value="IndiaMart">IndiaMart</option>
                  <option value="TradeIndia">TradeIndia</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Google Ads">Google Ads</option>
                  <option value="Exhibition">Exhibition</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">Priority</label>
                <select name="priority" value={form.priority} onChange={handleChange} className="w-full mt-1 p-2 border rounded-xl bg-background text-foreground font-bold outline-none">
                  <option value="Low" className="text-slate-500">Low</option>
                  <option value="Medium" className="text-blue-500">Medium</option>
                  <option value="High" className="text-amber-500">High</option>
                  <option value="Urgent" className="text-rose-500">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Address */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-1.5 border-b pb-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Location & Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label className="font-medium text-muted-foreground">Street Address</label>
                <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="Plot No, Street name, Landmark" className="w-full mt-1 p-2 border rounded-xl bg-background text-foreground outline-none" />
              </div>

              <div>
                <label className="font-medium text-muted-foreground">City</label>
                <input type="text" name="city" value={form.city} onChange={handleChange} placeholder="e.g. Mumbai" className="w-full mt-1 p-2 border rounded-xl bg-background text-foreground outline-none" />
              </div>

              <div>
                <label className="font-medium text-muted-foreground">District</label>
                <input type="text" name="district" value={form.district} onChange={handleChange} placeholder="e.g. Thane" className="w-full mt-1 p-2 border rounded-xl bg-background text-foreground outline-none" />
              </div>

              <div>
                <label className="font-medium text-muted-foreground">State</label>
                <input type="text" name="state" value={form.state} onChange={handleChange} placeholder="e.g. Maharashtra" className="w-full mt-1 p-2 border rounded-xl bg-background text-foreground outline-none" />
              </div>

              <div>
                <label className="font-medium text-muted-foreground">Pincode</label>
                <input type="text" name="pincode" value={form.pincode} onChange={handleChange} placeholder="e.g. 400001" className="w-full mt-1 p-2 border rounded-xl bg-background text-foreground outline-none font-mono" />
              </div>
            </div>
          </div>

          {/* Section 3: Campaign & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Megaphone className="h-3.5 w-3.5 text-primary" /> Campaign (optional)
              </label>
              <select name="campaign" value={form.campaign} onChange={handleChange} className="w-full p-2.5 border rounded-xl bg-background text-foreground outline-none">
                <option value="">-- No Specific Campaign --</option>
                {campaigns.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground">Tag this lead to an active tele sales campaign</p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" /> Initial Remark
              </label>
              <textarea name="remark" rows={2} value={form.remark} onChange={handleChange} placeholder="Any initial customer note or inquiry details..." className="w-full p-2 border rounded-xl bg-background text-foreground outline-none resize-none" />
            </div>
          </div>

        </div>

        {/* Modal Footer Buttons */}
        <div className="p-4 bg-muted/40 border-t flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-all"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            disabled={submitting}
            className="px-5 py-2 bg-primary text-primary-foreground font-bold rounded-xl shadow hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Check className="h-4 w-4" /> Save Lead
          </button>

          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={submitting}
            className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold rounded-xl shadow-lg hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <PhoneCall className="h-4 w-4 animate-pulse" /> Save & Call
          </button>
        </div>

      </div>
    </div>
  );
}
