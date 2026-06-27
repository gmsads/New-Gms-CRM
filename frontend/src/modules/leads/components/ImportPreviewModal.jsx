import React, { useState } from 'react';
import { UploadCloud, ShieldAlert, CheckCircle2, Users, ArrowRight, X, FileSpreadsheet } from 'lucide-react';

/**
 * ImportPreviewModal.jsx
 * Preview & Duplicate Detection UI before committing import.
 */
export const ImportPreviewModal = ({ isOpen, previewData, users = [], onClose, onCommit }) => {
  if (!isOpen || !previewData) return null;

  const [resolution, setResolution] = useState('Skip');
  const [distMethod, setDistMethod] = useState('Round Robin');
  const [singleUserId, setSingleUserId] = useState(users[0]?._id || '');

  const handleCommit = () => {
    onCommit({
      validRows: previewData.validRows,
      duplicateRows: previewData.duplicateRows,
      resolution,
      distributionMethod: distMethod,
      singleUserId: distMethod === 'Assign To Single Employee' ? singleUserId : undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-primary/10 px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-bold text-lg text-foreground">Lead Import Validation & Distribution</h3>
              <p className="text-xs text-muted-foreground">Total uploaded rows: {previewData.totalUploaded}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Summary Pills */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 uppercase">Ready to Import</span>
              <span className="text-xl font-bold text-emerald-600">{previewData.validCount}</span>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 uppercase">Duplicates Detected</span>
              <span className="text-xl font-bold text-amber-600">{previewData.duplicateCount}</span>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-rose-600 uppercase">Invalid / Skipped</span>
              <span className="text-xl font-bold text-rose-600">{previewData.invalidCount}</span>
            </div>
          </div>

          {/* Duplicate Resolution Strategy */}
          {previewData.duplicateCount > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-amber-600 uppercase flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" /> Duplicate Resolution Strategy
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'Skip', title: 'Skip Duplicates', desc: 'Ignore duplicate records completely.' },
                  { id: 'Replace', title: 'Replace Existing', desc: 'Overwrite CRM record with uploaded row.' },
                  { id: 'Merge', title: 'Merge Blank Fields', desc: 'Fill missing fields only.' }
                ].map(opt => (
                  <label
                    key={opt.id}
                    onClick={() => setResolution(opt.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                      resolution === opt.id ? 'bg-amber-500/15 border-amber-500 font-bold' : 'bg-background hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">{opt.title}</span>
                      <input type="radio" name="res" checked={resolution === opt.id} onChange={() => {}} className="text-amber-600" />
                    </div>
                    <span className="text-[11px] text-muted-foreground font-normal">{opt.desc}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Distribution Method Selection */}
          <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" /> Import Lead Distribution Method
            </h4>
            <div className="grid grid-cols-4 gap-3">
              {[
                { id: 'Round Robin', label: 'Round Robin', desc: 'Equally distribute among agents.' },
                { id: 'Assign To Single Employee', label: 'Single Employee', desc: 'Assign all to one executive.' },
                { id: 'Employee Mapping', label: 'Excel Mapping', desc: 'Auto-map Excel names to CRM users.' },
                { id: 'Keep Unassigned', label: 'Keep Unassigned', desc: 'Hold in pool unassigned.' }
              ].map(method => (
                <label
                  key={method.id}
                  onClick={() => setDistMethod(method.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                    distMethod === method.id ? 'bg-primary/10 border-primary font-bold text-primary' : 'bg-background hover:bg-muted text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs truncate">{method.label}</span>
                    <input type="radio" name="dist" checked={distMethod === method.id} onChange={() => {}} className="text-primary" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-normal line-clamp-2">{method.desc}</span>
                </label>
              ))}
            </div>

            {distMethod === 'Assign To Single Employee' && (
              <div className="pt-2 flex items-center gap-3">
                <span className="text-xs font-bold">Select Assignee:</span>
                <select
                  value={singleUserId}
                  onChange={(e) => setSingleUserId(e.target.value)}
                  className="bg-background border rounded-lg px-3 py-1.5 text-xs font-bold"
                >
                  {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-muted/30 px-6 py-4 border-t border-border flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2 rounded-xl border text-xs font-semibold hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={handleCommit}
            className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-all text-xs flex items-center gap-1.5"
          >
            Confirm Import & Distribute <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportPreviewModal;
