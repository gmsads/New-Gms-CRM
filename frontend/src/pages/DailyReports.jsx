import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, MapPin, Clock, Search, Filter, CheckCircle2, 
  AlertCircle, ChevronRight, User, Phone as PhoneIcon, Building, 
  Briefcase, Truck, Eye, ArrowLeft, RefreshCw, Navigation, FileText,
  Activity, ShieldCheck, Zap, Image as ImageIcon, ExternalLink, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { visitApi } from '../services/api';
import EmptyState from '../components/ui/EmptyState';

const MONTHS = [
  'All Months', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = ['All Years', '2026', '2025', '2024'];

const statusBadgeColors = {
  Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
  'In Progress': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
  Pending: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
  Scheduled: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300',
};

const DailyReports = () => {
  const { user } = useAuth();
  
  // Filters matching exact reference pic design
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [selectedMonth, setSelectedMonth] = useState('All Months');
  const [selectedExecutive, setSelectedExecutive] = useState('All Executives');
  const [specificDate, setSpecificDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detail view state when clicking specific executive
  const [activeExecutiveReport, setActiveExecutiveReport] = useState(null);
  const [activeTab, setActiveTab] = useState('work'); // 'work' | 'map'
  const [selectedPing, setSelectedPing] = useState(null);

  // Fetch Daily Reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = user?.token;

      const params = {};
      if (selectedYear !== 'All Years') params.year = selectedYear;
      if (selectedMonth !== 'All Months') params.month = selectedMonth;
      if (selectedExecutive !== 'All Executives') params.executive = selectedExecutive;
      if (specificDate) params.specificDate = specificDate;
      if (searchQuery) params.search = searchQuery;

      const res = await visitApi.getDailyReports(params, token);
      if (res.success) {
        setReports(res.data || []);
        
        // If an executive was selected in dropdown, or if active report is open, update active report
        if (selectedExecutive !== 'All Executives' && res.data && res.data.length > 0) {
          const match = res.data.find(r => r.employee._id === selectedExecutive || r.employee._id.toString() === selectedExecutive);
          if (match) setActiveExecutiveReport(match);
          else setActiveExecutiveReport(res.data[0]);
        } else if (activeExecutiveReport) {
          const updated = res.data.find(r => r.employee._id === activeExecutiveReport.employee._id);
          if (updated) setActiveExecutiveReport(updated);
        }
      } else {
        setError(res.message || 'Failed to fetch daily reports.');
      }
    } catch (err) {
      console.error('Error fetching daily reports:', err);
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [selectedYear, selectedMonth, selectedExecutive, specificDate]);

  // Handle manual search
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) fetchReports();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Format date display
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'All Dates';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const handleSelectExecutiveCard = (report) => {
    setActiveExecutiveReport(report);
    setActiveTab('work');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  // Extract all unique executives for the dropdown from fetched data or general
  const executiveOptions = React.useMemo(() => {
    const map = new Map();
    reports.forEach(r => {
      if (r.employee && r.employee._id) {
        map.set(r.employee._id, r.employee.name || 'Unknown Executive');
      }
    });
    return Array.from(map.entries());
  }, [reports]);

  // Calculate top summary stats across all shown employees
  const totalEmployeesCount = reports.length;
  const totalVisitsCount = reports.reduce((acc, r) => acc + r.stats.totalVisitsAssigned, 0);
  const totalCompletedVisits = reports.reduce((acc, r) => acc + r.stats.completedCount, 0);
  const totalClientSiteHours = (reports.reduce((acc, r) => acc + r.stats.clientSiteSpentMinutes, 0) / 60).toFixed(1);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Page Title & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 via-[#003366] to-slate-800 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur border border-white/20">
              <Clock className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Daily Reports</h1>
              <p className="text-blue-100 text-sm mt-0.5">
                Monitor field & sales executive daily visit logs, onsite work done, and live GPS route timelines.
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={fetchReports} 
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Reports
        </button>
      </div>

      {/* Filter Options Card matching exact reference picture */}
      <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900/90 shadow-md p-5 sm:p-6 transition-all">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-5">
          {/* Year Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Year:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                if (activeExecutiveReport && selectedExecutive === 'All Executives') setActiveExecutiveReport(null);
              }}
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10 transition-all shadow-sm"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Month:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                if (activeExecutiveReport && selectedExecutive === 'All Executives') setActiveExecutiveReport(null);
              }}
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10 transition-all shadow-sm"
            >
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Executive Filter (Highlighted with thick border per reference pic) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Executive:
            </label>
            <select
              value={selectedExecutive}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedExecutive(val);
                if (val === 'All Executives') {
                  setActiveExecutiveReport(null);
                } else {
                  const match = reports.find(r => r.employee._id === val || r.employee._id.toString() === val);
                  if (match) setActiveExecutiveReport(match);
                }
              }}
              className="w-full h-11 rounded-xl border-2 border-[#003366] bg-blue-50/40 px-3.5 text-sm font-bold text-[#003366] outline-none focus:ring-4 focus:ring-[#003366]/20 transition-all shadow-md"
            >
              <option value="All Executives">All Executives</option>
              {executiveOptions.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>

          {/* Specific Date Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Specific Date:
            </label>
            <div className="relative">
              <input
                type="date"
                value={specificDate}
                onChange={(e) => {
                  setSpecificDate(e.target.value);
                  if (activeExecutiveReport && selectedExecutive === 'All Executives') setActiveExecutiveReport(null);
                }}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-slate-100 my-4" />

        {/* Search by any field */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by any field..."
            className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10 transition-all"
          />
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{totalEmployeesCount}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Executives Reported</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 font-bold">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{totalVisitsCount}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Visits Logged</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{totalCompletedVisits}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Visits</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 font-bold">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{totalClientSiteHours} hrs</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Time On Client Site</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="h-10 w-10 rounded-full border-4 border-[#003366] border-t-transparent animate-spin mb-4" />
          <p className="text-sm font-semibold text-slate-600">Analyzing field logs & assembling live GPS routes...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-center gap-3">
          <AlertCircle className="h-6 w-6 shrink-0 text-red-500" />
          <div>
            <p className="font-bold text-base">Unable to load reports</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      ) : (
        <>
          {/* IF AN EXECUTIVE IS SELECTED / ACTIVE — SHOW DETAILED REPORT & LIVE ROUTE TIMELINE (GPS MAP) */}
          {activeExecutiveReport ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              {/* Back button & Executive Header */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5 mb-5">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        setActiveExecutiveReport(null);
                        setSelectedExecutive('All Executives');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to All Employees Report
                    </button>
                    <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-[#003366] to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                      {activeExecutiveReport.employee.name?.charAt(0).toUpperCase() || 'E'}
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        {activeExecutiveReport.employee.name}
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          {activeExecutiveReport.employee.role}
                        </span>
                      </h2>
                      <p className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5" /> {activeExecutiveReport.employee.department}</span>
                        <span className="flex items-center gap-1"><PhoneIcon className="h-3.5 w-3.5" /> {activeExecutiveReport.employee.phone}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-700">Report Date: {formatDateDisplay(specificDate)}</span>
                  </div>
                </div>

                {/* Executive Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase">Assigned Visits</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{activeExecutiveReport.stats.totalVisitsAssigned}</p>
                  </div>
                  <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-700 uppercase">Completed</p>
                    <p className="text-xl font-black text-emerald-900 mt-1">{activeExecutiveReport.stats.completedCount}</p>
                  </div>
                  <div className="bg-blue-50/80 p-3.5 rounded-xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-700 uppercase">In Progress</p>
                    <p className="text-xl font-black text-blue-900 mt-1">{activeExecutiveReport.stats.inProgressCount}</p>
                  </div>
                  <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-100">
                    <p className="text-xs font-bold text-amber-700 uppercase">Client Site Duration</p>
                    <p className="text-xl font-black text-amber-900 mt-1">
                      {Math.floor(activeExecutiveReport.stats.clientSiteSpentMinutes / 60)}h {activeExecutiveReport.stats.clientSiteSpentMinutes % 60}m
                    </p>
                  </div>
                  <div className="bg-purple-50/80 p-3.5 rounded-xl border border-purple-100">
                    <p className="text-xs font-bold text-purple-700 uppercase">Route / Other Duration</p>
                    <p className="text-xl font-black text-purple-900 mt-1">
                      {Math.floor(activeExecutiveReport.stats.travelOrOtherMinutes / 60)}h {activeExecutiveReport.stats.travelOrOtherMinutes % 60}m
                    </p>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-3 border-b border-slate-200 mt-6 pt-2">
                  <button
                    onClick={() => setActiveTab('work')}
                    className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
                      activeTab === 'work'
                        ? 'border-[#003366] text-[#003366]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Briefcase className="h-4 w-4" />
                    Work Done & Visits Log ({activeExecutiveReport.visits.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('map')}
                    className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
                      activeTab === 'map'
                        ? 'border-[#003366] text-[#003366]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Navigation className="h-4 w-4 text-blue-600" />
                    Live Route Timeline (GPS Map) ({activeExecutiveReport.liveRouteTimeline.length} Points)
                  </button>
                </div>
              </div>

              {/* TAB 1: WORK DONE & VISITS LOG */}
              {activeTab === 'work' && (
                <div className="space-y-4">
                  {activeExecutiveReport.visits.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                      <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <h3 className="text-lg font-bold text-slate-800">No visits logged for this day</h3>
                      <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                        When this executive schedules, checks into, or completes client visits, their detailed work log will appear right here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {activeExecutiveReport.visits.map((visit, vIdx) => (
                        <div key={visit._id || vIdx} className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-all">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-100">
                            <div>
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="font-extrabold text-lg text-slate-900">{visit.businessName || visit.clientName || 'Business Location'}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadgeColors[visit.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                  {visit.status}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                  {visit.purpose || visit.visitType || 'Site Visit'}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600 mt-1.5 flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-red-500 shrink-0" />
                                {visit.location || visit.locationName || 'Location not specified'}
                              </p>
                            </div>

                            <div className="flex flex-col sm:items-end gap-1 text-xs font-medium text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 shrink-0">
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-blue-600" />
                                Check-in: {visit.checkIn?.time ? new Date(visit.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                                Check-out: {visit.checkOut?.time ? new Date(visit.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Progress'}
                              </span>
                            </div>
                          </div>

                          {/* Work Done & Remarks */}
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-slate-400" /> Purpose / Task Description
                              </p>
                              <p className="text-sm font-medium text-slate-800 leading-relaxed">
                                {visit.notes || visit.remark || 'Standard field consultation and verification at client location.'}
                              </p>
                            </div>

                            <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100/60">
                              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <Award className="h-3.5 w-3.5 text-emerald-600" /> Work Done & Completion Notes
                              </p>
                              <p className="text-sm font-medium text-slate-800 leading-relaxed">
                                {visit.completionNotes || (visit.status === 'Completed' ? 'Successfully met client stakeholders, verified business requirements, and completed all on-ground action items.' : 'Visit is ongoing or pending completion remarks.')}
                              </p>
                            </div>
                          </div>

                          {/* Photos if any */}
                          {(visit.checkIn?.photo || visit.checkOut?.photo || (visit.mediaUploads && visit.mediaUploads.length > 0)) && (
                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3 overflow-x-auto">
                              <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
                                <ImageIcon className="h-3.5 w-3.5 text-blue-500" /> On-site Verification Photos:
                              </span>
                              {visit.checkIn?.photo && (
                                <a href={visit.checkIn.photo} target="_blank" rel="noreferrer" className="shrink-0 block rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity">
                                  <img src={visit.checkIn.photo} alt="Check In" className="h-16 w-16 object-cover" />
                                </a>
                              )}
                              {visit.checkOut?.photo && (
                                <a href={visit.checkOut.photo} target="_blank" rel="noreferrer" className="shrink-0 block rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity">
                                  <img src={visit.checkOut.photo} alt="Check Out" className="h-16 w-16 object-cover" />
                                </a>
                              )}
                              {visit.mediaUploads?.map((url, uIdx) => (
                                <a key={uIdx} href={url} target="_blank" rel="noreferrer" className="shrink-0 block rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity">
                                  <img src={url} alt="Media" className="h-16 w-16 object-cover" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: LIVE ROUTE TIMELINE & GPS MAP */}
              {activeTab === 'map' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Interactive GPS Map Visualization */}
                  <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm flex flex-col h-[560px]">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                          <Navigation className="h-5 w-5 text-blue-600 animate-pulse" /> Live Route GPS Map
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Showing precise path coordinates from location checks & field check-ins.
                        </p>
                      </div>
                      {activeExecutiveReport.liveRouteTimeline.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            GPS Tracking Active
                          </span>
                        </div>
                      )}
                    </div>

                    {activeExecutiveReport.liveRouteTimeline.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/80 rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
                        <MapPin className="h-12 w-12 text-slate-300 mb-3" />
                        <h4 className="font-bold text-slate-700 text-base">No GPS Route Points Captured Yet</h4>
                        <p className="text-xs text-slate-500 max-w-sm mt-1">
                          When this executive clicks on the Field Visits menu or checks in at a client location with GPS enabled, the route timeline will map right here.
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative flex flex-col">
                        {/* We embed OpenStreetMap based on latest or selected coordinate AND render interactive custom waypoints panel */}
                        {(() => {
                          const targetPoint = selectedPing || activeExecutiveReport.liveRouteTimeline[activeExecutiveReport.liveRouteTimeline.length - 1];
                          const lat = targetPoint?.latitude || 28.6139;
                          const lng = targetPoint?.longitude || 77.2090;
                          const delta = 0.015;
                          const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
                          const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;

                          return (
                            <>
                              <iframe
                                title="GPS Route Map"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                scrolling="no"
                                marginHeight="0"
                                marginWidth="0"
                                src={embedUrl}
                                className="flex-1 w-full"
                              />
                              {/* Route Overlay Header on top of map */}
                              <div className="absolute top-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200/80 shadow-md flex items-center justify-between pointer-events-auto">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                    📍
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-900 leading-none">
                                      {targetPoint?.locationName || `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`}
                                    </p>
                                    <p className="text-[11px] font-semibold text-blue-600 mt-1">
                                      {targetPoint?.status} • {new Date(targetPoint?.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 bg-[#003366] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1 shadow-sm shrink-0"
                                >
                                  Open Google Maps <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Step-by-Step Vertical Route Timeline */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm flex flex-col h-[560px]">
                    <div className="pb-4 border-b border-slate-100 mb-4">
                      <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-500" /> Route Timeline
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Chronological sequence of visited business locations & time spent.
                      </p>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                      {activeExecutiveReport.liveRouteTimeline.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-12">No timeline points captured.</p>
                      ) : (
                        activeExecutiveReport.liveRouteTimeline.map((point, pIdx) => {
                          const isCheckIn = point.activityType === 'Check-In';
                          const isCheckOut = point.activityType === 'Check-Out';
                          const isSelected = selectedPing?.id === point.id;

                          return (
                            <div
                              key={point.id || pIdx}
                              onClick={() => setSelectedPing(point)}
                              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative pl-5 ${
                                isSelected
                                  ? 'bg-blue-50/80 border-[#003366] shadow-sm'
                                  : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/70'
                              }`}
                            >
                              {/* Left vertical accent */}
                              <div
                                className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${
                                  isCheckIn
                                    ? 'bg-emerald-500'
                                    : isCheckOut
                                    ? 'bg-amber-500'
                                    : 'bg-blue-500'
                                }`}
                              />

                              <div className="flex justify-between items-start gap-2">
                                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                  {isCheckIn ? '🟢 Check-In' : isCheckOut ? '🏁 Check-Out' : '🔵 Location Ping'}
                                </span>
                                <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                  {new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <p className="text-xs font-extrabold text-slate-900 mt-1.5 leading-snug">
                                {point.businessName || point.visitTitle || point.locationName || 'Field Location Check'}
                              </p>

                              <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                                <span className="truncate">{point.locationName}</span>
                              </p>

                              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">
                                {point.status}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* DEFAULT VIEW: SHOW ALL EMPLOYEES REPORT IN THAT DAY ("below show all employees report in that day(default)") */
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-100/70 px-4 py-3 rounded-xl border border-slate-200/80">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Employee Daily Reports List ({reports.length})
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Showing records for: <strong className="text-slate-800">{formatDateDisplay(specificDate)}</strong>
                </span>
              </div>

              {reports.length === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  title="No Employee Reports Found"
                  description="No visits or location activity logged matching the selected filters or search query."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {reports.map((report) => {
                    const emp = report.employee;
                    const st = report.stats;
                    const hasActivity = st.totalVisitsAssigned > 0 || report.liveRouteTimeline.length > 0;

                    return (
                      <div
                        key={emp._id}
                        className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between p-5 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 ${
                          hasActivity ? 'border-slate-200/90' : 'border-slate-100 opacity-85'
                        }`}
                      >
                        <div>
                          {/* Top Header: Avatar + Name */}
                          <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-[#003366] to-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                                {emp.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div>
                                <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                                  {emp.name}
                                </h3>
                                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-100">
                                  {emp.role}
                                </span>
                              </div>
                            </div>

                            {hasActivity && (
                              <span className="px-2 py-1 rounded-full text-[10px] font-black tracking-wide uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Active Log
                              </span>
                            )}
                          </div>

                          {/* Quick Stats Grid */}
                          <div className="grid grid-cols-2 gap-2.5 my-4">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <p className="text-[11px] font-bold text-slate-500 uppercase">Assigned Visits</p>
                              <p className="text-lg font-black text-slate-900 mt-0.5">{st.totalVisitsAssigned}</p>
                            </div>
                            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100/70">
                              <p className="text-[11px] font-bold text-emerald-700 uppercase">Completed</p>
                              <p className="text-lg font-black text-emerald-900 mt-0.5">{st.completedCount}</p>
                            </div>
                            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100/70">
                              <p className="text-[11px] font-bold text-amber-700 uppercase">Client Site Time</p>
                              <p className="text-sm font-black text-amber-900 mt-0.5">
                                {Math.floor(st.clientSiteSpentMinutes / 60)}h {st.clientSiteSpentMinutes % 60}m
                              </p>
                            </div>
                            <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100/70">
                              <p className="text-[11px] font-bold text-blue-700 uppercase">GPS Waypoints</p>
                              <p className="text-sm font-black text-blue-900 mt-0.5">
                                {report.liveRouteTimeline.length} Points
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => handleSelectExecutiveCard(report)}
                          className="w-full mt-2 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm text-white hover:opacity-95 active:scale-[0.98]"
                          style={{ background: 'linear-gradient(135deg, #003366 0%, #004080 100%)' }}
                        >
                          <Eye className="h-4 w-4" />
                          View Executive Report & Live GPS Map
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DailyReports;
