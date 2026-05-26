import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar as CalendarIcon, Users } from 'lucide-react';

const COLORS = ['#22c55e', '#ef4444']; // Paid (Green), Unpaid (Red)
const PIE_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#f43f5e'];

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function SalesAnalyticsWidgets({ rawOrders = [], rawProspects = [], user }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [viewMode, setViewMode] = useState('own'); // 'own' or 'team'
  
  const isManager = ['SALES_MANAGER', 'SR_SALES_MANAGER', 'ADMIN', 'MD_CEO', 'BRANCH_HEAD'].includes(user.role);

  // Filter Data
  const filteredData = useMemo(() => {
    // 1. Filter by Date
    let fOrders = rawOrders.filter(o => {
      const d = new Date(o.createdAt);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
    
    let fProspects = rawProspects.filter(p => {
      const d = new Date(p.createdAt);
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
      let cat = 'Retail'; // default
      if (o.prospect && typeof o.prospect === 'object' && o.prospect.clientType) {
        cat = o.prospect.clientType;
      } else if (o.prospect) { // prospect is ID, search in rawProspects
        const p = rawProspects.find(rp => rp._id === o.prospect);
        if (p && p.clientType) cat = p.clientType;
      }
      
      if (categoryMap[cat] !== undefined) {
        categoryMap[cat] += (o.grandTotal || 0);
        categoryOrderCountMap[cat] += 1;
      }
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

  const monthName = months[selectedMonth];
  const formatMoney = (val) => `₹${(val || 0).toLocaleString('en-IN')}`;

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
          <div className="h-48 relative">
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
          <div className="h-48 relative">
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
          <div className="h-48 relative">
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
      <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 hover:shadow-xl transition-all duration-300">
        <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
          📊 Client Overview - {monthName} {selectedYear}
        </h3>
        
        <div className="h-64 mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData.categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} allowDecimals={false} />
              <RechartsTooltip cursor={{fill: '#f8fafc'}} content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={20} wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}} />
              <Bar dataKey="Orders" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <div className="flex justify-between items-center mb-6 px-2">
            <span className="font-black text-blue-600 text-lg">Total Clients: {filteredData.totalClients}</span>
            <span className="font-black text-blue-600 text-lg">Total Amount: {formatMoney(filteredData.totalOrderAmount)}</span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredData.categoryChartData.map(cat => (
              <div key={cat.category} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                <span className="font-bold text-slate-700 w-1/3">{cat.category}:</span>
                <span className="font-bold text-blue-500 w-1/3 text-center">{cat.Orders} orders</span>
                <span className="font-black text-emerald-600 w-1/3 text-right">{formatMoney(cat.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
