import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Search, Filter, Calendar, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';

const VendorAssignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    campaignName: '', vendor: '', area: '', startDate: '', endDate: '', workType: '', budget: 0, priority: 'Medium'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [assRes, venRes] = await Promise.all([
          api.get('/vendors/assignments', user.token),
          api.get('/vendors', user.token)
        ]);
        setAssignments(assRes.data.assignments || []);
        setVendors(venRes.data.vendors || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.token]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/vendors/assignments', formData, user.token);
      setIsModalOpen(false);
      // Refresh
      const res = await api.get('/vendors/assignments', user.token);
      setAssignments(res.data.assignments || []);
    } catch (error) {
      alert(error.message || 'Failed to assign vendor');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'In Progress': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Delayed': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const filtered = assignments.filter(a => 
    a.campaignName.toLowerCase().includes(search.toLowerCase()) ||
    a.vendor?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex w-full md:w-auto items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <input 
              type="search" 
              placeholder="Search campaigns or vendors..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button className="p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors text-slate-600">
            <Filter className="h-4 w-4" />
          </button>
        </div>
        
        <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> New Assignment
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Campaign / Order', 'Assigned Vendor', 'Location', 'Timeline', 'Budget', 'Status', ''].map(h => (
                  <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-sm font-bold text-slate-400">Loading Assignments...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-sm font-bold text-slate-400">No active assignments found.</td></tr>
              ) : (
                filtered.map(assignment => (
                  <tr key={assignment._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{assignment.campaignName}</p>
                          <p className="text-xs font-semibold text-slate-500">{assignment.workType || 'General Work'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-700">{assignment.vendor?.name || 'Unknown Vendor'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-sm">
                        <MapPin className="h-3.5 w-3.5" />
                        {assignment.area}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-sm">
                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                        {new Date(assignment.startDate).toLocaleDateString()}
                      </div>
                      <p className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-widest">
                        To {new Date(assignment.endDate).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">
                      ₹ {assignment.budget?.toLocaleString('en-IN') || 0}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border flex w-fit items-center gap-1 ${getStatusColor(assignment.status)}`}>
                        {assignment.status === 'Completed' ? <CheckCircle2 className="h-3 w-3" /> : assignment.status === 'Delayed' ? <AlertCircle className="h-3 w-3" /> : null}
                        {assignment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 rounded-lg text-xs font-bold text-slate-600 transition-all shadow-sm">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900">Assign Vendor</h2>
              <p className="text-sm font-bold text-slate-500 mt-1">Dispatch campaign execution work to a vendor partner.</p>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Campaign Name *</label>
                  <input type="text" required value={formData.campaignName} onChange={e => setFormData({...formData, campaignName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Vendor Partner *</label>
                  <select required value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-colors">
                    <option value="">Select Vendor...</option>
                    {vendors.map(v => <option key={v._id} value={v._id}>{v.name} ({v.baseLocation})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Target Area *</label>
                  <input type="text" required value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Work Type</label>
                  <input type="text" value={formData.workType} onChange={e => setFormData({...formData, workType: e.target.value})} placeholder="e.g. Wall Pasting" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Start Date *</label>
                  <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">End Date *</label>
                  <input type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Agreed Budget (₹)</label>
                  <input type="number" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-colors">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-4 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-600/20">Assign Work</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorAssignments;
