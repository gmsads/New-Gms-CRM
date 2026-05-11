import React, { useState } from 'react';
import { Search, Plus, KeyRound, ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import useApi from '../../hooks/useApi';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';

const ROLES_ALLOWED = ['SALES_EXEC','SALES_MANAGER','FIELD_EXEC','OPERATION_EXEC','OPERATION_MANAGER','DESIGNER','IT','ACCOUNTS','AGENT','VENDOR','HR'];
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

const HREmployees = ({ employees = [], onRefresh }) => {
  const [view, setView] = useState('list'); // 'list' | 'add'
  const [search, setSearch] = useState('');
  const [resetEmp, setResetEmp] = useState(null);

  const filtered = employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || (e.username||'').toLowerCase().includes(search.toLowerCase()));

  if (view === 'add') {
    return <AddEmployeeForm onCancel={() => setView('list')} onCreated={() => { onRefresh(); }} />;
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Employee Directory</h2>
          <p className="text-muted-foreground text-sm">Manage {employees.length} employees, roles, and access controls.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input type="search" placeholder="Search by name or ID..." value={search} onChange={e=>setSearch(e.target.value)}
              className="h-9 w-64 rounded-md border bg-background pl-9 pr-4 text-sm outline-none focus:border-primary transition-colors" />
          </div>
          <button onClick={() => setView('add')} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Add Employee
          </button>
        </div>
      </div>

      <div className="flex-1 rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          {filtered.length === 0 ? (
            <EmptyState icon={Search} title="No employees found" description="Try adjusting your search criteria." />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/40 border-b sticky top-0 backdrop-blur-sm z-10">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold">Employee</th>
                  <th className="px-5 py-4 text-left font-semibold">Employee ID</th>
                  <th className="px-5 py-4 text-left font-semibold">Role</th>
                  <th className="px-5 py-4 text-left font-semibold">Department</th>
                  <th className="px-5 py-4 text-left font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(emp => (
                  <tr key={emp._id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/10 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                          {emp.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground bg-muted/10">{emp.username || '—'}</td>
                    <td className="px-5 py-4 text-xs font-semibold">{(emp.role||'').replace(/_/g,' ')}</td>
                    <td className="px-5 py-4 text-muted-foreground">{emp.department || '—'}</td>
                    <td className="px-5 py-4"><Badge value={emp.status} /></td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => setResetEmp(emp)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 hover:bg-primary hover:text-primary-foreground rounded-md transition-all shadow-sm">
                        <KeyRound className="h-3.5 w-3.5" /> Reset Pass
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {resetEmp && <ResetPasswordModal emp={resetEmp} onClose={() => setResetEmp(null)} />}
    </div>
  );
};

export default HREmployees;
