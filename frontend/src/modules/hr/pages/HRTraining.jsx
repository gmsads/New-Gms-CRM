import React, { useState } from 'react';
import { BookOpen, Award, BarChart2, Plus, Star, Users, Calendar, ArrowRight } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';

const AddTrainingModal = ({ onClose, onRefresh }) => {
  const { request } = useApi();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', type: 'Workshop', date: '', participants: 1
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await request('POST', '/hr-training', form);
      onRefresh();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Schedule Training" size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-slate-50">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Program Title</label>
          <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Program Type</label>
          <select required value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none bg-white">
            <option value="Workshop">Workshop</option>
            <option value="Online Course">Online Course</option>
            <option value="Seminar">Seminar</option>
            <option value="Certification Prep">Certification Prep</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Start Date</label>
            <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Capacity</label>
            <input type="number" min="1" required value={form.participants} onChange={e => setForm({...form, participants: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-600 hover:bg-white transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {loading ? 'Scheduling...' : 'Schedule Training'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const HRTraining = () => {
  const [view, setView] = useState('Programs');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: response, loading, refetch } = useApi('/hr-training');
  const trainingData = response?.trainingData || response?.programs || [];
  const certifications = response?.certifications || [];
  
  const stats = response?.stats || { activePrograms: 0, totalCertifications: 0, avgScore: '0/5' };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-6 md:p-8">
      <div className="pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Training & Development</h1>
          <p className="text-slate-500 font-medium mt-2">Manage employee upskilling, skill matrices, and certifications.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:from-indigo-600 hover:to-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Schedule Training
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: 'Active Programs', value: stats.activePrograms, icon: BookOpen, color: 'blue', desc: 'Currently running' },
          { label: 'Total Certifications', value: stats.totalCertifications, icon: Award, color: 'emerald', desc: 'Company wide' },
          { label: 'Avg Skill Score', value: stats.avgScore, icon: Star, color: 'amber', desc: 'Across all departments' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[2rem] border border-slate-100 p-6 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-16 h-16 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center border border-${stat.color}-100 shrink-0 shadow-inner`}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 leading-tight mt-1">{stat.value}</p>
              <p className="text-sm font-medium text-slate-500 mt-1">{stat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex gap-2">
          {['Programs', 'Certifications', 'Skill Matrix'].map(tab => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`px-6 py-3 rounded-2xl font-black text-sm transition-all ${
                view === tab 
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' 
                  : 'text-slate-400 hover:bg-slate-100/50 hover:text-slate-600 border border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-8 flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 font-medium">Loading {view.toLowerCase()} data...</div>
          ) : view === 'Programs' && trainingData.length === 0 ? (
            <EmptyState icon={BookOpen} title="No Active Programs" description="There are no training programs currently scheduled." />
          ) : view === 'Programs' ? (
            <div className="grid gap-6 md:grid-cols-2">
              {trainingData.map(program => (
                <div key={program._id || program.id} className="border border-slate-100 rounded-3xl p-6 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all group bg-white relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                      {program.type}
                    </div>
                    <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4">{program.title}</h3>
                  <div className="flex items-center gap-6 text-sm font-bold text-slate-500 bg-slate-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-400" /> {program.participants} Enrolled</div>
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> {new Date(program.date).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : view === 'Certifications' && certifications.length === 0 ? (
            <EmptyState icon={Award} title="No Certifications Found" description="There are no certifications recorded for your employees." />
          ) : view === 'Certifications' ? (
            <div className="overflow-x-auto -mx-8 px-8">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Certification</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Achieved</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {certifications.map(cert => (
                    <tr key={cert._id || cert.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-5 font-bold text-slate-900">{cert.employee}</td>
                      <td className="py-5 font-bold text-slate-700 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-50">
                          <Award className="w-4 h-4 text-amber-500" /> 
                        </div>
                        {cert.name}
                      </td>
                      <td className="py-5 text-sm font-medium text-slate-500">{new Date(cert.date).toLocaleDateString()}</td>
                      <td className="py-5 text-right">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                          {cert.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : view === 'Skill Matrix' ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 text-center animate-in fade-in zoom-in-95">
              <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 flex items-center justify-center mb-6 shadow-inner border border-indigo-100">
                <BarChart2 className="w-10 h-10 text-indigo-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Skill Matrix Dashboard</h3>
              <p className="font-medium max-w-md text-slate-500">Detailed mapping of employee skills versus role requirements is currently being generated. Check back soon.</p>
              <button className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                Generate Matrix Report
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {isModalOpen && <AddTrainingModal onClose={() => setIsModalOpen(false)} onRefresh={refetch} />}
    </div>
  );
};

export default HRTraining;
