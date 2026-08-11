import React, { useState, useRef } from 'react';
import { read, utils, writeFile } from 'xlsx';
import { UploadCloud, X, Download, FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import leadApi from '../../../services/lead.api';
import { useAuth } from '../../../context/AuthContext';

export default function ImportLeadsModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [importResult, setImportResult] = useState(null);

  if (!isOpen) return null;

  const resetState = () => {
    setFile(null);
    setPreviewData(null);
    setImportResult(null);
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const downloadSampleSheet = () => {
    const headers = ['Business Name', 'Mobile Number', 'Contact Name', 'Lead Source', 'Address'];
    const sampleData = [
      ['ABC Enterprises', '9876543210', 'Ramesh Kumar', 'Website', 'Hyderabad'],
      ['XYZ Solutions', '9123456789', 'Suresh', 'Facebook', 'Secunderabad'],
      ['Global Traders', '9988776655', '', 'Referral', 'Vijayawada']
    ];
    
    const ws = utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Sample Leads');
    writeFile(wb, 'Lead_Import_Sample.xlsx');
  };

  const normalizeHeader = (header) => {
    if (!header) return '';
    const clean = header.toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (['businessname', 'company', 'companyname'].includes(clean)) return 'Business Name';
    if (['mobilenumber', 'mobile', 'phone', 'phonenumber'].includes(clean)) return 'Mobile Number';
    if (['contactname', 'contactperson', 'name'].includes(clean)) return 'Contact Name';
    if (['leadsource', 'source'].includes(clean)) return 'Lead Source';
    if (['address', 'city', 'location'].includes(clean)) return 'Address';
    return header.trim();
  };

  const validateRow = (row, rowIndex) => {
    const businessName = row['Business Name']?.toString().trim();
    let mobile = row['Mobile Number']?.toString().trim();
    
    // Convert scientific notation or floats to string if necessary, though XLSX usually handles it.
    if (typeof row['Mobile Number'] === 'number') {
      mobile = row['Mobile Number'].toString();
    }

    if (!businessName) return { valid: false, reason: 'Business Name is required' };
    if (!mobile) return { valid: false, reason: 'Mobile Number is required' };
    
    // Basic mobile format validation
    const cleanMobile = mobile.replace(/[^0-9+]/g, '');
    if (cleanMobile.length < 10) return { valid: false, reason: 'Mobile Number is invalid' };

    return {
      valid: true,
      data: {
        companyName: businessName,
        phone: cleanMobile,
        contactPerson: row['Contact Name']?.toString().trim() || '',
        source: row['Lead Source']?.toString().trim() || 'Excel',
        city: row['Address']?.toString().trim() || ''
      }
    };
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
      alert('Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV file.');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = (selectedFile) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Read raw array of arrays to normalize headers safely
        const rawJson = utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        if (rawJson.length < 2) {
          throw new Error('File is empty or contains only headers.');
        }

        const rawHeaders = rawJson[0];
        const normalizedHeaders = rawHeaders.map(normalizeHeader);
        
        // Re-construct array of objects with normalized headers
        const rows = [];
        for (let i = 1; i < rawJson.length; i++) {
          // Skip empty rows
          if (rawJson[i].every(cell => !cell)) continue;
          
          let rowObj = {};
          normalizedHeaders.forEach((header, index) => {
            if (header) {
              rowObj[header] = rawJson[i][index];
            }
          });
          rows.push(rowObj);
        }

        const validRows = [];
        const invalidRows = [];

        rows.forEach((row, idx) => {
          const validation = validateRow(row, idx + 2); // Excel row is index + 2 (1-based + header)
          if (validation.valid) {
            validRows.push(validation.data);
          } else {
            invalidRows.push({
              row: idx + 2,
              businessName: row['Business Name']?.toString() || 'N/A',
              mobile: row['Mobile Number']?.toString() || 'N/A',
              reason: validation.reason
            });
          }
        });

        setPreviewData({
          total: rows.length,
          validRows,
          invalidRows
        });
      } catch (error) {
        console.error(error);
        alert(error.message || 'Error parsing file. Please check the file structure.');
        setFile(null);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      alert('Error reading file.');
      setLoading(false);
      setFile(null);
    };
    reader.readAsBinaryString(selectedFile);
  };

  const submitImport = async () => {
    if (!previewData?.validRows?.length) return;
    
    setLoading(true);
    try {
      const res = await leadApi.importMyLeads(previewData.validRows, user.token);
      if (res.success) {
        setImportResult({
          summary: res.summary,
          errors: previewData.invalidRows.concat(res.errors || []) // combine frontend & backend errors
        });
      } else {
        alert(res.message || 'Import failed.');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  const downloadErrorReport = () => {
    if (!importResult?.errors?.length) return;
    
    const headers = ['Row Number', 'Business Name', 'Mobile Number', 'Reason'];
    const data = importResult.errors.map(err => [
      err.row || '-',
      err.businessName || '-',
      err.mobile || '-',
      err.reason || '-'
    ]);
    
    const ws = utils.aoa_to_sheet([headers, ...data]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Errors');
    writeFile(wb, 'Lead_Import_Errors.xlsx');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-card border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/30">
          <h2 className="text-lg font-black flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary" /> Import Leads
          </h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm">
          {!file && !importResult && (
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors flex flex-col items-center gap-3"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-base">Click to upload Lead File</p>
                  <p className="text-xs text-muted-foreground mt-1">Excel (.xlsx, .xls) or CSV</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleFileUpload} 
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3 text-blue-800 dark:text-blue-200">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="text-xs space-y-2">
                  <p className="font-bold text-sm">Import Requirements</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><b>Business Name</b> and <b>Mobile Number</b> are strictly required.</li>
                    <li>Optional fields: Contact Name, Lead Source, Address.</li>
                    <li>Imported leads will be assigned to <b>You</b> and appear in <b>Created Leads</b>.</li>
                  </ul>
                  <button 
                    onClick={downloadSampleSheet}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold rounded-lg hover:opacity-90"
                  >
                    <Download className="h-3.5 w-3.5" /> Download Sample Sheet
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading && !importResult && (
            <div className="py-12 text-center text-muted-foreground animate-pulse font-bold">
              Processing File...
            </div>
          )}

          {previewData && !loading && !importResult && (
            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-xl border flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">File Selected</p>
                  <p className="font-bold text-base truncate max-w-[200px]">{file.name}</p>
                </div>
                <div className="flex gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Total Rows</p>
                    <p className="font-bold">{previewData.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 font-semibold">Valid</p>
                    <p className="font-bold text-emerald-600">{previewData.validRows.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-destructive font-semibold">Invalid</p>
                    <p className="font-bold text-destructive">{previewData.invalidRows.length}</p>
                  </div>
                </div>
              </div>

              {previewData.invalidRows.length > 0 && (
                <div className="border border-destructive/20 rounded-xl overflow-hidden">
                  <div className="bg-destructive/10 px-4 py-2 font-bold text-destructive text-xs">
                    {previewData.invalidRows.length} Invalid Rows (Will be skipped)
                  </div>
                  <div className="max-h-40 overflow-y-auto p-2 text-xs">
                    {previewData.invalidRows.map((err, i) => (
                      <div key={i} className="flex justify-between py-1.5 px-2 hover:bg-muted/50 border-b last:border-0">
                        <span className="font-medium">Row {err.row}</span>
                        <span className="text-destructive truncate max-w-[250px]">{err.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {importResult && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-black">Import Completed</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-card border rounded-xl p-3 text-center shadow-sm">
                  <p className="text-xs text-muted-foreground font-bold">Total Processed</p>
                  <p className="text-lg font-black">{importResult.summary.totalRows}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-center shadow-sm">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">Imported</p>
                  <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">{importResult.summary.imported}</p>
                </div>
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-center shadow-sm">
                  <p className="text-xs text-destructive font-bold">Failed</p>
                  <p className="text-lg font-black text-destructive">{importResult.summary.failed}</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3 text-center shadow-sm">
                  <p className="text-xs text-orange-700 dark:text-orange-400 font-bold">Duplicates</p>
                  <p className="text-lg font-black text-orange-700 dark:text-orange-400">{importResult.summary.duplicates}</p>
                </div>
              </div>

              {importResult.errors?.length > 0 && (
                <div className="bg-muted/30 border rounded-xl p-4 flex items-center justify-between mt-4">
                  <span className="font-bold text-xs">Some rows failed to import.</span>
                  <button 
                    onClick={downloadErrorReport}
                    className="px-3 py-1.5 bg-card border rounded-lg text-xs font-bold hover:bg-muted flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5" /> Error Report
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/10 flex justify-end gap-3">
          {importResult ? (
            <button
              onClick={() => {
                onSuccess();
                handleClose();
              }}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-extrabold rounded-xl shadow-lg hover:opacity-95"
            >
              Done
            </button>
          ) : (
            <>
              <button
                onClick={handleClose}
                disabled={loading}
                className="px-5 py-2 border bg-card text-foreground font-bold rounded-xl hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              {previewData && (
                <button
                  onClick={submitImport}
                  disabled={loading || previewData.validRows.length === 0}
                  className="px-6 py-2 bg-primary text-primary-foreground font-extrabold rounded-xl shadow-lg hover:opacity-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? 'Importing...' : `Import ${previewData.validRows.length} Leads`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
