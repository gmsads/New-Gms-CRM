import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Settings, Search, Plus, Trash2, Calendar, Phone, Mail, ShoppingBag } from 'lucide-react';
import { productApi, quotationApi } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { ProductCatalogueModal } from './ProductCatalogueModal';

const QuotationBuilder = ({ prospect, onClose, onSave }) => {
  const { user } = useAuth();
  
  // -- Helper for Terms & Conditions validity sync --
  const updateTermsValidity = (currentTerms, days) => {
    if (!currentTerms) return currentTerms;
    const regex = /Validity[:\s-]+\d+\s*Days/i;
    if (regex.test(currentTerms)) {
      return currentTerms.replace(regex, `Validity: ${days} Days`);
    }
    return currentTerms;
  };
  
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

  // -- Extended state variables for premium quotation workflow --
  const [showValidity, setShowValidity] = useState(false);
  const [validDays, setValidDays] = useState('');
  const [validityDate, setValidityDate] = useState('');

  const [showNotes, setShowNotes] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showAdditional, setShowAdditional] = useState(false);

  const [upiId, setUpiId] = useState('gms@hdfcbank');
  const [bankDetails, setBankDetails] = useState({
    accountName: 'GMS ADVERTISING PRIVATE LIMITED',
    accountNo: '50200088735232',
    ifsc: 'HDFC0000047',
    bankName: 'HDFC BANK',
    branch: 'S.P Road Branch'
  });

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const [template, setTemplate] = useState(null);

  // -- Fetch Products & Template Settings --
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.token) return;
      try {
        const [prodRes, tempRes] = await Promise.all([
          productApi.list(user.token).catch(() => ({ success: false, data: [] })),
          quotationApi.getTemplate(user.token).catch(() => ({ success: false, data: null }))
        ]);
        
        if (prodRes.success) {
          setProducts(prodRes.data.filter(p => p.status === 'Active'));
        }
        
        if (tempRes.success && tempRes.data) {
          const tData = tempRes.data;
          setTemplate(tData);
          
          if (tData.bankDetails) {
            setBankDetails({
              accountName: tData.bankDetails.accountName || 'GMS ADVERTISING PRIVATE LIMITED',
              accountNo: tData.bankDetails.accountNumber || '50200088735232',
              ifsc: tData.bankDetails.ifscCode || 'HDFC0000047',
              bankName: tData.bankDetails.bankName || 'HDFC BANK',
              branch: tData.bankDetails.branch || 'S.P Road Branch'
            });
          }
          
          let initialTerms = '';
          if (tData.termsAndConditions?.length) {
            initialTerms = tData.termsAndConditions.filter(t => t.trim()).join('\n');
          }
          
          if (tData.defaultValidityDays) {
            setValidDays(tData.defaultValidityDays.toString());
            const baseDate = new Date();
            baseDate.setDate(baseDate.getDate() + tData.defaultValidityDays);
            setValidityDate(baseDate.toISOString().split('T')[0]);
            setShowValidity(true);
            
            if (initialTerms) {
              setTerms(updateTermsValidity(initialTerms, tData.defaultValidityDays));
            } else {
              setTerms(updateTermsValidity('1. 50% Advance Payment\n2. Validity: 15 Days', tData.defaultValidityDays));
            }
          } else {
            if (initialTerms) {
              setTerms(initialTerms);
            }
          }
          
          if (tData.footerNotes || tData.footerText) {
            setNotes(tData.footerNotes || tData.footerText || '');
          }
          
          if (tData.qrCode?.upiId) {
            setUpiId(tData.qrCode.upiId);
            if (tData.qrCode.enabled) {
              setShowQR(true);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching builder details', err);
      }
    };
    fetchData();
  }, [user]);

  // -- Computations --
  const subtotal = items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
  const totalAdditional = (showAdditional ? additionalCharges : []).reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const totalBeforeDiscount = subtotal + totalAdditional;
  
  let discountAmount = 0;
  if (discountType === 'PERCENT') {
    discountAmount = (totalBeforeDiscount * Number(discountValue || 0)) / 100;
  } else {
    discountAmount = Number(discountValue || 0);
  }
  
  const taxableAmount = totalBeforeDiscount - discountAmount;
  const gstAmount = 0; // GST is completely removed
  const finalTotal = taxableAmount;

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
      taxRate: 18
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

  // -- Bi-directional validity date calculation helpers --
  const calculateDateFromDays = (daysStr) => {
    const days = parseInt(daysStr, 10);
    if (isNaN(days)) return '';
    const baseDate = new Date(quoteDate);
    baseDate.setDate(baseDate.getDate() + days);
    return baseDate.toISOString().split('T')[0];
  };

  const calculateDaysFromDate = (dateStr) => {
    if (!dateStr) return '';
    const baseDate = new Date(quoteDate);
    const targetDate = new Date(dateStr);
    const diffTime = targetDate.getTime() - baseDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return isNaN(diffDays) ? '' : diffDays;
  };

  const handleValidDaysChange = (val) => {
    setValidDays(val);
    if (val === '') {
      setValidityDate('');
    } else {
      const newDate = calculateDateFromDays(val);
      setValidityDate(newDate);
      setTerms(prev => updateTermsValidity(prev, val));
    }
  };

  const handleValidityDateChange = (val) => {
    setValidityDate(val);
    if (val === '') {
      setValidDays('');
    } else {
      const newDays = calculateDaysFromDate(val);
      setValidDays(newDays);
      setTerms(prev => updateTermsValidity(prev, newDays));
    }
  };

  // -- WhatsApp Send Redirect Sequence --
  const handleSend = async () => {
    const savedQuote = await handleSave('Sent', true);
    if (!savedQuote) return;
    
    const phoneClean = prospect?.phone?.replace(/\D/g, '') || '';
    const formattedPhone = phoneClean.length === 10 ? `91${phoneClean}` : phoneClean;
    
    const itemsList = savedQuote.items.map(i => `• ${i.name} (x${i.quantity}): ₹${(i.totalCost || 0).toLocaleString()}`).join('\n');
    
    const validityStr = validityDate ? `\n*Validity:* ${validDays} Days (Until ${validityDate})` : '';
    const bankDetailsStr = showBank ? `\n*Bank Details:*\nAccount Name: ${bankDetails.accountName}\nAccount No: ${bankDetails.accountNo}\nIFSC: ${bankDetails.ifsc}\nBank: ${bankDetails.bankName}\nBranch: ${bankDetails.branch}` : '';
    
    const text = `*QUOTATION: ${template?.companyName || 'GMS ADS & MARKETING'}*

Hello *${prospect?.name || 'Client'}* (${prospect?.company || 'N/A'}),

Following is the estimate for your requirement:

${itemsList}
${validityStr}

--------------------------
*Subtotal:* ₹${savedQuote.subtotal.toLocaleString()}
${savedQuote.discount?.amount > 0 ? `*Discount:* -₹${savedQuote.discount.amount.toLocaleString()}\n` : ''}${savedQuote.additionalCharges?.length > 0 ? `*Additional Charges:* ₹${savedQuote.additionalCharges.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}\n` : ''}*TOTAL AMOUNT:* ₹${Math.round(savedQuote.totalAmount).toLocaleString()}
--------------------------
${bankDetailsStr}

*Terms & Conditions:*
${terms}

Regards,
*${user?.name || 'GMS Sales Team'}*
Sales Executive`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`, '_blank');
    onClose();
  };

  const handleSave = async (status = 'Draft', silent = false) => {
    if (items.length === 0) {
      alert('Please add at least one item');
      return null;
    }
    setSaving(true);
    try {
      const payload = {
        prospect: prospect?._id,
        items: items.map(i => ({
          product: i.product,
          name: i.name,
          quantity: Number(i.quantity || 1),
          unitCost: Number(i.unitPrice || 0),
          totalCost: Number(i.quantity || 1) * Number(i.unitPrice || 0),
          isCustomPrice: i.isCustomPrice,
          originalPrice: i.originalPrice
        })),
        subtotal,
        discount: { type: discountType, value: Number(discountValue), amount: discountAmount },
        tax: {
          enabled: false,
          rate: 0,
          cgst: 0,
          sgst: 0,
          amount: 0
        },
        additionalCharges: showAdditional ? additionalCharges : [],
        totalAmount: finalTotal,
        status,
        notes: showNotes ? notes : '',
        terms,
        validUntil: validityDate ? new Date(validityDate) : undefined
      };
      
      const res = await quotationApi.create(payload, user?.token);
      if (res.success) {
        if (onSave) onSave(res.data);
        if (!silent) {
          onClose();
        }
        return res.data;
      }
    } catch (err) {
      alert(err.message || 'Failed to save quotation');
    } finally {
      setSaving(false);
    }
    return null;
  };

  // -- Helper to render local preview modal --
  const renderPreviewModal = () => {
    if (!isPreviewOpen) return null;
    
    const previewItems = items;
    const previewSubtotal = subtotal;
    const previewDiscountAmount = discountAmount;
    const previewAdditionalCharges = showAdditional ? additionalCharges : [];
    const previewTotalAmount = finalTotal;
    
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300 text-slate-800">
        <div className="bg-slate-100 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800">
          
          <div className="bg-white border-b px-8 py-6 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Quotation Preview</h2>
            </div>
            <button onClick={() => setIsPreviewOpen(false)} className="h-10 w-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all">
              <span className="text-xl font-bold">×</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-10">
            {/* Document Sheet */}
            <div className="bg-white shadow-xl rounded-sm aspect-[1/1.414] w-full p-10 flex flex-col border border-slate-200">
              <div className="flex justify-between items-start mb-10">
                <div className="flex gap-4 items-start">
                  {template?.logoUrl && (
                    <img src={template.logoUrl} alt="Logo" className="h-12 object-contain max-w-[100px]" />
                  )}
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tighter">{template?.companyName || 'GMS ADS & MARKETING'}</h1>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{template?.address || 'Advertising • Branding • Digital'}</p>
                    <p className="text-[8px] font-bold text-slate-500 mt-1">
                      {template?.contactEmail || template?.email || 'hello@gms.com'} | {template?.contactPhone || template?.mobile || '+91 98765 43210'}
                    </p>
                    {template?.gstin && (
                      <p className="text-[8px] font-bold text-slate-500 mt-0.5">GSTIN: {template.gstin}</p>
                    )}
                    {template?.panNumber && (
                      <p className="text-[8px] font-bold text-slate-500 mt-0.5">PAN: {template.panNumber}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-900 uppercase">#DRAFT</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">{quoteDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-10 border-y py-6 border-slate-100">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Client Details</p>
                  <p className="text-[11px] font-black text-slate-900 mt-2">{prospect?.name || 'Client'}</p>
                  <p className="text-[9px] font-bold text-slate-500">{prospect?.company || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Contact Information</p>
                  <p className="text-[10px] font-black text-slate-900 mt-2">{prospect?.phone}</p>
                </div>
              </div>

              <div className="flex-1">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b-2 border-slate-900">
                      <th className="py-3 text-left">DESCRIPTION</th>
                      <th className="py-3 text-center">QTY</th>
                      <th className="py-3 text-right">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {previewItems.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-3 font-black text-slate-700">{it.name}</td>
                        <td className="py-3 text-center text-slate-500">{it.quantity}</td>
                        <td className="py-3 text-right font-bold text-slate-900">₹{(Number(it.quantity || 1) * Number(it.unitPrice || 0)).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-10 pt-6 border-t-2 border-slate-100 space-y-3">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400 font-bold uppercase">Subtotal</span>
                  <span className="font-black text-slate-900">₹{previewSubtotal.toLocaleString()}</span>
                </div>
                {previewDiscountAmount > 0 && (
                  <div className="flex justify-between text-[10px] text-rose-500">
                    <span className="font-bold uppercase">Discount ({discountType === 'PERCENT' ? `${discountValue}%` : 'Flat'})</span>
                    <span className="font-black">-₹{previewDiscountAmount.toLocaleString()}</span>
                  </div>
                )}
                {showAdditional && previewAdditionalCharges.map((charge, idx) => (
                  <div key={idx} className="flex justify-between text-[10px] text-slate-600">
                    <span className="font-bold uppercase">{charge.name || 'Charges'}</span>
                    <span className="font-black">₹{charge.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-6 border-t border-slate-900 mt-4">
                  <span className="text-sm font-black uppercase tracking-widest">Grand Total</span>
                  <span className="text-2xl font-black text-blue-600">₹{Math.round(previewTotalAmount).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="mt-8 grid grid-cols-3 gap-6 text-[8px] border-t pt-4 border-slate-100">
                {showBank ? (
                  <div>
                    <p className="font-black text-slate-400 uppercase tracking-widest mb-1">Bank Details</p>
                    <p className="font-bold text-slate-900">{bankDetails.accountName}</p>
                    <p className="text-slate-500">A/C: {bankDetails.accountNo}</p>
                    <p className="text-slate-500">{bankDetails.bankName} - IFSC: {bankDetails.ifsc}</p>
                  </div>
                ) : <div />}
                {terms ? (
                  <div>
                    <p className="font-black text-slate-400 uppercase tracking-widest mb-1">Terms & Conditions</p>
                    <p className="text-slate-500 whitespace-pre-line leading-relaxed">{terms}</p>
                  </div>
                ) : <div />}
                <div className="text-right flex flex-col items-end justify-end">
                  <p className="font-black text-slate-400 uppercase tracking-widest mb-1">Authorized Signatory</p>
                  {template?.authorizedSignatureUrl ? (
                    <img src={template.authorizedSignatureUrl} alt="Signature" className="h-8 object-contain my-1" />
                  ) : (
                    <div className="h-8" />
                  )}
                  <p className="font-bold text-slate-800">For {template?.companyName || 'GMS ADS & MARKETING'}</p>
                </div>
              </div>

              <div className="mt-auto pt-6 text-center border-t border-slate-100">
                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">This is a draft preview of the quotation document.</p>
              </div>
            </div>
          </div>

          <div className="bg-white border-t p-6 flex justify-end gap-3 shrink-0">
            <button 
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-2xl font-black text-xs hover:bg-gray-300 transition-all"
            >
              Back to Editor
            </button>
            <button 
              type="button"
              onClick={handleSend}
              className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md"
            >
              Save & Send via WhatsApp
            </button>
          </div>
        </div>
      </div>
    );
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
            <button 
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-indigo-200 rounded-lg text-indigo-600 hover:bg-indigo-50 bg-white shadow-sm transition-all text-sm font-semibold"
            >
              Preview
            </button>
            <button 
              type="button"
              onClick={handleSend} 
              disabled={saving} 
              className="px-8 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all text-sm disabled:opacity-50"
            >
              {saving ? 'Sending...' : 'Send'}
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
              
              {/* Validity / Due Date Block with Dual Sync */}
              <div>
                {!showValidity ? (
                  <button 
                    type="button"
                    onClick={() => {
                      setShowValidity(true);
                      handleValidDaysChange(15);
                    }} 
                    className="w-full h-10 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-lg flex items-center justify-center text-sm font-semibold hover:bg-indigo-50 transition-colors"
                  >
                    + Add Validity / Due Date
                  </button>
                ) : (
                  <div className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/10 space-y-3 relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowValidity(false);
                        setValidDays('');
                        setValidityDate('');
                      }}
                      className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-red-500 font-bold"
                    >
                      Remove
                    </button>
                    <p className="text-xs text-indigo-700 font-bold uppercase tracking-wider">Validity Period</p>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-400 font-bold block mb-1">VALID FOR (DAYS)</label>
                        <input
                          type="number"
                          value={validDays}
                          onChange={e => handleValidDaysChange(e.target.value)}
                          className="w-full h-9 px-2.5 border border-gray-300 rounded-lg text-xs font-semibold outline-none focus:border-indigo-500"
                          placeholder="e.g. 15"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-400 font-bold block mb-1">VALIDITY DATE</label>
                        <input
                          type="date"
                          value={validityDate}
                          onChange={e => handleValidityDateChange(e.target.value)}
                          className="w-full h-9 px-2.5 border border-gray-300 rounded-lg text-xs font-semibold outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                  <th className="py-3 px-4 w-24 border-r border-gray-200 text-center">Qty</th>
                  <th className="py-3 px-4 w-32 border-r border-gray-200 text-right">Price/Item (₹)</th>
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
                      <input 
                        type="text" 
                        value={item.quantity} 
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          updateItem(idx, 'quantity', val === '' ? '' : parseInt(val, 10));
                        }}
                        onBlur={() => {
                          if (item.quantity === '' || item.quantity < 1) {
                            updateItem(idx, 'quantity', 1);
                          }
                        }}
                        className="w-full bg-transparent outline-none text-gray-900 text-center font-medium" 
                      />
                    </td>
                    <td className="py-3 px-4 border-r border-gray-200">
                      <div className="flex flex-col gap-1 items-end">
                        <input 
                          type="number" 
                          value={item.unitPrice} 
                          onChange={e => {
                            const val = Number(e.target.value);
                            const original = item.originalPrice;
                            updateItem(idx, 'unitPrice', val);
                            updateItem(idx, 'isCustomPrice', val !== original);
                          }} 
                          className="w-full text-right outline-none font-medium px-2 py-1 rounded bg-transparent text-gray-900 hover:bg-gray-50 focus:bg-white focus:border focus:border-gray-200 transition-all" 
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 border-r border-gray-200 text-right font-bold text-gray-900 bg-gray-50/50">
                      {(Number(item.quantity || 1) * Number(item.unitPrice || 0)).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-all">
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
            
            <div className="flex bg-gray-50/80 border-t border-gray-200">
              <div className="flex-1 text-right py-3.5 px-5 font-bold text-gray-500 uppercase tracking-widest text-xs flex items-center justify-end">Subtotal</div>
              <div className="w-24 py-3 px-4 text-center font-bold border-l border-gray-200 text-gray-700">
                {items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0)}
              </div>
              <div className="w-32 py-3 px-4 text-right font-bold border-l border-gray-200 text-gray-700">
                ₹{items.reduce((acc, i) => acc + ((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0)), 0).toLocaleString()}
              </div>
              <div className="w-32 py-3 px-4 text-right font-black border-l border-r border-gray-200 text-indigo-700 text-base">
                ₹{subtotal.toLocaleString()}
              </div>
              <div className="w-12"></div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row gap-12">
            {/* Left Options - Collapsible Panel Forms */}
            <div className="flex-[3] space-y-4">
              {/* Notes */}
              <div>
                <button 
                  type="button"
                  onClick={() => setShowNotes(!showNotes)} 
                  className="text-indigo-600 font-bold text-sm hover:underline block transition-all"
                >
                  {showNotes ? 'Hide Notes' : '+ Add Notes'}
                </button>
                {showNotes && (
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 mt-2">
                    <p className="text-xs text-gray-500 mb-2 font-bold uppercase tracking-wider">Notes</p>
                    <textarea 
                      value={notes} 
                      onChange={e => setNotes(e.target.value)} 
                      placeholder="Add internal or customer notes..."
                      className="w-full bg-transparent outline-none text-slate-700 text-sm resize-none h-20 leading-relaxed font-medium" 
                    />
                  </div>
                )}
              </div>
              
              {/* Terms and Conditions */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                <p className="text-xs text-gray-500 mb-2 font-bold uppercase tracking-wider">Terms and Conditions</p>
                <textarea 
                  value={terms} 
                  onChange={e => setTerms(e.target.value)} 
                  className="w-full bg-transparent outline-none text-slate-700 text-sm resize-none h-20 leading-relaxed font-medium" 
                />
              </div>
              
              {/* Bank Account */}
              <div>
                <button 
                  type="button"
                  onClick={() => setShowBank(!showBank)} 
                  className="text-indigo-600 font-bold text-sm hover:underline block transition-all"
                >
                  {showBank ? 'Hide Bank Account' : '+ Add Bank Account'}
                </button>
                {showBank && (
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 grid grid-cols-2 gap-3 mt-2">
                    <div className="col-span-2">
                      <p className="text-xs text-slate-700 font-bold uppercase tracking-wider">Bank Account Details</p>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold block mb-1">ACCOUNT NAME</label>
                      <input 
                        type="text" 
                        value={bankDetails.accountName} 
                        onChange={e => setBankDetails({...bankDetails, accountName: e.target.value})} 
                        className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs font-semibold outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold block mb-1">ACCOUNT NUMBER</label>
                      <input 
                        type="text" 
                        value={bankDetails.accountNo} 
                        onChange={e => setBankDetails({...bankDetails, accountNo: e.target.value})} 
                        className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs font-semibold outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold block mb-1">IFSC CODE</label>
                      <input 
                        type="text" 
                        value={bankDetails.ifsc} 
                        onChange={e => setBankDetails({...bankDetails, ifsc: e.target.value})} 
                        className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs font-semibold outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold block mb-1">BANK NAME</label>
                      <input 
                        type="text" 
                        value={bankDetails.bankName} 
                        onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} 
                        className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs font-semibold outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-gray-400 font-bold block mb-1">BRANCH</label>
                      <input 
                        type="text" 
                        value={bankDetails.branch} 
                        onChange={e => setBankDetails({...bankDetails, branch: e.target.value})} 
                        className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs font-semibold outline-none focus:border-indigo-500" 
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Payment QR */}
              <div>
                <button 
                  type="button"
                  onClick={() => setShowQR(!showQR)} 
                  className="text-indigo-600 font-bold text-sm hover:underline block transition-all"
                >
                  {showQR ? 'Hide Payment QR' : '+ Add Payment QR'}
                </button>
                {showQR && (
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 mt-2 flex items-center gap-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-[9px] border border-indigo-300 shadow shadow-indigo-100 p-2 text-center">
                      UPI QR MOCK
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 font-bold block mb-1">UPI ID FOR QR GENERATION</label>
                      <input 
                        type="text" 
                        value={upiId} 
                        onChange={e => setUpiId(e.target.value)} 
                        className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs font-semibold outline-none focus:border-indigo-500" 
                      />
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">This UPI ID will generate a scan-and-pay QR code on the final document.</p>
                    </div>
                  </div>
                )}
              </div>
              

            </div>
            
            {/* Right Totals */}
            <div className="flex-[2] flex flex-col gap-4 text-sm min-w-[320px]">
              <div className="flex justify-between items-center text-gray-600 font-medium">
                <button 
                  type="button"
                  onClick={() => setShowAdditional(!showAdditional)} 
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  {showAdditional ? 'Hide Additional Charges' : '+ Add Additional Charges'}
                </button>
                <span>₹{totalAdditional.toLocaleString()}</span>
              </div>
              
              {/* Additional Charges Input Panel under button in right-side */}
              {showAdditional && (
                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/50 space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Itemize Additional Charges</p>
                  {additionalCharges.map((charge, idx) => (
                    <div key={idx} className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        value={charge.name}
                        onChange={e => {
                          const newCharges = [...additionalCharges];
                          newCharges[idx].name = e.target.value;
                          setAdditionalCharges(newCharges);
                        }}
                        placeholder="Name (e.g. Delivery)"
                        className="flex-1 h-8 px-2 border border-gray-300 rounded-lg text-[11px] font-semibold outline-none focus:border-indigo-500"
                      />
                      <input
                        type="number"
                        value={charge.amount}
                        onChange={e => {
                          const newCharges = [...additionalCharges];
                          newCharges[idx].amount = Number(e.target.value);
                          setAdditionalCharges(newCharges);
                        }}
                        placeholder="Amt"
                        className="w-16 h-8 px-2 border border-gray-300 rounded-lg text-[11px] font-semibold text-right outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setAdditionalCharges(additionalCharges.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAdditionalCharges([...additionalCharges, { name: '', amount: 0 }])}
                    className="text-xs text-indigo-600 font-bold flex items-center gap-1 hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Charge Row
                  </button>
                </div>
              )}
              
              <div className="flex justify-between items-center font-bold text-gray-800 text-base mt-2">
                <span>Taxable Amount</span>
                <span>₹{subtotal.toLocaleString()}</span>
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
              
              <div className="flex flex-col gap-3 mt-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <div className="flex justify-between items-center">
                  <span className="font-black text-gray-900 text-lg uppercase tracking-wider">Total Amount</span>
                  <span className="font-black text-indigo-700 text-2xl">₹{Math.round(finalTotal).toLocaleString()}</span>
                </div>
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
      {renderPreviewModal()}
    </div>
  );
};

export default QuotationBuilder;
