import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, Package, DollarSign, Activity, 
  UploadCloud, Plus, Trash2, AlertCircle, CheckCircle2 
} from 'lucide-react';
import useApi from '../../../../hooks/useApi';

const PRICING_TYPES = [
  { id: 'FIXED_PRICE', label: 'Fixed Price', desc: 'Single fixed price per unit' },
  { id: 'PER_SFT', label: 'Per Square Foot', desc: 'Calculated by width × height' },
  { id: 'SIZE_BASED', label: 'Size Based', desc: 'Specific price for standard sizes' },
  { id: 'QUANTITY_BASED', label: 'Quantity Slab', desc: 'Price changes based on volume' },
  { id: 'RENTAL_BASED', label: 'Rental', desc: 'Daily, Weekly, or Monthly rates' }
];

const COST_TEMPLATES = {
  'FLUTE': { fields: ['Material Cost', 'Printing Cost', 'Pole/Fabrication Cost', 'Labor/Installation', 'Transport Cost', 'Miscellaneous Cost'], type: 'SIZE_BASED' },
  'LED': { fields: ['Acrylic Cost', 'LED Cost', 'Printing Cost', 'Frame Fabrication', 'Wiring Cost', 'Installation Cost', 'Transport Cost', 'Miscellaneous Cost'], type: 'PER_SFT' },
  'SIGN': { fields: ['Acrylic Cost', 'LED Cost', 'Printing Cost', 'Frame Fabrication', 'Wiring Cost', 'Installation Cost', 'Transport Cost', 'Miscellaneous Cost'], type: 'PER_SFT' },
  'PRINTING': { fields: ['Material Cost', 'Printing Cost', 'Lamination Cost', 'Framing Cost', 'Installation Cost', 'Transport Cost', 'Miscellaneous Cost'], type: 'PER_SFT' },
  'FLEX': { fields: ['Material Cost', 'Printing Cost', 'Lamination Cost', 'Framing Cost', 'Installation Cost', 'Transport Cost', 'Miscellaneous Cost'], type: 'PER_SFT' },
  'RENTAL': { fields: ['Vehicle Rent', 'Fuel Cost', 'Driver Cost', 'Daily Charges', 'Maintenance Cost', 'Branding, printing and instalation cost', 'Miscellaneous Cost'], type: 'RENTAL_BASED' },
  'EVENT': { fields: ['Tent/Structure Cost', 'Branding Print Cost', 'Setup Labor', 'Transport Cost', 'Event Staff Charges', 'Electricity Cost', 'Miscellaneous Cost'], type: 'FIXED_PRICE' },
  'STICKER': { fields: ['Vinyl Cost', 'Printing Cost', 'Lamination Cost', 'Cutting Cost', 'Installation Cost', 'Transport Cost', 'Miscellaneous Cost'], type: 'PER_SFT' },
  'VINYL': { fields: ['Vinyl Cost', 'Printing Cost', 'Lamination Cost', 'Cutting Cost', 'Installation Cost', 'Transport Cost', 'Miscellaneous Cost'], type: 'PER_SFT' },
  'DEFAULT': { fields: ['Material Cost', 'Labor Cost', 'Transport Cost', 'Miscellaneous Cost'], type: 'FIXED_PRICE' }
};

export default function ProductModal({ isOpen, onClose, product = null, categories = [], onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [rentalType, setRentalType] = useState('daily');
  const { request } = useApi();

  // Unified State
  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    sku: '',
    description: '',
    minimumOrderQuantity: 1,
    pricingRules: {
      type: 'FIXED_PRICE',
      sellingPrice: 0,
      ratePerSft: 0,
      minArea: 0,
      sizePrices: [],
      quantitySlabs: [],
      rentalRates: { daily: 0, weekly: 0, monthly: 0, securityDeposit: 0 },
      minimumSellingPrice: 0,
      minimumMargin: 20,
      taxPercentage: 18,
      installationCharge: 0
    },
    costBreakdown: {}
  });

  useEffect(() => {
    if (product) {
      setFormData({
        productName: product.productName || '',
        category: product.category?._id || product.category || '',
        sku: product.sku || '',
        description: product.description || '',
        minimumOrderQuantity: product.minimumOrderQuantity || 1,
        pricingRules: {
          ...formData.pricingRules,
          ...(product.pricingRules || {})
        },
        costBreakdown: product.costBreakdown || {}
      });
    }
  }, [product]);

  const calculateTotalCost = () => {
    let sum = 0;
    for (const val of Object.values(formData.costBreakdown || {})) {
      sum += Number(val) || 0;
    }
    return sum;
  };

  const handleCategoryChange = (categoryId) => {
    const catObj = categories.find(c => c._id === categoryId || c.name === categoryId);
    const catName = (catObj?.name || '').toUpperCase();
    
    let templateMatch = COST_TEMPLATES['DEFAULT'];
    for (const [key, tpl] of Object.entries(COST_TEMPLATES)) {
      if (key !== 'DEFAULT' && catName.includes(key)) {
        templateMatch = tpl;
        break;
      }
    }

    const newCostBreakdown = {};
    templateMatch.fields.forEach(f => newCostBreakdown[f] = 0);

    setFormData(prev => ({
      ...prev,
      category: categoryId,
      costBreakdown: newCostBreakdown,
      pricingRules: {
        ...prev.pricingRules,
        type: templateMatch.type
      }
    }));
  };

  const baseCost = calculateTotalCost();
  const minimumMarginPct = Number(formData.pricingRules.minimumMargin) || 0;
  const totalBaseCost = baseCost + (baseCost * (minimumMarginPct / 100)); // Minimum allowed selling price

  const totalBasePriceValue = (
    (
      formData.pricingRules.type === 'FIXED_PRICE' ? Number(formData.pricingRules.sellingPrice) || 0 : 
      formData.pricingRules.type === 'PER_SFT' ? (Number(formData.pricingRules.ratePerSft) || 0) * (Number(formData.pricingRules.minArea) || 0) : 
      formData.pricingRules.type === 'SIZE_BASED' ? Number(formData.pricingRules.sizePrices?.[0]?.price) || 0 : 
      formData.pricingRules.type === 'QUANTITY_BASED' ? Number(formData.pricingRules.quantitySlabs?.[0]?.price) || 0 : 
      formData.pricingRules.type === 'RENTAL_BASED' ? (rentalType === 'custom' ? Number(formData.pricingRules.rentalRates?.customPrice) || 0 : Number(formData.pricingRules.rentalRates?.[rentalType]) || 0) : 
      0
    ) 
    * (1 + (Number(formData.pricingRules.taxPercentage) || 0) / 100) 
    + (Number(formData.pricingRules.installationCharge) || 0)
  );

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const endpoint = product ? `/products/${product._id}` : '/products';
      const method = product ? 'PATCH' : 'POST';
      
      const payload = { ...formData };
      
      const res = await request(method, endpoint, payload);
      if (res && res.success) {
        onSuccess();
        onClose();
      } else {
        alert(res?.message || 'Failed to save product. Please check required fields.');
      }
    } catch (err) {
      alert(err.message || 'Error saving product. Please check the form data.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {product ? 'Edit Product Configuration' : 'Product Pricing Engine'}
            </h2>
            <p className="text-slate-500 font-medium mt-1">Configure multi-variant commercial parameters</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Total Base Price</p>
              <p className="text-xl font-black text-blue-600">₹{totalBasePriceValue.toFixed(2)}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X className="h-6 w-6 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex border-b border-slate-100 px-8 bg-white relative z-10 shadow-sm">
          {[
            { num: 1, title: 'Basic Info', icon: Package },
            { num: 2, title: 'Total Base Price', icon: Activity },
            { num: 3, title: 'Pricing Engine', icon: DollarSign }
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`flex-1 py-4 flex items-center justify-center gap-3 border-b-2 transition-all ${
                step === s.num 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <s.icon className={`h-5 w-5 ${step === s.num ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="font-bold text-sm tracking-wide uppercase">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-8 overflow-y-auto flex-1 bg-slate-50/30">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Product Name</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.productName}
                      onChange={e => setFormData({ ...formData, productName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                    <select 
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.category}
                      onChange={e => handleCategoryChange(e.target.value)}
                    >
                      <option value="">Select Category</option>
                      {categories && categories.length > 0 ? categories.map(c => (
                        <option key={c._id || Math.random()} value={c._id || c.name}>
                          {c.name || 'Unnamed Category'}
                        </option>
                      )) : (
                        <option value="" disabled>No categories available</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">SKU Code</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.sku}
                      onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Minimum Order Quantity (MOQ)</label>
                    <input 
                      type="number" 
                      min="1"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      value={formData.minimumOrderQuantity}
                      onChange={e => setFormData({ ...formData, minimumOrderQuantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                    <textarea 
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Select Pricing Architecture</label>
                  <div className="grid grid-cols-3 gap-4">
                    {PRICING_TYPES.map(type => (
                      <button
                        key={type.id}
                        onClick={() => setFormData({ ...formData, pricingRules: { ...formData.pricingRules, type: type.id } })}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.pricingRules.type === type.id 
                            ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-100' 
                            : 'border-slate-100 bg-white hover:border-blue-300'
                        }`}
                      >
                        <p className={`font-bold ${formData.pricingRules.type === type.id ? 'text-blue-700' : 'text-slate-800'}`}>
                          {type.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{type.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  {formData.pricingRules.type === 'FIXED_PRICE' && (
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Selling Price (₹)</label>
                        <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          value={formData.pricingRules.sellingPrice}
                          onChange={e => setFormData({ ...formData, pricingRules: { ...formData.pricingRules, sellingPrice: e.target.value } })}
                        />
                      </div>
                    </div>
                  )}

                  {formData.pricingRules.type === 'PER_SFT' && (
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Rate Per SFT (₹)</label>
                        <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          value={formData.pricingRules.ratePerSft}
                          onChange={e => setFormData({ ...formData, pricingRules: { ...formData.pricingRules, ratePerSft: e.target.value } })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Minimum Billable Area (SFT)</label>
                        <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          value={formData.pricingRules.minArea}
                          onChange={e => setFormData({ ...formData, pricingRules: { ...formData.pricingRules, minArea: e.target.value } })}
                        />
                      </div>
                    </div>
                  )}

                  {formData.pricingRules.type === 'SIZE_BASED' && (
                    <div>
                      <p className="text-sm font-bold text-slate-700 mb-4">Size Configurations</p>
                      {formData.pricingRules.sizePrices.map((sp, idx) => (
                        <div key={idx} className="flex gap-4 mb-3">
                          <input type="text" placeholder="Size (e.g. 12x9)" className="flex-1 px-4 py-2 bg-slate-50 border rounded-lg"
                            value={sp.sizeLabel} onChange={e => {
                              const arr = [...formData.pricingRules.sizePrices];
                              arr[idx].sizeLabel = e.target.value;
                              setFormData({ ...formData, pricingRules: { ...formData.pricingRules, sizePrices: arr } });
                            }}
                          />
                          <input type="number" placeholder="Price" className="w-32 px-4 py-2 bg-slate-50 border rounded-lg appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            value={sp.price} onChange={e => {
                              const arr = [...formData.pricingRules.sizePrices];
                              arr[idx].price = e.target.value;
                              setFormData({ ...formData, pricingRules: { ...formData.pricingRules, sizePrices: arr } });
                            }}
                          />
                          <button 
                            onClick={() => {
                              const arr = [...formData.pricingRules.sizePrices];
                              arr.splice(idx, 1);
                              setFormData({ ...formData, pricingRules: { ...formData.pricingRules, sizePrices: arr } });
                            }}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove Size"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => setFormData({ ...formData, pricingRules: { ...formData.pricingRules, sizePrices: [...formData.pricingRules.sizePrices, { sizeLabel: '', price: 0 }] } })}
                        className="text-sm text-blue-600 font-bold flex items-center mt-2"
                      ><Plus className="h-4 w-4 mr-1"/> Add Size</button>
                    </div>
                  )}

                  {formData.pricingRules.type === 'QUANTITY_BASED' && (
                    <div>
                      <p className="text-sm font-bold text-slate-700 mb-4">Quantity Slabs</p>
                      {formData.pricingRules.quantitySlabs.map((slab, idx) => (
                        <div key={idx} className="flex gap-4 mb-3">
                          <input type="number" placeholder="Min Qty" className="w-1/3 px-4 py-2 bg-slate-50 border rounded-lg appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            value={slab.minQty} onChange={e => {
                              const arr = [...formData.pricingRules.quantitySlabs];
                              arr[idx].minQty = e.target.value;
                              setFormData({ ...formData, pricingRules: { ...formData.pricingRules, quantitySlabs: arr } });
                            }}
                          />
                          <input type="number" placeholder="Max Qty" className="w-1/3 px-4 py-2 bg-slate-50 border rounded-lg appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            value={slab.maxQty} onChange={e => {
                              const arr = [...formData.pricingRules.quantitySlabs];
                              arr[idx].maxQty = e.target.value;
                              setFormData({ ...formData, pricingRules: { ...formData.pricingRules, quantitySlabs: arr } });
                            }}
                          />
                          <input type="number" placeholder="Price" className="w-1/3 px-4 py-2 bg-slate-50 border rounded-lg appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            value={slab.price} onChange={e => {
                              const arr = [...formData.pricingRules.quantitySlabs];
                              arr[idx].price = e.target.value;
                              setFormData({ ...formData, pricingRules: { ...formData.pricingRules, quantitySlabs: arr } });
                            }}
                          />
                          <button 
                            onClick={() => {
                              const arr = [...formData.pricingRules.quantitySlabs];
                              arr.splice(idx, 1);
                              setFormData({ ...formData, pricingRules: { ...formData.pricingRules, quantitySlabs: arr } });
                            }}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove Slab"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => setFormData({ ...formData, pricingRules: { ...formData.pricingRules, quantitySlabs: [...formData.pricingRules.quantitySlabs, { minQty: 1, maxQty: 10, price: 0 }] } })}
                        className="text-sm text-blue-600 font-bold flex items-center mt-2"
                      ><Plus className="h-4 w-4 mr-1"/> Add Slab</button>
                    </div>
                  )}

                  {formData.pricingRules.type === 'RENTAL_BASED' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Rental Period Type</label>
                        <select 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                          value={rentalType}
                          onChange={e => setRentalType(e.target.value)}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      
                      {rentalType === 'custom' && (
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Number of Days</label>
                          <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            value={formData.pricingRules.rentalRates.customDays || ''}
                            onChange={e => setFormData({ ...formData, pricingRules: { ...formData.pricingRules, rentalRates: { ...formData.pricingRules.rentalRates, customDays: e.target.value } } })}
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Cost (₹)</label>
                        <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          value={rentalType === 'custom' ? (formData.pricingRules.rentalRates.customPrice || '') : (formData.pricingRules.rentalRates[rentalType] || '')}
                          onChange={e => {
                            const val = e.target.value;
                            if (rentalType === 'custom') {
                              setFormData({ ...formData, pricingRules: { ...formData.pricingRules, rentalRates: { ...formData.pricingRules.rentalRates, customPrice: val } } });
                            } else {
                              setFormData({ ...formData, pricingRules: { ...formData.pricingRules, rentalRates: { ...formData.pricingRules.rentalRates, [rentalType]: val } } });
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-100">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Tax Percentage (%)</label>
                      <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        value={formData.pricingRules.taxPercentage}
                        onChange={e => setFormData({ ...formData, pricingRules: { ...formData.pricingRules, taxPercentage: e.target.value } })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Default Installation Charge (₹)</label>
                      <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        value={formData.pricingRules.installationCharge}
                        onChange={e => setFormData({ ...formData, pricingRules: { ...formData.pricingRules, installationCharge: e.target.value } })}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Total Base Price (₹)</label>
                      <input type="text" readOnly className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-600 cursor-not-allowed"
                        value={totalBasePriceValue.toFixed(2)}
                      />
                      <p className="text-xs text-slate-400 mt-1">Calculated as: Price + Tax + Installation Charge</p>
                      {totalBasePriceValue > 0 && totalBasePriceValue < totalBaseCost && (
                        <p className="text-xs text-rose-600 font-bold mt-2 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1"/> Warning: Rate is below Total Base Cost
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  {/* Cost Breakdown Inputs */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Base Cost Breakdown</h3>
                    {Object.keys(formData.costBreakdown || {}).length === 0 ? (
                      <div className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Please select a category in the Basic Info step to load the appropriate costing template.
                      </div>
                    ) : (
                      Object.keys(formData.costBreakdown).map(key => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-600">{key}</span>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                            <input type="number" className="w-32 pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-right font-bold focus:ring-2 focus:ring-blue-500 outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              value={formData.costBreakdown[key]}
                              onChange={e => setFormData({ 
                                ...formData, 
                                costBreakdown: { ...formData.costBreakdown, [key]: e.target.value } 
                              })}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Financial Intelligence Engine */}
                  <div>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Financial Intelligence</h3>
                    
                    <div className="p-6 rounded-2xl border-2 transition-colors bg-blue-50 border-blue-200">
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Raw Material & Operation Cost</p>
                          <p className="text-2xl font-black text-slate-900">₹{baseCost.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Target Total Base Cost</p>
                          <p className="text-3xl font-black text-blue-700">₹{totalBaseCost.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-6 border-t border-slate-200/50">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-bold text-slate-700">Add Standard Margin (%)</label>
                          <input type="number" className="w-24 px-3 py-1.5 bg-white border rounded-lg text-right font-bold appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            value={formData.pricingRules.minimumMargin}
                            onChange={e => setFormData({ ...formData, pricingRules: { ...formData.pricingRules, minimumMargin: e.target.value } })}
                          />
                        </div>
                        
                        <div className="flex items-center gap-2 text-blue-800 bg-blue-100/50 p-3 rounded-lg mt-2 border border-blue-200">
                          <Activity className="h-5 w-5 flex-shrink-0" />
                          <p className="text-xs font-bold leading-tight">
                            Total Base Cost = Operation Cost (₹{baseCost.toFixed(2)}) + {minimumMarginPct}% Margin. <br/>
                            Any price configured below ₹{totalBaseCost.toFixed(2)} in the Pricing Engine will trigger a Manager Approval alert.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors flex items-center">
              <ChevronLeft className="h-5 w-5 mr-1" /> Back
            </button>
          ) : <div></div>}
          
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} className="px-8 py-2.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-300 hover:bg-slate-800 transition-all active:scale-95 flex items-center">
              Next Step <ChevronRight className="h-5 w-5 ml-1" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center">
              {loading ? 'Processing...' : 'Save Product Engine'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
