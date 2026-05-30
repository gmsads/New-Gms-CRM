import React, { useState } from 'react';
import { 
  Briefcase, 
  Users, 
  Calendar, 
  FileCheck, 
  Plus, 
  Search, 
  Edit, 
  XSquare, 
  UserPlus, 
  Mail, 
  Phone, 
  Link as LinkIcon 
} from 'lucide-react';

const MOCK_JOBS = [
  { id: 1, title: 'Senior React Developer', department: 'Engineering', role: 'Frontend', vacancies: 2, experience: '3-5 Years', salary: '₹12L - ₹18L', location: 'Remote', status: 'Open' },
  { id: 2, title: 'HR Manager', department: 'Human Resources', role: 'Manager', vacancies: 1, experience: '5-7 Years', salary: '₹8L - ₹12L', location: 'Mumbai', status: 'Open' },
  { id: 3, title: 'Sales Executive', department: 'Sales', role: 'Executive', vacancies: 5, experience: '1-3 Years', salary: '₹4L - ₹6L', location: 'Delhi', status: 'Closed' }
];

const MOCK_CANDIDATES = [
  { id: 101, name: 'Rahul Sharma', phone: '+91 9876543210', email: 'rahul.s@example.com', resume: '#', experience: '4 Years', position: 'Senior React Developer', source: 'LinkedIn', status: 'Screening' },
  { id: 102, name: 'Priya Patel', phone: '+91 8765432109', email: 'priya.p@example.com', resume: '#', experience: '6 Years', position: 'HR Manager', source: 'Referral', status: 'Interview Scheduled' },
  { id: 103, name: 'Amit Kumar', phone: '+91 7654321098', email: 'amit.k@example.com', resume: '#', experience: '2 Years', position: 'Sales Executive', source: 'Naukri', status: 'Selected' },
  { id: 104, name: 'Neha Gupta', phone: '+91 6543210987', email: 'neha.g@example.com', resume: '#', experience: '3.5 Years', position: 'Senior React Developer', source: 'Company Website', status: 'Applied' },
];

const HRRecruitment = () => {
  const [activeTab, setActiveTab] = useState('jobs');
  const [searchQuery, setSearchQuery] = useState('');

  const TABS = [
    { id: 'jobs', label: 'Job Openings', icon: Briefcase },
    { id: 'candidates', label: 'Candidates', icon: Users },
    { id: 'interviews', label: 'Interview Schedule', icon: Calendar },
    { id: 'offers', label: 'Offer Letters', icon: FileCheck },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'jobs':
        return (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Job Openings</h2>
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-colors shadow-sm">
                <Plus className="h-4 w-4" />
                Create Job
              </button>
            </div>
            
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold">Job Title</th>
                      <th className="p-4 font-bold">Department</th>
                      <th className="p-4 font-bold">Vacancies</th>
                      <th className="p-4 font-bold">Experience</th>
                      <th className="p-4 font-bold">Salary Range</th>
                      <th className="p-4 font-bold">Location</th>
                      <th className="p-4 font-bold">Status</th>
                      <th className="p-4 font-bold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {MOCK_JOBS.map(job => (
                      <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-semibold text-slate-800">
                          <div>{job.title}</div>
                          <div className="text-xs text-slate-500 font-normal mt-0.5">{job.role}</div>
                        </td>
                        <td className="p-4 text-slate-600">{job.department}</td>
                        <td className="p-4 text-slate-600">{job.vacancies}</td>
                        <td className="p-4 text-slate-600">{job.experience}</td>
                        <td className="p-4 text-slate-600">{job.salary}</td>
                        <td className="p-4 text-slate-600">{job.location}</td>
                        <td className="p-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${
                            job.status === 'Open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip" title="Edit Job">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors tooltip" title="Close Job">
                              <XSquare className="h-4 w-4" />
                            </button>
                            <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors tooltip" title="Assign Recruiter">
                              <UserPlus className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
        
      case 'candidates':
        return (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold text-slate-800">Candidates</h2>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search candidates..." 
                  className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold">Candidate Info</th>
                      <th className="p-4 font-bold">Contact</th>
                      <th className="p-4 font-bold">Applied For</th>
                      <th className="p-4 font-bold">Experience</th>
                      <th className="p-4 font-bold">Source</th>
                      <th className="p-4 font-bold">Status</th>
                      <th className="p-4 font-bold">Resume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {MOCK_CANDIDATES.map(cand => (
                      <tr key={cand.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-semibold text-slate-800">{cand.name}</td>
                        <td className="p-4 text-slate-600 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Phone className="h-3 w-3 text-slate-400" /> {cand.phone}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <Mail className="h-3 w-3 text-slate-400" /> {cand.email}
                          </div>
                        </td>
                        <td className="p-4 font-medium text-slate-700">{cand.position}</td>
                        <td className="p-4 text-slate-600">{cand.experience}</td>
                        <td className="p-4 text-slate-600">
                          <span className="px-2 py-1 bg-slate-100 rounded-md text-xs">{cand.source}</span>
                        </td>
                        <td className="p-4">
                          <select 
                            className="text-xs font-bold border rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                            defaultValue={cand.status}
                          >
                            <option value="Applied">Applied</option>
                            <option value="Screening">Screening</option>
                            <option value="Interview Scheduled">Interview Scheduled</option>
                            <option value="Interview Completed">Interview Completed</option>
                            <option value="Selected">Selected</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Offer Sent">Offer Sent</option>
                            <option value="Joined">Joined</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <a href={cand.resume} className="flex items-center justify-center p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors w-max">
                            <LinkIcon className="h-4 w-4" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'interviews':
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
            <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Interview Schedule Module</h3>
            <p className="text-slate-500 max-w-md">Connect your calendar or configure the scheduling system here. This section is currently under development.</p>
          </div>
        );

      case 'offers':
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
            <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <FileCheck className="h-10 w-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Offer Letters Generator</h3>
            <p className="text-slate-500 max-w-md">Create, customize, and track offer letters sent to selected candidates. This section is currently under development.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Recruitment Pipeline</h1>
        <p className="text-slate-500 font-medium mt-1">Manage job openings, track candidates, and handle interview schedules.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 bg-white border rounded-2xl p-2 shadow-sm">
          <nav className="space-y-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full min-h-[500px]">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default HRRecruitment;
