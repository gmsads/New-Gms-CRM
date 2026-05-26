import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Building2, MapPin, Wrench, IndianRupee, Clock, Star } from 'lucide-react';
import api from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';

const AddVendor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Basic
    name: '', contactNumber: '', alternateNumber: '', email: '', category: '', branch: 'HQ', status: 'Active',
    // Location
    baseLocation: '', city: '', workingAreas: '', address: '', pincode: '',
    // Service
    servicesOffered: '', teamSize: 1, vehicleCount: 0, workingCapacity: '', availabilityStatus: 'Available',
    // Financial
    baseCost: 0, costType: 'Per Day', gstNumber: '', paymentTerms: '',
    // Quality
    averageRating: 0, notes: ''
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/vendors/categories', user.token);
        setCategories(res.data.categories || []);
      } catch (err) { console.error(err); }
    };
    fetchCategories();
  }, [user.token]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Clean up arrays
      const payload = { ...formData };
      payload.workingAreas = formData.workingAreas.split(',').map(s => s.trim()).filter(Boolean);
      payload.servicesOffered = formData.servicesOffered.split(',').map(s => s.trim()).filter(Boolean);
      
      await api.post('/vendors', payload, user.token);
      alert('Vendor created successfully!');
      navigate('/vendors/list');
    } catch (error) {
      alert(error.message || 'Failed to create vendor');
    } finally {
      setLoading(false);
    }
  };

  const Section = ({ icon: Icon, title, children }) => (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm mb-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-black text-slate-800">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </div>
  );

  const Input = ({ label, name, type = 'text', required = false, placeholder = '' }) => (
    <div>
      <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">{label} {required && '*'}</label>
      <input type={type} name={name} value={formData[name]} onChange={handleChange} required={required} placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" />
    </div>
  );

  const Select = ({ label, name, options, required = false }) => (
    <div>
      <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">{label} {required && '*'}</label>
      <select name={name} value={formData[name]} onChange={handleChange} required={required}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors">
        <option value="">Select...</option>
        {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Add New Vendor</h2>
          <p className="text-sm font-bold text-slate-500 mt-1">Register a new campaign execution partner.</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/vendors/list')} className="px-6 py-3 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-2">
            <X className="h-4 w-4" /> Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading} className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2">
            <Save className="h-4 w-4" /> {loading ? 'Saving...' : 'Save Vendor'}
          </button>
        </div>
      </div>

      <form className="space-y-6">
        <Section icon={Building2} title="Basic Details">
          <Input label="Vendor Name" name="name" required placeholder="Company or Person Name" />
          <Input label="Contact Number" name="contactNumber" required placeholder="10-digit number" />
          <Input label="Alternate Number" name="alternateNumber" placeholder="Optional" />
          <Input label="Email Address" name="email" type="email" placeholder="vendor@example.com" />
          <Select label="Category" name="category" required options={categories.map(c => ({ label: c.name, value: c._id }))} />
          <Select label="Status" name="status" options={['Active', 'Inactive', 'Suspended']} />
        </Section>

        <Section icon={MapPin} title="Location Details">
          <Input label="Base Location" name="baseLocation" required placeholder="e.g. MG Road, Vijayawada" />
          <Input label="City" name="city" placeholder="e.g. Vijayawada" />
          <Input label="PIN Code" name="pincode" />
          <div className="col-span-full">
            <Input label="Working Areas (Comma Separated)" name="workingAreas" placeholder="e.g. Benz Circle, Patamata, Auto Nagar" />
          </div>
          <div className="col-span-full">
            <Input label="Full Address" name="address" placeholder="Complete address for records" />
          </div>
        </Section>

        <Section icon={Wrench} title="Service Capabilities">
          <div className="col-span-full">
            <Input label="Services Offered (Comma Separated)" name="servicesOffered" placeholder="e.g. Flex Printing, Wall Pasting, Pamphlet Distribution" />
          </div>
          <Input label="Team Size" name="teamSize" type="number" />
          <Input label="Vehicle Count" name="vehicleCount" type="number" />
          <Select label="Current Availability" name="availabilityStatus" options={['Available', 'Busy', 'On Leave', 'In Campaign', 'Maintenance']} />
        </Section>

        <Section icon={IndianRupee} title="Financial Details">
          <Input label="Base Cost (₹)" name="baseCost" type="number" />
          <Select label="Cost Type" name="costType" options={['Per Day', 'Per Campaign', 'Per KM', 'Fixed']} />
          <Input label="GST Number" name="gstNumber" placeholder="If applicable" />
          <div className="col-span-full">
            <Input label="Payment Terms" name="paymentTerms" placeholder="e.g. 50% Advance, 50% Post-Campaign" />
          </div>
        </Section>
        
        <Section icon={Star} title="Quality & Records">
          <Input label="Initial Rating (0-5)" name="averageRating" type="number" />
          <div className="col-span-full">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Internal Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"></textarea>
          </div>
        </Section>
      </form>
    </div>
  );
};

export default AddVendor;
