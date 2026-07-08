import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, X, Check, Grid, List, Tag, Layers, Eye, 
  ShoppingBag, Info, SlidersHorizontal, ArrowUpDown, ChevronRight 
} from 'lucide-react';
import { productApi } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

export const ProductCatalogueModal = ({ 
  isOpen, 
  onClose, 
  onSelectProduct, // Callback when a single product is selected (receives product object)
  onSelectMultiple, // Optional callback for adding multiple products at once
  mode = 'single', // 'single' or 'multiple'
  selectedIds = [], // Array of product IDs already selected
  title = "Product Catalogue"
}) => {
  const { user } = useAuth();
  
  // -- State --
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name-asc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  // Detail Preview State
  const [previewProduct, setPreviewProduct] = useState(null);
  
  // Multiple Selection State
  const [tempSelected, setTempSelected] = useState([]);

  // Reset temp selected when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempSelected(selectedIds);
      setPreviewProduct(null);
    }
  }, [isOpen, selectedIds]);

  // -- Fetch Data --
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen) return;
      setLoading(true);
      try {
        const prodRes = await productApi.list(user?.token);
        if (prodRes.success) {
          // Filter only active products
          const activeProds = prodRes.data.filter(p => p.status === 'Active');
          setProducts(activeProds);
          
          // Dynamically extract unique categories if category objects aren't populated
          const uniqueCats = new Map();
          activeProds.forEach(p => {
            if (p.category) {
              const catId = p.category._id || p.category;
              const catName = p.category.name || p.category;
              if (catId && catName) {
                uniqueCats.set(String(catId), catName);
              }
            }
          });
          
          const catList = Array.from(uniqueCats.entries()).map(([id, name]) => ({ _id: id, name }));
          setCategories(catList);
        }
      } catch (err) {
        console.error('Failed to fetch catalogue products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen, user]);

  // -- Filter and Sort Products --
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const name = p.productName || p.name || '';
        const code = p.productCode || '';
        const sku = p.sku || '';
        const desc = p.description || '';
        const tags = Array.isArray(p.tags) ? p.tags.join(' ') : '';
        
        const matchesSearch = 
          name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tags.toLowerCase().includes(searchQuery.toLowerCase());
          
        const categoryId = typeof p.category === 'object' ? p.category?._id : p.category;
        const matchesCategory = selectedCategory === 'All' || String(categoryId) === String(selectedCategory);
        
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        const nameA = a.productName || a.name || '';
        const nameB = b.productName || b.name || '';
        const priceA = a.pricingRules?.totalBasePrice || a.basePrice || 0;
        const priceB = b.pricingRules?.totalBasePrice || b.basePrice || 0;
        
        if (sortBy === 'name-asc') return nameA.localeCompare(nameB);
        if (sortBy === 'name-desc') return nameB.localeCompare(nameA);
        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        return 0;
      });
  }, [products, searchQuery, selectedCategory, sortBy]);

  if (!isOpen) return null;

  const toggleSelectMultiple = (productId) => {
    if (tempSelected.includes(productId)) {
      setTempSelected(tempSelected.filter(id => id !== productId));
    } else {
      setTempSelected([...tempSelected, productId]);
    }
  };

  const handleConfirmMultiple = () => {
    const selectedProducts = products.filter(p => tempSelected.includes(p._id));
    if (onSelectMultiple) {
      onSelectMultiple(selectedProducts);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)' }}>
      <div className="bg-slate-900 border border-slate-800 w-full max-w-7xl h-[90vh] rounded-3xl shadow-2xl flex flex-col font-sans overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shadow-lg">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {filteredProducts.length} active products available
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* View switcher */}
            <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <button 
              onClick={onClose} 
              className="h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-col md:flex-row gap-4 items-center">
          {/* Search bar */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search products by name, code, SKU, tags..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-11 pr-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm outline-none placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort selection */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <ArrowUpDown className="h-4 w-4 text-slate-400" />
            <select 
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs outline-none focus:border-indigo-500 font-bold transition-all w-full md:w-auto"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Categories Sidebar */}
          <div className="w-56 border-r border-slate-800 bg-slate-950/30 overflow-y-auto hidden sm:block p-4 space-y-1">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Categories</h3>
            <button
              onClick={() => setSelectedCategory('All')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${selectedCategory === 'All' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <span className="flex items-center gap-2"><Layers className="h-3.5 w-3.5" /> All Products</span>
              <span className="text-[10px] bg-slate-950/40 text-slate-400 px-2 py-0.5 rounded-full font-bold">{products.length}</span>
            </button>
            
            {categories.map(cat => {
              const count = products.filter(p => {
                const id = typeof p.category === 'object' ? p.category?._id : p.category;
                return String(id) === String(cat._id);
              }).length;
              
              return (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${selectedCategory === cat._id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  <span className="flex items-center gap-2 truncate"><Tag className="h-3.5 w-3.5 shrink-0" /> {cat.name}</span>
                  <span className="text-[10px] bg-slate-950/40 text-slate-400 px-2 py-0.5 rounded-full font-bold">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Grid/List View Content Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-950/20">
            {loading ? (
              <div className="h-full w-full flex flex-col items-center justify-center gap-4">
                <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-bold text-slate-400">Loading Product Catalogue...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <ShoppingBag className="h-16 w-16 mb-4 opacity-10" />
                <h4 className="text-base font-bold text-slate-300">No products found</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Try adjusting your search filters or selected category to browse other products.
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid Layout */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(p => {
                  const isSelected = tempSelected.includes(p._id);
                  const price = p.pricingRules?.totalBasePrice || p.basePrice || 0;
                  
                  return (
                    <div 
                      key={p._id}
                      className={`group rounded-2xl border bg-slate-900 overflow-hidden flex flex-col shadow-lg hover:shadow-xl transition-all duration-200 ${
                        isSelected 
                          ? 'border-indigo-500 ring-1 ring-indigo-500/20' 
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Product Media / Thumbnail */}
                      <div className="h-44 w-full bg-slate-950 relative overflow-hidden flex items-center justify-center shrink-0">
                        {p.thumbnail ? (
                          <img 
                            src={p.thumbnail} 
                            alt={p.productName} 
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-900/40 to-slate-950 flex flex-col items-center justify-center text-slate-500 gap-1.5">
                            <ShoppingBag className="h-8 w-8 text-slate-600" />
                            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-600">GMS Standard</span>
                          </div>
                        )}
                        
                        {/* Product Code Badge */}
                        <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-indigo-400 font-mono text-[9px] font-black px-2 py-0.5 rounded-full border border-slate-800">
                          {p.productCode || 'NO-CODE'}
                        </span>
                        
                        {/* Selected Indicator overlay */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-indigo-950/50 backdrop-blur-xs flex items-center justify-center">
                            <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40">
                              <Check className="h-5 w-5" />
                            </div>
                          </div>
                        )}
                        
                        {/* Quick View Button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewProduct(p);
                          }}
                          className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-slate-950/80 hover:bg-slate-950 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center shadow-md backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                              {p.productName || p.name}
                            </h4>
                          </div>
                          <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest mt-0.5">
                            {p.category?.name || 'Uncategorized'}
                          </p>
                          <p className="text-xs text-slate-400 mt-2 line-clamp-2 min-h-[32px] leading-relaxed">
                            {p.description || 'No description available for this product.'}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between bg-slate-950/40 rounded-xl p-2.5 border border-slate-800/40">
                            <div>
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Retail Cost</p>
                              <p className="text-base font-black text-white mt-0.5">₹{price.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">MOQ / Unit</p>
                              <p className="text-xs font-semibold text-slate-300 mt-0.5">
                                {p.minimumOrderQuantity || 1} {p.unit || 'pcs'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => setPreviewProduct(p)}
                              className="h-9 px-3 rounded-xl border border-slate-800 bg-slate-950/30 hover:bg-slate-850 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
                            >
                              <Info className="h-3.5 w-3.5" /> Details
                            </button>
                            
                            {mode === 'single' ? (
                              <button
                                onClick={() => {
                                  onSelectProduct(p);
                                  onClose();
                                }}
                                className="flex-1 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-900/30 flex items-center justify-center gap-1"
                              >
                                Select Product
                              </button>
                            ) : (
                              <button
                                onClick={() => toggleSelectMultiple(p._id)}
                                className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                                  isSelected 
                                    ? 'bg-rose-950/40 text-rose-400 border border-rose-500/30 hover:bg-rose-900/20' 
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/30'
                                }`}
                              >
                                {isSelected ? 'Deselect' : 'Add to Selection'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List Layout */
              <div className="space-y-3 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
                {filteredProducts.map(p => {
                  const isSelected = tempSelected.includes(p._id);
                  const price = p.pricingRules?.totalBasePrice || p.basePrice || 0;
                  
                  return (
                    <div 
                      key={p._id}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                        isSelected ? 'bg-indigo-950/10' : 'hover:bg-slate-850/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                          {p.thumbnail ? (
                            <img src={p.thumbnail} alt={p.productName} className="h-full w-full object-cover" />
                          ) : (
                            <ShoppingBag className="h-5 w-5 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-white">{p.productName || p.name}</h4>
                            <span className="bg-slate-950 text-slate-400 font-mono text-[8px] font-bold px-1.5 py-0.5 rounded border border-slate-800">
                              {p.productCode}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 font-semibold">
                            <span className="text-indigo-400">{p.category?.name || 'Uncategorized'}</span>
                            <span>·</span>
                            <span>Stock: <span className={p.stockQuantity <= p.lowStockAlert ? 'text-rose-500 font-bold' : 'text-slate-300'}>{p.stockQuantity} {p.unit}</span></span>
                            <span>·</span>
                            <span>MOQ: {p.minimumOrderQuantity}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 self-end sm:self-center">
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Selling Price</p>
                          <p className="text-sm font-black text-white mt-0.5">₹{price.toLocaleString('en-IN')}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewProduct(p)}
                            className="h-8 w-8 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                            title="Product Details"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                          
                          {mode === 'single' ? (
                            <button
                              onClick={() => {
                                onSelectProduct(p);
                                onClose();
                              }}
                              className="h-8 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow transition-colors"
                            >
                              Select
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleSelectMultiple(p._id)}
                              className={`h-8 px-4 text-xs font-bold rounded-lg transition-all ${
                                isSelected 
                                  ? 'bg-rose-950/40 text-rose-400 border border-rose-500/30' 
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                              }`}
                            >
                              {isSelected ? 'Remove' : 'Add'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer controls for Multiple Selection mode */}
        {mode === 'multiple' && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-bold">
                {tempSelected.length} products selected in total
              </span>
              {tempSelected.length > 0 && (
                <button 
                  onClick={() => setTempSelected([])} 
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold underline transition-colors"
                >
                  Clear Selection
                </button>
              )}
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="h-10 px-5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmMultiple}
                disabled={tempSelected.length === 0}
                className="h-10 px-8 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-900/30 transition-all flex items-center gap-2"
              >
                <Check className="h-4 w-4" /> Add Selected Products
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Product Specification Details Preview Slider ──────────────────────── */}
      {previewProduct && (
        <div className="fixed inset-0 z-[110] flex items-center justify-end" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-lg h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col font-sans overflow-hidden text-slate-100 animate-in slide-in-from-right duration-250">
            {/* Preview Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Info className="h-4 w-4 text-indigo-400" />
                Product Details
              </h3>
              <button 
                onClick={() => setPreviewProduct(null)} 
                className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center border border-slate-750 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Preview Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Product Banner */}
              <div className="h-56 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative flex items-center justify-center">
                {previewProduct.thumbnail ? (
                  <img src={previewProduct.thumbnail} alt={previewProduct.productName} className="h-full w-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-900/30 to-slate-950 flex flex-col items-center justify-center text-slate-500 gap-1.5">
                    <ShoppingBag className="h-10 w-10 text-indigo-500/50" />
                  </div>
                )}
                <span className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur text-indigo-400 font-mono text-[10px] font-black px-2.5 py-0.5 rounded-full border border-slate-850">
                  {previewProduct.productCode}
                </span>
              </div>

              {/* Title & Desc */}
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">{previewProduct.productName || previewProduct.name}</h2>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mt-1">{previewProduct.category?.name || 'Uncategorized'}</p>
                <p className="text-slate-400 text-xs mt-3 leading-relaxed">{previewProduct.description || 'No description provided.'}</p>
              </div>

              {/* Specifications Map */}
              {previewProduct.specifications && Object.keys(previewProduct.specifications).length > 0 && (
                <div className="bg-slate-950/40 rounded-2xl border border-slate-800/80 p-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Specifications</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {Object.entries(previewProduct.specifications).map(([key, val]) => (
                      <div key={key} className="bg-slate-950/50 rounded-lg p-2 border border-slate-850">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{key}</p>
                        <p className="font-bold text-slate-300 mt-0.5">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Costing breakdown panel */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Base Selling Price</span>
                  <span className="text-xl font-black text-emerald-400 mt-1">
                    ₹{(previewProduct.pricingRules?.totalBasePrice || previewProduct.basePrice || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5 font-semibold">Includes Taxes & Setup</span>
                </div>
                
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Pricing Type</span>
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider mt-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 w-fit">
                    {previewProduct.pricingRules?.type?.replace('_', ' ') || 'FIXED'}
                  </span>
                </div>
              </div>

              {/* Stock Details */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
                <div className="flex justify-between items-center p-3 text-xs">
                  <span className="text-slate-400 font-medium">SKU Reference</span>
                  <span className="font-mono text-slate-200 font-bold">{previewProduct.sku || '-'}</span>
                </div>
                <div className="flex justify-between items-center p-3 text-xs">
                  <span className="text-slate-400 font-medium">Standard Unit</span>
                  <span className="font-bold text-slate-200 uppercase">{previewProduct.unit || 'pcs'}</span>
                </div>
                <div className="flex justify-between items-center p-3 text-xs">
                  <span className="text-slate-400 font-medium">Min Order Quantity (MOQ)</span>
                  <span className="font-bold text-slate-200">{previewProduct.minimumOrderQuantity || 1}</span>
                </div>
                <div className="flex justify-between items-center p-3 text-xs">
                  <span className="text-slate-400 font-medium">Available Inventory Stock</span>
                  <span className={`font-bold ${previewProduct.stockQuantity <= previewProduct.lowStockAlert ? 'text-rose-500' : 'text-slate-200'}`}>
                    {previewProduct.stockQuantity} units
                  </span>
                </div>
              </div>
            </div>

            {/* Preview Footer */}
            <div className="p-5 border-t border-slate-800 bg-slate-950 shrink-0 flex gap-3">
              <button 
                onClick={() => setPreviewProduct(null)}
                className="flex-1 h-10 border border-slate-850 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition-colors"
              >
                Back to Grid
              </button>
              
              {mode === 'single' ? (
                <button
                  onClick={() => {
                    onSelectProduct(previewProduct);
                    setPreviewProduct(null);
                    onClose();
                  }}
                  className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-900/30 flex items-center justify-center gap-1.5"
                >
                  <Check className="h-4 w-4" /> Select This Product
                </button>
              ) : (
                <button
                  onClick={() => {
                    toggleSelectMultiple(previewProduct._id);
                    setPreviewProduct(null);
                  }}
                  className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    tempSelected.includes(previewProduct._id) 
                      ? 'bg-rose-950/40 text-rose-400 border border-rose-500/30 hover:bg-rose-900/20' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/30'
                  }`}
                >
                  {tempSelected.includes(previewProduct._id) ? 'Deselect Product' : 'Add to Selection'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCatalogueModal;
