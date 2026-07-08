import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ComposedChart, Line } from 'recharts';
import { Calendar as CalendarIcon, Users } from 'lucide-react';

const COLORS = ['#22c55e', '#ef4444']; // Paid (Green), Unpaid (Red)
const PIE_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#f43f5e'];

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-700 shadow-xl">
        <p className="text-white font-bold mb-1">{label || payload[0].name}</p>
        <p className="text-slate-300 font-medium">Value: <span className="text-white font-bold">{payload[0].value}</span></p>
      </div>
    );
  }
  return null;
};

export default function SalesAnalyticsWidgets({ rawOrders = [], rawProspects = [], user }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [viewMode, setViewMode] = useState('own'); // 'own' or 'team'
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const isManager = ['SALES_MANAGER', 'SR_SALES_MANAGER', 'ADMIN', 'MD_CEO', 'BRANCH_HEAD'].includes(user.role);

  // Filter Data
  const filteredData = useMemo(() => {
    // 1. Filter by Date
    let fOrders = rawOrders.filter(o => {
      const d = new Date(o.createdAt);
      if (selectedMonth === -1) return d.getFullYear() === selectedYear;
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
    
    let fProspects = rawProspects.filter(p => {
      const d = new Date(p.createdAt);
      if (selectedMonth === -1) return d.getFullYear() === selectedYear;
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    // 2. Filter by Team vs Own
    if (viewMode === 'own') {
      fOrders = fOrders.filter(o => (o.salesExec?._id || o.salesExec) === user._id);
      fProspects = fProspects.filter(p => (p.assignedTo?._id || p.assignedTo) === user._id);
    }

    // --- Compute Metrics ---
    let totalOrderAmount = 0;
    let pendingAmount = 0;
    let completedOrders = 0;
    
    // Category Breakdown (Client Overview)
    const categoryMap = {
      'Retail': 0,
      'Renewal': 0,
      'Corporate': 0,
      'Corporate-Renewal': 0,
      'Agent': 0,
      'Agent-Renewal': 0
    };

    const categoryOrderCountMap = { ...categoryMap };

    fOrders.forEach(o => {
      totalOrderAmount += (o.grandTotal || 0);
      pendingAmount += (o.balanceDue || 0);
      
      if (['Completed', 'Delivered'].includes(o.status)) {
        completedOrders += 1;
      }

      // Try to find client category
      let cat = o.orderType || (o.prospect && typeof o.prospect === 'object' ? o.prospect.clientType : null);
      if (!cat && o.prospect) {
        const p = rawProspects.find(rp => rp._id === o.prospect);
        if (p && p.clientType) cat = p.clientType;
      }
      cat = cat || 'Retail';
      
      let formattedCat = cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('-');
      
      // Mappings to match exactly the 6 categories
      if (formattedCat === 'Renewal-Agent') formattedCat = 'Agent-Renewal';
      if (formattedCat === 'Retail-Agent') formattedCat = 'Agent';
      if (!['Retail', 'Renewal', 'Corporate', 'Corporate-Renewal', 'Agent', 'Agent-Renewal'].includes(formattedCat)) {
        formattedCat = 'Retail';
      }

      categoryMap[formattedCat] += (o.grandTotal || 0);
      categoryOrderCountMap[formattedCat] += 1;
    });

    const paidAmount = totalOrderAmount - pendingAmount;

    let confirmedProspects = 0;
    fProspects.forEach(p => {
      if (p.status === 'Order Confirmed' || p.convertedToOrder || p.stage === 'Won') {
        confirmedProspects += 1;
      }
    });

    const categoryChartData = Object.keys(categoryMap).map(cat => ({
      category: cat,
      Orders: categoryOrderCountMap[cat],
      amount: categoryMap[cat]
    }));

    return {
      totalOrderAmount,
      paidAmount,
      pendingAmount,
      totalOrdersCount: fOrders.length,
      completedOrders,
      totalProspects: fProspects.length,
      confirmedProspects,
      categoryChartData,
      totalClients: Object.values(categoryOrderCountMap).reduce((a,b)=>a+b, 0)
    };
  }, [rawOrders, rawProspects, selectedMonth, selectedYear, viewMode, user._id]);

  const monthName = selectedMonth === -1 ? 'All Months' : months[selectedMonth];
  const formatMoney = (val) => `₹${(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6 col-span-full w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <CalendarIcon className="h-5 w-5 text-indigo-500 ml-2" />
          <select 
            className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer"
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            <option value={-1}>All Months</option>
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select 
            className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer pr-2"
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {isManager && (
          <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-200 ml-auto">
            <button 
              onClick={() => setViewMode('own')} 
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'own' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              My Data
            </button>
            <button 
              onClick={() => setViewMode('team')} 
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'team' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Team Data
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Chart 1: Amount */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
          <h3 className="font-bold text-slate-800 text-base mb-6 flex items-center gap-2">
            💳 Payment Status - {monthName} {selectedYear}
          </h3>
          <div className="h-48 relative w-full min-w-0 min-h-0">
            {filteredData.totalOrderAmount > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Paid', value: filteredData.paidAmount },
                      { name: 'Unpaid', value: filteredData.pendingAmount }
                    ]}
                    cx="50%" cy="50%" innerRadius={0} outerRadius={70} paddingAngle={0} dataKey="value" stroke="white" strokeWidth={2}
                  >
                    <Cell fill={COLORS[0]} />
                    <Cell fill={COLORS[1]} />
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={20} iconType="square" wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 font-bold text-sm">No payment data</div>
            )}
          </div>
          <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
            <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-600">Total:</span> <span className="font-black text-slate-900">{formatMoney(filteredData.totalOrderAmount)}</span></div>
            <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-600">Unpaid:</span> <span className="font-black text-slate-900">{formatMoney(filteredData.pendingAmount)}</span></div>
            <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-600">Month:</span> <span className="font-bold text-slate-700">{monthName} {selectedYear}</span></div>
          </div>
        </div>

        {/* Chart 2: Orders */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
          <h3 className="font-bold text-slate-800 text-base mb-6 flex items-center gap-2">
            📦 Order Fulfillment - {monthName} {selectedYear}
          </h3>
          <div className="h-48 relative w-full min-w-0 min-h-0">
            {filteredData.totalOrdersCount > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: filteredData.completedOrders },
                      { name: 'In Progress', value: filteredData.totalOrdersCount - filteredData.completedOrders }
                    ]}
                    cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none"
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#cbd5e1" />
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 font-bold text-sm">No order data</div>
            )}
          </div>
          <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
            <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-600">Total Orders:</span> <span className="font-black text-slate-900">{filteredData.totalOrdersCount}</span></div>
            <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-600">Completed:</span> <span className="font-black text-blue-600">{filteredData.completedOrders}</span></div>
          </div>
        </div>

        {/* Chart 3: Prospects */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
          <h3 className="font-bold text-slate-800 text-base mb-6 flex items-center gap-2">
            🎯 Prospect Conversion - {monthName} {selectedYear}
          </h3>
          <div className="h-48 relative w-full min-w-0 min-h-0">
            {filteredData.totalProspects > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Converted (Order Confirmed)', value: filteredData.confirmedProspects },
                      { name: 'In Pipeline', value: filteredData.totalProspects - filteredData.confirmedProspects }
                    ]}
                    cx="50%" cy="50%" innerRadius={0} outerRadius={70} paddingAngle={0} dataKey="value" stroke="white" strokeWidth={2}
                  >
                    <Cell fill="#8b5cf6" />
                    <Cell fill="#f1f5f9" />
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={20} iconType="square" wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 font-bold text-sm">No prospect data</div>
            )}
          </div>
          <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
            <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-600">Total Prospects:</span> <span className="font-black text-slate-900">{filteredData.totalProspects}</span></div>
            <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-600">Confirmed Orders:</span> <span className="font-black text-purple-600">{filteredData.confirmedProspects}</span></div>
          </div>
        </div>

      </div>

      {/* Client Overview Bar Chart */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-4 md:p-6 hover:shadow-xl transition-all duration-300">
        <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2 px-2">
          📊 Client Overview - {monthName} {selectedYear}
        </h3>
        
        <div className="mb-8 bg-white rounded-2xl md:rounded-3xl p-2 md:p-6 shadow-sm border border-slate-100 overflow-hidden">
          <div className="w-full h-80 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData.categoryChartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} 
                  dy={10} 
                  interval="preserveStartEnd" 
                  height={40} 
                  tickFormatter={(val) => {
                    if (!isMobile) return val;
                    const map = {
                      'Retail': 'Rt',
                      'Renewal': 'Re',
                      'Corporate': 'C',
                      'Corporate-Renewal': 'CR',
                      'Agent': 'A',
                      'Agent-Renewal': 'AR'
                    };
                    return map[val] || val;
                  }}
                />
                <YAxis yAxisId="right" orientation="left" axisLine={false} tickLine={false} tick={{fill: '#10b981', fontSize: 11, fontWeight: 700}} />
                <RechartsTooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{ borderRadius: '1rem', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', color: '#0f172a' }}
                  itemStyle={{ fontWeight: 'bold' }}
                  formatter={(value) => [value, 'Orders']}
                  labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '8px' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{fontSize: '12px', fontWeight: 'bold', color: '#475569'}} />
                
                <Bar yAxisId="right" dataKey="Orders" name="Orders" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-slate-50/80 md:bg-transparent p-4 md:p-2 rounded-2xl md:rounded-none border border-slate-100 md:border-none">
            <div className="flex flex-col items-center md:items-start text-center md:text-left w-full md:w-auto">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Clients</span>
              <span className="font-black text-blue-600 text-3xl md:text-xl leading-none">{filteredData.totalClients}</span>
            </div>
            <div className="w-12 md:w-px h-1 md:h-8 rounded-full md:rounded-none bg-slate-200" />
            <div className="flex flex-col items-center md:items-end text-center md:text-right w-full md:w-auto">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Amount</span>
              <span className="font-black text-emerald-600 text-3xl md:text-xl leading-none">{formatMoney(filteredData.totalOrderAmount)}</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3 md:p-4 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {filteredData.categoryChartData.map(cat => (
              <div key={cat.category} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100 gap-3 hover:-translate-y-0.5 transition-transform text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  <span className="font-bold text-slate-700 truncate">{cat.category}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-end gap-4 w-full sm:w-auto bg-slate-50 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                  <span className="font-bold text-blue-600 text-sm whitespace-nowrap bg-blue-50/50 px-2 py-0.5 rounded-md">{cat.Orders} orders</span>
                  <span className="font-black text-emerald-600 text-sm whitespace-nowrap">{formatMoney(cat.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
