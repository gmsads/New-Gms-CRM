import React, { useState } from 'react';
import { Search, Plus, MoreVertical, Filter, Download } from 'lucide-react';

const mockClients = [
  { id: 1, name: 'Acme Corp', contact: 'John Smith', email: 'john@acme.com', status: 'Active', spend: '$12,500' },
  { id: 2, name: 'Global Tech', contact: 'Sarah Jones', email: 'sarah@globaltech.com', status: 'Onboarding', spend: '$0' },
  { id: 3, name: 'Stark Industries', contact: 'Tony Stark', email: 'tony@stark.com', status: 'Active', spend: '$45,000' },
  { id: 4, name: 'Wayne Enterprises', contact: 'Bruce Wayne', email: 'bruce@wayne.com', status: 'Lead', spend: '$0' },
  { id: 5, name: 'Umbrella Corp', contact: 'Albert Wesker', email: 'albert@umbrella.com', status: 'Churned', spend: '$5,200' },
];

const getStatusColor = (status) => {
  switch (status) {
    case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'Onboarding': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'Lead': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'Churned': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = mockClients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients & Leads</h1>
          <p className="text-muted-foreground">Manage your agency's client portfolio.</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="mr-2 h-4 w-4" /> Add Client
        </button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between bg-muted/10">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </button>
            <button className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
              <Download className="mr-2 h-4 w-4" /> Export
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Company Name</th>
                <th scope="col" className="px-6 py-3 font-medium">Primary Contact</th>
                <th scope="col" className="px-6 py-3 font-medium">Status</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Total Spend</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredClients.map((client) => (
                <tr key={client.id} className="bg-card hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{client.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span>{client.contact}</span>
                      <span className="text-xs text-muted-foreground">{client.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(client.status)}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">{client.spend}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-muted-foreground hover:text-foreground">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                    No clients found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Clients;
