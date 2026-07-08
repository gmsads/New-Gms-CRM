import React, { useState } from 'react';
import { 
  Briefcase, Users, Calendar, FileCheck, Plus, Search, Edit, XSquare, 
  UserPlus, Mail, Phone, Link as LinkIcon, Inbox 
} from 'lucide-react';
import useApi from '../../../hooks/useApi';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';

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
    <Modal open={true} onClose={onClose} title="Create Job Opening" size="2xl">
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
    <Modal open={true} onClose={onClose} title="Add Candidate" size="2xl">
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
  const [activeTab, setActiveTab] = useState('jobs');
  const [modal, setModal] = useState(null);
  
  const { data: jobsResponse, refetch: fetchJobs, loading: jobsLoading } = useApi('/hr-recruitment/jobs');
  const { data: candidatesResponse, refetch: fetchCandidates, request } = useApi('/hr-recruitment/candidates');

  const jobs = jobsResponse?.jobs || jobsResponse || [];
  const candidates = candidatesResponse?.candidates || candidatesResponse || [];

  const [draggedItem, setDraggedItem] = useState(null);

  const TABS = [
    { id: 'jobs', label: 'Job Openings', icon: Briefcase },
    { id: 'candidates', label: 'Candidates', icon: Users },
    { id: 'interviews', label: 'Interview Schedule', icon: Calendar },
    { id: 'offers', label: 'Offer Letters', icon: FileCheck },
  ];

  const handleDragStart = (e, candidateId) => {
    setDraggedItem(candidateId);
    e.dataTransfer.setData('text/plain', candidateId);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { e.target.style.opacity = '0.5'; }, 0);
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

    const candidate = candidates.find(c => c._id === candidateId);
    if (candidate && candidate.status !== stageId) {
      try {
        await request('PUT', `/hr-recruitment/candidates/${candidateId}`, { status: stageId });
        fetchCandidates();
      } catch (err) {
        alert('Failed to update stage: ' + err.message);
      }
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'jobs':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800">Job Openings</h2>
              <button onClick={() => setModal('ADD_JOB')} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold transition-colors shadow-sm">
                <Plus className="h-4 w-4" /> Create Job
              </button>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {jobsLoading ? (
                <div className="p-12 text-center text-slate-500 font-medium">Loading Job Openings...</div>
              ) : jobs.length === 0 ? (
                <EmptyState icon={Briefcase} title="No Job Openings" description="There are no active job requisitions right now." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        <th className="p-4">Job Title</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Vacancies</th>
                        <th className="p-4">Experience</th>
                        <th className="p-4">Salary Range</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {jobs.map(job => (
                        <tr key={job._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-800">{job.title}</div>
                            <div className="text-xs text-slate-500 font-medium mt-0.5">{job.role}</div>
                          </td>
                          <td className="p-4 text-slate-600 font-medium">{job.department}</td>
                          <td className="p-4 text-slate-600 font-medium">{job.vacancies}</td>
                          <td className="p-4 text-slate-600 font-medium">{job.experience}</td>
                          <td className="p-4 text-slate-600 font-medium">{job.salaryRange}</td>
                          <td className="p-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${
                              job.status === 'Open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {job.status || 'OPEN'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Manage</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'candidates':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-black text-slate-800">Candidates Board</h2>
              <div className="flex items-center gap-3">
                 <button onClick={() => setModal('ADD_CANDIDATE')} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold transition-colors shadow-sm">
                  <Plus className="h-4 w-4" /> Add Candidate
                </button>
              </div>
            </div>

            <div className="flex-1 flex gap-4 overflow-x-auto pb-4 items-start min-h-[500px]">
              {STAGES.map(stage => {
                const stageCandidates = candidates.filter(c => (c.status || 'APPLIED') === stage.id);
                return (
                  <div 
                    key={stage.id} 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage.id)}
                    className="flex-shrink-0 w-80 flex flex-col rounded-[2rem] bg-slate-50 border border-slate-100 h-full overflow-hidden shadow-sm"
                  >
                    <div className={`p-5 border-b border-slate-100 flex items-center justify-between ${stage.color.replace('border-', 'border-b-')} rounded-t-[2rem]`}>
                      <h3 className="font-bold text-sm">{stage.label}</h3>
                      <span className="bg-white/60 px-2.5 py-0.5 rounded-full text-xs font-black shadow-sm">
                        {stageCandidates.length}
                      </span>
                    </div>
                    
                    <div className="p-4 flex-1 overflow-y-auto space-y-4">
                      {stageCandidates.length === 0 && (
                        <div className="h-24 flex items-center justify-center text-slate-400 text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-slate-200 rounded-2xl">
                          Drop Here
                        </div>
                      )}
                      {stageCandidates.map(c => (
                        <div 
                          key={c._id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, c._id)}
                          onDragEnd={handleDragEnd}
                          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-grab active:cursor-grabbing group"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm shadow-blue-200">
                                {c.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-800 leading-tight">{c.name}</h4>
                                <p className="text-[10px] font-black tracking-widest uppercase text-indigo-600 mt-1">
                                  {c.appliedPosition?.title || 'Unknown Position'}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                              <Briefcase className="h-3 w-3" /> {c.experience || 'Fresher'}
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.source || 'Direct'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'interviews':
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center animate-in fade-in">
            <div className="h-24 w-24 bg-blue-50 border border-blue-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
              <Calendar className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Interview Schedule Module</h3>
            <p className="text-slate-500 font-medium max-w-md">Connect your calendar or configure the scheduling system here. No active interviews found right now.</p>
          </div>
        );

      case 'offers':
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center animate-in fade-in">
            <div className="h-24 w-24 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
              <FileCheck className="h-10 w-10 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Offer Letters Generator</h3>
            <p className="text-slate-500 font-medium max-w-md">Create, customize, and track offer letters sent to selected candidates. No pending offers.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="pb-4 border-b border-slate-100">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Recruitment Pipeline</h1>
        <p className="text-slate-500 font-medium mt-2">Manage job openings, track candidates, and handle interview schedules.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start h-[calc(100vh-200px)]">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 bg-white border border-slate-100 rounded-[2rem] p-3 shadow-sm h-full">
          <nav className="space-y-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full h-full overflow-hidden">
          {renderTabContent()}
        </div>
      </div>

      {modal === 'ADD_JOB' && <AddJobModal onClose={() => setModal(null)} onRefresh={fetchJobs} />}
      {modal === 'ADD_CANDIDATE' && <AddCandidateModal onClose={() => setModal(null)} onRefresh={fetchCandidates} jobs={jobs || []} />}
    </div>
  );
};

export default HRRecruitment;
