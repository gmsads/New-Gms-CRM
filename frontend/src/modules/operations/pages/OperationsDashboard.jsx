import React, { useState, useRef, useEffect } from 'react';
import { MapPin, CheckCircle2, Clock, Plus, Truck, AlertCircle, RefreshCw, Filter, X, Search, Camera, User, Phone as PhoneIcon, Building, Calendar as CalendarIcon, FileText, MessageCircle, MoreVertical } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import useApi from '../../../hooks/useApi';

const statusStyle = {
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-100',
  Pending: 'bg-amber-50 text-amber-700 border-amber-100',
};

const typeColors = {
  Installation: 'bg-purple-50 text-purple-700 border-purple-100',
  Survey: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  Maintenance: 'bg-orange-50 text-orange-700 border-orange-100',
  Shoot: 'bg-pink-50 text-pink-700 border-pink-100',
  Visit: 'bg-indigo-50 text-indigo-700 border-indigo-100',
};

const TYPES = ['All', 'Installation', 'Survey', 'Maintenance', 'Shoot', 'Visit'];

const OperationsDashboard = () => {
  const { user } = useAuth();
  const { data, loading, error, refetch, request } = useApi('/visits');
  const [filter, setFilter] = useState('All');

  // Modals state
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [newVisitModalOpen, setNewVisitModalOpen] = useState(false);

  // Search state
  const [searchPhone, setSearchPhone] = useState('');
  const [searchCompany, setSearchCompany] = useState('');
  const [foundVisit, setFoundVisit] = useState(null);
  const [searchError, setSearchError] = useState('');

  // New Visit Form state
  const [newVisitForm, setNewVisitForm] = useState({
    clientName: '',
    phone: '',
    businessName: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    purpose: '',
    remark: '',
    status: 'follow-up',
    followUpDate: '',
    photo: null,
  });
  const [photoPreview, setPhotoPreview] = useState(null);

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!newVisitModalOpen) {
      stopCamera();
    }
  }, [newVisitModalOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Unable to access camera. Please allow camera permissions in your browser.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      
      const dataUrl = canvasRef.current.toDataURL('image/jpeg');
      setPhotoPreview(dataUrl);
      
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "visit_photo.jpg", { type: "image/jpeg" });
          setNewVisitForm(prev => ({ ...prev, photo: file }));
        });
        
      stopCamera();
    }
  };

  const currentDate = new Date();
  const [yearFilter, setYearFilter] = useState(currentDate.getFullYear().toString());
  const [monthFilter, setMonthFilter] = useState((currentDate.getMonth() + 1).toString().padStart(2, '0'));

  const visits = data?.data || [];
  
  const filtered = visits.filter(v => {
    if (!v.scheduledDate) return yearFilter === 'All' && monthFilter === 'All';
    const vDate = new Date(v.scheduledDate);
    if (isNaN(vDate.getTime())) return yearFilter === 'All' && monthFilter === 'All';
    
    const matchYear = yearFilter === 'All' || vDate.getFullYear().toString() === yearFilter;
    const matchMonth = monthFilter === 'All' || (vDate.getMonth() + 1).toString().padStart(2, '0') === monthFilter;
    
    return matchYear && matchMonth;
  });

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setSearchError('');

    if (!searchPhone) {
      setSearchError('10-Digit Mobile Number is required');
      return;
    }
    if (searchPhone.length !== 10) {
      setSearchError('Mobile Number must be exactly 10 digits');
      return;
    }
    if (!searchCompany.trim()) {
      setSearchError('Business Name is required');
      return;
    }
    
    // Check if visit exists for this phone or company (using generic match since 'visits' may have different structure)
    const match = visits.find(v => 
      (v.phone?.includes(searchPhone) || v.clientPhone?.includes(searchPhone)) || 
      (v.businessName?.toLowerCase().includes(searchCompany.toLowerCase()) || v.company?.toLowerCase().includes(searchCompany.toLowerCase()))
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
      // Show loading state immediately
      setNewVisitForm(prev => ({ ...prev, location: 'Fetching address...' }));
      
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        try {
          // Using BigDataCloud's free client-side reverse geocoding API
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
          const data = await response.json();
          
          const addressParts = [data.locality, data.principalSubdivision, data.countryName].filter(Boolean);
          const locationName = addressParts.length > 0 ? addressParts.join(', ') : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          
          setNewVisitForm(prev => ({
            ...prev,
            location: locationName
          }));
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          setNewVisitForm(prev => ({
            ...prev,
            location: `${lat.toFixed(4)}, ${lon.toFixed(4)}`
          }));
        }
      }, () => {
        setNewVisitForm(prev => ({ ...prev, location: '' }));
        alert("Unable to retrieve your location. Please allow location access in your browser.");
      });
    } else {
      alert("Geolocation not supported.");
    }
  };

  const handleScheduleVisit = async (e) => {
    e.preventDefault();
    if (!newVisitForm.location) {
      alert("Location is required. Please click 'Get Location'.");
      return;
    }
    if (!newVisitForm.photo) {
      alert("Visit Photo is required. Please capture a photo.");
      return;
    }
    
    try {
      // Because photo is a File object, we'll convert it to base64 or a URL for the backend if needed.
      // But since useApi serializes body to JSON, we will skip the raw file for now or send as a string.
      // Usually, images would go to an S3 bucket or multer formData, but for JSON payload, we omit raw files.
      const payload = {
        title: `Visit for ${newVisitForm.businessName}`,
        businessName: newVisitForm.businessName,
        clientName: newVisitForm.clientName,
        phone: newVisitForm.phone,
        location: newVisitForm.location,
        purpose: newVisitForm.purpose,
        remark: newVisitForm.remark,
        status: newVisitForm.status,
        followUpDate: newVisitForm.followUpDate || undefined,
        scheduledDate: newVisitForm.date,
        // photo processing skipped for JSON body - S3 URL logic usually goes here
        assignedTo: user?.id || user?._id // Add assigned user to show in the table
      };
      
      await request('POST', '/visits', payload);
      alert("Visit Scheduled successfully!");
      setNewVisitModalOpen(false);
      setPhotoPreview(null);
      refetch(); // Reload the table data
    } catch (err) {
      alert("Failed to schedule visit: " + err.message);
    }
  };

  // Format date as dd-mm-yyyy for display
  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      <div className="py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{user?.name?.split(' ')[0] || 'Manager'}!</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium mt-2 italic">
            "Seamless operations are the backbone of success. Keep the gears turning."
          </p>
        </div>
        <div className="flex gap-3">
           <button onClick={() => refetch()} className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
             <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
             Sync
           </button>
           <button onClick={() => { setSearchPhone(''); setSearchCompany(''); setSearchModalOpen(true); }} className="h-10 px-6 rounded-xl text-white text-sm font-bold shadow-lg shadow-blue-900/20 hover:opacity-90 transition-all active:scale-95 flex items-center gap-2" style={{ background: "linear-gradient(135deg, #003366 0%, #004080 100%)" }}>
             <Plus className="h-4 w-4" /> Add Visit
           </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex h-96 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : error ? (
        <div className="p-6 text-sm text-red-500 bg-red-50 rounded-xl border border-red-200">Error loading operations: {error}</div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Visit Collections</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Manage and track your field operations</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select 
                value={yearFilter} 
                onChange={e => setYearFilter(e.target.value)}
                className="h-10 px-4 flex-1 sm:flex-none rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/20 transition-all shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.8rem_center] bg-[length:0.6rem] pr-8"
              >
                <option value="All">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
              <select 
                value={monthFilter} 
                onChange={e => setMonthFilter(e.target.value)}
                className="h-10 px-4 flex-1 sm:flex-none rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/20 transition-all shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.8rem_center] bg-[length:0.6rem] pr-8"
              >
                <option value="All">All Months</option>
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Business Details</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Visit Info</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Outcome / Remark</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length > 0 ? filtered.map(visit => (
                  <tr key={visit._id || Math.random()} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <p className="text-sm font-black text-slate-900 group-hover:text-[#003366] transition-colors">{visit.businessName || visit.company || 'Unknown'}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-xs font-bold text-slate-500">{visit.phone || visit.clientPhone || 'No Phone'}</p>
                        {(visit.phone || visit.clientPhone) && (
                          <div className="flex items-center gap-1.5">
                            <a href={`tel:${visit.phone || visit.clientPhone}`} className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors shadow-sm" title="Call">
                              <PhoneIcon className="h-3 w-3" />
                            </a>
                            <a href={`https://wa.me/${(visit.phone || visit.clientPhone).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors shadow-sm" title="WhatsApp">
                              <MessageCircle className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">{visit.locationName || visit.location || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5 text-slate-400"/> {visit.scheduledDate ? new Date(visit.scheduledDate).toLocaleDateString() : 'N/A'}</p>
                      <p className="text-xs font-bold text-slate-500 mt-1">{visit.purpose || visit.visitType || 'Visit'}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-bold text-slate-800 line-clamp-2">{visit.remark || visit.notes || 'No remarks added.'}</p>
                      {visit.followUpDate && (
                        <div className="inline-flex items-center gap-1.5 mt-1.5 text-[#003366] bg-[#003366]/5 px-2 py-1 rounded border border-[#003366]/10 text-[10px] font-black uppercase tracking-widest">
                          <Clock className="h-3 w-3" /> Next Follow-up: {new Date(visit.followUpDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${statusStyle[visit.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {visit.status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="h-8 w-8 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-[#003366] hover:bg-slate-100 transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="py-20 text-center">
                      <div className="mx-auto w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 mb-4 shadow-sm">
                        <Truck className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="text-sm font-black text-slate-500 uppercase tracking-[0.15em]">No Visits Found</p>
                      <p className="text-xs font-bold text-slate-400 mt-2 max-w-sm mx-auto">We couldn't find any visits matching your selected year and month. Adjust filters or schedule a new one.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- Search Visit Modal --- */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-xl border bg-white shadow-2xl overflow-hidden p-8 relative">
            <button onClick={() => setSearchModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold text-center mb-6 text-slate-900">Search Visit</h2>
            {searchError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg">
                {searchError}
              </div>
            )}
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-800 mb-2 block">10-Digit Mobile Number:</label>
                <input 
                  value={searchPhone} 
                  onChange={e => {
                    setSearchError('');
                    setSearchPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                  }} 
                  placeholder="Enter mobile number" 
                  className="h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#003366]" 
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-800 mb-2 block">Business Name:</label>
                <input 
                  value={searchCompany} 
                  onChange={e => {
                    setSearchError('');
                    setSearchCompany(e.target.value);
                  }} 
                  placeholder="Enter business name" 
                  className="h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#003366]" 
                />
              </div>
              <button
                type="submit"
                className="w-full h-10 rounded text-white font-semibold text-sm transition-colors hover:opacity-90 mt-2"
                style={{ background: '#003366' }}
              >
                Search
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- Visit Details Modal (Found Visit) --- */}
      {detailsModalOpen && foundVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-white shadow-2xl overflow-hidden p-8 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setDetailsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition-colors bg-slate-100 hover:bg-slate-200 rounded-full p-1.5">
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Visit Record Found</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">Existing details for <span className="font-bold text-slate-700">{searchPhone || searchCompany}</span></p>
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Business Name</p>
                  <p className="text-sm font-black text-slate-900">{foundVisit.businessName || foundVisit.company || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                  <p className="text-sm font-black text-slate-900">{foundVisit.phone || foundVisit.clientPhone || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Scheduled</p>
                  <p className="text-sm font-black text-slate-900">{foundVisit.scheduledDate ? new Date(foundVisit.scheduledDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Purpose</p>
                  <p className="text-sm font-black text-slate-900">{foundVisit.purpose || foundVisit.visitType || 'N/A'}</p>
                </div>
                <div className="col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
                  <p className="text-sm font-black text-slate-900 flex items-center gap-2"><MapPin className="h-4 w-4 text-[#003366]/60"/> {foundVisit.locationName || foundVisit.location || 'N/A'}</p>
                </div>
              </div>
            </div>
            <button onClick={() => setDetailsModalOpen(false)} className="w-full h-12 rounded-2xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* --- New Visit Modal --- */}
      {newVisitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-3xl rounded-[2rem] border border-white/20 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ background: "linear-gradient(135deg, #003366 0%, #004080 100%)" }}>
                    <Plus className="h-5 w-5" />
                  </div>
                  Schedule New Visit
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-1 pl-[52px]">Enter the details to schedule a new field visit.</p>
              </div>
              <button onClick={() => setNewVisitModalOpen(false)} className="text-slate-400 hover:text-slate-800 transition-colors bg-white hover:bg-slate-100 rounded-full p-2.5 shadow-sm border border-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleVisit} className="p-8 flex-1 overflow-y-auto custom-scrollbar bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-2 block">Client Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
                      <input required value={newVisitForm.clientName} onChange={e => setNewVisitForm({...newVisitForm, clientName: e.target.value})} placeholder="Enter client name" className="h-12 w-full rounded-xl border-2 border-slate-100 bg-white pl-11 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-[#003366] transition-all hover:border-slate-200" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-2 block">Phone Number</label>
                    <div className="relative group">
                      <PhoneIcon className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
                      <input required value={newVisitForm.phone} onChange={e => setNewVisitForm({...newVisitForm, phone: e.target.value})} placeholder="10-digit number" className="h-12 w-full rounded-xl border-2 border-slate-100 bg-white pl-11 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-[#003366] transition-all hover:border-slate-200" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-2 block">Business Name</label>
                    <div className="relative group">
                      <Building className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
                      <input required value={newVisitForm.businessName} onChange={e => setNewVisitForm({...newVisitForm, businessName: e.target.value})} placeholder="Company or shop name" className="h-12 w-full rounded-xl border-2 border-slate-100 bg-white pl-11 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-[#003366] transition-all hover:border-slate-200" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-2 flex justify-between items-center">
                      Date 
                      <span className="text-xs font-black text-[#003366] bg-[#003366]/5 px-2.5 py-1 rounded-lg border border-[#003366]/10">{formatDateDisplay(newVisitForm.date)}</span>
                    </label>
                    <div className="relative group">
                      <CalendarIcon className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
                      <input type="date" required value={newVisitForm.date} onChange={e => setNewVisitForm({...newVisitForm, date: e.target.value})} className="h-12 w-full rounded-xl border-2 border-slate-100 bg-white pl-11 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-[#003366] transition-all hover:border-slate-200" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-2 block">Purpose</label>
                    <div className="relative group">
                      <FileText className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
                      <input required type="text" value={newVisitForm.purpose} onChange={e => setNewVisitForm({...newVisitForm, purpose: e.target.value})} placeholder="e.g. Site Visit, Installation" className="h-12 w-full rounded-xl border-2 border-slate-100 bg-white pl-11 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-[#003366] transition-all hover:border-slate-200" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-2 block">Location</label>
                    <div className="flex gap-3">
                      <div className={`relative flex-1 rounded-xl border-2 flex items-center px-4 ${newVisitForm.location ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                        <MapPin className={`absolute left-4 top-3.5 h-4 w-4 ${newVisitForm.location ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <span className={`text-sm font-bold pl-7 truncate ${newVisitForm.location ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {newVisitForm.location || 'Click Get to fetch location'}
                        </span>
                      </div>
                      <button type="button" onClick={handleGetLocation} className="h-12 px-5 rounded-xl border-2 border-[#003366]/20 bg-[#003366]/5 text-[#003366] font-bold text-sm hover:border-[#003366] hover:text-[#003366] transition-all flex items-center gap-2 shrink-0">
                        <MapPin className="h-4 w-4" /> Get
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-2 block">Visit Photo</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-[1.5rem] p-4 text-center hover:bg-slate-50 hover:border-[#003366]/40 transition-all group bg-slate-50/50 relative overflow-hidden flex flex-col items-center justify-center min-h-[160px]">
                    {isCameraOpen ? (
                      <div className="absolute inset-0 z-20 bg-black flex flex-col items-center justify-center">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <button type="button" onClick={capturePhoto} className="absolute bottom-4 h-12 w-12 bg-white rounded-full border-4 border-slate-300 shadow-lg active:scale-95 transition-transform" />
                        <button type="button" onClick={stopCamera} className="absolute top-2 right-2 text-white bg-black/50 p-1.5 rounded-full hover:bg-black/80">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : photoPreview ? (
                      <img src={photoPreview} alt="Captured" className="w-full h-full object-cover absolute inset-0 z-0 opacity-40 group-hover:opacity-20 transition-opacity" />
                    ) : null}

                    <div className="relative z-10 flex flex-col items-center w-full">
                      <button type="button" onClick={startCamera} className={`h-16 w-16 rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 border transition-transform group-hover:scale-110 ${photoPreview ? 'bg-white/90 text-emerald-600 border-emerald-100' : 'bg-white text-[#003366] border-slate-100'}`}>
                        {photoPreview ? <CheckCircle2 className="h-7 w-7" /> : <Camera className="h-7 w-7" />}
                      </button>
                      <p className="text-sm font-black text-slate-800 mb-1">{photoPreview ? 'Retake Photo' : 'Click to open camera'}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Required</p>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                </div>

                <div>
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-2 block">Status *</label>
                      <select required value={newVisitForm.status} onChange={e => setNewVisitForm({...newVisitForm, status: e.target.value})} className="h-12 w-full rounded-[1rem] border-2 border-slate-100 bg-white px-4 text-sm font-bold text-slate-800 outline-none focus:border-[#003366] transition-all hover:border-slate-200 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:0.7rem]">
                        <option value="follow-up">Follow-up</option>
                        <option value="order confirmed">Order Confirmed</option>
                        <option value="not-interested">Not Interested</option>
                      </select>
                    </div>

                    {newVisitForm.status === 'follow-up' && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                          Next Follow-up Date *
                        </label>
                        <div className="relative group">
                          <CalendarIcon className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
                          <input type="date" required value={newVisitForm.followUpDate} onChange={e => setNewVisitForm({...newVisitForm, followUpDate: e.target.value})} className="h-12 w-full rounded-[1rem] border-2 border-slate-100 bg-white pl-11 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-[#003366] transition-all hover:border-slate-200" />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-2 block flex items-center gap-2"><FileText className="h-4 w-4 text-slate-400"/> Remark</label>
                      <textarea rows={newVisitForm.status === 'follow-up' ? 2 : 4} value={newVisitForm.remark} onChange={e => setNewVisitForm({...newVisitForm, remark: e.target.value})} placeholder="Enter remarks..." className="w-full rounded-[1rem] border-2 border-slate-100 bg-white p-5 text-sm font-bold text-slate-800 outline-none focus:border-[#003366] transition-all hover:border-slate-200 resize-none custom-scrollbar" />
                    </div>
                  </div>
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4 shrink-0 justify-end">
              <button type="button" onClick={() => setNewVisitModalOpen(false)} className="h-12 px-8 rounded-xl border-2 border-slate-200 bg-white text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors">
                Cancel
              </button>
              <button type="submit" onClick={handleScheduleVisit} className="h-12 px-10 rounded-xl text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-blue-900/20 flex items-center gap-2" style={{ background: "linear-gradient(135deg, #003366 0%, #004080 100%)" }}>
                <CheckCircle2 className="h-5 w-5" /> Schedule Visit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsDashboard;

