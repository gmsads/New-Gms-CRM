import React from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

const CompanyProfileTab = ({ formData, setFormData }) => {
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <h2 className="text-xl font-bold text-slate-900 border-b pb-4">Company Profile</h2>
      
      {/* Basic Info */}
      <div>
        <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Company Name</label>
            <input name="companyName" value={formData.companyName} onChange={handleChange} className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email</label>
            <input name="contactEmail" value={formData.contactEmail} onChange={handleChange} className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
            <input name="contactPhone" value={formData.contactPhone} onChange={handleChange} className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Alternate Phone</label>
            <input name="alternateMobile" value={formData.alternateMobile || ''} onChange={handleChange} className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Website</label>
            <input name="website" value={formData.website} onChange={handleChange} className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600" />
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider border-b pb-2">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Address Line</label>
            <input name="address" value={formData.address} onChange={handleChange} className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
            <input name="city" value={formData.city || ''} onChange={handleChange} className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
            <input name="state" value={formData.state || ''} onChange={handleChange} className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
            <input name="pincode" value={formData.pincode || ''} onChange={handleChange} className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600" />
          </div>
        </div>
      </div>

      {/* Registration */}
      <div>
        <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider border-b pb-2">Registration Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN</label>
            <input name="gstin" value={formData.gstin} onChange={handleChange} className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600 uppercase font-mono" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">PAN Number</label>
            <input name="panNumber" value={formData.panNumber} onChange={handleChange} className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600 uppercase font-mono" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Company Reg. Number</label>
            <input name="regNumber" value={formData.regNumber} onChange={handleChange} className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600 font-mono" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">CIN</label>
            <input name="cin" value={formData.cin || ''} onChange={handleChange} className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600 uppercase font-mono" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">MSME / Udyam</label>
            <input name="msme" value={formData.msme || ''} onChange={handleChange} className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-600 uppercase font-mono" />
          </div>
        </div>
      </div>

      {/* Branding Images */}
      <div>
        <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider border-b pb-2">Branding Assets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Logo */}
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-3 bg-slate-50 relative group">
            {formData.logoUrl ? (
              <img src={formData.logoUrl} alt="Logo" className="h-20 object-contain" />
            ) : (
              <div className="h-20 w-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
            <label className="cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              <Upload className="h-3 w-3" /> UPLOAD LOGO
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logoUrl')} />
            </label>
          </div>

          {/* Signature */}
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-3 bg-slate-50 relative group">
            {formData.authorizedSignatureUrl ? (
              <img src={formData.authorizedSignatureUrl} alt="Signature" className="h-16 object-contain mix-blend-multiply" />
            ) : (
              <div className="h-16 w-32 border-b border-dashed border-slate-400 flex items-end justify-center pb-2 text-slate-400 font-serif italic">Signature</div>
            )}
            <label className="cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              <Upload className="h-3 w-3" /> UPLOAD SIGNATURE
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'authorizedSignatureUrl')} />
            </label>
          </div>

          {/* Seal */}
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-3 bg-slate-50 relative group">
            {formData.sealUrl ? (
              <img src={formData.sealUrl} alt="Seal" className="h-20 object-contain mix-blend-multiply" />
            ) : (
              <div className="h-20 w-20 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center text-slate-400 text-xs font-bold text-center">Company Seal</div>
            )}
            <label className="cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              <Upload className="h-3 w-3" /> UPLOAD SEAL
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'sealUrl')} />
            </label>
          </div>

          {/* Watermark */}
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-3 bg-slate-50 relative group">
            {formData.watermarkUrl ? (
              <img src={formData.watermarkUrl} alt="Watermark" className="h-20 object-contain opacity-50 mix-blend-multiply" />
            ) : (
              <div className="h-20 w-32 border border-dashed border-slate-300 flex items-center justify-center text-slate-300 text-xs font-black uppercase tracking-widest">WATERMARK</div>
            )}
            <label className="cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              <Upload className="h-3 w-3" /> UPLOAD WATERMARK
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'watermarkUrl')} />
            </label>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default CompanyProfileTab;
