import React, { useState } from 'react';
import { MapPin, CheckCircle2, Clock, Plus, Truck, AlertCircle, X, Search, Camera, User, Phone as PhoneIcon, Building, Calendar as CalendarIcon, FileText } from 'lucide-react';
import useApi from '../hooks/useApi';
import EmptyState from '../components/ui/EmptyState';

const statusStyle = {
  Completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const priorityStyle = {
  High: 'text-red-500', Medium: 'text-yellow-500', Low: 'text-blue-500',
};

const typeColors = {
  Installation: 'bg-purple-100 text-purple-700', Survey: 'bg-cyan-100 text-cyan-700',
  Maintenance: 'bg-orange-100 text-orange-700', Shoot: 'bg-pink-100 text-pink-700', Visit: 'bg-indigo-100 text-indigo-700',
};

const TYPES = ['All', 'Installation', 'Survey', 'Maintenance', 'Shoot', 'Visit'];

const Field = () => {
  const { data, loading, error, refetch } = useApi('/visits');
  const [filter, setFilter] = useState('All');

  // Modals state
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [newVisitModalOpen, setNewVisitModalOpen] = useState(false);

  // Search state
  const [searchPhone, setSearchPhone] = useState('');
  const [searchCompany, setSearchCompany] = useState('');
  const [foundVisit, setFoundVisit] = useState(null);

  // New Visit Form state
  const [newVisitForm, setNewVisitForm] = useState({
    clientName: '',
    phone: '',
    businessName: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    purpose: 'Site Visit',
    notes: '',
  });

  const visits = data?.data || [];
  const filtered = visits.filter(v => filter === 'All' || v.visitType === filter);
  const completedCount = visits.filter(v => v.status === 'Completed').length;
  const inProgressCount = visits.filter(v => v.status === 'In Progress').length;

  const handleSearch = () => {
    if (!searchPhone && !searchCompany) return;
    
    // Check if visit exists for this phone or company (using generic match since 'visits' may have different structure)
    const match = visits.find(v => 
      (searchPhone && (v.phone?.includes(searchPhone) || v.clientPhone?.includes(searchPhone))) || 
      (searchCompany && (v.businessName?.toLowerCase().includes(searchCompany.toLowerCase()) || v.company?.toLowerCase().includes(searchCompany.toLowerCase())))
    );
    
    setSearchModalOpen(false);
    
    if (match) {
      setFoundVisit(match);
      setDetailsModalOpen(true);
    } else {
      setNewVisitForm(prev => ({ ...prev, phone: searchPhone, businessName: searchCompany, date: new Date().toISOString().split('T')[0] }));
      setNewVisitModalOpen(true);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setNewVisitForm(prev => ({
          ...prev,
          location: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
        }));
      }, () => {
        alert("Unable to retrieve your location.");
      });
    } else {
      alert("Geolocation not supported.");
    }
  };

  const handleScheduleVisit = (e) => {
    e.preventDefault();
    // Simulate API call to schedule visit
    alert("Visit Scheduled successfully!");
    setNewVisitModalOpen(false);
  };

  // Format date as dd-mm-yyyy for display
  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Field Operations</h1>
          <p className="text-muted-foreground">Track on-ground campaign activities and site visits.</p>
        </div>
        <button onClick={() => { setSearchPhone(''); setSearchCompany(''); setSearchModalOpen(true); }} className="inline-flex items-center justify-center rounded-md bg-[#003366] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#003366]/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
          <Plus className="mr-2 h-4 w-4" /> Add Visit
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : error ? (
        <div className="p-6 text-sm text-red-500 bg-red-50 rounded-xl border border-red-200">Error: {error}</div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid gap-4 grid-cols-3">
            {[
              { label: 'Total Tasks', value: visits.length, icon: Truck, color: 'bg-primary/10 text-primary' },
              { label: 'In Progress', value: inProgressCount, icon: Clock, color: 'bg-blue-100 text-blue-600' },
              { label: 'Completed', value: completedCount, icon: CheckCircle2, color: 'bg-green-100 text-green-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl border bg-card p-5 shadow-sm flex items-center gap-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${color}`}><Icon className="h-5 w-5" /></div>
                <div><p className="text-2xl font-bold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>
              </div>
            ))}
          </div>

          {/* Type Filters */}
          <div className="flex gap-2 flex-wrap">
            {TYPES.map(t => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${filter === t ? 'bg-[#003366] text-white border-[#003366] shadow-sm' : 'bg-background hover:bg-muted border-input text-muted-foreground'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Task Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(visit => (
              <div key={visit._id || Math.random()} className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col gap-4 group">
                <div className="flex items-start justify-between gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeColors[visit.visitType] || 'bg-muted text-muted-foreground'}`}>{visit.visitType || 'Visit'}</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[visit.status] || 'bg-muted text-muted-foreground'}`}>{visit.status}</span>
                </div>
                <div>
                  <h3 className="font-semibold leading-snug group-hover:text-[#003366] transition-colors">{visit.purpose || 'Field Visit'}</h3>
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />{visit.locationName || 'Unknown Location'}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm border-t pt-3">
                  <span className="text-muted-foreground flex items-center gap-1"><User className="h-3.5 w-3.5"/> {visit.assignedTo?.name || 'Unassigned'}</span>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{visit.scheduledDate ? new Date(visit.scheduledDate).toLocaleDateString() : 'No date'}</span>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full">
                <EmptyState icon={MapPin} title="No tasks found" description="Try a different filter or check back later." />
              </div>
            )}
          </div>
        </>
      )}

      {/* --- Search Visit Modal --- */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white shadow-2xl overflow-hidden p-8 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setSearchModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition-colors bg-slate-100 hover:bg-slate-200 rounded-full p-1.5">
              <X className="h-5 w-5" />
            </button>
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Search className="h-7 w-7" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-8 text-slate-900 tracking-tight">Search Visit</h2>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2"><PhoneIcon className="h-4 w-4 text-slate-400" /> 10-Digit Mobile Number</label>
                <input
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="Enter mobile number"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/20 transition-all"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs font-medium uppercase">
                  <span className="bg-white px-3 text-slate-400">Or</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2"><Building className="h-4 w-4 text-slate-400" /> Business Name</label>
                <input
                  value={searchCompany}
                  onChange={(e) => setSearchCompany(e.target.value)}
                  placeholder="Enter business name"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/20 transition-all"
                />
              </div>
              <button onClick={handleSearch} className="w-full h-12 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg hover:opacity-90 active:scale-[0.98] mt-2" style={{ background: "linear-gradient(135deg, #003366 0%, #004080 100%)" }}>
                Search Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Visit Details Modal (Found Visit) --- */}
      {detailsModalOpen && foundVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-white shadow-2xl overflow-hidden p-8 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setDetailsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition-colors bg-slate-100 hover:bg-slate-200 rounded-full p-1.5">
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="h-14 w-14 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Visit Record Found</h2>
                <p className="text-sm text-muted-foreground mt-1">Existing details for {searchPhone || searchCompany}</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Business Name</p>
                  <p className="text-sm font-medium text-slate-900">{foundVisit.businessName || foundVisit.company || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone</p>
                  <p className="text-sm font-medium text-slate-900">{foundVisit.phone || foundVisit.clientPhone || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date Scheduled</p>
                  <p className="text-sm font-medium text-slate-900">{foundVisit.scheduledDate ? new Date(foundVisit.scheduledDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Purpose</p>
                  <p className="text-sm font-medium text-slate-900">{foundVisit.purpose || foundVisit.visitType || 'N/A'}</p>
                </div>
                <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Location</p>
                  <p className="text-sm font-medium text-slate-900 flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400"/> {foundVisit.locationName || foundVisit.location || 'N/A'}</p>
                </div>
              </div>
            </div>
            <button onClick={() => setDetailsModalOpen(false)} className="w-full h-12 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors shadow-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* --- New Visit Modal --- */}
      {newVisitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 tracking-tight"><Plus className="h-5 w-5 text-blue-600"/> Schedule New Visit</h2>
                <p className="text-sm text-muted-foreground mt-1">Fill out the details below to log a new field visit.</p>
              </div>
              <button onClick={() => setNewVisitModalOpen(false)} className="text-slate-400 hover:text-slate-800 transition-colors bg-white hover:bg-slate-200 rounded-full p-2 shadow-sm border border-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleVisit} className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Client Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input required value={newVisitForm.clientName} onChange={e => setNewVisitForm({...newVisitForm, clientName: e.target.value})} placeholder="Enter client name" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/20 transition-all shadow-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Phone Number</label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input required value={newVisitForm.phone} onChange={e => setNewVisitForm({...newVisitForm, phone: e.target.value})} placeholder="10-digit number" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/20 transition-all shadow-sm" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Business Name</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input required value={newVisitForm.businessName} onChange={e => setNewVisitForm({...newVisitForm, businessName: e.target.value})} placeholder="Company or shop name" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/20 transition-all shadow-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block flex justify-between">Date 
                    <span className="text-xs font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{formatDateDisplay(newVisitForm.date)}</span>
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input type="date" required value={newVisitForm.date} onChange={e => setNewVisitForm({...newVisitForm, date: e.target.value})} className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/20 transition-all shadow-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Purpose</label>
                  <select value={newVisitForm.purpose} onChange={e => setNewVisitForm({...newVisitForm, purpose: e.target.value})} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/20 transition-all shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:0.7rem]">
                    <option value="Site Visit">Site Visit</option>
                    <option value="Installation">Installation</option>
                    <option value="Survey">Survey</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Meeting">Meeting</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Location</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input required value={newVisitForm.location} onChange={e => setNewVisitForm({...newVisitForm, location: e.target.value})} placeholder="Address or Coordinates" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/20 transition-all shadow-sm" />
                  </div>
                  <button type="button" onClick={handleGetLocation} className="h-11 px-4 rounded-xl border-2 border-blue-100 bg-blue-50 text-blue-700 font-semibold text-sm hover:bg-blue-100 transition-colors flex items-center gap-2 shrink-0">
                    <MapPin className="h-4 w-4" /> Get Location
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Visit Photo</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Camera className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Click to upload or capture photo</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                  <input type="file" accept="image/*" capture="environment" className="hidden" id="visit-photo-upload" />
                  <label htmlFor="visit-photo-upload" className="absolute inset-0 cursor-pointer"></label>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block flex items-center gap-2"><FileText className="h-4 w-4 text-slate-400"/> Notes (Optional)</label>
                <textarea rows={3} value={newVisitForm.notes} onChange={e => setNewVisitForm({...newVisitForm, notes: e.target.value})} placeholder="Any additional remarks..." className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/20 transition-all shadow-sm resize-none custom-scrollbar" />
              </div>
            </form>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
              <button type="button" onClick={() => setNewVisitModalOpen(false)} className="h-12 flex-1 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors shadow-sm">
                Cancel
              </button>
              <button type="submit" onClick={handleScheduleVisit} className="h-12 flex-1 rounded-xl text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex justify-center items-center gap-2" style={{ background: "linear-gradient(135deg, #003366 0%, #004080 100%)" }}>
                <CheckCircle2 className="h-5 w-5" /> Schedule Visit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Field;

