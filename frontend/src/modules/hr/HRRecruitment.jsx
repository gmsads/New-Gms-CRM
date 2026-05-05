import React, { useState } from 'react';
import { Plus, Search, MoreHorizontal, FileText, Calendar, CheckCircle, XCircle, Users } from 'lucide-react';
import Badge from '../../components/ui/Badge';

const MOCK_CANDIDATES = [
  { id: '1', name: 'Sarah Jenkins', role: 'UI/UX Designer', exp: '4 Years', stage: 'Screening', source: 'LinkedIn' },
  { id: '2', name: 'Michael Chen', role: 'Frontend Dev', exp: '2 Years', stage: 'Applied', source: 'Website' },
  { id: '3', name: 'Emma Davis', role: 'Marketing Manager', exp: '6 Years', stage: 'Interview', source: 'Referral' },
  { id: '4', name: 'James Wilson', role: 'Sales Executive', exp: '3 Years', stage: 'Selected', source: 'LinkedIn' },
];

const STAGES = ['Applied', 'Screening', 'Interview', 'Selected', 'Rejected'];

const CandidateCard = ({ candidate }) => (
  <div className="bg-card border rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing mb-3 group">
    <div className="flex justify-between items-start mb-2">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">
          {candidate.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <h4 className="text-sm font-semibold leading-none">{candidate.name}</h4>
          <p className="text-xs text-muted-foreground mt-1">{candidate.role}</p>
        </div>
      </div>
      <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
    <div className="flex items-center justify-between mt-3 text-xs">
      <Badge value={candidate.source} />
      <span className="text-muted-foreground flex items-center gap-1">
        <Calendar className="h-3 w-3" /> {candidate.exp}
      </span>
    </div>
  </div>
);

const HRRecruitment = () => {
  const [candidates, setCandidates] = useState(MOCK_CANDIDATES);

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recruitment Pipeline</h2>
          <p className="text-muted-foreground text-sm">Manage candidates from application to hiring.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input type="search" placeholder="Search candidates..." 
              className="h-9 w-64 rounded-md border bg-background pl-9 pr-4 text-sm outline-none focus:border-primary transition-colors" />
          </div>
          <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Add Candidate
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 shrink-0">
        <div className="rounded-xl border bg-card p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Avg. Time to Hire</p>
            <h3 className="text-2xl font-bold">18 Days</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Calendar className="h-5 w-5" />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Top Source of Hire</p>
            <h3 className="text-2xl font-bold">LinkedIn (65%)</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Users className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 pt-2">
        {STAGES.map(stage => {
          const stageCandidates = candidates.filter(c => c.stage === stage);
          return (
            <div key={stage} className="flex-shrink-0 w-72 flex flex-col rounded-xl bg-muted/40 border border-muted-foreground/10 h-full">
              <div className="p-3 border-b flex items-center justify-between bg-card rounded-t-xl shrink-0 shadow-sm">
                <h3 className="font-semibold text-sm">{stage}</h3>
                <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-medium text-muted-foreground">
                  {stageCandidates.length}
                </span>
              </div>
              <div className="p-3 flex-1 overflow-y-auto">
                {stageCandidates.map(c => <CandidateCard key={c.id} candidate={c} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HRRecruitment;
