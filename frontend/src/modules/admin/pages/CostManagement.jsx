import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, TrendingUp, History, Save, RefreshCw, 
  Search, ShieldAlert, ArrowUpRight, ArrowDownRight,
  ChevronDown, Settings2, Info, Plus, Trash2, X
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { productApi } from '../../../services/api';

const CostManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [clientTypes, setClientTypes] = useState([]);
  const [prices, setPrices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Manage Categories Modal state
  const [showManageModal, setShowManageModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchData = async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const [catRes, prodRes, ctRes] = await Promise.all([
        productApi.getCategories(user.token).catch(() => ({ data: [] })),
        productApi.list(user.token).catch(() => ({ data: [] })),
        productApi.getClientTypes(user.token).catch(() => ({ data: [] }))
      ]);

      const activeTypes = ctRes.data || [];
      setClientTypes(activeTypes);

      if (catRes.data) setCategories(catRes.data);
      if (prodRes.data) {
        const fetchedProducts = prodRes.data.map(p => {
          const sellingPrice = p.pricingRules?.sellingPrice || 0;
          const pricing = {};
          
          activeTypes.forEach(ct => {
            // Check if there is a custom cost saved for this category key, otherwise fall back to base sellingPrice
            if (p.clientTypePricing && p.clientTypePricing[ct.key] !== undefined) {
              pricing[ct.key] = p.clientTypePricing[ct.key];
            } else {
              pricing[ct.key] = parseFloat((sellingPrice * ct.multiplier).toFixed(2));
            }
          });

          return {
            id: p._id,
            product: p.productName,
            variant: p.productCode || 'N/A',
            categoryId: p.category?._id || p.category,
            pricing,
            minPrice: p.pricingRules?.minimumSellingPrice || 0,
            baseCost: p.totalBaseCost || 0
          };
        });
        setPrices(fetchedProducts);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.token]);

  const handlePriceChange = (variantId, type, value) => {
    setPrices(prev => prev.map(v => {
      if (v.id === variantId) {
        return {
          ...v,
          pricing: { ...v.pricing, [type]: parseFloat(value) || 0 }
        };
      }
      return v;
    }));
  };

  const handleSavePrices = async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const promises = prices.map(p => {
        return productApi.update(p.id, { clientTypePricing: p.pricing }, user.token);
      });
      await Promise.all(promises);
      alert('Pricing rules saved successfully!');
      await fetchData();
    } catch (error) {
      console.error('Error saving prices:', error);
      alert('Failed to save pricing rules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      setCreating(true);
      const res = await productApi.createClientType({
        name: newCatName,
        multiplier: 1.0 // Defaults to 1.0 (base price multiplier) since we edit costs manually later
      }, user.token);

      if (res.success) {
        setNewCatName('');
        await fetchData(); // Refresh data to show new category columns
      }
    } catch (error) {
      console.error('Error creating cost category:', error);
      alert(error.message || 'Failed to add cost category');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this cost category? This will affect calculations for this group.')) return;
    try {
      setDeletingId(id);
      const res = await productApi.deleteClientType(id, user.token);
      if (res.success) {
        await fetchData(); // Refresh columns and calculations
      }
    } catch (error) {
      console.error('Error deleting cost category:', error);
      alert(error.message || 'Failed to delete cost category');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPrices = prices.filter(p => {
    if (selectedCategory && p.categoryId !== selectedCategory) return false;
    if (searchTerm && !p.product.toLowerCase().includes(searchTerm.toLowerCase()) && !p.variant.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cost & Margin Master</h1>
          <p className="text-slate-500 mt-1 font-medium">Define dynamic pricing rules for different client categories</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSavePrices}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save Pricing
          </button>
          <button 
            onClick={() => setShowManageModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
          >
            <Settings2 className="h-4 w-4" />
            Manage Categories
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search variant or product..." 
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none flex items-center gap-2 pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">Select Category</option>
              {categories.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          <button 
            onClick={fetchData}
            title="Reload Data"
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors"
          >
            <RefreshCw className={`h-5 w-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dynamic Pricing Matrix */}
      <div className="bg-white rounded-3xl border shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-100">
                <th className="sticky left-0 bg-slate-50/80 z-10 px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest border-r border-slate-100">Product & Variant</th>
                {clientTypes.map(ct => (
                  <th key={ct._id} className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest min-w-[150px] whitespace-nowrap">
                    {ct.name}
                  </th>
                ))}
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-100/50">Base Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && prices.length === 0 ? (
                <tr>
                  <td colSpan={clientTypes.length + 2} className="px-6 py-20 text-center text-slate-500 font-medium">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-600 mb-3" />
                    Loading products and price matrices...
                  </td>
                </tr>
              ) : filteredPrices.length === 0 ? (
                <tr>
                  <td colSpan={clientTypes.length + 2} className="px-6 py-12 text-center text-slate-400 font-semibold">
                    No products found matching criteria
                  </td>
                </tr>
              ) : filteredPrices.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-all duration-300">
                  <td className="sticky left-0 bg-white group-hover:bg-slate-50/50 z-10 px-6 py-5 border-r border-slate-100 min-w-[240px]">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xs border border-indigo-100">
                        {item.variant}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-none">{item.product}</p>
                        <p className="text-[10px] font-black text-indigo-500 uppercase mt-1 tracking-tighter">Variant: {item.variant}</p>
                      </div>
                    </div>
                  </td>
                  
                  {/* Dynamic Pricing Cells */}
                  {clientTypes.map(ct => (
                    <PriceInputCell 
                      key={ct._id}
                      value={item.pricing[ct.key] || 0} 
                      onChange={(v) => handlePriceChange(item.id, ct.key, v)} 
                      min={item.minPrice} 
                    />
                  ))}
                  
                  <td className="px-6 py-5 bg-slate-50 font-black text-slate-600 text-sm">
                    ₹{item.baseCost.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Helper Legend */}
      <div className="flex flex-wrap items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 bg-white border border-slate-300 rounded-full" />
          <span className="text-xs font-bold text-slate-500">Normal Pricing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 bg-amber-100 border border-amber-300 rounded-full" />
          <span className="text-xs font-bold text-slate-500">Near Min Margin</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 bg-rose-100 border border-rose-300 rounded-full" />
          <span className="text-xs font-bold text-slate-500">Below Min Limit</span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-indigo-600">
          <Info className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Double click cell to bulk edit</span>
        </div>
      </div>

      {/* Manage Client Categories Popup Modal */}
      {showManageModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[85vh] border animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Manage Cost Categories</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Add, view or delete dynamic client price groups</p>
              </div>
              <button 
                onClick={() => setShowManageModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center font-bold"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Form to add new Category */}
            <form onSubmit={handleCreateCategory} className="py-4 border-b space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Add New Category</h3>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Category Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. Retail, Corporate"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  disabled={creating}
                  className="bg-slate-950 text-white font-bold px-6 py-2.5 rounded-xl text-xs hover:bg-indigo-650 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 h-[42px]"
                >
                  {creating ? 'Adding...' : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Category
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-2 max-h-[45vh]">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Active Categories</h3>
              {clientTypes.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No categories loaded.</p>
              ) : clientTypes.map(ct => (
                <div key={ct._id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:bg-slate-100/50">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{ct.name}</p>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-tight">Key: {ct.key}</p>
                  </div>
                  
                  {ct.key !== 'retail' ? (
                    <button 
                      type="button"
                      disabled={deletingId === ct._id}
                      onClick={() => handleDeleteCategory(ct._id)}
                      className="text-rose-600 hover:bg-rose-50 p-2 rounded-xl text-xs font-bold transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingId === ct._id ? '...' : 'Delete'}
                    </button>
                  ) : (
                    <span className="text-[9px] font-black text-slate-400 bg-slate-200/80 px-2 py-0.5 rounded-md uppercase tracking-wider">System Default</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PriceInputCell = ({ value, onChange, min }) => {
  const isBelowMin = value < min;
  const isWarning = value >= min && value < min * 1.1;

  return (
    <td className={`px-4 py-4 transition-colors ${isBelowMin ? 'bg-rose-50/50' : isWarning ? 'bg-amber-50/50' : ''}`}>
      <div className="relative group">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
        <input 
          type="number" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full pl-7 pr-3 py-2 bg-white border rounded-xl text-sm font-black outline-none transition-all
            ${isBelowMin ? 'border-rose-300 text-rose-600 focus:ring-rose-500' : 
              isWarning ? 'border-amber-300 text-amber-600 focus:ring-amber-500' : 
              'border-slate-200 text-slate-900 focus:ring-indigo-500'}
            shadow-sm group-hover:border-indigo-300
          `}
        />
        {isBelowMin && (
          <div className="absolute -top-1 -right-1">
            <ShieldAlert className="h-4 w-4 text-rose-500 fill-white" />
          </div>
        )}
      </div>
    </td>
  );
}

export default CostManagement;
