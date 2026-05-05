import React, { useState } from 'react';
import {
  Search, Phone, MessageCircle, Plus, X, CheckCircle, User, Building2,
  ArrowRight, AlertCircle
} from 'lucide-react';
import { whatsappTemplates, requirementTypes, leadSources } from '../data/mockData';
import { prospectApi } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';


// ─── Phone Search Bar ────────────────────────────────────────────────────────
export const PhoneSearchOverlay = ({ onClose }) => {
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const handleSearch = async () => {
    if (!phone || phone.length < 10) return;
    setSearching(true);
    try {
      const data = await prospectApi.searchPhone(phone, user?.token);
      const found = data?.data || null;
      setResult(found);
      setSearched(true);
      setShowCreate(!found);
    } catch {
      setResult(null);
      setSearched(true);
      setShowCreate(true);
    }
    setSearching(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)' }}>
          <div>
            <h2 className="text-white font-bold text-lg">🔍 Smart Prospect Search</h2>
            <p className="text-blue-200 text-xs mt-0.5">Enter phone number to check existing records</p>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Enter 10-digit mobile number..."
                className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                maxLength={10}
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 h-10 rounded-lg font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: '#1e3a8a' }}
            >
              Search
            </button>
          </div>

          {/* Result: Found */}
          {searched && result && (
            <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">Prospect Found!</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground text-xs">Name</p><p className="font-semibold">{result.name}</p></div>
                <div><p className="text-muted-foreground text-xs">Company</p><p className="font-semibold">{result.company}</p></div>
                <div><p className="text-muted-foreground text-xs">Stage</p>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700">{result.stage}</span>
                </div>
                <div><p className="text-muted-foreground text-xs">Last Contact</p><p className="font-medium">{result.lastInteraction}</p></div>
                <div><p className="text-muted-foreground text-xs">Priority</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${result.priority === 'Hot' ? 'bg-red-100 text-red-700' : result.priority === 'Warm' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{result.priority}</span>
                </div>
                <div><p className="text-muted-foreground text-xs">Requirement</p><p className="font-medium">{result.requirement}</p></div>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 h-9 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-1.5">
                  <ArrowRight className="h-4 w-4" /> View Profile
                </button>
                <button className="flex-1 h-9 rounded-lg border border-green-400 text-green-700 text-sm font-medium hover:bg-green-100 flex items-center justify-center gap-1.5">
                  <Plus className="h-4 w-4" /> Add Follow-up
                </button>
              </div>
            </div>
          )}

          {/* Result: Not Found */}
          {searched && !result && (
            <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span className="font-semibold text-orange-800">No Record Found for {phone}</span>
              </div>
              <p className="text-sm text-orange-700 mb-4">This phone number is not in the system. Create a new prospect?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex-1 h-9 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-1.5"
                  style={{ background: '#1e3a8a' }}
                >
                  <User className="h-4 w-4" /> Create Prospect
                </button>
                <button className="flex-1 h-9 rounded-lg border border-orange-300 text-orange-700 text-sm font-medium hover:bg-orange-100 flex items-center justify-center gap-1.5">
                  <Building2 className="h-4 w-4" /> Create Order
                </button>
              </div>
            </div>
          )}

          {/* Quick Create Form */}
          {showCreate && (
            <CreateProspectForm phone={phone} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Quick Create Prospect Form ───────────────────────────────────────────────
const CreateProspectForm = ({ phone, onClose }) => {
  const [form, setForm] = useState({
    name: '', company: '', source: 'JustDial', requirement: 'Boards',
    budget: '', hasDesign: false, notes: '', priority: 'Warm'
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
      <h3 className="font-semibold text-sm text-blue-900">📝 Quick Create Prospect</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name *</label>
          <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Client name" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Company</label>
          <input value={form.company} onChange={e => update('company', e.target.value)} placeholder="Company name" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Lead Source</label>
          <select value={form.source} onChange={e => update('source', e.target.value)} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none">
            {leadSources.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Requirement</label>
          <select value={form.requirement} onChange={e => update('requirement', e.target.value)} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none">
            {requirementTypes.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Budget</label>
          <input value={form.budget} onChange={e => update('budget', e.target.value)} placeholder="₹ budget range" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
          <select value={form.priority} onChange={e => update('priority', e.target.value)} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none">
            {['Hot', 'Warm', 'Cold'].map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
        <textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Interaction notes..." className="h-16 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none" />
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={form.hasDesign} onChange={e => update('hasDesign', e.target.checked)} className="rounded" />
        <span>Client has design ready</span>
      </label>
      <button
        onClick={onClose}
        className="w-full h-10 rounded-lg text-white font-semibold text-sm transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)' }}
      >
        ✅ Create Prospect
      </button>
    </div>
  );
};

// ─── WhatsApp Action Panel ────────────────────────────────────────────────────
export const WhatsAppPanel = ({ prospect, onClose }) => {
  const [selected, setSelected] = useState(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b" style={{ background: 'linear-gradient(135deg, #075e54, #128c7e)' }}>
          <div>
            <h2 className="text-white font-bold">💬 WhatsApp Actions</h2>
            <p className="text-green-200 text-xs mt-0.5">{prospect?.name} · {prospect?.phone}</p>
          </div>
          <button onClick={onClose} className="text-green-200 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground">Select a template to send via WhatsApp</p>
          {whatsappTemplates.map(t => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className={`w-full rounded-xl border-2 p-3 text-left transition-all ${selected === t.id ? 'border-green-500 bg-green-50' : 'border-border hover:border-green-300 hover:bg-green-50/50'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{t.icon}</span>
                <span className="font-semibold text-sm">{t.label}</span>
                {selected === t.id && <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{t.message}</p>
            </button>
          ))}
          <button
            disabled={!selected}
            className="w-full h-10 rounded-lg text-white font-semibold text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: '#25D366' }}
          >
            <MessageCircle className="h-4 w-4" />
            Open in WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Client Interaction Guide ─────────────────────────────────────────────────
export const InteractionGuide = ({ prospect, onClose }) => {
  const questions = [
    { q: 'What type of requirement?', key: 'type', options: requirementTypes },
    { q: 'Quantity required?', key: 'qty', type: 'number' },
    { q: 'Location of service?', key: 'location', type: 'text' },
    { q: 'Timeline / urgency?', key: 'timeline', options: ['Immediate', 'Within 1 week', '2-4 weeks', '1-2 months', 'Flexible'] },
    { q: 'Budget range?', key: 'budget', type: 'text' },
    { q: 'Do you have design ready?', key: 'hasDesign', options: ['Yes — Upload', 'No — Request design'] },
  ];

  const quickReplies = [
    { label: 'Share Brochure', emoji: '📄' },
    { label: 'Send Quotation', emoji: '💰' },
    { label: 'Arrange Design Demo', emoji: '🎨' },
    { label: 'Schedule Meeting', emoji: '📅' },
  ];

  const [answers, setAnswers] = useState({});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl border bg-card shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b shrink-0" style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}>
          <div>
            <h2 className="text-white font-bold">📞 Client Interaction Guide</h2>
            <p className="text-blue-200 text-xs mt-0.5">{prospect?.name} · Guided Call Script</p>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Discovery Questions</p>
          {questions.map((q, i) => (
            <div key={q.key} className="rounded-xl border p-3 bg-muted/20">
              <p className="text-sm font-semibold mb-2">{i + 1}. {q.q}</p>
              {q.options ? (
                <div className="flex flex-wrap gap-2">
                  {q.options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setAnswers(a => ({ ...a, [q.key]: opt }))}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${answers[q.key] === opt ? 'bg-blue-600 text-white border-blue-600' : 'border-border hover:border-blue-400'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type={q.type}
                  placeholder="Type answer..."
                  value={answers[q.key] || ''}
                  onChange={e => setAnswers(a => ({ ...a, [q.key]: e.target.value }))}
                  className="h-8 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-blue-500"
                />
              )}
            </div>
          ))}

          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Quick Reply Templates</p>
            <div className="grid grid-cols-2 gap-2">
              {quickReplies.map(r => (
                <button key={r.label} className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-sm font-medium text-green-800 hover:bg-green-100 transition-colors text-left">
                  <span>{r.emoji}</span>{r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t shrink-0 flex gap-2">
          <button className="flex-1 h-9 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
            Save Interaction
          </button>
          <button onClick={onClose} className="h-9 px-4 rounded-lg border text-sm font-medium hover:bg-muted">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
