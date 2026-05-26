import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { employeeApi, permissionApi } from '../../../services/api';
import { Shield, ShieldAlert, Plus, Trash2, Users, Search, RefreshCw } from 'lucide-react';

const AuthorityAccess = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [assignedPermissions, setAssignedPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedPermission, setSelectedPermission] = useState('');
  const [selectedScope, setSelectedScope] = useState('SELF');
  const [search, setSearch] = useState('');

  const fetchData = async (hideUI = true) => {
    if (!user?.token) return;
    if (hideUI) setLoading(true);
    try {
      const [empRes, permRes, assignedRes] = await Promise.all([
        employeeApi.list({ limit: 1000 }, user.token),
        permissionApi.available(user.token),
        permissionApi.assigned(user.token)
      ]);
      if (empRes.employees) setEmployees(empRes.employees || []);
      else if (empRes.data?.employees) setEmployees(empRes.data.employees);
      
      if (permRes.success) setAvailablePermissions(permRes.data || []);
      if (assignedRes.success) setAssignedPermissions(assignedRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (hideUI) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !selectedPermission) return;
    try {
      const res = await permissionApi.assign({
        user_id: selectedEmployee,
        permission_key: selectedPermission,
        scope: selectedScope
      }, user.token);
      
      if (res.success) {
        setSelectedEmployee('');
        setSelectedPermission('');
        setSelectedScope('SELF');
        fetchData(false);
      }
    } catch (err) {
      alert(err.message || 'Failed to assign permission');
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this authority?')) return;
    try {
      await permissionApi.revoke(id, user.token);
      fetchData(false);
    } catch (err) {
      alert(err.message || 'Failed to revoke permission');
    }
  };

  const filteredAssigned = assignedPermissions.filter(p => 
    (p.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.permission_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (!user || !['ADMIN', 'MD_CEO'].includes(user.role)) {
    return <div className="p-8 text-center text-red-600 font-bold">Access Denied</div>;
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
          <Shield className="h-6 w-6 text-indigo-600" />
          Authority Access Management
        </h1>
        <p className="text-slate-500 font-medium mt-1">Dynamically assign specific module authorities and permissions to employees.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ASSIGNMENT FORM */}
        <div className="lg:col-span-1">
          <form onSubmit={handleAssign} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 space-y-5">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 border-b pb-4">
              <Plus className="h-5 w-5 text-indigo-600" />
              Assign Authority
            </h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">Employee</label>
              <select 
                required
                value={selectedEmployee} 
                onChange={e => setSelectedEmployee(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:border-indigo-600 focus:bg-white transition-colors appearance-none"
              >
                <option value="">Select Employee...</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name} ({emp.role})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">Authority / Permission</label>
              <select 
                required
                value={selectedPermission} 
                onChange={e => setSelectedPermission(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:border-indigo-600 focus:bg-white transition-colors appearance-none"
              >
                <option value="">Select Authority...</option>
                {availablePermissions.map(perm => (
                  <option key={perm.permission_key} value={perm.permission_key}>{perm.permission_name} ({perm.module_name})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">Scope</label>
              <select 
                required
                value={selectedScope} 
                onChange={e => setSelectedScope(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:border-indigo-600 focus:bg-white transition-colors appearance-none"
              >
                <option value="SELF">Self (Only own records)</option>
                <option value="TEAM">Team (Own team records)</option>
                <option value="BRANCH">Branch (Entire branch records)</option>
                <option value="ALL">All (Organization wide)</option>
              </select>
            </div>

            <button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4">
              <ShieldAlert className="h-4 w-4" />
              Grant Authority
            </button>
          </form>
        </div>

        {/* ASSIGNED LIST */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-4 bg-white p-2 pl-4 rounded-2xl border shadow-sm">
            <Search className="h-5 w-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by employee or authority name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 h-10 outline-none font-medium text-slate-700 bg-transparent"
            />
          </div>

          <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Authority</th>
                    <th className="px-6 py-4">Scope</th>
                    <th className="px-6 py-4">Assigned By</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssigned.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                        <Shield className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-medium">No authorities assigned yet.</p>
                      </td>
                    </tr>
                  ) : filteredAssigned.map(item => (
                    <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                            {item.user?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{item.user?.name || 'Unknown'}</p>
                            <p className="text-[11px] text-slate-500 font-medium">{item.user?.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{item.permission_name}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{item.module_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-700 rounded text-[10px] font-bold uppercase tracking-wider">
                          {item.scope}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-700">{item.assigned_by?.name || 'System'}</p>
                        <p className="text-[10px] text-slate-400">{new Date(item.assigned_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleRevoke(item._id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Revoke Authority"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthorityAccess;
