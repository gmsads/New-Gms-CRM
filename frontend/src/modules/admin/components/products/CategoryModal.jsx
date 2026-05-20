import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Layers, Tag, Trash2, Power } from 'lucide-react';
import useApi from '../../../../hooks/useApi';

export default function CategoryModal({ isOpen, onClose, onSuccess, categories = [] }) {
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const { request } = useApi();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Active'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Category Name is required.');
    
    setLoading(true);
    try {
      const res = await request('POST', '/products/categories', formData);
      if (res.success) {
        setFormData({ name: '', description: '', status: 'Active' });
        onSuccess();
      } else {
        alert(res.message || 'Failed to create category');
      }
    } catch (err) {
      alert('Error saving category');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (category) => {
    setActionId(category._id);
    const newStatus = category.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await request('PATCH', `/products/categories/${category._id}/status`, { status: newStatus });
      if (res.success) {
        onSuccess(); // Refresh the list
      } else {
        alert(res.message || 'Failed to update category status');
      }
    } catch (err) {
      alert('Error updating category status');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (category) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete the category "${category.name}"?\nThis action cannot be undone.`);
    if (!isConfirmed) return;

    setActionId(category._id);
    try {
      const res = await request('DELETE', `/products/categories/${category._id}`);
      if (res.success) {
        onSuccess(); // Refresh the list
      } else {
        alert(res.message || 'Failed to delete category');
      }
    } catch (err) {
      alert(err.message || 'Error deleting category. It might be linked to existing products.');
    } finally {
      setActionId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px]"
      >
        {/* Left Column: List Categories */}
        <div className="w-full md:w-1/2 bg-slate-50 border-r border-slate-100 flex flex-col">
          <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Existing Categories</h2>
                <p className="text-xs text-slate-500 font-medium">{categories.length} total categories</p>
              </div>
            </div>
            <button onClick={onClose} className="md:hidden p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {categories.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm font-medium">
                No categories found. Create one to get started.
              </div>
            ) : (
              categories.map(c => (
                <div key={c._id} className={`p-4 bg-white border ${c.status === 'Inactive' ? 'border-slate-100 opacity-75' : 'border-slate-200'} rounded-xl shadow-sm hover:border-indigo-300 transition-colors flex flex-col gap-3`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`font-bold ${c.status === 'Inactive' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{c.name}</p>
                      {c.description && <p className="text-xs text-slate-500 mt-1">{c.description}</p>}
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${c.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {c.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button 
                      onClick={() => handleToggleStatus(c)}
                      disabled={actionId === c._id}
                      className={`p-1.5 rounded-lg flex items-center justify-center transition-colors ${c.status === 'Active' ? 'hover:bg-amber-100 text-amber-600' : 'hover:bg-emerald-100 text-emerald-600'}`}
                      title={c.status === 'Active' ? 'Deactivate Category' : 'Activate Category'}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(c)}
                      disabled={actionId === c._id}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Add Category Form */}
        <div className="w-full md:w-1/2 flex flex-col bg-white">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Tag className="h-5 w-5 text-slate-400" /> Add New Category
            </h2>
            <button onClick={onClose} className="hidden md:block p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 overflow-y-auto">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Category Name *</label>
              <input 
                type="text" 
                placeholder="e.g. Sign Boards"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
              <textarea 
                rows={3}
                placeholder="Brief description of this category..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                {loading ? 'Saving...' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
