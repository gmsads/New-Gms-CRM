import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Settings, Search, Plus, Trash2, Calendar, Phone, Mail, ShoppingBag } from 'lucide-react';
import { productApi, quotationApi } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { ProductCatalogueModal } from './ProductCatalogueModal';

const QuotationBuilder = ({ prospect, onClose, onSave }) => {
  const { user } = useAuth();
  
  // -- State --
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  
  const [discountType, setDiscountType] = useState('FLAT');
  const [discountValue, setDiscountValue] = useState(0);
  const [applyGst, setApplyGst] = useState(true);
  
  const [additionalCharges, setAdditionalCharges] = useState([]);
  
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('1. 50% Advance Payment\n2. Validity: 15 Days');
  
  const [saving, setSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [isCatalogueOpen, setIsCatalogueOpen] = useState(false);

  const [poNumber, setPoNumber] = useState('');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
  
  // -- Fetch Products --
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productApi.list(user?.token);
        if (res.success) setProducts(res.data.filter(p => p.status === 'Active'));
      } catch (err) {
        console.error('Failed to load products', err);
      }
    };
    fetchProducts();
  }, [user]);

  // -- Computations --
  const subtotal = items.reduce((acc, item) => acc + ((item.quantity * item.unitPrice) - (item.discount || 0)), 0);
  const totalAdditional = additionalCharges.reduce((acc, c) => acc + c.amount, 0);
  const totalBeforeDiscount = subtotal + totalAdditional;
  
  let discountAmount = 0;
  if (discountType === 'PERCENT') {
    discountAmount = (totalBeforeDiscount * discountValue) / 100;
  } else {
    discountAmount = Number(discountValue);
  }
  
  const taxableAmount = totalBeforeDiscount - discountAmount;
  const gstAmount = applyGst ? taxableAmount * 0.18 : 0;
  const finalTotal = taxableAmount + gstAmount;

  // -- Handlers --
  const addItem = (productId) => {
    if (!productId) return;
    const product = products.find(p => p._id === productId);
    if (!product) return;

    const exists = items.find(i => i.product === product._id);
    if (exists) {
      setSelectedProduct('');
      return; 
    }
    
    setItems([...items, {
      product: product._id,
      name: product.productName || product.name,
      originalPrice: product.pricingRules?.totalBasePrice || product.basePrice || 0,
      unitPrice: product.pricingRules?.totalBasePrice || product.basePrice || 0,
      quantity: product.minimumOrderQuantity || product.moq || 1,
      isCustomPrice: false,
      hsn: product.hsn || '',
      taxRate: 18,
      discount: 0
    }]);
    setSelectedProduct('');
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async (status = 'Draft') => {
    if (items.length === 0) return alert('Please add at least one item');
    setSaving(true);
    try {
      const payload = {
        prospect: prospect._id,
        items: items.map(i => ({
          product: i.product,
          name: i.name,
          quantity: i.quantity,
          unitCost: i.unitPrice,
          totalCost: (i.quantity * i.unitPrice) - (i.discount || 0),
          isCustomPrice: i.isCustomPrice,
          originalPrice: i.originalPrice
        })),
        subtotal,
        discount: { type: discountType, value: Number(discountValue), amount: discountAmount },
        tax: {
          enabled: applyGst,
          rate: 18,
          cgst: gstAmount / 2,
          sgst: gstAmount / 2,
          amount: gstAmount
        },
        additionalCharges,
        totalAmount: finalTotal,
        status,
        notes,
        terms
      };
      
      const res = await quotationApi.create(payload, user?.token);
      if (res.success) {
        if (onSave) onSave(res.data);
        onClose();
      }
    } catch (err) {
      alert(err.message || 'Failed to save quotation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 sm:p-8 overflow-y-auto backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl rounded-xl shadow-2xl flex flex-col font-sans text-sm animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800">Create Quotation</h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-white bg-gray-50 shadow-sm transition-all text-sm font-medium">
              <Settings className="h-4 w-4 text-red-500" /> Settings
            </button>
            <button className="px-5 py-2 border border-gray-200 rounded-lg text-gray-400 bg-gray-100 cursor-not-allowed text-sm font-medium">Save & New</button>
            <button onClick={() => handleSave('Draft')} disabled={saving} className="px-8 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all text-sm">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Top Section */}
          <div className="flex flex-col lg:flex-row gap-10 mb-8">
            <div className="flex-1">
              <p className="text-gray-600 mb-3 font-semibold tracking-wide uppercase text-xs">Bill To</p>
              <div className="border-2 border-dashed border-indigo-200 rounded-xl p-5 bg-indigo-50/30 w-full lg:max-w-md">
                <p className="font-bold text-gray-900 text-lg mb-1">{prospect?.company || 'Company Name'}</p>
                <p className="text-gray-700 font-medium">{prospect?.name || 'Contact Person'}</p>
                <p className="text-gray-500 text-sm mt-2 flex items-center gap-2">
                  <span className="w-4 flex justify-center"><Phone className="h-3.5 w-3.5" /></span> {prospect?.phone}
                </p>
                {prospect?.email && (
                  <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                    <span className="w-4 flex justify-center"><Mail className="h-3.5 w-3.5" /></span> {prospect.email}
                  </p>
                )}
              </div>
            </div>
            <div className="w-full lg:w-96 flex flex-col gap-5">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 font-semibold block mb-1.5 uppercase tracking-wide">Quotation No</label>
                  <input type="text" disabled value="Auto-generated" className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm outline-none font-medium" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 font-semibold block mb-1.5 uppercase tracking-wide">Quotation Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input type="date" value={quoteDate} onChange={e => setQuoteDate(e.target.value)} className="w-full h-10 pl-10 pr-3 border border-gray-300 rounded-lg text-gray-800 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium transition-all" />
                  </div>
                </div>
              </div>
              <button className="w-full h-10 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg flex items-center justify-center text-sm font-semibold hover:bg-blue-50 transition-colors">
                + Add Due Date
              </button>
              <div>
                <label className="text-xs text-gray-500 font-semibold block mb-1.5 uppercase tracking-wide">PO No</label>
                <input type="text" value={poNumber} onChange={e => setPoNumber(e.target.value)} className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-gray-800 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4 w-12 border-r border-gray-200 text-center">No</th>
                  <th className="py-3 px-4 border-r border-gray-200">Items/Services</th>
                  <th className="py-3 px-4 w-28 border-r border-gray-200 text-center">HSN/SAC</th>
                  <th className="py-3 px-4 w-24 border-r border-gray-200 text-center">Qty</th>
                  <th className="py-3 px-4 w-32 border-r border-gray-200 text-right">Price/Item (₹)</th>
                  <th className="py-3 px-4 w-28 border-r border-gray-200 text-right">Discount</th>
                  <th className="py-3 px-4 w-24 border-r border-gray-200 text-center">Tax</th>
                  <th className="py-3 px-4 w-32 border-r border-gray-200 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 w-12 text-center border-l border-gray-200"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors group">
                    <td className="py-3 px-4 text-gray-500 border-r border-gray-200 text-center font-medium">{idx + 1}</td>
                    <td className="py-3 px-4 border-r border-gray-200">
                      <input type="text" value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} className="w-full bg-transparent outline-none text-gray-900 font-medium" />
                    </td>
                    <td className="py-3 px-4 border-r border-gray-200">
                      <input type="text" value={item.hsn || ''} onChange={e => updateItem(idx, 'hsn', e.target.value)} className="w-full bg-transparent outline-none text-gray-600 text-center" placeholder="-" />
                    </td>
                    <td className="py-3 px-4 border-r border-gray-200">
                      <input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} className="w-full bg-transparent outline-none text-gray-900 text-center font-medium" />
                    </td>
                    <td className="py-3 px-4 border-r border-gray-200">
                      <div className="flex flex-col gap-1 items-end">
                        <div className="flex items-center gap-1.5 self-start mb-1">
                          <input type="checkbox" id={`custom-${idx}`} checked={item.isCustomPrice} onChange={e => updateItem(idx, 'isCustomPrice', e.target.checked)} className="rounded cursor-pointer" />
                          <label htmlFor={`custom-${idx}`} className="text-[10px] font-bold text-slate-500 cursor-pointer">Custom</label>
                        </div>
                        <input type="number" disabled={!item.isCustomPrice} value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} className={`w-full text-right outline-none font-medium px-2 py-1 rounded ${!item.isCustomPrice ? 'bg-transparent text-gray-900' : 'bg-white border border-gray-300'}`} />
                      </div>
                    </td>
                    <td className="py-3 px-4 border-r border-gray-200">
                      <input type="number" value={item.discount} onChange={e => updateItem(idx, 'discount', Number(e.target.value))} className="w-full bg-transparent outline-none text-gray-600 text-right" placeholder="0" />
                    </td>
                    <td className="py-3 px-4 border-r border-gray-200 text-center text-gray-600">
                      {item.taxRate}%
                    </td>
                    <td className="py-3 px-4 border-r border-gray-200 text-right font-bold text-gray-900 bg-gray-50/50">
                      {((item.quantity * item.unitPrice) - (item.discount || 0)).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="h-4 w-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="p-4 bg-white border-b border-gray-200 flex gap-3">
              <div className="flex-1 relative">
                <select 
                  value={selectedProduct}
                  onChange={e => addItem(e.target.value)}
                  className="w-full h-11 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-lg bg-indigo-50/30 px-4 outline-none cursor-pointer text-sm font-bold hover:bg-indigo-50 transition-colors appearance-none"
                >
                  <option value="" disabled>+ Select Product / Service to Add</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.productName || p.name} - ₹{(p.pricingRules?.totalBasePrice || p.basePrice || 0).toLocaleString()}</option>
                  ))}
                </select>
              </div>
              <button 
                type="button" 
                onClick={() => setIsCatalogueOpen(true)} 
                className="h-11 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors flex items-center gap-1.5 shadow shrink-0"
                title="Browse Catalogue"
              >
                <ShoppingBag className="h-4 w-4" /> Catalogue
              </button>
            </div>
            
            <div className="flex bg-gray-50/80">
              <div className="flex-1 text-right py-3.5 px-5 font-bold text-gray-500 uppercase tracking-widest text-xs flex items-center justify-end">Subtotal</div>
              <div className="w-32 py-3 px-4 text-right font-bold border-l border-gray-200 text-gray-700">₹{items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0).toLocaleString()}</div>
              <div className="w-28 py-3 px-4 text-right font-bold border-l border-gray-200 text-rose-500">-₹{items.reduce((acc, i) => acc + (i.discount || 0), 0).toLocaleString()}</div>
              <div className="w-24 py-3 px-4 text-right font-bold border-l border-gray-200 text-gray-700">-</div>
              <div className="w-32 py-3 px-4 text-right font-black border-l border-r border-gray-200 text-indigo-700 text-base">₹{subtotal.toLocaleString()}</div>
              <div className="w-[4.5rem]"></div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row gap-12">
            {/* Left Options */}
            <div className="flex-[3] space-y-4">
              <button className="text-indigo-600 font-semibold text-sm hover:underline block transition-all">+ Add Notes</button>
              
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                <p className="text-xs text-gray-500 mb-2 font-bold uppercase tracking-wider">Terms and Conditions</p>
                <textarea 
                  value={terms} 
                  onChange={e => setTerms(e.target.value)} 
                  className="w-full bg-transparent outline-none text-gray-700 text-sm resize-none h-20 leading-relaxed font-medium" 
                />
              </div>
              
              <button className="text-indigo-600 font-semibold text-sm hover:underline block transition-all">+ Add Bank Account</button>
              <button className="text-indigo-600 font-semibold text-sm hover:underline block transition-all">+ Add Payment QR</button>
            </div>
            
            {/* Right Totals */}
            <div className="flex-[2] flex flex-col gap-4 text-sm min-w-[320px]">
              <div className="flex justify-between items-center text-gray-600 font-medium">
                <button className="text-indigo-600 font-semibold hover:underline">+ Add Additional Charges</button>
                <span>₹0</span>
              </div>
              
              <div className="flex justify-between items-center font-bold text-gray-800 text-base mt-2">
                <span>Taxable Amount</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center text-gray-600 font-medium mt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={applyGst} onChange={() => setApplyGst(!applyGst)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
                  <span className="group-hover:text-gray-900 transition-colors">Apply GST (18%)</span>
                </label>
                <span>{applyGst ? `+ ₹${gstAmount.toLocaleString()}` : '₹0'}</span>
              </div>
              
              <div className="flex justify-between items-center text-gray-600 font-medium mt-1">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-600 font-semibold cursor-pointer hover:underline">+ Add Discount</span>
                  <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="border border-gray-200 bg-gray-50 rounded px-1 py-1 outline-none text-xs font-bold">
                    <option value="FLAT">₹</option>
                    <option value="PERCENT">%</option>
                  </select>
                  <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} className="w-16 border border-gray-200 rounded px-2 py-1 outline-none text-right font-semibold" />
                </div>
                <span className="text-rose-500 font-bold">- ₹{discountAmount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <label className="flex items-center gap-2 text-gray-700 font-medium cursor-pointer group">
                  <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
                  <span className="group-hover:text-gray-900 transition-colors">Auto Round Off</span>
                </label>
                <div className="flex items-center gap-2">
                  <select className="border border-gray-200 rounded bg-gray-50 outline-none text-xs px-2 py-1 font-semibold text-gray-600">
                    <option>+ Add</option>
                  </select>
                  <input type="text" disabled value="₹ 0" className="w-16 bg-transparent text-right outline-none text-gray-400 font-semibold" />
                </div>
              </div>
              
              <div className="flex flex-col gap-3 mt-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <div className="flex justify-between items-center">
                  <span className="font-black text-gray-900 text-lg uppercase tracking-wider">Total Amount</span>
                  <span className="font-black text-indigo-700 text-2xl">₹{Math.round(finalTotal).toLocaleString()}</span>
                </div>
                <button className="w-full h-10 bg-gray-200 text-gray-500 font-bold rounded-lg text-xs mt-2 hover:bg-gray-300 transition-colors">
                  Enter Payment amount
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ProductCatalogueModal
        isOpen={isCatalogueOpen}
        onClose={() => setIsCatalogueOpen(false)}
        mode="single"
        onSelectProduct={(product) => {
          addItem(product._id);
        }}
      />
    </div>
  );
};

export default QuotationBuilder;
