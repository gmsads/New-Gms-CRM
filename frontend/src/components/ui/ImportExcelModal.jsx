import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, X, Check } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ImportExcelModal({ isOpen, onClose, onImport, title = 'Import from Excel' }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.match(/\.(xlsx|xls|csv)$/)) {
      setError('Please upload a valid Excel or CSV file.');
      return;
    }

    setFile(uploadedFile);
    setError(null);
    parseFile(uploadedFile);
  };

  const parseFile = (fileToParse) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { raw: false });
        
        if (json.length === 0) {
          setError('The uploaded file is empty.');
        } else {
          setParsedData(json);
        }
      } catch (err) {
        setError('Failed to parse the file. Ensure it is a valid Excel/CSV.');
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Error reading file.');
      setLoading(false);
    };
    reader.readAsArrayBuffer(fileToParse);
  };

  const handleSubmit = async () => {
    if (parsedData.length === 0) {
      setError('No data to import.');
      return;
    }
    try {
      setLoading(true);
      await onImport(parsedData);
      onClose();
    } catch (err) {
      setError(err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Bulk Upload Data</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-lg hover:bg-slate-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span className="text-sm font-semibold">{error}</span>
            </div>
          )}

          {!parsedData.length ? (
            <div 
              className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="h-16 w-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="h-8 w-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Click to upload Excel/CSV</h3>
              <p className="text-xs font-medium text-slate-400 mt-2 max-w-xs">
                Make sure your file has headers in the first row matching the system fields.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{file?.name}</h3>
                    <p className="text-xs font-semibold text-green-600">{parsedData.length} rows found</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setParsedData([]); setFile(null); }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                >
                  Change File
                </button>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Data Preview (First 3 rows)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-slate-200">
                        {Object.keys(parsedData[0]).slice(0, 5).map((key) => (
                          <th key={key} className="pb-2 pr-4 font-bold text-slate-600">{key}</th>
                        ))}
                        {Object.keys(parsedData[0]).length > 5 && <th className="pb-2 text-slate-400 font-medium">...</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedData.slice(0, 3).map((row, i) => (
                        <tr key={i}>
                          {Object.values(row).slice(0, 5).map((val, j) => (
                            <td key={j} className="py-2 pr-4 text-slate-600">{String(val).substring(0, 30)}</td>
                          ))}
                          {Object.values(row).length > 5 && <td className="py-2 text-slate-400">...</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || parsedData.length === 0}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-colors"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Import Data
          </button>
        </div>
      </div>
    </div>
  );
}
