import React, { useState, useEffect } from 'react';
import { 
  FileText, Send, Search, Filter, History, 
  Upload, CheckCircle, XCircle, MoreVertical,
  Plus, Download, ExternalLink, RefreshCw,
  Eye, MessageSquare, Phone, Image
} from 'lucide-react';
import { brochureApi } from '../../../services/api';

// ── Brochure Card Component ──────────────────────────────────────────────────
export const BrochureCard = ({ brochure, onSend }) => {
  return (
    <div className="bg-white rounded-[2rem] border overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        {brochure.thumbnailUrl ? (
          <img src={brochure.thumbnailUrl} alt={brochure.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="h-12 w-12 text-slate-300" />
          </div>
        )}
        <div className="absolute top-4 right-4 px-2 py-1 bg-white/90 backdrop-blur rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-900 border border-slate-100">
          {brochure.language}
        </div>
        {brochure.status === 'INACTIVE' && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">Inactive</span>
          </div>
        )}
      </div>
      
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="flex-1">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{brochure.category}</p>
          <h3 className="text-lg font-black text-slate-900 line-clamp-1">{brochure.title}</h3>
          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{brochure.description || 'No description provided.'}</p>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Version</span>
            <span className="text-xs font-black text-slate-900">v{brochure.version}</span>
          </div>
          <div className="flex items-center gap-2">
            <a href={brochure.fileUrl} target="_blank" rel="noreferrer" className="h-9 w-9 rounded-xl border flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
              <Eye className="h-4 w-4" />
            </a>
            <button 
              onClick={() => onSend(brochure)}
              disabled={brochure.status === 'INACTIVE'}
              className="h-9 px-4 bg-blue-600 text-white rounded-xl text-xs font-black flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
            >
              <Send className="h-3 w-3" /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Send Brochure Modal ──────────────────────────────────────────────────────
export const SendBrochureModal = ({ brochure, user, onClose, onSent, initialData }) => {
  const [formData, setFormData] = useState({ 
    clientPhone: initialData?.clientPhone || '', 
    clientName: initialData?.clientName || '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientPhone || formData.clientPhone.length < 10) return setError('Please enter a valid phone number');
    
    setLoading(true);
    setError(null);
    try {
      const res = await brochureApi.send({ 
        brochureId: brochure._id, 
        clientPhone: formData.clientPhone,
        clientName: formData.clientName,
        prospectId: initialData?.prospectId
      }, user.token);
      
      if (res.success) {
        // Trigger WhatsApp
        const text = `Hello ${formData.clientName || 'there'}! Please find our ${brochure.category} Catalog (${brochure.title}) here: ${brochure.fileUrl}. Regards, ${user?.name}`;
        window.open(`https://wa.me/${formData.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
        
        onSent(res.message);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-slate-900 p-8 text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
            <XCircle className="h-6 w-6" />
          </button>
          <div className="h-12 w-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-6">
            <MessageSquare className="h-6 w-6 text-blue-400" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Share Catalog</h2>
          <p className="text-slate-400 text-sm mt-2 font-medium">Send <span className="text-white font-bold">"{brochure.title}"</span> via WhatsApp</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
              <XCircle className="h-4 w-4" /> {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block px-1">Client Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  autoFocus
                  required
                  type="text" 
                  placeholder="e.g. 9876543210"
                  className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block px-1">Client Name (Optional)</label>
              <input 
                type="text" 
                placeholder="John Doe"
                className="w-full h-14 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4">
             <div className="bg-blue-50/50 rounded-2xl p-4 mb-6 border border-blue-100/50">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Message Preview</p>
                <p className="text-[10px] text-slate-600 leading-relaxed italic">
                  "Hello {formData.clientName || 'there'}! Please find the GMS {brochure.category} Catalog ({brochure.title}) attached here. Feel free to contact me for any queries. Regards, {user?.name}"
                </p>
             </div>

             <button 
               type="submit" 
               disabled={loading}
               className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-600 transition-all active:scale-95 shadow-xl disabled:opacity-50"
             >
               {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <><Send className="h-5 w-5" /> Send Catalog Now</>}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Brochure Manager (Admin/Manager View) ────────────────────────────────────
export const BrochureManager = ({ user }) => {
  const [brochures, setBrochures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [editingBrochure, setEditingBrochure] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await brochureApi.list({}, user.token);
      if (res.success) setBrochures(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleToggleStatus = async (brochure) => {
    const newStatus = brochure.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await brochureApi.update(brochure._id, { status: newStatus }, user.token);
      fetch();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this catalog? This cannot be undone.')) return;
    try {
      await brochureApi.delete(id, user.token);
      fetch();
    } catch (err) {
      alert('Failed to delete catalog');
    }
  };

  const openEdit = (b) => {
    setEditingBrochure(b);
    setShowUpload(true);
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Catalog Repository</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage, update, and track brochure performance</p>
        </div>
        <button onClick={() => { setEditingBrochure(null); setShowUpload(true); }} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl shadow-slate-200">
          <Upload className="h-5 w-5" /> Upload New Catalog
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <tr>
              <th className="p-6">Catalog ID</th>
              <th className="p-6">Title & Details</th>
              <th className="p-6">Category</th>
              <th className="p-6">Performance</th>
              <th className="p-6">Status</th>
              <th className="p-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {brochures.map(b => (
              <tr key={b._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-6 font-mono font-bold text-slate-400 text-xs">{b.brochureId}</td>
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      {b.thumbnailUrl ? <img src={b.thumbnailUrl} className="h-full w-full object-cover rounded-xl" /> : <FileText className="h-6 w-6 text-slate-300" />}
                    </div>
                    <div>
                      <p className="font-black text-slate-900">{b.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">Version v{b.version} · {b.language}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full">{b.category}</span>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-2">
                    <Send className="h-3 w-3 text-emerald-500" />
                    <span className="text-sm font-black text-slate-900">{b.sendCount}</span>
                    <span className="text-[10px] font-bold text-slate-400">shares</span>
                  </div>
                </td>
                <td className="p-6">
                  <button 
                    onClick={() => handleToggleStatus(b)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${b.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${b.status === 'ACTIVE' ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-slate-500">{b.status}</span>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-2">
                     <a href={b.fileUrl} target="_blank" rel="noreferrer" title="View" className="h-10 w-10 rounded-xl border flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><ExternalLink className="h-4 w-4" /></a>
                     <button onClick={() => openEdit(b)} title="Edit" className="h-10 w-10 rounded-xl border flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"><EditIcon /></button>
                     <button onClick={() => handleDelete(b._id)} title="Delete" className="h-10 w-10 rounded-xl border flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"><TrashIcon /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showUpload && <BrochureUploadModal user={user} initialData={editingBrochure} onClose={() => { setShowUpload(false); setEditingBrochure(null); }} onSaved={fetch} />}
    </div>
  );
};

// SVG icons since lucide Edit/Trash might not be imported in this file
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

// ── Brochure History Table ───────────────────────────────────────────────────
export const BrochureHistoryTable = ({ user }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await brochureApi.history(user.token);
      if (res.success) setHistory(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  if (loading) return <div className="flex h-48 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="bg-white rounded-[2.5rem] border overflow-hidden shadow-sm animate-in fade-in duration-500">
      <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="h-5 w-5 text-blue-600" />
          <h3 className="text-xl font-black text-slate-900">Recent Sharing Activity</h3>
        </div>
        <button onClick={fetch} className="h-10 w-10 rounded-xl border flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white transition-all"><RefreshCw className="h-4 w-4" /></button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-8 py-4">Recipient</th>
              <th className="px-8 py-4">Catalog Shared</th>
              <th className="px-8 py-4">Timestamp</th>
              <th className="px-8 py-4">Status</th>
              {['ADMIN', 'SALES_MANAGER'].includes(user.role) && <th className="px-8 py-4">Sent By</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.length === 0 ? (
               <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium italic">No recent sharing activity found.</td></tr>
            ) : history.map(h => (
              <tr key={h._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5">
                  <p className="font-bold text-slate-900">{h.clientPhone}</p>
                  <p className="text-[10px] font-medium text-slate-400">{h.clientName || 'Anonymous Client'}</p>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <FileText className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-black text-slate-700">{h.brochure?.title || 'Unknown Catalog'}</p>
                  </div>
                </td>
                <td className="px-8 py-5 text-xs font-bold text-slate-500">
                  {new Date(h.sentAt).toLocaleString()}
                </td>
                <td className="px-8 py-5">
                  <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${h.status === 'Sent' ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <CheckCircle className="h-3 w-3" /> {h.status}
                  </span>
                </td>
                {['ADMIN', 'SALES_MANAGER'].includes(user.role) && (
                  <td className="px-8 py-5 text-xs font-black text-blue-600">{h.sentBy?.name}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Brochure Upload Modal (Simplified for now) ──────────────────────────────
const BrochureUploadModal = ({ user, initialData, onClose, onSaved }) => {
  const isEdit = !!initialData;
  const [formData, setFormData] = useState({ 
    title: initialData?.title || '', 
    category: initialData?.category || 'Sign Boards', 
    fileUrl: initialData?.fileUrl || '', 
    thumbnailUrl: initialData?.thumbnailUrl || '', 
    description: initialData?.description || '', 
    language: initialData?.language || 'English' 
  });
  const [loading, setLoading] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'thumbnail') setUploadingThumbnail(true);
    else setUploadingFile(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'thumbnail') {
        setFormData(prev => ({ ...prev, thumbnailUrl: reader.result }));
        setUploadingThumbnail(false);
      } else {
        setFormData(prev => ({ ...prev, fileUrl: reader.result }));
        setUploadingFile(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fileUrl) return alert('Please upload a brochure file');
    setLoading(true);
    try {
      let res;
      if (isEdit) {
        res = await brochureApi.update(initialData._id, formData, user.token);
      } else {
        res = await brochureApi.create(formData, user.token);
      }
      if (res.success) {
        onSaved();
        onClose();
      }
    } catch (err) {
      alert(err.message || 'Error saving brochure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10 border-b bg-slate-50 flex justify-between items-center">
           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{isEdit ? 'Edit Catalog' : 'Upload Catalog'}</h2>
              <p className="text-slate-500 font-medium text-sm mt-1">{isEdit ? 'Update brochure details and file' : 'Publish a new brochure to the executive dashboard'}</p>
           </div>
           <button onClick={onClose} className="h-12 w-12 rounded-2xl bg-white border flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"><XCircle className="h-6 w-6" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 grid grid-cols-2 gap-8">
           <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Catalog Title *</label>
                <input required className="w-full h-12 px-4 rounded-xl border bg-slate-50 focus:bg-white transition-all outline-none font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Premium Sign Boards 2026" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Category *</label>
                <select className="w-full h-12 px-4 rounded-xl border bg-slate-50 outline-none font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option>Sign Boards</option><option>Flex Printing</option><option>LED Boards</option><option>Digital Marketing</option><option>Branding</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Language</label>
                <input className="w-full h-12 px-4 rounded-xl border bg-slate-50 outline-none font-bold" value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} />
              </div>
           </div>

           <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Brochure File (PDF/Image) {isEdit ? '' : '*'}</label>
                <div className="relative h-12">
                   <input 
                     type="file" 
                     accept=".pdf,image/*" 
                     onChange={(e) => handleFileChange(e, 'file')}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                   />
                   <div className={`h-full w-full border-2 border-dashed rounded-xl flex items-center px-4 gap-2 transition-colors ${formData.fileUrl ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                      {uploadingFile ? <RefreshCw className="h-4 w-4 animate-spin text-blue-500" /> : <Upload className={`h-4 w-4 ${formData.fileUrl ? 'text-emerald-500' : 'text-slate-400'}`} />}
                      <span className="text-xs font-bold text-slate-600 truncate">
                        {formData.fileUrl ? (formData.fileUrl.startsWith('data:') ? 'New file selected ✓' : 'Existing file ✓') : 'Choose brochure file...'}
                      </span>
                   </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Cover Thumbnail</label>
                <div className="relative h-24">
                   <input 
                     type="file" 
                     accept="image/*" 
                     onChange={(e) => handleFileChange(e, 'thumbnail')}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                   />
                   <div className={`h-full w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-1 transition-colors ${formData.thumbnailUrl ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
                      {formData.thumbnailUrl ? (
                        <img src={formData.thumbnailUrl} className="h-full w-full object-cover rounded-2xl" />
                      ) : (
                        <>
                          {uploadingThumbnail ? <RefreshCw className="h-5 w-5 animate-spin text-blue-500" /> : <Image className="h-5 w-5 text-slate-300" />}
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Click to upload</span>
                        </>
                      )}
                   </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Description</label>
                <textarea className="w-full h-20 p-4 rounded-xl border bg-slate-50 outline-none font-bold text-sm resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
           </div>

           <div className="col-span-2 pt-6">
              <button disabled={loading} type="submit" className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl">
                 {loading ? <RefreshCw className="h-6 w-6 animate-spin" /> : <><CheckCircle className="h-6 w-6" /> {isEdit ? 'Save Changes' : 'Publish Catalog'}</>}
              </button>
           </div>
        </form>
      </div>
    </div>
  );
};

// ── Brochure Selector Modal ──────────────────────────────────────────────────
export const BrochureSelectorModal = ({ user, onClose, onSelect }) => {
  const [brochures, setBrochures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    brochureApi.list({ status: 'ACTIVE' }, user.token).then(res => {
      if (res.success) setBrochures(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
        <div className="p-8 border-b bg-slate-50 flex justify-between items-center shrink-0">
           <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Select Catalog</h2>
              <p className="text-slate-500 font-medium text-sm">Choose a brochure to share with the client</p>
           </div>
           <button onClick={onClose} className="h-10 w-10 rounded-xl bg-white border flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"><XCircle className="h-6 w-6" /></button>
        </div>
        
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
           {loading ? (
             <div className="flex h-64 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>
           ) : brochures.length === 0 ? (
             <div className="text-center py-20 text-slate-400 italic">No active catalogs available.</div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {brochures.map(b => (
                 <div key={b._id} className="cursor-pointer group" onClick={() => onSelect(b)}>
                    <div className="bg-slate-50 rounded-[2rem] border overflow-hidden p-2 group-hover:bg-blue-50 transition-colors">
                      <BrochureCard brochure={b} onSend={() => onSelect(b)} />
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
