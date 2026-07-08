import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Truck, MapPin, Phone, Mail, Clock, Star, ShieldCheck, Briefcase, IndianRupee } from 'lucide-react';
import api from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';

const VendorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const res = await api.get(`/vendors/${id}`, user.token);
        setVendor(res.data.vendor);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [id, user.token]);

  if (loading) return <div className="p-12 text-center text-slate-500 font-bold">Loading Vendor Profile...</div>;
  if (!vendor) return <div className="p-12 text-center text-rose-500 font-bold">Vendor not found.</div>;

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Inactive': return 'bg-slate-50 text-slate-600 border-slate-200';
      case 'Suspended': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => navigate('/vendors/list')} className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm text-slate-500">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Vendor Profile</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-600 to-indigo-700" />
            <div className="relative z-10 flex flex-col items-center mt-12">
              <div className="w-24 h-24 bg-white rounded-full p-2 shadow-xl border border-slate-100 mb-4">
                <div className="w-full h-full bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <Truck className="h-10 w-10" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 text-center">{vendor.name}</h3>
              <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">{vendor.category?.name || 'Uncategorized'}</p>
              
              <div className="mt-4 flex gap-2">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(vendor.status)}`}>{vendor.status}</span>
                <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-amber-50 text-amber-600 border-amber-100 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-600" /> {vendor.averageRating || 'NEW'}
                </span>
              </div>
            </div>

            <div className="mt-8 space-y-4 pt-6 border-t border-slate-50">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center"><Phone className="h-4 w-4 text-slate-400" /></div>
                {vendor.contactNumber}
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center"><Mail className="h-4 w-4 text-slate-400" /></div>
                {vendor.email || 'No email provided'}
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center"><MapPin className="h-4 w-4 text-slate-400" /></div>
                {vendor.baseLocation} {vendor.city ? `, ${vendor.city}` : ''}
              </div>
            </div>
            
            <button className="w-full mt-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center gap-2">
              <Edit2 className="h-4 w-4" /> Edit Profile
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Operational Areas</h4>
            <div className="flex flex-wrap gap-2">
              {vendor.workingAreas?.map(area => (
                <span key={area} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600">{area}</span>
              ))}
              {!vendor.workingAreas?.length && <span className="text-sm font-medium text-slate-400">No specific areas mapped</span>}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><Briefcase className="h-6 w-6" /></div>
              <p className="text-3xl font-black text-slate-900 mb-1">{vendor.activeAssignments?.length || 0}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Assignments</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4"><ShieldCheck className="h-6 w-6" /></div>
              <p className="text-3xl font-black text-slate-900 mb-1">{vendor.performanceScore || '100'}%</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reliability Score</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4"><IndianRupee className="h-6 w-6" /></div>
              <p className="text-3xl font-black text-slate-900 mb-1">₹ {vendor.baseCost?.toLocaleString('en-IN') || 0}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{vendor.costType}</p>
            </div>
          </div>

          {/* Work History Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900">Recent Assignments</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Date', 'Campaign', 'Area', 'Status', 'Budget'].map(h => (
                      <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {/* We don't have assignments populated yet, mock it or show empty state */}
                  {vendor.activeAssignments?.length > 0 ? vendor.activeAssignments.map(a => (
                    <tr key={a._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-600">{new Date(a.startDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{a.campaignName}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-600">{a.area}</td>
                      <td className="px-6 py-4"><span className="px-2 py-1 rounded border bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest">{a.status}</span></td>
                      <td className="px-6 py-4 font-black text-slate-900">₹ {a.budget?.toLocaleString('en-IN')}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="px-6 py-12 text-center text-sm font-bold text-slate-400">No recent assignments found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-black text-slate-900 mb-6">Operational Timeline</h3>
            <div className="border-l-2 border-slate-100 ml-4 pl-6 py-2 space-y-8">
              <div className="relative">
                <div className="absolute -left-[35px] top-1 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-sm" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Just Now</p>
                <p className="font-bold text-slate-900 text-sm">Vendor Profile Checked</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">Profile accessed by {user.name}</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[35px] top-1 w-4 h-4 bg-slate-300 rounded-full border-4 border-white shadow-sm" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{new Date(vendor.createdAt).toLocaleDateString()}</p>
                <p className="font-bold text-slate-900 text-sm">Vendor Registered</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">Added to the execution network.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDetails;
