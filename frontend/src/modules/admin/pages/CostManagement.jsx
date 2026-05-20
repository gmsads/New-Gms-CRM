import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, TrendingUp, History, Save, RefreshCw, 
  Search, ShieldAlert, ArrowUpRight, ArrowDownRight,
  ChevronDown, Settings2, Info
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { productApi } from '../../../services/api';

const CostManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [prices, setPrices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.token) return;
      try {
        setLoading(true);
        const [catRes, prodRes] = await Promise.all([
          productApi.getCategories(user.token).catch(() => ({ data: [] })),
          productApi.list(user.token).catch(() => ({ data: [] }))
        ]);
        if (catRes.data) setCategories(catRes.data);
        if (prodRes.data) {
          const fetchedProducts = prodRes.data.map(p => ({
            id: p._id,
            product: p.productName,
            variant: p.productCode || 'N/A',
            categoryId: p.category?._id || p.category,
            pricing: {
              retail: p.pricingRules?.sellingPrice || 0,
              renewal: (p.pricingRules?.sellingPrice || 0) * 0.95,
              corporate: (p.pricingRules?.sellingPrice || 0) * 0.9,
              agent: (p.pricingRules?.sellingPrice || 0) * 0.85,
              corporateRenewal: (p.pricingRules?.sellingPrice || 0) * 0.88,
              agentRenewal: (p.pricingRules?.sellingPrice || 0) * 0.83
            },
            minPrice: p.pricingRules?.minimumSellingPrice || 0,
            baseCost: p.totalBaseCost || 0
          }));
          setPrices(fetchedProducts);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
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
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm">
            <Settings2 className="h-5 w-5 text-slate-600" />
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
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Retail Price</th>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Renewal</th>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Corporate</th>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Agent</th>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Corp Renewal</th>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Agent Renewal</th>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-100/50">Base Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPrices.map((item) => (
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
                  
                  {/* Editable Cells */}
                  <PriceInputCell value={item.pricing.retail} onChange={(v) => handlePriceChange(item.id, 'retail', v)} min={item.minPrice} />
                  <PriceInputCell value={item.pricing.renewal} onChange={(v) => handlePriceChange(item.id, 'renewal', v)} min={item.minPrice} />
                  <PriceInputCell value={item.pricing.corporate} onChange={(v) => handlePriceChange(item.id, 'corporate', v)} min={item.minPrice} />
                  <PriceInputCell value={item.pricing.agent} onChange={(v) => handlePriceChange(item.id, 'agent', v)} min={item.minPrice} />
                  <PriceInputCell value={item.pricing.corporateRenewal} onChange={(v) => handlePriceChange(item.id, 'corporateRenewal', v)} min={item.minPrice} />
                  <PriceInputCell value={item.pricing.agentRenewal} onChange={(v) => handlePriceChange(item.id, 'agentRenewal', v)} min={item.minPrice} />
                  
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
