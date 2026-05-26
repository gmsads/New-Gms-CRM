import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, MoreVertical, Eye, Truck, Star, MapPin } from 'lucide-react';
import api from '../../../../../services/api';
import { useAuth } from '../../../../../context/AuthContext';

const VendorList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 25;

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        const params = { page, limit };
        if (search) params.search = search; // Assume API Features handles this or we filter client-side for now
        if (statusFilter) params.status = statusFilter;
        
        const res = await api.get(`/vendors?${new URLSearchParams(params)}`, user.token);
        // If APIFeatures search isn't strictly implemented on the backend yet, we do simple client-side search fallback if needed
        setVendors(res.data.vendors || []);
        // setTotalPages(Math.ceil(res.total / limit) || 1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    // Simple debounce
    const t = setTimeout(fetchVendors, 300);
    return () => clearTimeout(t);
  }, [search, statusFilter, page, user.token]);

  // Client-side filtering fallback just in case backend query doesn't handle search text yet
  const displayedVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) || 
    (v.category?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Inactive': return 'bg-slate-50 text-slate-600 border-slate-200';
      case 'Suspended': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getAvailabilityStyle = (status) => {
    switch(status) {
      case 'Available': return 'text-emerald-600 bg-emerald-50';
      case 'Busy': case 'In Campaign': return 'text-blue-600 bg-blue-50';
      default: return 'text-amber-600 bg-amber-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex w-full md:w-auto items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <input 
              type="search" 
              placeholder="Search by vendor name or category..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-11 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
        
        <button onClick={() => navigate('/vendors/add')} className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> Register Vendor
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Vendor Name', 'Category', 'Contact', 'Location / Areas', 'Availability', 'Status', 'Rating', ''].map(h => (
                  <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="8" className="px-6 py-12 text-center text-sm font-bold text-slate-400">Loading Vendors...</td></tr>
              ) : displayedVendors.length === 0 ? (
                <tr><td colSpan="8" className="px-6 py-12 text-center text-sm font-bold text-slate-400">No vendors found matching your criteria.</td></tr>
              ) : (
                displayedVendors.map(vendor => (
                  <tr key={vendor._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                          <Truck className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{vendor.name}</p>
                          <p className="text-xs font-semibold text-slate-500">ID: {vendor._id.substring(vendor._id.length - 6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{vendor.category?.name || 'Uncategorized'}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{vendor.contactNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-sm">
                        <MapPin className="h-3.5 w-3.5" />
                        {vendor.baseLocation}
                      </div>
                      {vendor.workingAreas && vendor.workingAreas.length > 0 && (
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                          + {vendor.workingAreas.length} Areas
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getAvailabilityStyle(vendor.availabilityStatus)}`}>
                        {vendor.availabilityStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(vendor.status)}`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        {vendor.averageRating > 0 ? (
                          <><Star className="h-4 w-4 text-amber-400 fill-amber-400" /> {vendor.averageRating}</>
                        ) : (
                          <span className="text-slate-400 text-xs">New</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => navigate(`/vendors/${vendor._id}`)}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 rounded-lg text-xs font-bold text-slate-600 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <Eye className="h-3.5 w-3.5" /> Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="border-t border-slate-100 p-4 flex items-center justify-between text-sm font-bold text-slate-500">
          <span>Showing {displayedVendors.length} vendors</span>
          <div className="flex gap-2">
            <button disabled className="px-4 py-2 rounded-lg bg-slate-50 border border-slate-100 disabled:opacity-50">Prev</button>
            <button disabled className="px-4 py-2 rounded-lg bg-slate-50 border border-slate-100 disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorList;
