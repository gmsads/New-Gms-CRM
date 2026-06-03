import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { teamApi, employeeApi } from '../../../services/api';
import { Users, Plus, X, Shield, User as UserIcon, Building2, Trash2, Edit2 } from 'lucide-react';

export default function TeamAssignment() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [department, setDepartment] = useState('Sales');
  const [managerId, setManagerId] = useState('');
  const [teamLeaderId, setTeamLeaderId] = useState('');
  const [members, setMembers] = useState(['']); // Array of member IDs
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch data independently so one failure doesn't crash the other
      let teamsRes, empRes;
      try { teamsRes = await teamApi.list(user.token); } catch(e) { console.error(e); }
      try { empRes = await employeeApi.list({ limit: 2000 }, user.token); } catch(e) { console.error(e); }

      if (teamsRes?.success) setTeams(teamsRes.data);
      
      // Robust employee extraction matching TargetAssignment.jsx
      if (empRes?.employees) setEmployees(empRes.employees);
      else if (empRes?.data?.employees) setEmployees(empRes.data.employees);
      else if (Array.isArray(empRes)) setEmployees(empRes);
      else if (Array.isArray(empRes?.data)) setEmployees(empRes.data);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get all possible roles from the data to debug
  const allRoles = [...new Set(employees.map(e => e.role))].join(', ');

  const getManagers = () => {
    const managerRoles = [
      'ADMIN', 'MD_CEO', 'BRANCH_HEAD', 'HR', 
      'SALES_MANAGER', 'SR_SALES_MANAGER', 
      'OPERATION_MANAGER', 'PRODUCTION_MANAGER', 'SERVICE_MANAGER'
    ];
    return employees.filter(e => managerRoles.includes(e?.role));
  };

  const getExecs = () => {
    const managerRoles = [
      'ADMIN', 'MD_CEO', 'BRANCH_HEAD', 'HR', 
      'SALES_MANAGER', 'SR_SALES_MANAGER', 
      'OPERATION_MANAGER', 'PRODUCTION_MANAGER', 'SERVICE_MANAGER'
    ];
    return employees.filter(e => !managerRoles.includes(e?.role));
  };

  const handleAddMemberSelect = () => {
    setMembers([...members, '']);
  };

  const handleMemberChange = (index, value) => {
    const newMembers = [...members];
    newMembers[index] = value;
    setMembers(newMembers);
  };

  const handleRemoveMember = (index) => {
    const newMembers = [...members];
    newMembers.splice(index, 1);
    setMembers(newMembers);
  };

  const handleEdit = (team) => {
    setEditingTeamId(team._id);
    setTeamName(team.name);
    setDepartment(team.department || 'Sales');
    setManagerId(team.manager?._id || '');
    setTeamLeaderId(team.teamLeader?._id || '');
    setMembers(team.members?.length > 0 ? team.members.map(m => m._id) : ['']);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    try {
      const res = await teamApi.delete(id, user.token);
      if (res.success) {
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete team');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teamName || !managerId) return alert('Team name and manager are required');
    
    setSubmitting(true);
    try {
      const validMembers = members.filter(m => m !== '');
      const payload = {
        name: teamName,
        department,
        manager: managerId,
        teamLeader: teamLeaderId || null,
        members: validMembers
      };
      
      const res = editingTeamId 
        ? await teamApi.update(editingTeamId, payload, user.token)
        : await teamApi.create(payload, user.token);
        
      if (res.success) {
        setShowModal(false);
        setEditingTeamId(null);
        setTeamName('');
        setDepartment('Sales');
        setManagerId('');
        setTeamLeaderId('');
        setMembers(['']);
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to save team');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingTeamId(null);
    setTeamName('');
    setDepartment('Sales');
    setManagerId('');
    setTeamLeaderId('');
    setMembers(['']);
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" /> Team Assignment
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage sales teams, managers, and field executives</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Create Team
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No teams created yet</p>
          </div>
        ) : teams.map(team => (
          <div key={team._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{team.name}</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1">
                  <Building2 className="h-3 w-3" /> {team.department}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(team)} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(team._id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manager</p>
                  <p className="text-sm font-bold text-slate-800">{team.manager?.name || 'N/A'}</p>
                </div>
              </div>
              
              {team.teamLeader && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Leader</p>
                    <p className="text-sm font-bold text-slate-800">{team.teamLeader?.name || 'N/A'}</p>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Team Members ({team.members?.length || 0})</p>
                <div className="flex flex-wrap gap-2">
                  {team.members?.map(member => (
                    <span key={member._id} className="inline-flex items-center text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                      {member.name}
                    </span>
                  ))}
                  {(!team.members || team.members.length === 0) && (
                    <span className="text-xs text-slate-400 italic">No members assigned</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b bg-slate-900 text-white flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" /> {editingTeamId ? 'Edit Team' : 'Create New Team'}
              </h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Team Name *</label>
                <input 
                  type="text" 
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-medium"
                  placeholder="e.g. Alpha Sales Team"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Department *</label>
                <select 
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-medium"
                  required
                >
                  <option value="Management">Management</option>
                  <option value="Sales">Sales</option>
                  <option value="Operations">Operations</option>
                  <option value="Production">Production</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Design & Creative">Design & Creative</option>
                  <option value="Field">Field</option>
                  <option value="SERVICE_OPERATIONS">Service Operations</option>
                  <option value="IT">IT</option>
                  <option value="Accounts">Accounts</option>
                  <option value="Vendor Management">Vendor Management</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Manager ({getManagers().length}) *</label>
                <select 
                  value={managerId}
                  onChange={e => setManagerId(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-medium"
                  required
                >
                  <option value="">Select Manager</option>
                  {getManagers().map(m => (
                    <option key={m._id} value={m._id}>{m.name} ({(m.role || 'No Role').replace('_', ' ')})</option>
                  ))}
                </select>
                {getManagers().length === 0 && (
                  <p className="text-[10px] text-red-500">No managers found.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Team Leader</label>
                <select 
                  value={teamLeaderId}
                  onChange={e => setTeamLeaderId(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-medium"
                >
                  <option value="">Select Team Leader (Optional)</option>
                  {getExecs().map(m => (
                    <option key={m._id} value={m._id}>{m.name} ({m.role.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
                  <span>Team Members</span>
                  <button type="button" onClick={handleAddMemberSelect} className="text-blue-600 hover:text-blue-700 flex items-center gap-1 capitalize text-[11px]">
                    <Plus className="h-3 w-3" /> Add member
                  </button>
                </label>
                
                {members.map((memberId, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <select 
                      value={memberId}
                      onChange={e => handleMemberChange(index, e.target.value)}
                      className="flex-1 h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-medium"
                    >
                      <option value="">Select Member</option>
                      {getExecs().map(m => (
                        <option key={m._id} value={m._id}>{m.name} ({m.role.replace('_', ' ')})</option>
                      ))}
                    </select>
                    {members.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveMember(index)}
                        className="h-11 w-11 flex-shrink-0 flex items-center justify-center rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </form>
            
            <div className="p-5 border-t bg-slate-50 flex gap-3">
              <button 
                onClick={resetForm}
                className="flex-1 h-11 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 h-11 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : (editingTeamId ? 'Save Changes' : 'Create Team')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
