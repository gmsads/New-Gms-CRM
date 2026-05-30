import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { Users, Plus, Edit, Trash2, RefreshCw, X } from 'lucide-react';

const LabourManagement = () => {
  const { user } = useAuth();
  const [labour, setLabour] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    skill: '',
    status: 'Available'
  });

  const fetchLabour = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
      const res = await fetch(`${apiUrl}/api/labour`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLabour(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabour();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const apiUrl = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
      const url = editingId ? `${apiUrl}/api/labour/${editingId}` : `${apiUrl}/api/labour`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        fetchLabour();
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ name: '', mobile: '', skill: '', status: 'Available' });
      } else {
        alert(data.message || 'Failed to save labour');
      }
    } catch (err) {
      alert('Error saving labour');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this labour record?')) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
      const res = await fetch(`${apiUrl}/api/labour/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchLabour();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (l) => {
    setEditingId(l._id);
    setFormData({
      name: l.name,
      mobile: l.mobile,
      skill: l.skill,
      status: l.status
    });
    setIsModalOpen(true);
  };

  const stats = {
    total: labour.length,
    available: labour.filter(l => l.status === 'Available').length,
    assigned: labour.filter(l => l.status === 'Assigned').length,
    onLeave: labour.filter(l => l.status === 'On Leave').length
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Labour Management</h1>
          <p className="text-slate-500 mt-1">Manage field service technicians and installers.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchLabour} className="p-2 border rounded-lg hover:bg-slate-50">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => { setEditingId(null); setFormData({name:'', mobile:'', skill:'', status:'Available'}); setIsModalOpen(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
            <Plus className="w-5 h-5" /> Add Labour
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Labour', value: stats.total, color: 'bg-blue-50 text-blue-600' },
          { label: 'Available', value: stats.available, color: 'bg-green-50 text-green-600' },
          { label: 'Assigned', value: stats.assigned, color: 'bg-amber-50 text-amber-600' },
          { label: 'On Leave', value: stats.onLeave, color: 'bg-red-50 text-red-600' }
        ].map(stat => (
          <div key={stat.label} className="bg-white border p-5 rounded-2xl shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-3xl font-black mt-2 ${stat.color.split(' ')[1]}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 font-semibold text-slate-600 border-b">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Mobile</th>
              <th className="px-6 py-4">Skill</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {labour.map(l => (
              <tr key={l._id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-semibold">{l.name}</td>
                <td className="px-6 py-4">{l.mobile}</td>
                <td className="px-6 py-4">{l.skill}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    l.status === 'Available' ? 'bg-green-100 text-green-700' : 
                    l.status === 'Assigned' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {l.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => openEdit(l)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(l._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {labour.length === 0 && !loading && (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No labour records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">{editingId ? 'Edit Labour' : 'Add Labour'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1">Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg h-10 px-3 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">Mobile *</label>
                <input required type="text" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full border rounded-lg h-10 px-3 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">Skill</label>
                <input type="text" value={formData.skill} onChange={e => setFormData({...formData, skill: e.target.value})} placeholder="e.g. Electrician, Carpenter" className="w-full border rounded-lg h-10 px-3 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border rounded-lg h-10 px-3 outline-none focus:border-blue-500">
                  <option value="Available">Available</option>
                  <option value="Assigned">Assigned</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabourManagement;
