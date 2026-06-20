import React, { useState } from 'react';
import { Search, Plus, KeyRound, ShieldAlert, CheckCircle, Clock, FileText, Trash2, Settings, RefreshCw } from 'lucide-react';
import useApi from '../../hooks/useApi';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';

const ROLES_ALLOWED = ['CEO','COO','BRANCH_HEAD','SALES_EXEC','SALES_MANAGER','FIELD_EXEC','OPERATION_EXEC','OPERATION_MANAGER','PRODUCTION_MANAGER','PRODUCTION_EXEC','DESIGNER','SERVICE_MANAGER','SERVICE_EXEC','IT','ACCOUNTS','AGENT','VENDOR','HR'];
const DEPTS = ['Sales','Operations','Design & Creative','Field','IT','Accounts','Human Resources','Vendor Management','Management'];

const BLANK = { name:'', email:'', phone:'', role:'', department:'', employmentType:'FULL_TIME' };

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL === '/api') return ''; // Uses relative path, handled by proxy or same domain
  const url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return url.replace(/\/api$/, '');
};
const BASE_URL = getBaseUrl();

const ResetPasswordModal = ({ emp, onClose }) => {
  const { request } = useApi();
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await request('POST', `/employees/${emp._id}/reset-password`, {});
      setResult(res);
      setDone(true);
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open onClose={onClose} title="Reset Password" size="sm">
      <div className="p-6">
        {done ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="font-semibold text-green-800">✅ Reset successful</p>
              <div className="mt-2 font-mono text-sm space-y-1">
                <p>Employee ID: <strong>{result?.employeeId}</strong></p>
                <p>Temp Password: <strong>{result?.tempPassword}</strong></p>
              </div>
            </div>
            <button onClick={onClose} className="w-full rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">Done</button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">Reset password for <strong>{emp.name}</strong> to the default <code className="bg-muted px-1 rounded">GMS@1234</code>?</p>
            <div className="flex gap-3">
              <button onClick={handleReset} disabled={loading} className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
                {loading ? 'Wait...' : 'Reset'}
              </button>
              <button onClick={onClose} className="flex-1 rounded-lg border px-4 py-2 text-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

const SettingsModal = ({ open, onClose, type }) => {
  const { data, loading, refetch, request } = useApi('/settings');
  const [newVal, setNewVal] = useState('');
  const [adding, setAdding] = useState(false);

  const isRole = type === 'role';
  const items = isRole ? data?.roles || [] : data?.departments || [];
  const endpointBase = isRole ? '/settings/roles' : '/settings/departments';

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newVal.trim()) return;
    setAdding(true);
    try {
      const payload = isRole ? { role: newVal } : { department: newVal };
      await request('PUT', `${endpointBase}/add`, payload);
      setNewVal('');
      refetch();
    } catch (err) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (val) => {
    if (!window.confirm(`Remove ${val}?`)) return;
    try {
      const payload = isRole ? { role: val } : { department: val };
      await request('PUT', `${endpointBase}/remove`, payload);
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Manage ${isRole ? 'Roles' : 'Departments'}`} size="md">
      <div className="p-6 space-y-6">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input 
            type="text" 
            placeholder={`New ${isRole ? 'Role (e.g. DATA_SCIENTIST)' : 'Department'}...`}
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            className="flex-1 h-11 px-4 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none uppercase text-sm font-semibold"
          />
          <button type="submit" disabled={adding} className="h-11 px-5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> {adding ? 'Adding...' : 'Add'}
          </button>
        </form>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 flex justify-center"><RefreshCw className="w-6 h-6 animate-spin text-indigo-500" /></div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm font-semibold">No entries found.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map(item => (
                <li key={item} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors group">
                  <span className="text-sm font-bold text-slate-700 tracking-wider uppercase">{item.replace(/_/g, ' ')}</span>
                  <button onClick={() => handleRemove(item)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
};

const CustomSelect = ({ label, options, value, onChange, required, heightClass = 'h-11' }) => {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">
        {label} {required && '*'}
      </label>
      <select required={required} value={value} onChange={(e) => onChange(e.target.value)} className={`${heightClass} w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-colors`}>
        <option value="">Select...</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
        ))}
      </select>
    </div>
  );
};

const ChangeStatusModal = ({ emp, onClose, onSubmit }) => {
  const [reason, setReason] = useState('RESIGNED');
  const [resignDate, setResignDate] = useState('');
  const [suspendFrom, setSuspendFrom] = useState('');
  const [suspendTo, setSuspendTo] = useState('');
  const [remark, setRemark] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { 
      status: reason === 'SUSPENDED' ? 'SUSPENDED' : 'INACTIVE', 
      inactiveReason: reason 
    };

    if (reason === 'RESIGNED') payload.resignationDate = resignDate;
    if (reason === 'SUSPENDED') {
      payload.suspendFrom = suspendFrom;
      payload.suspendTo = suspendTo;
    }
    if (reason === 'OTHER') payload.inactiveRemark = remark;

    onSubmit(payload);
  };

  return (
    <Modal open onClose={onClose} title={`Deactivate ${emp.name}`} size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Reason for Deactivation</label>
          <div className="flex gap-4">
            {['RESIGNED', 'SUSPENDED', 'OTHER'].map(r => (
              <label key={r} className={`flex-1 flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-colors ${reason === r ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                <input type="radio" className="hidden" name="reason" value={r} checked={reason === r} onChange={(e) => setReason(e.target.value)} />
                <span className="text-xs font-bold uppercase tracking-wider">{r}</span>
              </label>
            ))}
          </div>
        </div>

        {reason === 'RESIGNED' && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">Resignation Date</label>
            <input type="date" required value={resignDate} onChange={(e) => setResignDate(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" />
          </div>
        )}

        {reason === 'SUSPENDED' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">From Date</label>
                <input type="date" required value={suspendFrom} onChange={(e) => setSuspendFrom(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">End Date</label>
                <input type="date" required value={suspendTo} onChange={(e) => setSuspendTo(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" />
              </div>
            </div>
            <p className="text-xs text-indigo-600 bg-indigo-50 p-3 rounded-lg border border-indigo-100 font-semibold">
              <ShieldAlert className="w-4 h-4 inline mr-1 -mt-0.5" />
              Employee will be able to be activated again after the end date.
            </p>
          </div>
        )}

        {reason === 'OTHER' && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">Remark / Explanation</label>
            <textarea required value={remark} onChange={(e) => setRemark(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none min-h-[100px]" placeholder="Provide details here..." />
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors shadow-sm">Confirm Deactivation</button>
        </div>
      </form>
    </Modal>
  );
};

const AddEmployeeForm = ({ onCreated, onCancel, uniqueRoles, uniqueDepts }) => {
  const { request } = useApi();
  const [form, setForm] = useState({ ...BLANK, alternatePhone: '', parentGuardianName: '', parentGuardianContact: '', panNumber: '', aadhaarNumber: '', dateOfJoining: '', experience: '' });
  const [files, setFiles] = useState([]);
  const [profilePic, setProfilePic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);

  const set = (k, v) => {
    let val = v;
    if (k === 'name') val = v.replace(/[^a-zA-Z\s]/g, '');
    if (k === 'phone' || k === 'alternatePhone' || k === 'parentGuardianContact') val = v.replace(/\D/g, '').slice(0, 10);
    setForm(f => ({ ...f, [k]: val }));
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.phone && form.phone.length !== 10) return alert('Phone number must be exactly 10 digits');
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val) formData.append(key, val);
      });
      files.forEach(file => {
        formData.append('documents', file);
      });
      if (profilePic) {
        formData.append('profileImage', profilePic);
      }

      const res = await request('POST', '/employees', formData);
      setCreated(res);
      if (onCreated) onCreated();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  if (created) return (
    <div className="p-8 rounded-2xl border border-emerald-200 bg-emerald-50/50 max-w-2xl mx-auto mt-10 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle className="w-8 h-8 text-emerald-600" />
        <h3 className="text-2xl font-black text-emerald-900 tracking-tight">Employee Onboarded</h3>
      </div>
      <p className="text-emerald-700 mb-6 font-medium">Share these credentials with the new employee. They will be prompted to change their password on first login.</p>
      <div className="bg-white rounded-xl p-6 font-mono text-sm border border-emerald-100 shadow-inner space-y-3">
        <p className="text-slate-500 uppercase tracking-wider text-xs font-bold">Employee ID</p>
        <p className="text-xl font-bold text-slate-800">{created.loginCredentials?.employeeId}</p>
        <div className="h-px bg-slate-100 my-2" />
        <p className="text-slate-500 uppercase tracking-wider text-xs font-bold">Temporary Password</p>
        <p className="text-xl font-bold text-slate-800">{created.loginCredentials?.password}</p>
      </div>
      <div className="mt-8 flex justify-end">
        <button onClick={onCancel} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm">Done</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-slate-900 px-8 py-6 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-white tracking-tight">New Employee Onboarding</h3>
          <p className="text-slate-400 mt-1 font-medium">Complete the form below to register a new team member.</p>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-lg text-sm font-bold">Cancel</button>
      </div>
      
      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Basic Identity */}
        <div>
          <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 border-b border-indigo-100 pb-2">Basic Identity</h4>
          <div className="grid gap-5 sm:grid-cols-2">
            <div><label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Full Name *</label><input required value={form.name} onChange={e=>set('name',e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-colors" /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Email Address *</label><input type="email" required value={form.email} onChange={e=>set('email',e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-colors" /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Primary Phone *</label><input type="tel" required value={form.phone} onChange={e=>set('phone',e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-colors" /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Alternative Phone</label><input type="tel" value={form.alternatePhone} onChange={e=>set('alternatePhone',e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-colors" /></div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Profile Picture</label>
              <input type="file" accept="image/*" onChange={e => setProfilePic(e.target.files[0])} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Personal & Compliance */}
        <div>
          <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 border-b border-indigo-100 pb-2">Personal & Compliance</h4>
          <div className="grid gap-5 sm:grid-cols-2">
            <div><label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Parent/Guardian Name</label><input value={form.parentGuardianName} onChange={e=>set('parentGuardianName',e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-colors" /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Parent/Guardian Contact</label><input type="tel" value={form.parentGuardianContact} onChange={e=>set('parentGuardianContact',e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-colors" /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Aadhar Card Number</label><input type="text" pattern="[2-9][0-9]{11}" maxlength="12" placeholder="234567890123" oninput="this.value = this.value.replace(/[^0-9]/g, '')" value={form.aadhaarNumber} onChange={e=>set('aadhaarNumber',e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-colors uppercase" /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">PAN Card Number</label><input type="text" pattern="[A-Z]{5}[0-9]{4}[A-Z]" maxlength="10" placeholder="ABCDE1234F" oninput="this.value = this.value.toUpperCase()" value={form.panNumber} onChange={e=>set('panNumber',e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-colors uppercase" /></div>
          </div>
        </div>

        {/* Employment Details */}
        <div>
          <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 border-b border-indigo-100 pb-2">Employment Details</h4>
          <div className="grid gap-5 sm:grid-cols-2">
            <CustomSelect required label="Role" options={uniqueRoles} value={form.role} onChange={v=>set('role',v)} heightClass="h-11" />
            <CustomSelect required label="Department" options={uniqueDepts} value={form.department} onChange={v=>set('department',v)} heightClass="h-11" />
            <div><label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Date of Joining</label><input type="date" value={form.dateOfJoining} onChange={e=>set('dateOfJoining',e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-colors" /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Past Experience (Years)</label><input type="number" step="0.5" value={form.experience} onChange={e=>set('experience',e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-colors" /></div>
          </div>
        </div>

        {/* Document Uploads */}
        <div>
          <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 border-b border-indigo-100 pb-2">Upload Documents</h4>
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-slate-300 bg-slate-50 rounded-2xl p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
          >
            <div className="flex justify-center mb-3">
              <FileText className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700">Drag & drop files here, or</p>
            <label className="mt-2 inline-block cursor-pointer bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50">
              Browse Files
              <input type="file" multiple className="hidden" onChange={handleFileSelect} />
            </label>
            <p className="text-xs text-slate-400 mt-3">Upload Aadhar, PAN, Resume, Certificates (PDF, JPG, PNG)</p>
          </div>
          
          {files.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {files.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 truncate">{f.name}</span>
                  </div>
                  <button type="button" onClick={() => removeFile(idx)} className="text-rose-500 hover:text-rose-700 text-xs font-bold bg-rose-50 px-2 py-1 rounded">Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
          <button type="button" onClick={onCancel} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="bg-slate-900 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-indigo-600 transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2">
            {loading ? 'Processing...' : 'Complete Onboarding'}
          </button>
        </div>
      </form>
    </div>
  );
};

const EditEmployeeModal = ({ emp, onClose, onRefresh, uniqueRoles, uniqueDepts }) => {
  const { request } = useApi();
  const [form, setForm] = useState({
    name: emp.name || '',
    email: emp.email || '',
    phone: emp.phone || '',
    alternatePhone: emp.alternatePhone || '',
    parentGuardianName: emp.parentGuardianName || '',
    parentGuardianContact: emp.parentGuardianContact || '',
    aadhaarNumber: emp.aadhaarNumber || '',
    panNumber: emp.panNumber || '',
    dateOfJoining: emp.dateOfJoining ? new Date(emp.dateOfJoining).toISOString().split('T')[0] : '',
    experience: emp.experience || '',
    role: emp.role || '',
    department: emp.department || '',
    status: emp.status || 'ACTIVE'
  });
  const [files, setFiles] = useState([]);
  const [profilePic, setProfilePic] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
  };

  const handleFileSelect = (e) => {
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files)]);
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val) formData.append(key, val);
      });
      files.forEach(f => formData.append('documents', f));
      if (profilePic) formData.append('profileImage', profilePic);

      const res = await request('PUT', `/employees/${emp._id}`, formData);
      if (res && res.message) {
        alert(res.message);
      }
      onRefresh();
      onClose();
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  const getDocName = (url) => {
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  return (
    <Modal open onClose={onClose} title="Employee Profile" size="4xl" className="max-w-6xl">
      <div className="p-8 max-h-[85vh] overflow-y-auto bg-slate-50/50">
        
        {/* Profile Header */}
        <div className="flex items-start gap-8 mb-8 pb-8 border-b border-slate-200">
          <div className="w-32 h-32 rounded-full shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-white shrink-0 overflow-hidden relative group">
            {form.profileImage || emp.profileImage ? (
              <img src={`${BASE_URL}${form.profileImage || emp.profileImage}`} alt={emp.name} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
            ) : (
              emp.name.charAt(0)
            )}
            <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-xs font-bold">
              Update
              <input type="file" accept="image/*" className="hidden" onChange={e => {
                const file = e.target.files[0];
                if (file) {
                  setProfilePic(file);
                  const reader = new FileReader();
                  reader.onload = (event) => set('profileImage', event.target.result);
                  reader.readAsDataURL(file);
                }
              }} />
            </label>
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{emp.name}</h2>
            <div className="flex items-center gap-3 mt-2 mb-4">
              <Badge variant={form.status === 'ACTIVE' ? 'success' : 'secondary'}>{form.status}</Badge>
              <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">ID: {emp.username || emp._id.toString().slice(-6)}</span>
              <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{form.role.replace(/_/g, ' ')}</span>
            </div>
            
            <div className="flex items-center gap-4">
               <button 
                onClick={() => set('status', form.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors ${form.status === 'ACTIVE' ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
              >
                {form.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Column */}
          <div className="space-y-10">
            {/* Contact Details */}
            <section>
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><div className="w-2 h-6 bg-indigo-500 rounded-full" /> Contact Details</h3>
              <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Email</label><input value={form.email} onChange={e=>set('email',e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Primary Phone</label><input value={form.phone} onChange={e=>set('phone',e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Alternative Phone</label><input value={form.alternatePhone} onChange={e=>set('alternatePhone',e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" /></div>
                </div>
              </div>
            </section>

            {/* Employment Info */}
            <section>
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><div className="w-2 h-6 bg-blue-500 rounded-full" /> Employment Info</h3>
              <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  <CustomSelect label="Role" options={uniqueRoles} value={form.role} onChange={v=>set('role',v)} heightClass="h-10" />
                  <CustomSelect label="Department" options={uniqueDepts} value={form.department} onChange={v=>set('department',v)} heightClass="h-10" />
                  <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Date of Joining</label><input type="date" value={form.dateOfJoining} onChange={e=>set('dateOfJoining',e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Experience (Yrs)</label><input type="number" step="0.5" value={form.experience} onChange={e=>set('experience',e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" /></div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-10">
            {/* Personal & Compliance */}
            <section>
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><div className="w-2 h-6 bg-amber-500 rounded-full" /> Personal & Compliance</h3>
              <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Guardian Name</label><input value={form.parentGuardianName} onChange={e=>set('parentGuardianName',e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Guardian Phone</label><input value={form.parentGuardianContact} onChange={e=>set('parentGuardianContact',e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Aadhar Number</label><input value={form.aadhaarNumber} onChange={e=>set('aadhaarNumber',e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm uppercase focus:border-indigo-500 outline-none" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">PAN Number</label><input value={form.panNumber} onChange={e=>set('panNumber',e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm uppercase focus:border-indigo-500 outline-none" /></div>
                </div>
              </div>
            </section>

            {/* Documents Showcase */}
            <section>
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><div className="w-2 h-6 bg-emerald-500 rounded-full" /> Documents</h3>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                
                {emp.documents && emp.documents.length > 0 && (
                  <div className="mb-6 grid grid-cols-2 gap-3">
                    {emp.documents.map((doc, idx) => (
                      <a key={idx} href={BASE_URL + doc} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all group bg-slate-50">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-110 transition-transform">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">{getDocName(doc)}</p>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Click to view</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl p-6 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
                >
                  <p className="text-sm font-bold text-slate-600">Upload additional documents</p>
                  <label className="mt-3 inline-block cursor-pointer bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50">
                    Browse Files
                    <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                        <span className="text-xs font-semibold text-indigo-800 truncate">{f.name}</span>
                        <button type="button" onClick={() => removeFile(idx)} className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2">Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="p-6 border-t border-slate-200 bg-white flex items-center justify-between rounded-b-2xl">
        <button onClick={onClose} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button onClick={handleSave} disabled={loading} className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2">
          {loading ? 'Saving Changes...' : 'Save Profile Changes'}
        </button>
      </div>
    </Modal>
  );
};
const RoleCard = ({ role, employees, onResetPass, onToggleStatus, onEditEmp }) => {
  const [expanded, setExpanded] = useState(false);
  const displayEmps = expanded ? employees : employees.slice(0, 4);
  const hasMore = employees.length > 4;

  const getAvatarColor = (name) => {
    const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-500', 'bg-rose-600', 'bg-indigo-600'];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-max">
      <div className="border-b-2 border-slate-800 pb-3 mb-4">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">{(role || 'Unassigned').replace(/_/g, ' ')}</h3>
      </div>
      <div className="space-y-1">
        {displayEmps.map(emp => (
          <div key={emp._id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 group">
            <div 
              className="flex items-center gap-3 cursor-pointer flex-1" 
              onClick={() => onEditEmp(emp)}
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm overflow-hidden ${getAvatarColor(emp.name)}`}>
                {emp.profileImage ? (
                  <img src={`${BASE_URL}${emp.profileImage}`} alt={emp.name} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                ) : (
                  emp.name.split(' ').map(n=>n[0]).join('').slice(0,2)
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">{emp.name}</p>
                <p className="text-[11px] font-mono font-semibold text-slate-400 mt-0.5">#{emp.username || emp._id.toString().slice(-6)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => onResetPass(emp)} 
                className="text-slate-300 hover:text-indigo-600 transition-colors" 
                title="Reset Password"
              >
                <KeyRound className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onToggleStatus(emp)}
                className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors flex items-center ${emp.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-200'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${emp.status === 'ACTIVE' ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="mt-4 text-xs font-bold text-blue-500 hover:text-blue-700 self-start italic"
        >
          {expanded ? '- less' : `+ ${employees.length - 4} more`}
        </button>
      )}
    </div>
  );
};

const HREmployees = ({ employees = [], onRefresh }) => {
  const { request } = useApi();
  const [view, setView] = useState('list'); // 'list' | 'add'
  const [search, setSearch] = useState('');
  const [resetEmp, setResetEmp] = useState(null);
  const [editEmp, setEditEmp] = useState(null);
  const [filterType, setFilterType] = useState('All'); // Active, Inactive, All
  const [settingsModal, setSettingsModal] = useState(null);

  const [statusChangeEmp, setStatusChangeEmp] = useState(null);

  const activeCount = employees.filter(e => e.status === 'ACTIVE').length;
  const inactiveCount = employees.filter(e => e.status !== 'ACTIVE').length;

  const { data: settingsData } = useApi('/settings');
  const uniqueRoles = settingsData?.roles || ROLES_ALLOWED;
  const uniqueDepts = settingsData?.departments || DEPTS;

  const handleToggleClick = (emp) => {
    if (emp.status === 'ACTIVE') {
      setStatusChangeEmp(emp); // Open modal for deactivation
    } else {
      executeStatusChange(emp, { status: 'ACTIVE' }); // Direct activation
    }
  };

  const executeStatusChange = async (emp, payload) => {
    try {
      await request('PUT', `/employees/${emp._id}/status`, payload);
      onRefresh();
      if (statusChangeEmp) setStatusChangeEmp(null);
    } catch (e) {
      alert('Failed to update status: ' + e.message);
    }
  };

  if (view === 'add') {
    return <AddEmployeeForm onCancel={() => setView('list')} onCreated={() => { onRefresh(); }} uniqueRoles={uniqueRoles} uniqueDepts={uniqueDepts} />;
  }

  const filtered = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) || (e.username||'').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterType === 'All' ? true : filterType === 'Active' ? e.status === 'ACTIVE' : e.status !== 'ACTIVE';
    return matchesSearch && matchesFilter;
  });

  const groupedEmployees = filtered.reduce((acc, emp) => {
    const role = emp.role || 'Unassigned';
    if (!acc[role]) acc[role] = [];
    acc[role].push(emp);
    return acc;
  }, {});

  // Sort roles to maintain consistent order
  const sortedRoles = Object.keys(groupedEmployees).sort();

  return (
    <div className="space-y-8 h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Employee Directory</h1>
          <p className="text-slate-500 font-medium mt-2">Manage employee records, roles, and system access.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-slate-100 rounded-full p-1 shadow-inner">
            <button 
              onClick={() => setFilterType('Active')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filterType === 'Active' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Active <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${filterType === 'Active' ? 'bg-slate-600' : 'bg-slate-200'}`}>{activeCount}</span>
            </button>
            <button 
              onClick={() => setFilterType('Inactive')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filterType === 'Inactive' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Inactive <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${filterType === 'Inactive' ? 'bg-slate-600' : 'bg-slate-200'}`}>{inactiveCount}</span>
            </button>
            <button 
              onClick={() => setFilterType('All')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filterType === 'All' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${filterType === 'All' ? 'bg-slate-600' : 'bg-slate-200'}`}>{employees.length}</span>
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setSettingsModal('role')} className="bg-white text-indigo-600 border border-indigo-100 px-4 py-2 rounded-md font-bold text-sm hover:bg-indigo-50 transition-colors shadow-sm flex items-center gap-2">
              <Settings className="w-4 h-4" /> Roles
            </button>
            <button onClick={() => setSettingsModal('department')} className="bg-white text-indigo-600 border border-indigo-100 px-4 py-2 rounded-md font-bold text-sm hover:bg-indigo-50 transition-colors shadow-sm flex items-center gap-2">
              <Settings className="w-4 h-4" /> Departments
            </button>
          </div>

          <button className="bg-emerald-500 text-white px-5 py-2 rounded-md font-bold text-sm hover:bg-emerald-600 transition-colors shadow-sm">
            Download Data
          </button>
          <button onClick={() => setView('add')} className="bg-blue-600 text-white px-5 py-2 rounded-md font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8 custom-scrollbar">
        {filtered.length === 0 ? (
          <EmptyState icon={Search} title="No employees found" description="Try adjusting your search criteria or filters." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {sortedRoles.map(role => (
              <RoleCard 
                key={role} 
                role={role} 
                employees={groupedEmployees[role]} 
                onResetPass={setResetEmp}
                onToggleStatus={handleToggleClick}
                onEditEmp={setEditEmp}
              />
            ))}
          </div>
        )}
      </div>

      {resetEmp && <ResetPasswordModal emp={resetEmp} onClose={() => setResetEmp(null)} />}
      {editEmp && <EditEmployeeModal emp={editEmp} onClose={() => setEditEmp(null)} onRefresh={onRefresh} uniqueRoles={uniqueRoles} uniqueDepts={uniqueDepts} />}
      {statusChangeEmp && <ChangeStatusModal emp={statusChangeEmp} onClose={() => setStatusChangeEmp(null)} onSubmit={(payload) => executeStatusChange(statusChangeEmp, payload)} />}
      {settingsModal && <SettingsModal open={true} onClose={() => setSettingsModal(null)} type={settingsModal} />}
    </div>
  );
};

export default HREmployees;
