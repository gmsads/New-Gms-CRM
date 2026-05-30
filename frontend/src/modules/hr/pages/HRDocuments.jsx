import React, { useState, useMemo } from 'react';
import { 
  FileText, FileBadge, Receipt, RefreshCw, Send, Download, Eye, Save, AlertCircle, 
  History, Mail, ChevronRight, Calculator, User, Calendar, Briefcase, ChevronLeft, FileCheck
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const DOCUMENT_TYPES = [
  { id: 'payslip', title: 'Payslip Generator', icon: Receipt, desc: 'Generate monthly salary slips with calculations', color: 'bg-blue-50 text-blue-600' },
  { id: 'offer', title: 'Offer Letter', icon: FileText, desc: 'Create and send new candidate offers', color: 'bg-indigo-50 text-indigo-600' },
  { id: 'appointment', title: 'Appointment Letter', icon: FileBadge, desc: 'Official joining and employment letters', color: 'bg-emerald-50 text-emerald-600' },
  { id: 'experience', title: 'Experience Letter', icon: History, desc: 'Employment certificates for exiting staff', color: 'bg-amber-50 text-amber-600' },
  { id: 'relieving', title: 'Relieving Letter', icon: Send, desc: 'Final exit clearance documentation', color: 'bg-rose-50 text-rose-600' },
  { id: 'salary_certificate', title: 'Salary Certificate', icon: FileText, desc: 'Official proof of income and employment', color: 'bg-teal-50 text-teal-600' },
  { id: 'promotion', title: 'Promotion Letter', icon: RefreshCw, desc: 'Role and compensation upgrade letters', color: 'bg-purple-50 text-purple-600' },
  { id: 'transfer', title: 'Transfer Letter', icon: RefreshCw, desc: 'Location or department change letters', color: 'bg-cyan-50 text-cyan-600' },
  { id: 'warning', title: 'Warning Letter', icon: AlertCircle, desc: 'Disciplinary action and warning notices', color: 'bg-red-50 text-red-600' },
];

const HRDocuments = () => {
  const [activeDoc, setActiveDoc] = useState(null);
  
  // State for Payslip
  const [payslipData, setPayslipData] = useState({
    employeeName: '',
    employeeId: '',
    designation: '',
    department: '',
    month: '',
    year: new Date().getFullYear(),
    basicSalary: 0,
    allowances: 0,
    incentives: 0,
    salesCommission: 0,
    bonus: 0,
    deductions: 0
  });

  // Generic document state
  const [genericDocData, setGenericDocData] = useState({
    employeeName: '',
    date: new Date().toISOString().split('T')[0],
    subject: '',
    content: ''
  });

  // Calculate Payslip Totals
  const payslipTotals = useMemo(() => {
    const basic = parseFloat(payslipData.basicSalary) || 0;
    const allow = parseFloat(payslipData.allowances) || 0;
    const incen = parseFloat(payslipData.incentives) || 0;
    const comm = parseFloat(payslipData.salesCommission) || 0;
    const bonus = parseFloat(payslipData.bonus) || 0;
    const ded = parseFloat(payslipData.deductions) || 0;
    
    const gross = basic + allow + incen + comm + bonus;
    const net = gross - ded;
    
    return { gross, totalDeductions: ded, net };
  }, [payslipData]);

  const handlePayslipChange = (e) => {
    const { name, value } = e.target;
    setPayslipData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenericChange = (e) => {
    const { name, value } = e.target;
    setGenericDocData(prev => ({ ...prev, [name]: value }));
  };

  const generatePayslipPDF = () => {
    const doc = new jsPDF();
    const data = payslipData;
    const totals = payslipTotals;
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); // blue-900
    doc.text('COMPANY NAME', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('123 Business Avenue, Tech Park, City - 100000', 105, 28, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(`Payslip for ${data.month} ${data.year}`, 105, 40, { align: 'center' });
    
    // Employee Details
    doc.autoTable({
      startY: 50,
      body: [
        ['Employee Name:', data.employeeName || 'N/A', 'Employee ID:', data.employeeId || 'N/A'],
        ['Designation:', data.designation || 'N/A', 'Department:', data.department || 'N/A']
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3, textColor: [50, 50, 50] },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [15, 23, 42] },
        2: { fontStyle: 'bold', textColor: [15, 23, 42] }
      }
    });
    
    // Earnings & Deductions Table
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Earnings', 'Amount', 'Deductions', 'Amount']],
      body: [
        ['Basic Salary', data.basicSalary || '0', 'Standard Deductions', data.deductions || '0'],
        ['Allowances', data.allowances || '0', '', ''],
        ['Incentives', data.incentives || '0', '', ''],
        ['Sales Commission', data.salesCommission || '0', '', ''],
        ['Bonus', data.bonus || '0', '', ''],
        [
          { content: 'Gross Earnings', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, 
          { content: totals.gross.toFixed(2), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, 
          { content: 'Total Deductions', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, 
          { content: totals.totalDeductions.toFixed(2), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }
        ]
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
      styles: { fontSize: 10, cellPadding: 5 }
    });
    
    // Net Pay
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Net Pay: $${totals.net.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('This is a computer-generated document and does not require a signature.', 105, 280, { align: 'center' });
    
    doc.save(`${data.employeeName || 'Employee'}_Payslip_${data.month}_${data.year}.pdf`);
  };

  const generateGenericPDF = (typeTitle) => {
    const doc = new jsPDF();
    const data = genericDocData;
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); 
    doc.text('COMPANY NAME', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('123 Business Avenue, Tech Park, City - 100000', 105, 28, { align: 'center' });
    doc.line(14, 32, 196, 32);

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Date: ${data.date}`, 14, 45);
    
    doc.text(`To,`, 14, 55);
    doc.setFont(undefined, 'bold');
    doc.text(`${data.employeeName || 'Employee Name'}`, 14, 62);
    doc.setFont(undefined, 'normal');
    
    if (data.subject) {
      doc.setFont(undefined, 'bold');
      doc.text(`Subject: ${data.subject}`, 14, 75);
      doc.setFont(undefined, 'normal');
    }
    
    // Content body
    const splitText = doc.splitTextToSize(data.content || `This is an official ${typeTitle}.`, 180);
    doc.text(splitText, 14, 90);
    
    // Signatures
    const finalY = Math.max(90 + (splitText.length * 6) + 30, 200);
    
    doc.text('For Company Name,', 14, finalY);
    doc.text('__________________', 14, finalY + 20);
    doc.text('Authorized Signatory', 14, finalY + 25);
    
    doc.save(`${data.employeeName || 'Employee'}_${typeTitle.replace(/\s+/g, '_')}.pdf`);
  };

  const handleSimulateAction = (action) => {
    alert(`Simulated: ${action}`);
  };

  const renderPayslipForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2"><User size={16}/> Employee Name</label>
          <input type="text" name="employeeName" value={payslipData.employeeName} onChange={handlePayslipChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" placeholder="John Doe" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2"><Briefcase size={16}/> Employee ID</label>
          <input type="text" name="employeeId" value={payslipData.employeeId} onChange={handlePayslipChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" placeholder="EMP-001" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2"><Calendar size={16}/> Month</label>
          <select name="month" value={payslipData.month} onChange={handlePayslipChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all">
            <option value="">Select Month</option>
            {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2"><Calendar size={16}/> Year</label>
          <input type="number" name="year" value={payslipData.year} onChange={handlePayslipChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-2"><Calculator size={20} className="text-emerald-500"/> Earnings</h3>
          {['basicSalary', 'allowances', 'incentives', 'salesCommission', 'bonus'].map((field) => (
            <div key={field} className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-600 capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
              <input type="number" name={field} value={payslipData[field]} onChange={handlePayslipChange} className="w-32 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="0.00" />
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="font-bold text-slate-800">Gross Earnings</span>
            <span className="font-bold text-emerald-600">${payslipTotals.gross.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-2"><Calculator size={20} className="text-red-500"/> Deductions</h3>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-600">Total Deductions (Tax, PF)</label>
            <input type="number" name="deductions" value={payslipData.deductions} onChange={handlePayslipChange} className="w-32 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="0.00" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t mt-auto">
            <span className="font-bold text-slate-800">Total Deductions</span>
            <span className="font-bold text-red-600">${payslipTotals.totalDeductions.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between shadow-lg">
        <div>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Net Payable Amount</p>
          <h2 className="text-4xl font-black">${payslipTotals.net.toFixed(2)}</h2>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button onClick={() => handleSimulateAction('Email Payslip')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium transition-colors flex items-center gap-2">
            <Mail size={18}/> Email
          </button>
          <button onClick={generatePayslipPDF} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-blue-900/20 shadow-lg">
            <Download size={18}/> Generate PDF
          </button>
        </div>
      </div>
    </div>
  );

  const renderGenericForm = (docType) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2"><User size={16}/> Employee Name</label>
          <input type="text" name="employeeName" value={genericDocData.employeeName} onChange={handleGenericChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" placeholder="John Doe" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2"><Calendar size={16}/> Date</label>
          <input type="date" name="date" value={genericDocData.date} onChange={handleGenericChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
        </div>
      </div>
      
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2"><FileText size={16}/> Subject</label>
        <input type="text" name="subject" value={genericDocData.subject} onChange={handleGenericChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" placeholder={`Regarding ${docType.title}`} />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2"><FileCheck size={16}/> Document Content</label>
        <textarea name="content" value={genericDocData.content} onChange={handleGenericChange} rows={8} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none" placeholder={`Type the content of the ${docType.title} here...`}></textarea>
      </div>

      <div className="flex gap-4 pt-4 border-t border-slate-100 flex-wrap">
        <button onClick={() => handleSimulateAction(`Store ${docType.title} in History`)} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors flex items-center gap-2">
          <Save size={18}/> Store in History
        </button>
        <div className="flex-1 hidden sm:block"></div>
        <button onClick={() => handleSimulateAction(`Email ${docType.title}`)} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors flex items-center gap-2">
          <Mail size={18}/> Email
        </button>
        <button onClick={() => generateGenericPDF(docType.title)} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20">
          <Download size={18}/> Generate PDF
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="py-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FileBadge className="text-blue-600" size={32} />
            Document Management
          </h1>
          <p className="text-slate-500 font-medium mt-1">Centralized hub for generating and managing employee documents.</p>
        </div>
        {activeDoc && (
          <button onClick={() => setActiveDoc(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors flex items-center gap-2">
            <ChevronLeft size={18}/> Back to Documents
          </button>
        )}
      </div>

      {!activeDoc ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DOCUMENT_TYPES.map(doc => {
            const Icon = doc.icon;
            return (
              <div 
                key={doc.id} 
                onClick={() => setActiveDoc(doc)}
                className="group p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer flex flex-col items-start gap-4 relative overflow-hidden"
              >
                <div className={`p-4 rounded-2xl ${doc.color} group-hover:scale-110 transition-transform`}>
                  <Icon size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-900 group-hover:text-blue-700 transition-colors">{doc.title}</h3>
                  <p className="text-slate-500 mt-1 line-clamp-2">{doc.desc}</p>
                </div>
                <div className="mt-auto pt-4 flex items-center text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Generate <ChevronRight size={18} className="ml-1" />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row">
          <div className="lg:w-1/3 bg-slate-50 p-8 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col">
            <div className={`w-16 h-16 rounded-2xl ${activeDoc.color} flex items-center justify-center mb-6`}>
              <activeDoc.icon size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{activeDoc.title}</h2>
            <p className="text-slate-500 mb-8">{activeDoc.desc}</p>
            
            <div className="space-y-4 mt-auto">
              <div className="flex items-center gap-3 text-sm text-slate-600 bg-white p-4 rounded-xl border border-slate-200">
                <Eye size={18} className="text-blue-500"/> Real-time preview available
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 bg-white p-4 rounded-xl border border-slate-200">
                <History size={18} className="text-emerald-500"/> Documents are versioned
              </div>
            </div>
          </div>
          
          <div className="lg:w-2/3 p-8">
            {activeDoc.id === 'payslip' ? renderPayslipForm() : renderGenericForm(activeDoc)}
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDocuments;
