import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Edit2, Trash2, CheckCircle, XCircle, 
  Package, MoreVertical, Layers, Image as ImageIcon, ChevronRight,
  Info, AlertTriangle
} from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { useAuth } from '../../../context/AuthContext';

import ProductModal from '../components/products/ProductModal';
import CategoryModal from '../components/products/CategoryModal';

const ProductManagement = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { request } = useApi();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const timestamp = new Date().getTime();
      const headers = { 
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      };
      
      const parseJsonSafe = async (r) => {
        const text = await r.text();
        return text ? JSON.parse(text) : {};
      };

      const p1 = fetch(`/api/products?t=${timestamp}`, { headers, cache: 'no-store' }).then(parseJsonSafe);
      const p2 = fetch(`/api/products/categories?t=${timestamp}`, { headers, cache: 'no-store' }).then(parseJsonSafe);
      
      const [pRes, cRes] = await Promise.all([p1, p2]);
      
      if (pRes && pRes.success) {
        setProducts(pRes.data || []);
      }
      
      if (cRes && cRes.success) {
        setCategories(cRes.data || []);
      } else {
        alert('Failed to load categories: ' + (cRes?.message || 'Server error'));
      }
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Network error while loading data. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProductStatus = async (product) => {
    const newStatus = product.status === 'Active' ? 'Draft' : 'Active';
    try {
      const res = await request('PATCH', `/products/${product._id}/status`, { status: newStatus });
      if (res && res.success) {
        fetchProducts(); // Refresh list after toggle
      } else {
        alert(res?.message || 'Failed to update product status');
      }
    } catch (err) {
      alert('Error updating status');
    }
  };

  const handleDeleteProduct = async (product) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete the product "${product.productName}"?\nThis will hide it from the catalog but retain its historical audit logs.`);
    if (!isConfirmed) return;

    try {
      const res = await request('DELETE', `/products/${product._id}`);
      if (res && res.success) {
        fetchProducts(); // Refresh list after deletion
      } else {
        alert(res?.message || 'Failed to delete product');
      }
    } catch (err) {
      alert('Error deleting product');
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.productName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-8 w-full max-w-[1800px] mx-auto animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Enterprise Product Catalog</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage master products, dynamic pricing rules, and margins.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-5 py-2.5 rounded-xl font-bold transition-all border border-indigo-200"
          >
            <Layers className="h-5 w-5" />
            <span>Manage Categories ({categories.length})</span>
          </button>
          <button 
            onClick={() => setShowProductModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            <Plus className="h-5 w-5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Products" value={products.length} icon={Package} color="blue" />
        <StatCard title="Active Categories" value={categories.length} icon={Layers} color="indigo" />
        <StatCard title="Low Margin Alerts" value="3" icon={AlertTriangle} color="amber" />
        <StatCard title="New Requests" value="12" icon={Info} color="emerald" />
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by product name or SKU..." 
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 md:flex-none h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
          </select>
          <button className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
            <Filter className="h-5 w-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Product Info</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Total Base Price</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Pricing Logic</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">MOQ</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.map((product) => {
              const baseCost = product.costBreakdown?.totalBaseCost || 0;
              const rules = product.pricingRules || {};
              let sp = 0;
              let pricingText = 'Dynamic';

              if (rules.type === 'FIXED_PRICE') {
                sp = rules.sellingPrice || 0;
                pricingText = `₹${sp} fixed`;
              } else if (rules.type === 'PER_SFT') {
                sp = rules.ratePerSft || 0;
                pricingText = `₹${sp}/sft (Min: ${rules.minArea || 0}sft)`;
              } else if (rules.type === 'SIZE_BASED') {
                const sizes = rules.sizePrices?.map(s => s.sizeLabel).join(', ');
                pricingText = sizes ? sizes : 'No Sizes Configured';
              } else if (rules.type === 'QUANTITY_BASED') {
                pricingText = `${rules.quantitySlabs?.length || 0} Volume Slabs`;
              } else if (rules.type === 'RENTAL_BASED') {
                pricingText = `₹${rules.rentalRates?.daily || 0}/day`;
              }

              const margin = baseCost > 0 && sp > 0 ? ((sp - baseCost) / baseCost) * 100 : (rules.minimumMargin || 100);
              const isLowMargin = margin < (rules.minimumMargin || 20);

              return (
                <tr key={product._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shadow-inner shrink-0">
                        {product.thumbnail ? (
                          <img src={product.thumbnail} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{product.productName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-slate-500 font-medium tracking-tight">Code: {product.productCode || product.sku}</p>
                          <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                          <span className="text-xs font-bold text-slate-500 truncate max-w-[120px]">{product.category?.name || 'Uncategorized'}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-bold text-slate-700">₹{product.pricingRules?.totalBasePrice?.toFixed(2) || '0.00'} <span className="text-xs text-slate-400 font-normal">total</span></p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${isLowMargin ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                      <span className={`text-xs font-bold ${isLowMargin ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {sp > 0 ? `${margin.toFixed(1)}% margin` : `Min ${rules.minimumMargin || 20}% margin`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 whitespace-nowrap">
                      {rules.type?.replace('_', ' ') || 'FIXED PRICE'}
                    </span>
                    <p className="text-sm font-bold text-slate-700 mt-1.5 truncate max-w-[150px]" title={pricingText}>
                      {pricingText}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Min. {product.minimumOrderQuantity || 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleToggleProductStatus(product)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${product.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.status === 'Active' ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className={`text-xs font-bold ${product.status === 'Active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {product.status === 'Active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2 transition-opacity">
                      <button 
                        onClick={() => { setSelectedProduct(product); setShowProductModal(true); }}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                        title="Edit Pricing Engine"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product)}
                        className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                        title="Delete Product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Catalog...</p>
          </div>
        )}
        
        {!loading && filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No products found</h3>
            <p className="text-slate-500 max-w-xs mt-1">Try adjusting your filters or search terms to find what you're looking for.</p>
          </div>
        )}
      </div>

      {showProductModal && (
        <ProductModal 
          isOpen={showProductModal}
          onClose={() => {
            setShowProductModal(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          categories={categories}
          onSuccess={fetchProducts}
        />
      )}

      {showCategoryModal && (
        <CategoryModal 
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          onSuccess={fetchProducts}
          categories={categories}
        />
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100"
  };
  
  return (
    <div className={`p-6 rounded-2xl border shadow-sm flex items-center gap-5 bg-white group hover:border-blue-300 transition-all hover:shadow-md`}>
      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border shadow-inner ${colors[color] || colors.blue}`}>
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );
};

export default ProductManagement;
