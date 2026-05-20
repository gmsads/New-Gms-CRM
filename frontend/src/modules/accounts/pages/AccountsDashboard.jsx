import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { CreditCard, IndianRupee, FileText, CheckCircle } from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';

const AccountsDashboard = () => {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value="₹0" icon={IndianRupee} color="green" />
        <StatCard title="Pending Invoices" value="0" icon={FileText} color="amber" />
        <StatCard title="Verified Payments" value="0" icon={CheckCircle} color="blue" />
        <StatCard title="Outstanding" value="₹0" icon={CreditCard} color="rose" />
      </div>
      
      <div className="rounded-[2rem] border bg-white p-8 text-center shadow-sm">
        <h3 className="text-xl font-bold">Financial Control Panel</h3>
        <p className="text-muted-foreground mt-2">Manage all incoming payments and client invoicing here.</p>
      </div>
    </div>
  );
};

export default AccountsDashboard;
