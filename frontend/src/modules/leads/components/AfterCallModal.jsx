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
  const [businessDisposition, setBusinessDisposition] = useState('');
  const [acwSeconds, setAcwSeconds] = useState(15);

  const [priority, setPriority] = useState(lead.priority || 'Medium');
  const [interestedLevel, setInterestedLevel] = useState('Warm (Evaluating)');
  const [nextAction, setNextAction] = useState('Follow-up Call');

  React.useEffect(() => {
    if (isOpen && lead) {
      setCallStatus(lead.status || 'Connected');
      setRemarks('');
      setFollowupDate('');
      setFollowupTime('10:00');
      setInterested(false);
      setNeedMeeting(false);
      setNeedQuotation(false);
      setConvertToProspect(false);
      setBusinessDisposition('');
      setPriority(lead.priority || 'Medium');
      setInterestedLevel('Warm (Evaluating)');
      setNextAction('Follow-up Call');
    }
  }, [isOpen, lead]);

  const statuses = [
    'Connected', 'Busy', 'Call Waiting', 'Not Reachable', 
    'Wrong Number', 'Rejected', 'Failed', 'Voicemail'
  ];

  const handleSave = (e) => {
    e.preventDefault();
    const actualDuration = lead.callStartTime
      ? Math.max(15, Math.round((Date.now() - lead.callStartTime) / 1000))
      : (lead.talkDuration || lead.durationSeconds || 30);

    onSave({
      leadId: lead._id,
      callStatus,
      durationSeconds: actualDuration,
      remarks: remarks || `Call outcome: ${businessDisposition || callStatus} (${interestedLevel})`,
      followupDate,
      followupTime,
      interested,
      interestedLevel,
      nextAction,
      priority,
      needMeeting,
      needQuotation,
      convertToProspect,
      businessDisposition: businessDisposition || callStatus,
      acwSeconds
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh]">
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
        <form onSubmit={handleSave} className="flex flex-col overflow-hidden flex-1">
          <div className="p-4 md:p-6 space-y-4 overflow-y-auto">
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

          {/* Business Disposition Pills */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Business Disposition (Enterprise)</label>
            <div className="grid grid-cols-3 gap-1.5">
              {['Highly Interested', 'Meeting Scheduled', 'Send Quotation', 'Callback Requested', 'Manager Review Required', 'Not Interested / Lost'].map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    setBusinessDisposition(b);
                    if (b === 'Highly Interested') setInterested(true);
                    if (b === 'Meeting Scheduled') setNeedMeeting(true);
                    if (b === 'Send Quotation') setNeedQuotation(true);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all truncate ${
                    businessDisposition === b ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Priority & Interested Level & Next Action Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-background border rounded-xl p-2 text-xs text-foreground font-semibold focus:ring-2 focus:ring-primary/40"
              >
                <option value="Low">🟢 Low</option>
                <option value="Medium">🟡 Medium</option>
                <option value="High">🟠 High</option>
                <option value="Urgent">🔴 Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Interested Level</label>
              <select
                value={interestedLevel}
                onChange={(e) => {
                  setInterestedLevel(e.target.value);
                  if (e.target.value.includes('Hot') || e.target.value.includes('Warm')) setInterested(true);
                  if (e.target.value.includes('Not')) setInterested(false);
                }}
                className="w-full bg-background border rounded-xl p-2 text-xs text-foreground font-semibold focus:ring-2 focus:ring-primary/40"
              >
                <option value="Hot (Ready to Buy)">🔥 Hot (Ready to Buy)</option>
                <option value="Warm (Evaluating)">☀️ Warm (Evaluating)</option>
                <option value="Cold (Future Interest)">❄️ Cold (Future)</option>
                <option value="Not Interested">🚫 Not Interested</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Next Action</label>
              <select
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                className="w-full bg-background border rounded-xl p-2 text-xs text-foreground font-semibold focus:ring-2 focus:ring-primary/40"
              >
                <option value="Follow-up Call">📞 Follow-up Call</option>
                <option value="Send Email / Brochure">📧 Send Email / Brochure</option>
                <option value="Schedule Demo">💻 Schedule Demo</option>
                <option value="Site Visit">🏢 Site Visit</option>
                <option value="Pricing Negotiation">💰 Pricing Negotiation</option>
                <option value="Close Deal">🤝 Close Deal</option>
              </select>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Call Notes / Remarks</label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter discussion summary or customer feedback (optional)..."
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

          </div>

          {/* Footer Submit */}
          <div className="flex justify-end gap-3 p-4 border-t bg-card shrink-0">
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
