import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import leadApi from '../../../services/lead.api';
import ImportPreviewModal from '../components/ImportPreviewModal';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight, Download, Info, Table } from 'lucide-react';

/**
 * LeadImport.jsx
 * Enterprise Excel (.xlsx) & CSV Lead Ingestion Engine
 */
export default function LeadImport() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/employees`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(r => r.json())
      .then(res => {
        const empList = res.data || res.employees || [];
        if (Array.isArray(empList)) setUsers(empList);
      })
      .catch(console.error);
  }, [user]);

  const downloadSampleTemplate = async () => {
    const XLSX = await import('xlsx');
    const headers = ['Contact Person', 'Phone', 'Company Name', 'Email', 'City', 'State', 'Business Category', 'Alternate Phone', 'Source', 'Assigned To'];
    const sampleRows = [
      ['Rajesh Sharma', '9876543210', 'TechSolutions Ltd', 'rajesh@techsolutions.com', 'Hyderabad', 'Telangana', 'IT Services', '0401234567', 'Trade Show', 'Rahul Sales'],
      ['Anita Desai', '9123456780', 'Desai Exports', 'anita@desaiexports.com', 'Mumbai', 'Maharashtra', 'Manufacturing', '', 'Referral', 'Priya Exec'],
      ['Suresh Kumar', '9988776655', 'Apex Traders', 'suresh@apextraders.com', 'Bangalore', 'Karnataka', 'Retail', '9811223344', 'LinkedIn', 'Rahul Sales']
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads Template');
    XLSX.writeFile(workbook, `GMS_Lead_Upload_Template.xlsx`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const XLSX = await import('xlsx');
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const parsedJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!parsedJson || parsedJson.length === 0) {
          setLoading(false);
          alert('❌ Upload Error: The selected Excel/CSV file appears to be completely empty.');
          return;
        }

        // Validate mandatory columns on the first row
        const sampleRow = parsedJson[0];
        const keys = Object.keys(sampleRow).map(k => k.toLowerCase().trim());
        const hasContact = keys.some(k => ['contact person', 'contactperson', 'name', 'contact', 'client name'].includes(k));
        const hasPhone = keys.some(k => ['phone', 'mobile', 'contact number', 'phonenumber', 'cell', 'phone number'].includes(k));

        if (!hasContact || !hasPhone) {
          setLoading(false);
          alert('❌ Upload Error: Your Excel file is missing mandatory columns ("Contact Person" and "Phone"). Please check the upload guidelines below or download our sample template.');
          return;
        }

        // Map and normalize rows
        const rows = parsedJson.map((r, idx) => {
          const getVal = (...possibleKeys) => {
            for (const pk of possibleKeys) {
              const found = Object.keys(r).find(k => k.toLowerCase().trim() === pk.toLowerCase());
              if (found !== undefined && r[found] !== '') return r[found];
            }
            return '';
          };
          return {
            contactPerson: getVal('contact person', 'contactperson', 'name', 'contact', 'client name') || `Lead ${idx+1}`,
            phone: getVal('phone', 'mobile', 'contact number', 'phonenumber', 'cell', 'phone number'),
            companyName: getVal('company name', 'companyname', 'company', 'organization') || '',
            email: getVal('email', 'email address', 'mail') || '',
            city: getVal('city', 'location', 'town') || '',
            state: getVal('state', 'province') || '',
            businessCategory: getVal('business category', 'category', 'industry') || '',
            alternatePhone: getVal('alternate phone', 'alt phone', 'other phone') || '',
            source: getVal('source', 'lead source') || 'Excel',
            mappedEmployee: getVal('assigned to', 'assignedto', 'employee', 'sales exec', 'agent', 'owner', 'assignee', 'mapped employee') || ''
          };
        }).filter(r => r.contactPerson && r.phone);

        setRawRows(rows);
        leadApi.previewImport(rows, user.token)
          .then(res => {
            if (res.success) {
              setPreviewData(res.data);
              setShowPreviewModal(true);
            } else {
              alert('❌ Verification Failed: ' + (res.message || 'Unknown error'));
            }
          })
          .catch(err => alert('❌ Server Preview Error: ' + err.message))
          .finally(() => setLoading(false));
      } catch (err) {
        setLoading(false);
        alert('❌ Failed to parse spreadsheet file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCommitImport = (payload) => {
    setLoading(true);
    setShowPreviewModal(false);
    leadApi.commitImport(payload, user.token)
      .then(res => {
        if (res.success) {
          setImportSummary(res);
        }
      })
      .catch(err => alert('❌ Import Commit Error: ' + err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Bulk Lead Import Engine</h1>
          <p className="text-xs text-muted-foreground mt-1">Upload Excel (.xlsx) or CSV files with automated deduplication and 4-way distribution.</p>
        </div>
        <button
          type="button"
          onClick={downloadSampleTemplate}
          className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <Download className="h-4 w-4" /> Download Sample Template (.xlsx)
        </button>
      </div>

      {/* Excel Column Guidelines Card */}
      <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 text-primary border-b pb-3">
          <Info className="h-5 w-5" />
          <h3 className="font-bold text-sm uppercase tracking-wide">Excel Upload Guidelines & Column Specification</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Ensure your uploaded Excel or CSV sheet contains headers matching the column specification below. The system automatically detects and deduplicates records against existing MongoDB leads.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Mandatory Fields */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 space-y-2">
            <span className="text-[11px] font-extrabold text-red-600 uppercase tracking-wider block">🚨 Mandatory Columns (Required)</span>
            <ul className="text-xs space-y-1.5 text-foreground font-medium">
              <li>• <strong className="text-red-600">Contact Person</strong> (or Name)</li>
              <li>• <strong className="text-red-600">Phone</strong> (or Mobile / Phone Number)</li>
            </ul>
            <p className="text-[10px] text-muted-foreground italic pt-1">If these 2 columns are missing, the system will reject the file immediately.</p>
          </div>

          {/* Optional Fields */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-2">
            <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider block">ℹ️ Supported Optional Columns</span>
            <div className="grid grid-cols-2 gap-1 text-xs text-foreground font-medium">
              <span>• Company Name</span>
              <span>• Email Address</span>
              <span>• City & State</span>
              <span>• Business Category</span>
              <span>• Alternate Phone</span>
              <span>• Lead Source</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Box */}
      <div className="border-2 border-dashed border-primary/40 rounded-2xl p-10 text-center bg-card hover:bg-muted/20 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer relative shadow-sm">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          disabled={loading}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        <div className="p-4 bg-primary/10 text-primary rounded-full">
          <UploadCloud className="h-10 w-10 animate-bounce" />
        </div>
        <div>
          <h3 className="font-bold text-base text-foreground">Click to Browse or Drag & Drop Excel File</h3>
          <p className="text-xs text-muted-foreground mt-1">Supported formats: Excel (.xlsx, .xls) and CSV. Maximum 10,000 rows.</p>
        </div>
      </div>

      {loading && <div className="p-6 text-center text-primary font-bold animate-pulse text-sm">Processing Spreadsheet & Scanning Database Duplicates...</div>}

      {/* Success Confirmation Summary */}
      {importSummary && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 space-y-4 animate-in zoom-in-95">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0" />
            <div>
              <h3 className="font-bold text-lg text-emerald-600">Import & Distribution Successful!</h3>
              <p className="text-xs text-muted-foreground">Batch ID: {importSummary.distributionSummary?.batchId || 'N/A'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs font-mono border-t border-emerald-500/20">
            <div><span className="text-muted-foreground">Records Imported:</span> <strong className="text-emerald-600 text-sm block">{importSummary.importSummary?.importedCount || 0}</strong></div>
            <div><span className="text-muted-foreground">Records Replaced/Merged:</span> <strong className="text-sm block">{((importSummary.importSummary?.replacedCount||0)+(importSummary.importSummary?.mergedCount||0))}</strong></div>
            <div><span className="text-muted-foreground">Leads Distributed:</span> <strong className="text-primary text-sm block">{importSummary.distributionSummary?.assignedCount || 0}</strong></div>
          </div>
        </div>
      )}

      {/* Preview Validation & Deduplication Modal */}
      <ImportPreviewModal
        isOpen={showPreviewModal}
        previewData={previewData}
        users={users}
        onClose={() => setShowPreviewModal(false)}
        onCommit={handleCommitImport}
      />
    </div>
  );
}
