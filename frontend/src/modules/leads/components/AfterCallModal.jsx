import React, { useState } from 'react';
import { PhoneCall, Calendar, Clock, CheckSquare, X, ArrowRightCircle } from 'lucide-react';

/**
 * AfterCallModal.jsx
 * Automatically displayed after a call ends.
 */
export const AfterCallModal = ({ isOpen, lead, onClose, onSave }) => {
  if (!isOpen || !lead) return null;

  const [callStatus, setCallStatus] = useState('Connected');
  const [remarks, setRemarks] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [followupTime, setFollowupTime] = useState('10:00');
  
  const [interested, setInterested] = useState(false);
  const [needMeeting, setNeedMeeting] = useState(false);
  const [needQuotation, setNeedQuotation] = useState(false);
  const [convertToProspect, setConvertToProspect] = useState(false);

  const statuses = [
    'Connected', 'Busy', 'Call Waiting', 'Not Reachable', 
    'Wrong Number', 'Rejected', 'Failed', 'Voicemail'
  ];

  const handleSave = (e) => {
    e.preventDefault();
    onSave({
      leadId: lead._id,
      callStatus,
      durationSeconds: Math.floor(Math.random() * 60) + 20, // simulated
      remarks: remarks || `Call outcome: ${callStatus}`,
      followupDate,
      followupTime,
      interested,
      needMeeting,
      needQuotation,
      convertToProspect
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-primary/10 px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary text-primary-foreground rounded-lg">
              <PhoneCall className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Post-Call Disposition</h3>
              <p className="text-xs text-muted-foreground font-mono">{lead.companyName || lead.contactPerson} ({lead.phone})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Call Outcome Status Pills */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Call Status Outcome</label>
            <div className="grid grid-cols-4 gap-1.5">
              {statuses.map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setCallStatus(st)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all truncate ${
                    callStatus === st ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Call Notes / Remarks *</label>
            <textarea
              required
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter discussion summary or customer feedback..."
              className="w-full bg-background border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          {/* Follow-up Reminder */}
          <div className="bg-muted/30 p-3.5 rounded-xl border space-y-2">
            <span className="text-xs font-bold flex items-center gap-1.5 text-foreground">
              <Calendar className="h-4 w-4 text-primary" /> Schedule Next Follow-up
            </span>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={followupDate}
                onChange={(e) => setFollowupDate(e.target.value)}
                className="bg-background border rounded-lg px-3 py-1.5 text-xs text-foreground"
              />
              <input
                type="time"
                value={followupTime}
                onChange={(e) => setFollowupTime(e.target.value)}
                className="bg-background border rounded-lg px-3 py-1.5 text-xs text-foreground"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <label className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/30 cursor-pointer text-xs font-medium">
              <input type="checkbox" checked={interested} onChange={(e) => setInterested(e.target.checked)} className="rounded text-primary" />
              ⭐ Customer Interested
            </label>
            <label className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/30 cursor-pointer text-xs font-medium">
              <input type="checkbox" checked={needMeeting} onChange={(e) => setNeedMeeting(e.target.checked)} className="rounded text-primary" />
              🤝 Meeting Required
            </label>
            <label className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/30 cursor-pointer text-xs font-medium">
              <input type="checkbox" checked={needQuotation} onChange={(e) => setNeedQuotation(e.target.checked)} className="rounded text-primary" />
              📄 Need Quotation
            </label>
            <label className="flex items-center gap-2 p-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 cursor-pointer text-xs font-bold text-emerald-600">
              <input type="checkbox" checked={convertToProspect} onChange={(e) => setConvertToProspect(e.target.checked)} className="rounded text-emerald-600" />
              🚀 Convert to Prospect
            </label>
          </div>

          {/* Footer Submit */}
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-muted">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all text-xs flex items-center gap-1.5">
              Save Disposition <ArrowRightCircle className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AfterCallModal;
