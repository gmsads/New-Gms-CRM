import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { Truck, Plus, Edit, Trash2, RefreshCw, X } from 'lucide-react';

const VehicleManagement = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    number: '',
    driverName: '',
    driverMobile: '',
    type: 'Van',
    status: 'Available'
  });

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
      const res = await fetch(`${apiUrl}/api/vehicle`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data.success) {
        setVehicles(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const apiUrl = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
      const url = editingId ? `${apiUrl}/api/vehicle/${editingId}` : `${apiUrl}/api/vehicle`;
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
        fetchVehicles();
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ number: '', driverName: '', driverMobile: '', type: 'Van', status: 'Available' });
      } else {
        alert(data.message || 'Failed to save vehicle');
      }
    } catch (err) {
      alert('Error saving vehicle');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle record?')) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
      const res = await fetch(`${apiUrl}/api/vehicle/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchVehicles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (v) => {
    setEditingId(v._id);
    setFormData({
      number: v.number,
      driverName: v.driverName,
      driverMobile: v.driverMobile,
      type: v.type,
      status: v.status
    });
    setIsModalOpen(true);
  };

  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'Available').length,
    assigned: vehicles.filter(v => v.status === 'Assigned').length,
    maintenance: vehicles.filter(v => v.status === 'Maintenance').length
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Vehicle Management</h1>
          <p className="text-slate-500 mt-1">Manage transport fleet for field services.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchVehicles} className="p-2 border rounded-lg hover:bg-slate-50">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => { setEditingId(null); setFormData({number:'', driverName:'', driverMobile:'', type:'Van', status:'Available'}); setIsModalOpen(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700">
            <Plus className="w-5 h-5" /> Add Vehicle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Fleet', value: stats.total, color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Available', value: stats.available, color: 'bg-green-50 text-green-600' },
          { label: 'In Transit', value: stats.assigned, color: 'bg-amber-50 text-amber-600' },
          { label: 'Maintenance', value: stats.maintenance, color: 'bg-red-50 text-red-600' }
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
              <th className="px-6 py-4">Vehicle No.</th>
              <th className="px-6 py-4">Driver Details</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {vehicles.map(v => (
              <tr key={v._id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-black uppercase tracking-wider text-slate-800">{v.number}</td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800">{v.driverName || 'Unassigned'}</div>
                  <div className="text-xs text-slate-500">{v.driverMobile}</div>
                </td>
                <td className="px-6 py-4">{v.type}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    v.status === 'Available' ? 'bg-green-100 text-green-700' : 
                    v.status === 'Assigned' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {v.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => openEdit(v)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(v._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && !loading && (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No vehicles found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-indigo-50">
              <h2 className="text-lg font-bold text-indigo-900">{editingId ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-indigo-700" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1">Vehicle Number *</label>
                <input required type="text" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} placeholder="e.g. MH-12-AB-1234" className="w-full border rounded-lg h-10 px-3 outline-none focus:border-indigo-500 uppercase" />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">Driver Name</label>
                <input type="text" value={formData.driverName} onChange={e => setFormData({...formData, driverName: e.target.value})} className="w-full border rounded-lg h-10 px-3 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">Driver Mobile</label>
                <input type="text" value={formData.driverMobile} onChange={e => setFormData({...formData, driverMobile: e.target.value})} className="w-full border rounded-lg h-10 px-3 outline-none focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1">Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border rounded-lg h-10 px-3 outline-none focus:border-indigo-500">
                    <option value="Bike">Bike</option>
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                    <option value="Mini-Truck">Mini-Truck</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border rounded-lg h-10 px-3 outline-none focus:border-indigo-500">
                    <option value="Available">Available</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">Save Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleManagement;
