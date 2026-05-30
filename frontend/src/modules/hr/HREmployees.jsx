import React, { useState } from 'react';
import { Search, Plus, KeyRound, ShieldAlert, CheckCircle, Clock, FileText } from 'lucide-react';
import useApi from '../../hooks/useApi';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';

const ROLES_ALLOWED = ['CEO','COO','BRANCH_HEAD','SALES_EXEC','SALES_MANAGER','FIELD_EXEC','OPERATION_EXEC','OPERATION_MANAGER','PRODUCTION_MANAGER','PRODUCTION_EXEC','DESIGNER','SERVICE_MANAGER','SERVICE_EXEC','IT','ACCOUNTS','AGENT','VENDOR','HR'];
const DEPTS = ['Sales','Operations','Design & Creative','Field','IT','Accounts','Human Resources','Vendor Management','Management'];

const BLANK = { name:'', email:'', phone:'', role:'', department:'', employmentType:'FULL_TIME' };

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

const AddEmployeeForm = ({ onCreated, onCancel }) => {
  const { request } = useApi();
  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);

  const set = (k, v) => {
    let val = v;
    if (k === 'name') val = v.replace(/[^a-zA-Z\s]/g, '');
    if (k === 'phone') val = v.replace(/\D/g, '').slice(0, 10);
    setForm(f => ({ ...f, [k]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.phone && form.phone.length !== 10) {
      return alert('Phone number must be exactly 10 digits');
    }
    setLoading(true);
    try {
      const res = await request('POST', '/employees', form);
      setCreated(res);
      if (onCreated) onCreated();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  if (created) return (
    <div className="p-6 rounded-xl border border-green-200 bg-green-50 max-w-2xl mx-auto mt-10">
      <h3 className="text-lg font-bold text-green-800 mb-2">✅ Employee Created Successfully</h3>
      <p className="text-sm text-green-700 mb-4">Share these credentials with the new employee. They will be prompted to change their password on first login.</p>
      <div className="bg-white rounded-lg p-4 font-mono text-sm border border-green-200 space-y-2">
        <p>Employee ID: <strong className="text-lg">{created.loginCredentials?.employeeId}</strong></p>
        <p>Password: <strong className="text-lg">{created.loginCredentials?.password}</strong></p>
      </div>
      <div className="mt-6 flex justify-end">
        <button onClick={onCancel} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">Done</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto mt-6 bg-card border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">New Employee Onboarding</h3>
          <p className="text-sm text-muted-foreground mt-1">Add details. System will auto-generate ID and default password.</p>
        </div>
        <button onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="block text-sm font-medium mb-1">Full Name *</label><input required value={form.name} onChange={e=>set('name',e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm focus:border-primary outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Email *</label><input type="email" required value={form.email} onChange={e=>set('email',e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm focus:border-primary outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Phone</label><input type="tel" value={form.phone} onChange={e=>set('phone',e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm focus:border-primary outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Role *</label><select required value={form.role} onChange={e=>set('role',e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm focus:border-primary outline-none"><option value="">Select...</option>{ROLES_ALLOWED.map(r=><option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">Department *</label><select required value={form.department} onChange={e=>set('department',e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm focus:border-primary outline-none"><option value="">Select...</option>{DEPTS.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
        </div>
        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={loading} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Employee'}
          </button>
        </div>
      </form>
    </div>
  );
};

const EditEmployeeModal = ({ emp, onClose, onRefresh }) => {
  const [form, setForm] = useState({
    name: emp.name || '',
    username: emp.username || '',
    email: emp.email || '',
    phone: emp.phone || '',
    parentName: emp.parentName || '',
    parentContact: emp.parentContact || '',
    aadharNumber: emp.aadharNumber || '',
    dateOfJoining: emp.dateOfJoining ? new Date(emp.dateOfJoining).toISOString().split('T')[0] : '',
    pastExperience: emp.pastExperience || '',
    role: emp.role || '',
    status: emp.status || 'ACTIVE'
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal open onClose={onClose} title="Edit Employee Details" size="4xl" className="max-w-5xl">
      <div className="p-8 max-h-[85vh] overflow-y-auto bg-slate-50/50">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Photo */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-3">Employee Photo</p>
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-indigo-100 flex items-center justify-center text-indigo-500 text-3xl font-bold overflow-hidden">
                  {emp.name.charAt(0)}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2">Upload New Photo</p>
                <div className="border border-slate-200 bg-white rounded-md p-1.5 flex items-center gap-2">
                  <button className="bg-slate-100 border border-slate-300 px-3 py-1 text-xs font-medium rounded text-slate-700 hover:bg-slate-200">
                    Choose File
                  </button>
                  <span className="text-xs text-slate-500 italic">No file chosen</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 italic">
                  Current photo uploaded. Upload a new photo to replace it.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Basic Info */}
          <div className="lg:col-span-8 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-blue-900 border-b pb-2 mb-4">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name*</label>
                  <input value={form.name} onChange={e=>set('name',e.target.value)} className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:border-blue-500 outline-none shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Username*</label>
                  <input value={form.username} onChange={e=>set('username',e.target.value)} className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:border-blue-500 outline-none shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
                  <input value={form.email} onChange={e=>set('email',e.target.value)} className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:border-blue-500 outline-none shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number*</label>
                  <input value={form.phone} onChange={e=>set('phone',e.target.value)} className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:border-blue-500 outline-none shadow-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Grid (Personal & Employment Details) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Personal Details */}
          <div>
            <h3 className="text-sm font-bold text-blue-900 border-b pb-2 mb-4">Personal Details</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Parent/Guardian Name</label>
                <input value={form.parentName} onChange={e=>set('parentName',e.target.value)} className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:border-blue-500 outline-none shadow-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Parent/Guardian Contact</label>
                <input value={form.parentContact} onChange={e=>set('parentContact',e.target.value)} className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:border-blue-500 outline-none shadow-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Aadhar Card Number</label>
              <input value={form.aadharNumber} onChange={e=>set('aadharNumber',e.target.value)} className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:border-blue-500 outline-none shadow-sm" />
            </div>
          </div>

          {/* Employment Details */}
          <div>
            <h3 className="text-sm font-bold text-blue-900 border-b pb-2 mb-4">Employment Details</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Date of Joining</label>
                <input type="date" value={form.dateOfJoining} onChange={e=>set('dateOfJoining',e.target.value)} className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:border-blue-500 outline-none shadow-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Past Experience (years)</label>
                <input placeholder="Years of experience" value={form.pastExperience} onChange={e=>set('pastExperience',e.target.value)} className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:border-blue-500 outline-none shadow-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Role/Department*</label>
                <select value={form.role} onChange={e=>set('role',e.target.value)} className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:border-blue-500 outline-none shadow-sm bg-white">
                  {ROLES_ALLOWED.map(r=><option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Employee ID</label>
                <input disabled value={emp.username || emp._id.toString().slice(-6)} className="w-full h-10 px-3 rounded-md border border-blue-100 bg-blue-50/50 text-blue-600 text-sm shadow-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Employment Status */}
        <div className="mt-8">
          <h3 className="text-sm font-bold text-blue-900 border-b pb-2 mb-4">Employment Status</h3>
          <div className="flex p-1 bg-white rounded-lg border border-slate-200 shadow-sm">
            <button 
              onClick={() => set('status', 'ACTIVE')}
              className={`flex-1 py-3 rounded-md flex items-center justify-center gap-2 text-sm font-bold transition-colors ${form.status === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <div className={`w-2 h-2 rounded-full ${form.status === 'ACTIVE' ? 'bg-white' : 'bg-slate-300'}`} />
              Active
            </button>
            <button 
              onClick={() => set('status', 'INACTIVE')}
              className={`flex-1 py-3 rounded-md flex items-center justify-center gap-2 text-sm font-bold transition-colors ${form.status !== 'ACTIVE' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <div className={`w-2 h-2 rounded-full ${form.status !== 'ACTIVE' ? 'bg-white' : 'bg-slate-300'}`} />
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-white flex items-center justify-between">
        <button onClick={onClose} className="px-6 py-2 rounded-md border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">
          Cancel
        </button>
        <div className="flex gap-3">
          <button className="px-6 py-2 rounded-md bg-cyan-500 text-white font-bold text-sm hover:bg-cyan-600">
            Manage Documents
          </button>
          <button className="px-6 py-2 rounded-md bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600">
            Download Data
          </button>
          <button onClick={onClose} className="px-6 py-2 rounded-md bg-slate-900 text-white font-bold text-sm hover:bg-slate-800">
            Save Changes
          </button>
        </div>
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
              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${getAvatarColor(emp.name)}`}>
                {emp.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
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

  const activeCount = employees.filter(e => e.status === 'ACTIVE').length;
  const inactiveCount = employees.filter(e => e.status !== 'ACTIVE').length;

  const handleToggleStatus = async (emp) => {
    const newStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await request('PUT', `/employees/${emp._id}/status`, { status: newStatus });
      onRefresh();
    } catch (e) {
      alert('Failed to update status: ' + e.message);
    }
  };

  if (view === 'add') {
    return <AddEmployeeForm onCancel={() => setView('list')} onCreated={() => { onRefresh(); }} />;
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
                onToggleStatus={handleToggleStatus}
                onEditEmp={setEditEmp}
              />
            ))}
          </div>
        )}
      </div>

      {resetEmp && <ResetPasswordModal emp={resetEmp} onClose={() => setResetEmp(null)} />}
      {editEmp && <EditEmployeeModal emp={editEmp} onClose={() => setEditEmp(null)} onRefresh={onRefresh} />}
    </div>
  );
};

export default HREmployees;
