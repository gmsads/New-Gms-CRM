import React, { useState } from 'react';
import { BookOpen, Award, BarChart2, Plus, Star, Users, Calendar, ArrowRight } from 'lucide-react';

const trainingData = [
  { id: 1, title: 'Leadership Development', participants: 12, date: '2026-06-15', duration: '3 Days', type: 'Workshop' },
  { id: 2, title: 'Advanced React Patterns', participants: 25, date: '2026-06-20', duration: 'Self-paced', type: 'Online Course' },
];

const certifications = [
  { id: 1, employee: 'Alice Smith', name: 'AWS Certified Solutions Architect', date: '2026-05-10', status: 'Active' },
  { id: 2, employee: 'Bob Jones', name: 'PMP Certification', date: '2026-04-22', status: 'Active' },
];

const HRTraining = () => {
  const [view, setView] = useState('Programs');

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="py-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Training & Development</h1>
          <p className="text-slate-500 font-medium mt-2">Manage employee upskilling, skill matrices, and certifications.</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Schedule Training
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: 'Active Programs', value: 8, icon: BookOpen, color: 'blue', desc: 'Currently running' },
          { label: 'Total Certifications', value: 142, icon: Award, color: 'emerald', desc: 'Company wide' },
          { label: 'Avg Skill Score', value: '4.2/5', icon: Star, color: 'amber', desc: 'Across all departments' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[2rem] border border-slate-100 p-6 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center border border-${stat.color}-100 shrink-0`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 leading-tight mt-1">{stat.value}</p>
              <p className="text-sm font-medium text-slate-500 mt-1">{stat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-2 bg-slate-50 border-b border-slate-100 flex gap-2">
          {['Programs', 'Certifications', 'Skill Matrix'].map(tab => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                view === tab ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-8">
          {view === 'Programs' && (
            <div className="grid gap-6 md:grid-cols-2">
              {trainingData.map(program => (
                <div key={program.id} className="border border-slate-100 rounded-3xl p-6 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                      {program.type}
                    </div>
                    <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-4">{program.title}</h3>
                  <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
                    <div className="flex items-center gap-2"><Users className="w-4 h-4" /> {program.participants} Enrolled</div>
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {program.date}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === 'Certifications' && (
            <div className="overflow-x-auto -mx-8 px-8">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Employee</th>
                    <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Certification</th>
                    <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date Achieved</th>
                    <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {certifications.map(cert => (
                    <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 font-bold text-slate-900">{cert.employee}</td>
                      <td className="py-4 font-semibold text-slate-700 flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-500" /> {cert.name}
                      </td>
                      <td className="py-4 text-sm font-medium text-slate-500">{cert.date}</td>
                      <td className="py-4 text-right">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
                          {cert.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {view === 'Skill Matrix' && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
              <BarChart2 className="w-16 h-16 mb-4 text-slate-200" />
              <h3 className="text-xl font-black text-slate-900 mb-2">Skill Matrix Dashboard</h3>
              <p className="font-medium max-w-md">Detailed mapping of employee skills versus role requirements is currently being generated. Check back soon.</p>
              <button className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-full font-bold text-sm">
                Generate Report
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRTraining;
