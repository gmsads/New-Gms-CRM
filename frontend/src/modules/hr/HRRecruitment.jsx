import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, FileText, Calendar, CheckCircle, XCircle, Users, Briefcase, ChevronRight, Inbox } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import useApi from '../../hooks/useApi';

const STAGES = [
  { id: 'APPLIED', label: 'Applied', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'SCREENING', label: 'Screening', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'INTERVIEW_COMPLETED', label: 'Interview Completed', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'SELECTED', label: 'Selected', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'OFFER_SENT', label: 'Offer Sent', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'JOINED', label: 'Joined', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { id: 'REJECTED', label: 'Rejected', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

const AddJobModal = ({ onClose, onRefresh }) => {
  const { request } = useApi();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', department: '', role: '', vacancies: 1, experience: '', salaryRange: '', location: 'On-site'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await request('POST', '/hr-recruitment/jobs', form);
      onRefresh();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Create Job Opening" size="2xl">
      <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-slate-50">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Job Title *</label>
            <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Role *</label>
            <input required value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Department *</label>
            <input required value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Vacancies *</label>
            <input type="number" min="1" required value={form.vacancies} onChange={e => setForm({...form, vacancies: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Experience Req. *</label>
            <input required placeholder="e.g. 2-4 Years" value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Salary Range</label>
            <input placeholder="e.g. 50k - 80k" value={form.salaryRange} onChange={e => setForm({...form, salaryRange: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-600 hover:bg-white transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Job Opening'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const AddCandidateModal = ({ onClose, onRefresh, jobs }) => {
  const { request } = useApi();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', experience: '', appliedPosition: '', source: 'Direct'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await request('POST', '/hr-recruitment/candidates', form);
      onRefresh();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Add Candidate" size="2xl">
      <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-slate-50">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Candidate Name *</label>
            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Phone *</label>
            <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Email *</label>
            <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Experience</label>
            <input value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Applied Position *</label>
            <select required value={form.appliedPosition} onChange={e => setForm({...form, appliedPosition: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none bg-white">
              <option value="">Select a Job Opening...</option>
              {jobs.map(j => (
                <option key={j._id} value={j._id}>{j.title} ({j.department})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-600 hover:bg-white transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {loading ? 'Adding...' : 'Add Candidate'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const HRRecruitment = () => {
  const { data: jobs, refetch: fetchJobs, loading: jobsLoading } = useApi('/hr-recruitment/jobs');
  const { data: candidates, refetch: fetchCandidates, request } = useApi('/hr-recruitment/candidates');
  
  const [modal, setModal] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragStart = (e, candidateId) => {
    setDraggedItem(candidateId);
    e.dataTransfer.setData('text/plain', candidateId);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, stageId) => {
    e.preventDefault();
    const candidateId = e.dataTransfer.getData('text/plain');
    if (!candidateId) return;

    // Optimistically update UI
    const candidate = candidates?.find(c => c._id === candidateId);
    if (candidate && candidate.status !== stageId) {
      try {
        await request('PUT', \`/hr-recruitment/candidates/\${candidateId}\`, { status: stageId });
        fetchCandidates();
      } catch (err) {
        alert('Failed to update stage: ' + err.message);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 shrink-0 bg-white border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Recruitment Pipeline</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Manage job openings and candidate progression.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setModal('ADD_JOB')} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-sm">
            <Briefcase className="h-4 w-4" /> Post Job
          </button>
          <button onClick={() => setModal('ADD_CANDIDATE')} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-600 transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Add Candidate
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Kanban Board */}
        <div className="flex-1 flex gap-4 overflow-x-auto p-6 items-start h-full pb-8">
          {STAGES.map(stage => {
            const stageCandidates = (candidates || []).filter(c => c.status === stage.id);
            return (
              <div 
                key={stage.id} 
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
                className="flex-shrink-0 w-80 flex flex-col rounded-2xl bg-slate-100/50 border border-slate-200 h-full max-h-full overflow-hidden"
              >
                <div className={\`p-4 border-b flex items-center justify-between \${stage.color} rounded-t-2xl shrink-0\`}>
                  <h3 className="font-bold text-sm">{stage.label}</h3>
                  <span className="bg-white/50 px-2.5 py-0.5 rounded-full text-xs font-black shadow-sm">
                    {stageCandidates.length}
                  </span>
                </div>
                
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {stageCandidates.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-slate-400 text-sm font-medium border-2 border-dashed border-slate-200 rounded-xl">
                      Drop Here
                    </div>
                  )}
                  {stageCandidates.map(c => (
                    <div 
                      key={c._id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, c._id)}
                      onDragEnd={handleDragEnd}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm shrink-0">
                            {c.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 leading-tight">{c.name}</h4>
                            <p className="text-xs font-semibold text-indigo-600 mt-1 flex items-center gap-1">
                              {c.appliedPosition?.title || 'Unknown Position'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded">
                          <Briefcase className="h-3 w-3" /> {c.experience || 'Fresher'}
                        </div>
                        <Badge value={c.source} variant="secondary" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modal === 'ADD_JOB' && <AddJobModal onClose={() => setModal(null)} onRefresh={fetchJobs} />}
      {modal === 'ADD_CANDIDATE' && <AddCandidateModal onClose={() => setModal(null)} onRefresh={fetchCandidates} jobs={jobs || []} />}
    </div>
  );
};

export default HRRecruitment;
