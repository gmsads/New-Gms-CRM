import React from 'react';
import { Mail, Phone, MapPin, Briefcase } from 'lucide-react';

const OverviewTab = ({ client }) => {
  if (!client) return <div className="p-6 text-slate-500">No client data available.</div>;

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-slate-800">Client Profile</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Briefcase className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500">Company / Business Name</p>
              <p className="font-medium text-slate-900">{client.company || client.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500">Contact Number</p>
              <p className="font-medium text-slate-900">{client.phone}</p>
              {client.alternateMobile && <p className="text-sm text-slate-600">{client.alternateMobile} (Alt)</p>}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500">Email Address</p>
              <p className="font-medium text-slate-900">{client.email || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-500 mb-1">Tax Information</p>
            <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
              <p className="text-sm"><span className="font-medium">GST:</span> {client.gstNumber || 'N/A'}</p>
              <p className="text-sm"><span className="font-medium">PAN:</span> {client.panNumber || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500">Billing Address</p>
              <p className="text-sm text-slate-900 mt-1">
                {client.billingAddress?.line1 ? (
                  <>
                    {client.billingAddress.line1}<br/>
                    {client.billingAddress.city}, {client.billingAddress.state} - {client.billingAddress.pincode}
                  </>
                ) : 'No address provided'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
