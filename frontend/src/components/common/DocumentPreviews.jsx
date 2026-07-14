import React from 'react';
import { createPortal } from 'react-dom';
import { Eye, Printer, X, FileText, AlertCircle, MessageCircle } from 'lucide-react';
import { numberToWords } from '../../utils/numberToWords';
import { useAuth } from '../../context/AuthContext';
import { useCompanyProfile } from '../../context/CompanyProfileContext';
import { quotationApi } from '../../services/api';

// Default GMS Company Logo SVG component matching the PDF logo
const DefaultLogo = () => (
  <div className="flex flex-col items-center shrink-0 w-[110px] select-none">
    <div className="relative flex items-center justify-center mb-0.5">
      <svg className="w-15 h-15 text-[#1d4ed8]" viewBox="0 0 60 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 25C10 14 20 6 35 6C45 6 52 11 54 18" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M54 18L46 13M54 18L49 26" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M50 26C50 37 40 45 25 45C15 45 8 40 6 33" stroke="#e11d48" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M6 33L14 38M6 33L11 25" stroke="#e11d48" strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="30" cy="25.5" r="8" fill="#1e40af" />
      </svg>
    </div>
    <div className="text-center">
      <span className="block font-black text-[13px] tracking-tight leading-none text-[#1e40af]">GLOBAL</span>
      <span className="block font-bold text-[8.5px] text-[#e11d48] tracking-widest leading-tight mt-0.5">MARKETING SOLUTIONS</span>
      <span className="block font-medium text-[4.8px] text-slate-500 tracking-[0.1em] mt-0.5 uppercase">ADVERTISING | BRANDING | PRINTING | EVENTS</span>
    </div>
  </div>
);

// CSS applied globally when modal is printed to ensure exact A4 sheet print
const printStyles = `
  @media print {
    body * {
      visibility: hidden !important;
    }
    .printable-document-sheet, .printable-document-sheet * {
      visibility: visible !important;
    }
    .printable-document-sheet {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 15mm 15mm !important;
      border: none !important;
      box-shadow: none !important;
      background: white !important;
    }
    .print-hidden {
      display: none !important;
    }
  }
`;

const formatUKDate = (dateVal) => {
  if (!dateVal) return new Date().toLocaleDateString('en-GB');
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-');
      return `${d}/${m}/${y}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed;
    }
  }
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? String(dateVal) : d.toLocaleDateString('en-GB');
};

export const ViewQuotationModal = ({ quotation, onClose, onSendWhatsApp }) => {
  const { user } = useAuth();
  const { profile } = useCompanyProfile();
  if (!quotation) return null;

  const rawTemplate = quotation.templateSnapshot || quotation.template || {};
  const template = { ...profile, ...rawTemplate, bankDetails: { ...profile?.bankDetails, ...(rawTemplate.bankDetails || {}) } };
  const prospect = quotation.prospect || quotation.clientSnapshot || {};
  const items = quotation.items || [];
  
  // Calculations
  const subtotal = quotation.subtotal || items.reduce((acc, it) => acc + (Number(it.totalCost || it.amount || (Number(it.quantity || 1) * Number(it.unitCost || it.unitPrice || it.rate || 0))) || 0), 0);
  const totalQty = items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  
  // Tax
  const taxAmount = quotation.tax?.amount !== undefined 
    ? Number(quotation.tax.amount) 
    : items.reduce((acc, it) => acc + (Number(it.taxAmount) || (Number(it.totalCost || (Number(it.quantity || 1) * Number(it.unitCost || 0))) * 0.18)), 0);
    
  const totalAmount = quotation.totalAmount !== undefined 
    ? Number(quotation.totalAmount) 
    : subtotal + taxAmount - (quotation.discount?.amount || 0);

  // Dates & IDs
  const quoteNo = quotation.quotationId || quotation.quotationNumber || quotation._id?.slice(-6)?.toUpperCase() || '2292';
  const quoteDate = formatUKDate(quotation.quotationDate || quotation.date || quotation.createdAt || new Date());
  
  // Place of supply and tax breakdown (CGST+SGST vs IGST based on Supplier GSTIN state vs POS)
  const supplierGst = template.gstin || profile?.gstin || '36AAQFG7654Q2ZB';
  const supplierStateCode = supplierGst.replace(/\D/g, '').slice(0, 2) || '36';
  const supplierStateName = supplierStateCode === '36' ? 'Telangana' : (template.state || profile?.state || 'Telangana');

  const clientGst = prospect.gstin || prospect.gstNumber || '';
  const clientStateCode = clientGst ? clientGst.replace(/\D/g, '').slice(0, 2) : '';
  const placeOfSupply = prospect.placeOfSupply || prospect.state || 'Telangana';
  
  const isIntrastate = (clientStateCode && clientStateCode === supplierStateCode) || (!clientStateCode && (placeOfSupply.toLowerCase().includes(supplierStateName.toLowerCase()) || placeOfSupply.toLowerCase().includes('telangana')));
  
  const cgstAmount = isIntrastate ? taxAmount / 2 : 0;
  const sgstAmount = isIntrastate ? taxAmount / 2 : 0;
  const igstAmount = !isIntrastate ? taxAmount : 0;

  const notesText = quotation.notes || template.termsAndConditions?.[0] || '70% ADVANCE PAYMENT NEED TO START WORK';

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <style>{printStyles}</style>
      <div className="bg-slate-100 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] text-slate-800">
        
        {/* Modal Top Bar */}
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center shrink-0 print-hidden">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center">
              <Eye className="h-4 w-4 text-blue-400" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Quotation Preview</h2>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {onClose && (
              <button 
                onClick={onClose} 
                className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Printable Sheet Wrapper */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/80">
          <div className="printable-document-sheet bg-white mx-auto shadow-xl rounded-sm w-full max-w-[210mm] min-h-[297mm] p-[12mm] sm:p-[15mm] flex flex-col justify-between font-sans text-slate-800 border border-slate-300">
            
            {/* Top Section */}
            <div>
              {/* Header: Logo & Company Address */}
              <div className="flex items-stretch justify-between gap-6 pb-4">
                {/* Logo Container: Centered Horizontally & Vertically */}
                <div className="w-[160px] sm:w-[185px] shrink-0 flex items-center justify-center pr-5">
                  {template.logoUrl ? (
                    <img src={template.logoUrl} alt="Logo" className="max-h-20 w-auto object-contain max-w-full mx-auto my-auto" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full my-auto">
                      <DefaultLogo />
                    </div>
                  )}
                </div>

                {/* Company Details Content */}
                <div className="flex-1 text-left pl-1 sm:pl-3 flex flex-col justify-center">
                  <h1 className="text-2xl sm:text-[27px] font-extrabold text-[#0284c7] tracking-tight leading-tight">
                    {template.companyName || profile?.companyName || 'Global Marketing Solutions'}
                  </h1>
                  <p className="text-xs sm:text-[13px] text-slate-700 font-medium leading-relaxed mt-1">
                    {template.address || profile?.address || '2nd floor, Plot no 204, Kamineni Hospital Bypass Rd, Suvidha Arcade, RTC Colony, L. B. Nagar, Hyderabad, Telangana, PIN:500060.'}
                  </p>
                  
                  {/* Row 1: Mobile & Email */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-[13px] text-slate-800 font-normal mt-2">
                    <div>
                      <span className="font-bold text-slate-900">Mobile:</span> {template.contactPhone || template.mobile || profile?.contactPhone || profile?.mobile || '+91 98765 43210'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">Email:</span> {template.contactEmail || template.email || profile?.contactEmail || profile?.email || 'info@globalmarketingsolutions.in'}
                    </div>
                  </div>

                  {/* Row 2: GSTIN, PAN */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-[13px] text-slate-800 font-normal mt-1">
                    <div>
                      <span className="font-bold text-slate-900">GSTIN:</span> {template.gstin || profile?.gstin || '36AAGCE2149M1Z8'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">PAN Number:</span> {template.panNumber || profile?.panNumber || 'AABCU9603R'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Title & Quotation Info Banner */}
              <div className="bg-[#f0f6fa] border-t-[3.5px] border-[#0284c7] py-2 px-5 mt-3 grid grid-cols-2 gap-4 text-xs sm:text-[13px] font-normal text-slate-900">
                <div>
                  <span className="font-bold">Quotation No.:</span> {quoteNo}
                </div>
                <div className="text-right">
                  <span className="font-bold">Quotation Date:</span> {quoteDate}
                </div>
              </div>

              {/* BILL TO & SHIP TO */}
              {(() => {
                const companyName = prospect.company || prospect.companyName || (prospect.name && !prospect.contactPerson ? prospect.name : '');
                const contactPerson = prospect.contactPerson || prospect.contactPersonName || (prospect.company && prospect.name ? prospect.name : '');
                const billAddr = prospect.address || prospect.location || prospect.billingAddress || '';
                const shipAddr = prospect.shippingAddress || billAddr;
                const phone = prospect.phone || prospect.mobile || prospect.mobileNumber || '';
                const gstin = prospect.gstin || prospect.gstNumber || '';
                const pan = prospect.panNumber || prospect.pan || '';
                const showPlaceOfSupply = placeOfSupply || prospect.state;

                return (
                  <div className="grid grid-cols-2 gap-6 py-5 px-1 border-b border-slate-100 text-xs sm:text-[13px]">
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs tracking-wider uppercase mb-1">BILL TO</h3>
                      {companyName ? <p className="font-bold text-slate-900 text-[13.5px]">{companyName}</p> : <p className="font-bold text-slate-400 italic text-xs">No Client Name Specified</p>}
                      {contactPerson && <p className="text-slate-800 mt-0.5"><span className="font-semibold">Contact Person:</span> {contactPerson}</p>}
                      {billAddr && <p className="text-slate-800 mt-0.5 leading-snug">{billAddr}</p>}
                      {phone && <p className="text-slate-800 mt-1"><span className="font-semibold">Mobile:</span> {phone}</p>}
                      {gstin && <p className="text-slate-800"><span className="font-semibold">GSTIN:</span> {gstin}</p>}
                      {pan && <p className="text-slate-800"><span className="font-semibold">PAN Number:</span> {pan}</p>}
                      {showPlaceOfSupply && <p className="text-slate-800"><span className="font-semibold">Place of Supply:</span> {showPlaceOfSupply} ({isIntrastate ? 'Intra-State' : 'Inter-State'})</p>}
                    </div>
                    {(companyName || shipAddr) && (
                      <div>
                        <h3 className="font-bold text-slate-900 text-xs tracking-wider uppercase mb-1">SHIP TO</h3>
                        {companyName && <p className="font-bold text-slate-900 text-[13.5px]">{companyName}</p>}
                        {contactPerson && <p className="text-slate-800 mt-0.5"><span className="font-semibold">Contact Person:</span> {contactPerson}</p>}
                        {shipAddr && <p className="text-slate-800 mt-0.5 leading-snug">{shipAddr}</p>}
                        {phone && <p className="text-slate-800 mt-1"><span className="font-semibold">Mobile:</span> {phone}</p>}
                        {gstin && <p className="text-slate-800"><span className="font-semibold">GSTIN:</span> {gstin}</p>}
                        {pan && <p className="text-slate-800"><span className="font-semibold">PAN Number:</span> {pan}</p>}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Table Section */}
              <div className="mt-4">
                <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
                  <thead>
                    <tr className="border-t-2 border-b-2 border-slate-900 text-slate-900 font-bold">
                      <th className="py-2.5 px-3">ITEMS</th>
                      <th className="py-2.5 px-3 text-center">QTY.</th>
                      <th className="py-2.5 px-3 text-right">RATE</th>
                      <th className="py-2.5 px-3 text-right">TAX</th>
                      <th className="py-2.5 px-3 text-right">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80">
                    {items.map((it, idx) => {
                      const qty = Number(it.quantity || 1);
                      const unit = it.unit || 'PCS';
                      const rate = Number(it.unitCost || it.unitPrice || it.rate || 0);
                      const itemTax = Number(it.taxAmount || (qty * rate * 0.18));
                      const itemAmt = Number(it.totalCost || (qty * rate));
                      const desc = it.name || it.description || 'ADVERTISEMENT ITEM';
                      const subDesc = it.details || it.notes || '';

                      return (
                        <tr key={idx} className="align-top">
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-900 block">{desc}</span>
                            {subDesc && <span className="text-[11px] text-slate-600 font-normal block mt-0.5">{subDesc}</span>}
                          </td>
                          <td className="py-3 px-3 text-center font-normal text-slate-900 whitespace-nowrap">
                            {qty} {unit}
                          </td>
                          <td className="py-3 px-3 text-right font-normal text-slate-900 whitespace-nowrap">
                            {rate.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-right font-normal text-slate-900 whitespace-nowrap">
                            <div>{itemTax.toLocaleString('en-IN')}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5 font-normal">(18% GST)</div>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                            {itemAmt.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-b-2 border-slate-900 font-bold text-slate-900">
                      <td className="py-2.5 px-3 uppercase">SUBTOTAL</td>
                      <td className="py-2.5 px-3 text-center">{totalQty}</td>
                      <td className="py-2.5 px-3"></td>
                      <td className="py-2.5 px-3"></td>
                      <td className="py-2.5 px-3 text-right">₹ {subtotal.toLocaleString('en-IN')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Bottom Details Section: Notes & Totals Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 px-3 text-xs sm:text-[13px]">
                {/* Notes */}
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-1">NOTES</h4>
                  <p className="text-slate-800 font-normal leading-relaxed">{notesText}</p>
                  
                  {template.bankDetails && (
                    <div className="mt-4 pt-3 border-t border-slate-200 text-slate-800">
                      <p className="font-bold text-slate-900 mb-0.5">Bank Details:</p>
                      <p><span className="font-semibold">Bank:</span> {template.bankDetails.bankName}</p>
                      <p><span className="font-semibold">Account Name:</span> {template.bankDetails.accountName}</p>
                      <p><span className="font-semibold">A/C No:</span> {template.bankDetails.accountNumber}</p>
                      <p><span className="font-semibold">IFSC:</span> {template.bankDetails.ifscCode}</p>
                      {template.bankDetails.branch && <p><span className="font-semibold">Branch:</span> {template.bankDetails.branch}</p>}
                    </div>
                  )}
                </div>

                {/* Totals Table */}
                <div className="flex flex-col items-end">
                  <div className="w-full max-w-[280px] space-y-1.5 text-right">
                    <div className="flex justify-between font-normal text-slate-900">
                      <span>Taxable Amount</span>
                      <span>₹ {subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    {isIntrastate ? (
                      <>
                        <div className="flex justify-between font-normal text-slate-900">
                          <span>CGST @9% (Intra-State)</span>
                          <span>₹ {cgstAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between font-normal text-slate-900">
                          <span>SGST @9% (Intra-State)</span>
                          <span>₹ {sgstAmount.toLocaleString('en-IN')}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between font-normal text-slate-900">
                        <span>IGST @18% (Inter-State)</span>
                        <span>₹ {igstAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-300 my-2 pt-1.5 flex justify-between font-bold text-slate-900 text-sm sm:text-[14px]">
                      <span>Total Amount</span>
                      <span>₹ {Math.round(totalAmount).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="mt-4 w-full text-right">
                    <p className="font-normal text-slate-700 text-[12px]">Total Amount (in words)</p>
                    <p className="font-bold text-slate-900 text-[13px] mt-0.5 leading-snug">
                      {numberToWords(Math.round(totalAmount))}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Block */}
            <div className="pt-12 pb-2 text-right pr-2 flex flex-col items-end shrink-0">
              {template.signatureUrl ? (
                <img src={template.signatureUrl} alt="Signature" className="h-12 object-contain mb-1" />
              ) : (
                <div className="h-12 w-32 border-b border-slate-300 flex items-center justify-end font-serif italic text-slate-400 text-sm">
                  Gary
                </div>
              )}
              <p className="text-xs sm:text-[12.5px] font-bold text-slate-900 tracking-wider uppercase mt-1">
                AUTHORISED SIGNATORY FOR
              </p>
              <p className="text-xs sm:text-[13px] text-slate-800 font-normal mt-0.5">
                Global Marketing Solutions
              </p>
            </div>

          </div>
        </div>

        {/* Approval Actions Footer (if pending approval) */}
        {/* Bottom Actions Footer */}
        <div className="bg-white border-t px-6 py-4 flex flex-wrap justify-between items-center gap-4 shrink-0 print-hidden">
          <div>
            {quotation.requiresApproval && quotation.status === 'Draft' && (
              ['ADMIN', 'SALES_MANAGER', 'MD_CEO'].includes(user?.role) ? (
                <div className="flex gap-3">
                  <button 
                    onClick={async () => {
                      if (window.confirm('Approve this quotation?')) {
                        await quotationApi.updateStatus(quotation._id || quotation.id, { status: 'Approved' }, user?.token);
                        onClose?.(true);
                      }
                    }}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-md"
                  >
                    Approve Quotation
                  </button>
                  <button 
                    onClick={async () => {
                      const reason = window.prompt('Reason for rejection:');
                      if (reason !== null) {
                        await quotationApi.update(quotation._id || quotation.id, { status: 'Rejected', notes: reason }, user?.token);
                        onClose?.(true);
                      }
                    }}
                    className="px-6 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-100 transition-all"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <p className="text-xs font-bold text-amber-600 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" /> Pending Manager Approval
                </p>
              )
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button 
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-[#0284c7] text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-[#0369a1] transition-all shadow-md"
            >
              <Printer className="h-4 w-4" /> Download PDF / Print
            </button>
            <button 
              onClick={() => {
                if (onSendWhatsApp) {
                  onSendWhatsApp();
                } else {
                  const phoneClean = prospect.phone?.replace(/\D/g, '') || '';
                  const formattedPhone = phoneClean.length === 10 ? `91${phoneClean}` : phoneClean;
                  const itemsList = items.map(i => `• ${i.name || i.description} (x${i.quantity || 1}): ₹${Number(i.totalCost || i.amount || 0).toLocaleString()}`).join('\n');
                  const text = `*QUOTATION: ${template.companyName || 'GMS ADS & MARKETING'}*\n\nHello *${prospect.name || 'Client'}* (${prospect.company || 'N/A'}),\n\nFollowing is the estimate for your requirement:\n\n${itemsList}\n\n--------------------------\n*Subtotal:* ₹${Number(subtotal).toLocaleString()}\n*TOTAL AMOUNT:* ₹${Math.round(totalAmount).toLocaleString()}\n--------------------------\n\nRegards,\n*GMS Sales Team*`;
                  window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`, '_blank');
                }
              }}
              className="px-5 py-2.5 bg-[#25d366] text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-[#1ebd5b] transition-all shadow-md"
            >
              <MessageCircle className="h-4 w-4" /> Send via WhatsApp
            </button>
            <button onClick={onClose} className="px-5 py-2.5 bg-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-300 transition-all">
              Close
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};


// ─── View Invoice Modal matching exact Tax Invoice PDF format ───────────────────
export const ViewInvoiceModal = ({ order, onClose }) => {
  const { profile } = useCompanyProfile();
  if (!order) return null;

  const rawCompany = order.companySnapshot || order.companyDetails || {};
  const companySnapshot = { ...profile, ...rawCompany, bankDetails: { ...profile?.bankDetails, ...(rawCompany.bankDetails || {}) } };
  const clientSnapshot = order.clientSnapshot || order.prospect || {};
  const lineItems = order.lineItems || [];
  
  // Calculations
  const subtotal = order.subtotal || lineItems.reduce((acc, it) => acc + (Number(it.amount || (Number(it.quantity || 1) * Number(it.unitPrice || 0))) || 0), 0);
  const totalQty = lineItems.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  
  const taxAmount = order.totalGST !== undefined 
    ? Number(order.totalGST) 
    : lineItems.reduce((acc, it) => acc + (Number(it.taxAmount) || (Number(it.amount || (Number(it.quantity || 1) * Number(it.unitPrice || 0))) * 0.18)), 0);
    
  const totalAmount = order.grandTotal !== undefined 
    ? Number(order.grandTotal) 
    : (order.totalAmount !== undefined ? Number(order.totalAmount) : subtotal + taxAmount);

  const receivedAmount = order.totalPaid !== undefined ? Number(order.totalPaid) : 0;

  // Dates & IDs (Follow exact guidelines: Delivery Date -> Invoice Date -> Due Date = Invoice Date + Credit Period)
  const invoiceNo = order.invoiceNumber || order.orderNumber || order.orderId || order._id?.slice(-6)?.toUpperCase() || '2074';
  
  // 1. Delivery Date from order form
  const rawDeliveryDateVal = order.deliveryDate || order.lineItems?.[0]?.deliveryDate || order.orderDate || order.date || order.createdAt || new Date();
  const deliveryDate = formatUKDate(rawDeliveryDateVal);

  // 2. Invoice Date (Bill Date / Date of Invoice - date on which invoice is raised/issued)
  const rawInvoiceDateVal = order.invoiceDate || order.billDate || order.orderDate || order.createdAt || new Date();
  const rawInvoiceDate = new Date(rawInvoiceDateVal);
  const invoiceDate = formatUKDate(rawInvoiceDateVal);

  // 3. Due Date = Invoice Date + Credit Period (or explicit order.dueDate)
  const creditDays = Number(order.creditDays || order.creditPeriod || (order.orderType === 'corporate' ? 30 : 30));
  const dueDateVal = order.dueDate ? new Date(order.dueDate) : new Date(rawInvoiceDate.getTime() + creditDays * 24 * 60 * 60 * 1000);
  const dueDate = formatUKDate(dueDateVal);

  // Place of supply and tax breakdown (Compare supplier location with POS)
  const supplierGst = companySnapshot.gstin || profile?.gstin || '36AAQFG7654Q2ZB';
  const supplierStateCode = supplierGst.replace(/\D/g, '').slice(0, 2) || '36';
  const supplierStateName = supplierStateCode === '36' ? 'Telangana' : (companySnapshot.state || profile?.state || 'Telangana');

  const clientGst = clientSnapshot.gstin || clientSnapshot.gstNumber || order.gstNumber || '';
  const clientStateCode = clientGst ? clientGst.replace(/\D/g, '').slice(0, 2) : '';
  const placeOfSupply = clientSnapshot.placeOfSupply || clientSnapshot.state || order.state || 'Telangana';
  
  const isIntrastate = (clientStateCode && clientStateCode === supplierStateCode) || (!clientStateCode && (placeOfSupply.toLowerCase().includes(supplierStateName.toLowerCase()) || placeOfSupply.toLowerCase().includes('telangana')));
  
  const cgstAmount = isIntrastate ? taxAmount / 2 : 0;
  const sgstAmount = isIntrastate ? taxAmount / 2 : 0;
  const igstAmount = !isIntrastate ? taxAmount : 0;

  const termsText = order.termsAndConditions || [
    '1) Payment should be Crossed and Made to "GLOBAL MARKETING SOLUTIONS", AXIS BANK, BRANCH: Champapet, A/C: 917020030786090, IFSCcode:UTIB0001305'
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <style>{printStyles}</style>
      <div className="bg-slate-100 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] text-slate-800">
        
        {/* Modal Top Bar */}
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center shrink-0 print-hidden">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center">
              <FileText className="h-4 w-4 text-emerald-400" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Tax Invoice Preview</h2>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.print()}
              className="px-5 py-2 bg-[#0284c7] text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-[#0369a1] transition-all shadow-md"
            >
              <Printer className="h-4 w-4" /> Download PDF / Print
            </button>
            {onClose && (
              <button 
                onClick={onClose} 
                className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Printable Sheet Wrapper */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/80">
          <div className="printable-document-sheet bg-white mx-auto shadow-xl rounded-sm w-full max-w-[210mm] min-h-[297mm] p-[12mm] sm:p-[15mm] flex flex-col justify-between font-sans text-slate-800 border border-slate-300">
            
            {/* Top Section */}
            <div>
              {/* Top Document Header Bar: TAX INVOICE & ORIGINAL FOR RECIPIENT */}
              <div className="flex justify-between items-center mb-4 text-slate-900">
                <span className="font-bold text-sm tracking-wide uppercase">TAX INVOICE</span>
                <span className="border border-slate-400 px-2.5 py-0.5 text-xs font-semibold text-slate-700 tracking-wide uppercase bg-slate-50">
                  ORIGINAL FOR RECIPIENT
                </span>
              </div>

              {/* Header: Logo & Company Address */}
              <div className="flex items-stretch justify-between gap-6 pb-4">
                {/* Logo Container: Centered Horizontally & Vertically */}
                <div className="w-[160px] sm:w-[185px] shrink-0 flex items-center justify-center pr-5">
                  {companySnapshot.logoUrl ? (
                    <img src={companySnapshot.logoUrl} alt="Logo" className="max-h-20 w-auto object-contain max-w-full mx-auto my-auto" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full my-auto">
                      <DefaultLogo />
                    </div>
                  )}
                </div>

                {/* Company Details Content */}
                <div className="flex-1 text-left pl-1 sm:pl-3 flex flex-col justify-center">
                  <h1 className="text-2xl sm:text-[27px] font-extrabold text-[#0284c7] tracking-tight leading-tight">
                    {companySnapshot.companyName || profile?.companyName || 'Global Marketing Solutions Pvt Ltd'}
                  </h1>
                  <p className="text-xs sm:text-[13px] text-slate-700 font-medium leading-relaxed mt-1">
                    {companySnapshot.address || profile?.address || '2nd floor, Plot no 204, Kamineni Hospital Bypass Rd, Suvidha Arcade, RTC Colony, L. B. Nagar, Hyderabad, Telangana, PIN:500060.'}
                  </p>
                  
                  {/* Row 1: Mobile & Email */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-[13px] text-slate-800 font-normal mt-2">
                    <div>
                      <span className="font-bold text-slate-900">Mobile:</span> {companySnapshot.contactPhone || companySnapshot.mobile || profile?.contactPhone || profile?.mobile || '+91 98765 43210'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">Email:</span> {companySnapshot.contactEmail || companySnapshot.email || profile?.contactEmail || profile?.email || 'info@globalmarketingsolutions.in'}
                    </div>
                  </div>

                  {/* Row 2: GSTIN, PAN */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-[13px] text-slate-800 font-normal mt-1">
                    <div>
                      <span className="font-bold text-slate-900">GSTIN:</span> {companySnapshot.gstin || profile?.gstin || '36AAGCE2149M1Z8'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">PAN Number:</span> {companySnapshot.panNumber || profile?.panNumber || 'AABCU9603R'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Metadata Bar */}
              <div className="bg-[#f0f6fa] border-t-[3.5px] border-[#0284c7] py-2 px-5 mt-3 grid grid-cols-3 gap-2 text-xs sm:text-[13px] font-normal text-slate-900">
                <div>
                  <span className="font-bold">Invoice No.:</span> {invoiceNo}
                </div>
                <div className="text-center">
                  <span className="font-bold">Invoice Date:</span> {invoiceDate}
                </div>
                <div className="text-right">
                  <span className="font-bold">Due Date:</span> {dueDate}
                </div>
              </div>

              {/* BILL TO & SHIP TO */}
              {(() => {
                const companyName = clientSnapshot.company || clientSnapshot.companyName || (clientSnapshot.name && !clientSnapshot.contactPerson ? clientSnapshot.name : '');
                const contactPerson = clientSnapshot.contactPerson || clientSnapshot.contactPersonName || (clientSnapshot.company && clientSnapshot.name ? clientSnapshot.name : '');
                const billAddr = clientSnapshot.address || clientSnapshot.location || clientSnapshot.billingAddress || order.location || order.address || '';
                const shipAddr = clientSnapshot.shippingAddress || order.shippingAddress || billAddr;
                const phone = clientSnapshot.phone || clientSnapshot.mobile || clientSnapshot.mobileNumber || '';
                const gstin = clientSnapshot.gstin || clientSnapshot.gstNumber || order.gstNumber || '';
                const pan = clientSnapshot.panNumber || clientSnapshot.pan || '';
                const showPlaceOfSupply = placeOfSupply || clientSnapshot.state;

                return (
                  <div className="grid grid-cols-2 gap-6 py-5 px-1 border-b border-slate-100 text-xs sm:text-[13px]">
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs tracking-wider uppercase mb-1">BILL TO</h3>
                      {companyName ? <p className="font-bold text-slate-900 text-[13.5px]">{companyName}</p> : <p className="font-bold text-slate-400 italic text-xs">No Client Name Specified</p>}
                      {contactPerson && <p className="text-slate-800 mt-0.5"><span className="font-semibold">Contact Person:</span> {contactPerson}</p>}
                      {billAddr && <p className="text-slate-800 mt-0.5 leading-snug">{billAddr}</p>}
                      {phone && <p className="text-slate-800 mt-1"><span className="font-semibold">Mobile:</span> {phone}</p>}
                      {gstin && <p className="text-slate-800"><span className="font-semibold">GSTIN:</span> {gstin}</p>}
                      {pan && <p className="text-slate-800"><span className="font-semibold">PAN Number:</span> {pan}</p>}
                      {showPlaceOfSupply && <p className="text-slate-800"><span className="font-semibold">Place of Supply:</span> {showPlaceOfSupply} ({isIntrastate ? 'Intra-State' : 'Inter-State'})</p>}
                    </div>
                    {(companyName || shipAddr) && (
                      <div>
                        <h3 className="font-bold text-slate-900 text-xs tracking-wider uppercase mb-1">SHIP TO</h3>
                        {companyName && <p className="font-bold text-slate-900 text-[13.5px]">{companyName}</p>}
                        {contactPerson && <p className="text-slate-800 mt-0.5"><span className="font-semibold">Contact Person:</span> {contactPerson}</p>}
                        {shipAddr && <p className="text-slate-800 mt-0.5 leading-snug">{shipAddr}</p>}
                        {phone && <p className="text-slate-800 mt-1"><span className="font-semibold">Mobile:</span> {phone}</p>}
                        {gstin && <p className="text-slate-800"><span className="font-semibold">GSTIN:</span> {gstin}</p>}
                        {pan && <p className="text-slate-800"><span className="font-semibold">PAN Number:</span> {pan}</p>}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Table Section */}
              <div className="mt-4">
                <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
                  <thead>
                    <tr className="border-t-2 border-b-2 border-slate-900 text-slate-900 font-bold">
                      <th className="py-2.5 px-3">ITEMS</th>
                      <th className="py-2.5 px-3 text-center">QTY.</th>
                      <th className="py-2.5 px-3 text-right">RATE</th>
                      <th className="py-2.5 px-3 text-right">TAX</th>
                      <th className="py-2.5 px-3 text-right">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80">
                    {lineItems.map((it, idx) => {
                      const qty = Number(it.quantity || 1);
                      const unit = it.unit || 'PCS';
                      const rate = Number(it.unitPrice || it.rate || 0);
                      const itemTax = Number(it.taxAmount || (qty * rate * 0.18));
                      const itemAmt = Number(it.amount || (qty * rate));
                      const desc = it.description || it.name || 'SERVICE ITEM';
                      const subDesc = it.details || it.notes || '';

                      return (
                        <tr key={idx} className="align-top">
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-900 block">{desc}</span>
                            {subDesc && <span className="text-[11px] text-slate-600 font-normal block mt-0.5">{subDesc}</span>}
                          </td>
                          <td className="py-3 px-3 text-center font-normal text-slate-900 whitespace-nowrap">
                            {qty} {unit}
                          </td>
                          <td className="py-3 px-3 text-right font-normal text-slate-900 whitespace-nowrap">
                            {rate.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-right font-normal text-slate-900 whitespace-nowrap">
                            <div>{itemTax.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{isIntrastate ? '(CGST 9% + SGST 9%)' : '(IGST 18%)'}</div>
                          </td>
                          <td className="py-3 px-3 text-right font-normal text-slate-900 whitespace-nowrap">
                            {itemAmt.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Subtotal Row */}
                  <tfoot>
                    <tr className="border-t-2 border-b-2 border-slate-900 font-bold text-slate-900">
                      <td className="py-2.5 px-3 uppercase">SUBTOTAL</td>
                      <td className="py-2.5 px-3 text-center">{totalQty}</td>
                      <td className="py-2.5 px-3 text-right">₹ {taxAmount.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</td>
                      <td className="py-2.5 px-3 text-right"></td>
                      <td className="py-2.5 px-3 text-right">₹ {subtotal.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Bottom Details Section: Terms & Totals Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 px-3 text-xs sm:text-[13px]">
                {/* Terms and Conditions */}
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-1">TERMS AND CONDITIONS</h4>
                  <p className="font-bold text-slate-800 text-[12.5px] mt-1">TERMS AND CONDITIONS (Credit Period: Net {creditDays} Days):</p>
                  <div className="text-slate-800 font-normal mt-0.5 leading-relaxed space-y-1">
                    {Array.isArray(termsText) ? (
                      termsText.map((term, i) => <p key={i}>{term}</p>)
                    ) : (
                      <p>{termsText}</p>
                    )}
                  </div>
                  {companySnapshot.bankDetails && (
                    <div className="mt-4 pt-3 border-t border-slate-200 text-slate-800">
                      <p className="font-bold text-slate-900 mb-0.5">Bank Account Details:</p>
                      <p><span className="font-semibold">Bank:</span> {companySnapshot.bankDetails.bankName}</p>
                      <p><span className="font-semibold">Account Name:</span> {companySnapshot.bankDetails.accountName}</p>
                      <p><span className="font-semibold">A/C No:</span> {companySnapshot.bankDetails.accountNumber}</p>
                      <p><span className="font-semibold">IFSC:</span> {companySnapshot.bankDetails.ifscCode}</p>
                      {companySnapshot.bankDetails.branch && <p><span className="font-semibold">Branch:</span> {companySnapshot.bankDetails.branch}</p>}
                    </div>
                  )}
                </div>

                {/* Totals Table */}
                <div className="flex flex-col items-end">
                  <div className="w-full max-w-[280px] space-y-1.5 text-right">
                    <div className="flex justify-between font-normal text-slate-900">
                      <span>Taxable Amount</span>
                      <span>₹ {subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    {isIntrastate ? (
                      <>
                        <div className="flex justify-between font-normal text-slate-900">
                          <span>CGST @9% (Intra-State)</span>
                          <span>₹ {cgstAmount.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
                        </div>
                        <div className="flex justify-between font-normal text-slate-900">
                          <span>SGST @9% (Intra-State)</span>
                          <span>₹ {sgstAmount.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between font-normal text-slate-900">
                        <span>IGST @18% (Inter-State)</span>
                        <span>₹ {igstAmount.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-300 my-2 pt-1.5 flex justify-between font-bold text-slate-900 text-sm sm:text-[14px]">
                      <span>Total Amount</span>
                      <span>₹ {totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
                    </div>
                    <div className="flex justify-between font-normal text-slate-800 pt-0.5">
                      <span>Received Amount</span>
                      <span>₹ {receivedAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="mt-4 w-full text-right">
                    <p className="font-normal text-slate-700 text-[12px]">Total Amount (in words)</p>
                    <p className="font-bold text-slate-900 text-[13px] mt-0.5 leading-snug">
                      {numberToWords(totalAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Block */}
            <div className="pt-12 pb-2 text-right pr-2 flex flex-col items-end shrink-0">
              {companySnapshot.signatureUrl ? (
                <img src={companySnapshot.signatureUrl} alt="Signature" className="h-12 object-contain mb-1" />
              ) : (
                <div className="h-12 w-32 border-b border-slate-300 flex items-center justify-end font-serif italic text-slate-400 text-sm">
                  Gary
                </div>
              )}
              <p className="text-xs sm:text-[12.5px] font-bold text-slate-900 tracking-wider uppercase mt-1">
                AUTHORISED SIGNATORY FOR
              </p>
              <p className="text-xs sm:text-[13px] text-slate-800 font-normal mt-0.5">
                Global Marketing Solutions
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
