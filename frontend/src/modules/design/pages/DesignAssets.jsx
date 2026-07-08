import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Palette, Search, UploadCloud, Folder, FileText, Image as ImageIcon, Download, MoreVertical } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const ASSET_CATEGORIES = [
  { id: 'All', label: 'All Assets', icon: Folder },
  { id: 'Logos', label: 'Logos', icon: ImageIcon },
  { id: 'Fonts', label: 'Fonts', icon: FileText },
  { id: 'Templates', label: 'Templates', icon: FileText },
  { id: 'Brand Kits', label: 'Brand Kits', icon: Palette },
  { id: 'PSD Files', label: 'PSD Files', icon: ImageIcon }
];

const DesignAssets = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'All';
  
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const q = new URLSearchParams();
      if (categoryParam !== 'All') q.append('category', categoryParam);
      if (searchQuery) q.append('search', searchQuery);
      
      const apiUrl = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
      const res = await fetch(`${apiUrl}/api/design/assets?${q.toString()}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data.success) setAssets(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchAssets();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [categoryParam, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Design Assets</h1>
          <p className="text-slate-500 text-sm mt-1">Centralized hub for all brand kits, templates, and archives.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm">
          <UploadCloud className="w-4 h-4" />
          Upload Asset
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar for Categories */}
        <div className="w-64 shrink-0 bg-white border rounded-xl shadow-sm p-4 h-max">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-2">Categories</h3>
          <nav className="space-y-1">
            {ASSET_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSearchParams({ category: cat.id })}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  categoryParam === cat.id
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <cat.icon className={`w-4 h-4 ${categoryParam === cat.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                {cat.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          <div className="bg-white border rounded-xl shadow-sm p-4 flex justify-between items-center">
            <div className="relative w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search tags, brand, or keywords..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50"
              />
            </div>
            <div className="text-sm text-slate-500">
              {assets.length} {assets.length === 1 ? 'asset' : 'assets'} found
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center bg-white border rounded-xl shadow-sm">
              <div className="flex flex-col items-center text-slate-400">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                <p>Loading assets...</p>
              </div>
            </div>
          ) : assets.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center bg-white border border-dashed rounded-xl shadow-sm text-slate-400 p-6 text-center">
              <Folder className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-slate-600 mb-1">No assets found</p>
              <p className="text-sm">Try adjusting your filters or upload a new asset to this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {assets.map(asset => (
                <div key={asset._id} className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group relative flex flex-col">
                  <div className="w-full aspect-square bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center mb-3 overflow-hidden">
                    {/* Placeholder for image preview */}
                    {asset.fileType?.startsWith('image/') ? (
                      <ImageIcon className="w-12 h-12 text-slate-300" />
                    ) : (
                      <FileText className="w-12 h-12 text-slate-300" />
                    )}
                  </div>
                  <h4 className="font-semibold text-slate-800 text-sm truncate" title={asset.title}>{asset.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 truncate">{asset.brand || 'No brand specified'}</p>
                  
                  <div className="flex flex-wrap gap-1 mt-2 mb-3">
                    {asset.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-bold tracking-wider">
                        {tag}
                      </span>
                    ))}
                    {asset.tags?.length > 2 && (
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">
                        +{asset.tags.length - 2}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto flex justify-between items-center pt-3 border-t">
                    <span className="text-xs text-slate-400">{new Date(asset.createdAt).toLocaleDateString()}</span>
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignAssets;
