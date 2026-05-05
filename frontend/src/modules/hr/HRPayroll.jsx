import React from 'react';
import { DollarSign, Download, Plus, Search, FileText, TrendingUp, PiggyBank } from 'lucide-react';
import Badge from '../../components/ui/Badge';

const PAYROLL_DATA = [
  { id: 1, name: 'Alex Johnson', role: 'Sales Exec', base: 45000, incentive: 12500, deductions: 2500, status: 'Processed' },
  { id: 2, name: 'Priya Sharma', role: 'UI/UX Designer', base: 60000, incentive: 0, deductions: 3000, status: 'Pending' },
  { id: 3, name: 'Rahul Desai', role: 'Marketing Mgr', base: 85000, incentive: 8000, deductions: 4500, status: 'Processed' },
  { id: 4, name: 'Sneha Patel', role: 'Field Exec', base: 35000, incentive: 5500, deductions: 1500, status: 'Pending' },
];

const HRPayroll = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payroll & Compensation</h2>
          <p className="text-muted-foreground text-sm">Manage salaries, incentives, deductions, and payslips.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Run Payroll (April)
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Total Payroll</p>
          <h3 className="text-2xl font-bold">₹8,45,000</h3>
          <p className="text-xs text-muted-foreground mt-2">For 24 Active Employees</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-500" /> Total Incentives</p>
          <h3 className="text-2xl font-bold text-green-600">₹1,12,500</h3>
          <p className="text-xs text-muted-foreground mt-2">+14% vs last month</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2"><PiggyBank className="h-4 w-4 text-red-500" /> Deductions (TDS/PF)</p>
          <h3 className="text-2xl font-bold text-red-600">₹64,200</h3>
          <p className="text-xs text-muted-foreground mt-2">Standard calculations applied</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm border-blue-200 bg-blue-50/30">
          <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2"><FileText className="h-4 w-4 text-blue-500" /> Payslips Generated</p>
          <h3 className="text-2xl font-bold text-blue-700">18 / 24</h3>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-1.5"><div className="bg-blue-600 h-1.5 rounded-full" style={{width: '75%'}}></div></div>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/10 flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-semibold text-lg">Employee Salary Breakdown</h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input type="search" placeholder="Search employee..." className="h-9 w-64 rounded-md border bg-background pl-9 pr-4 text-sm outline-none focus:border-primary transition-colors" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-muted/30 border-b">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Employee</th>
                <th className="px-5 py-3 text-right font-medium">Base Salary</th>
                <th className="px-5 py-3 text-right font-medium text-green-600">Incentive</th>
                <th className="px-5 py-3 text-right font-medium text-red-500">Deductions</th>
                <th className="px-5 py-3 text-right font-medium">Net Salary</th>
                <th className="px-5 py-3 text-center font-medium">Status</th>
                <th className="px-5 py-3 text-center font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PAYROLL_DATA.map(p => {
                const net = p.base + p.incentive - p.deductions;
                return (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.role}</p>
                    </td>
                    <td className="px-5 py-4 text-right font-mono">₹{p.base.toLocaleString()}</td>
                    <td className="px-5 py-4 text-right font-mono text-green-600">₹{p.incentive.toLocaleString()}</td>
                    <td className="px-5 py-4 text-right font-mono text-red-500">₹{p.deductions.toLocaleString()}</td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-primary">₹{net.toLocaleString()}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${p.status === 'Processed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="Download Payslip">
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HRPayroll;
