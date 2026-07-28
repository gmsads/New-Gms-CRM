import React from 'react';

const AddressFields = ({ prefix, title, address, onAddressChange, disabled, errors }) => (
  <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
    <h4 className="font-semibold text-slate-800 text-sm border-b pb-2">{title}</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className="block text-xs font-semibold text-slate-600 mb-1">Address Line 1</label>
        <input
          value={address?.line1 || ''}
          onChange={(e) => onAddressChange('line1', e.target.value)}
          disabled={disabled}
          placeholder="House/Flat No., Building Name, Street"
          className="h-9 w-full rounded border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-500"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs font-semibold text-slate-600 mb-1">Address Line 2</label>
        <input
          value={address?.line2 || ''}
          onChange={(e) => onAddressChange('line2', e.target.value)}
          disabled={disabled}
          placeholder="Locality, Area (Optional)"
          className="h-9 w-full rounded border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-500"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Landmark</label>
        <input
          value={address?.landmark || ''}
          onChange={(e) => onAddressChange('landmark', e.target.value)}
          disabled={disabled}
          placeholder="Near by landmark"
          className="h-9 w-full rounded border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-500"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">City*<label>
        <input
          value={address?.city || ''}
          onChange={(e) => onAddressChange('city', e.target.value)}
          disabled={disabled}
          className={`h-9 w-full rounded border ${errors[`${prefix}City`] ? "border-red-500 bg-red-50" : "border-slate-300"} bg-white px-3 text-sm outline-none focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-500`}
        />
        {errors[`${prefix}City`] && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors[`${prefix}City`]}</p>}
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">State</label>
        <input
          value={address?.state || ''}
          onChange={(e) => onAddressChange('state', e.target.value)}
          disabled={disabled}
          className={`h-9 w-full rounded border ${errors[`${prefix}State`] ? "border-red-500 bg-red-50" : "border-slate-300"} bg-white px-3 text-sm outline-none focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-500`}
        />
        {errors[`${prefix}State`] && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors[`${prefix}State`]}</p>}
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Pincode</label>
        <input
          value={address?.pincode || ''}
          onChange={(e) => onAddressChange('pincode', e.target.value)}
          disabled={disabled}
          className={`h-9 w-full rounded border ${errors[`${prefix}Pincode`] ? "border-red-500 bg-red-50" : "border-slate-300"} bg-white px-3 text-sm outline-none focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-500`}
        />
        {errors[`${prefix}Pincode`] && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors[`${prefix}Pincode`]}</p>}
      </div>
    </div>
  </div>
);

const CustomerInformationForm = ({ data = {}, onChange, readOnly = false, errors = {} }) => {
  const handleChange = (field, value) => {
    if (readOnly) return;
    onChange(field, value);
  };

  const handleBillingChange = (field, value) => {
    if (readOnly) return;
    const newBilling = { ...(data.billingAddress || {}), [field]: value };
    const updates = { billingAddress: newBilling };
    
    // Auto sync shipping if checked
    if (data.shippingSameAsBilling !== false) {
      updates.shippingAddress = { ...newBilling };
    }
    
    // Update multiple fields at once
    if (onChange.name === 'updateFormObject') {
       onChange(updates);
    } else {
       // fallback for simple field updaters
       onChange('billingAddress', newBilling);
       if (data.shippingSameAsBilling !== false) {
         onChange('shippingAddress', newBilling);
       }
    }
  };

  const handleShippingChange = (field, value) => {
    if (readOnly || data.shippingSameAsBilling !== false) return;
    const newShipping = { ...(data.shippingAddress || {}), [field]: value };
    onChange('shippingAddress', newShipping);
  };

  const toggleShippingSameAsBilling = (checked) => {
    if (readOnly) return;
    onChange('shippingSameAsBilling', checked);
    if (checked) {
      onChange('shippingAddress', { ...(data.billingAddress || {}) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Business Name *</label>
          <input
            value={data.company || data.companyName || ''}
            onChange={(e) => handleChange('company', e.target.value)}
            disabled={readOnly}
            placeholder="e.g. Global Marketing Solutions"
            className={`h-9 w-full rounded border ${errors.company ? "border-red-500 bg-red-50" : "border-slate-300"} bg-white px-3 text-sm outline-none focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-500`}
          />
          {errors.company && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors.company}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person *</label>
          <input
            value={data.name || data.contactPerson || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={readOnly}
            placeholder="Full Name"
            className={`h-9 w-full rounded border ${errors.name ? "border-red-500 bg-red-50" : "border-slate-300"} bg-white px-3 text-sm outline-none focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-500`}
          />
          {errors.name && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
          <input
            value={data.phone || data.mobile || ''}
            onChange={(e) => handleChange('phone', e.target.value?.replace(/\D/g, "").slice(0, 10))}
            disabled={readOnly}
            placeholder="10-digit mobile"
            className={`h-9 w-full rounded border ${errors.phone ? "border-red-500 bg-red-50" : "border-slate-300"} bg-white px-3 text-sm outline-none focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-500`}
          />
          {errors.phone && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Alternate Mobile</label>
          <input
            value={data.alternateMobile || ''}
            onChange={(e) => handleChange('alternateMobile', e.target.value?.replace(/\D/g, "").slice(0, 10))}
            disabled={readOnly}
            placeholder="Optional"
            className={`h-9 w-full rounded border ${errors.alternateMobile ? "border-red-500 bg-red-50" : "border-slate-300"} bg-white px-3 text-sm outline-none focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-500`}
          />
          {errors.alternateMobile && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors.alternateMobile}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
          <input
            value={data.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            disabled={readOnly}
            type="email"
            placeholder="email@company.com"
            className={`h-9 w-full rounded border ${errors.email ? "border-red-500 bg-red-50" : "border-slate-300"} bg-white px-3 text-sm outline-none focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-500`}
          />
          {errors.email && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">GST Number</label>
          <input
            value={data.gstNumber || ''}
            onChange={(e) => handleChange('gstNumber', e.target.value?.toUpperCase())}
            disabled={readOnly}
            placeholder="15-digit GSTIN"
            className={`h-9 w-full rounded border ${errors.gstNumber ? "border-red-500 bg-red-50" : "border-slate-300"} bg-white px-3 text-sm outline-none focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-500 uppercase`}
          />
          {errors.gstNumber && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors.gstNumber}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Number</label>
          <input
            value={data.panNumber || ''}
            onChange={(e) => handleChange('panNumber', e.target.value?.toUpperCase())}
            disabled={readOnly}
            placeholder="10-digit PAN"
            className={`h-9 w-full rounded border ${errors.panNumber ? "border-red-500 bg-red-50" : "border-slate-300"} bg-white px-3 text-sm outline-none focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-500 uppercase`}
          />
          {errors.panNumber && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors.panNumber}</p>}
        </div>
      </div>

      <AddressFields
        prefix="billing"
        title="Billing Address"
        address={data.billingAddress}
        onAddressChange={handleBillingChange}
        disabled={readOnly}
        errors={errors}
      />

      <div className="flex items-center space-x-2 mt-6">
        <input
          type="checkbox"
          id="shippingSame"
          checked={data.shippingSameAsBilling !== false}
          onChange={(e) => toggleShippingSameAsBilling(e.target.checked)}
          disabled={readOnly}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
        />
        <label htmlFor="shippingSame" className="text-sm font-medium text-slate-700 cursor-pointer">
          Shipping address same as billing
        </label>
      </div>

      {data.shippingSameAsBilling === false && (
        <AddressFields
          prefix="shipping"
          title="Shipping Address"
          address={data.shippingAddress}
          onAddressChange={handleShippingChange}
          disabled={readOnly}
          errors={errors}
        />
      )}
    </div>
  );
};

export default CustomerInformationForm;
