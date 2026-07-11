import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import RoutePlaybackModal from '../components/workforce/RoutePlaybackModal';
import { 
  Users, MapPin, Navigation, Clock, ShieldCheck, Zap, RefreshCw, 
  Search, Calendar, ChevronRight, Activity, BatteryCharging, FileSpreadsheet,
  Building2, Briefcase, Coffee, AlertCircle, CheckCircle2
} from 'lucide-react';

const WorkforceTimelineDashboard = () => {
  const { user } = useAuth();
  const token = user?.token;

  const [liveWorkforce, setLiveWorkforce] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Selected employee detail & playback
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [timelineDetail, setTimelineDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [playbackModalOpen, setPlaybackModalOpen] = useState(false);

  // Reports view state
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'timeline' | 'reports'
  const [selectedReportType, setSelectedReportType] = useState('Employee Timeline Report');
  const [reportData, setReportData] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);

  // Fetch live workforce status
  const fetchLiveStatus = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/timeline/live-status?branch=${selectedBranch}&role=${selectedRole}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setLiveWorkforce(json.data || []);
        if (json.data && json.data.length > 0 && !selectedEmployee) {
          setSelectedEmployee(json.data[0].user);
        }
      } else {
        setError(json.message || 'Failed to fetch workforce status.');
      }
    } catch (err) {
      console.error('Workforce live status fetch error:', err);
      setError('Error connecting to workforce tracking server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 45000); // auto-refresh every 45s
    return () => clearInterval(interval);
  }, [token, selectedBranch, selectedRole]);

  // Fetch daily timeline for selected employee when clicked or date changes
  useEffect(() => {
    if (!selectedEmployee || !token) return;
    const fetchDetail = async () => {
      try {
        setLoadingDetail(true);
        const res = await fetch(`/api/timeline/employee/${selectedEmployee._id}/daily?dateString=${selectedDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setTimelineDetail(json.data);
        }
      } catch (err) {
        console.error('Timeline detail fetch error:', err);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchDetail();
  }, [selectedEmployee, selectedDate, token]);

  // Fetch report when in reports tab
  useEffect(() => {
    if (activeTab !== 'reports' || !token) return;
    const fetchReport = async () => {
      try {
        setLoadingReport(true);
        const res = await fetch(`/api/timeline/reports/${encodeURIComponent(selectedReportType)}?startDate=${selectedDate}&endDate=${selectedDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setReportData(json.data || []);
        }
      } catch (err) {
        console.error('Report fetch error:', err);
      } finally {
        setLoadingReport(false);
      }
    };
    fetchReport();
  }, [activeTab, selectedReportType, selectedDate, token]);

  // Filter live workforce grid by search
  const filteredWorkforce = liveWorkforce.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.user.name && item.user.name.toLowerCase().includes(q)) ||
      (item.user.username && item.user.username.toLowerCase().includes(q)) ||
      (item.user.role && item.user.role.toLowerCase().includes(q)) ||
      (item.currentAddress && item.currentAddress.toLowerCase().includes(q))
    );
  });

  // Calculate top KPI statistics
  const totalActiveOnShift = liveWorkforce.filter(item => item.session && item.status !== 'Shift Ended (Logged Out)').length;
  const totalDistanceCovered = liveWorkforce.reduce((acc, curr) => acc + (curr.distanceKm || 0), 0);
  const totalStopsLogged = liveWorkforce.reduce((acc, curr) => acc + (curr.stopsCount || 0), 0);

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Top Header & Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Activity className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Enterprise Workforce Intelligence</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Continuous Tracking Layer
              </span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Silent parallel workday tracking from Login to Logout • Stop Detection • Route Replay
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={fetchLiveStatus}
            className="h-10 px-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-bold text-sm flex items-center gap-2 transition-all border border-indigo-200 dark:border-indigo-800"
            title="Refresh Live Status"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Users className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Shift Workforce</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalActiveOnShift} <span className="text-sm font-semibold text-slate-400">/ {liveWorkforce.length}</span>
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Navigation className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Total Travel</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalDistanceCovered.toFixed(1)} <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">km</span>
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <MapPin className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Stops Detected Today</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalStopsLogged} <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">Stops</span>
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Clock className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tracking Frequency</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
              Adaptive <span className="text-xs font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950">60s Ping</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeTab === 'live'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Live Workforce Grid & Timeline Feed</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Enterprise Reports Export Hub</span>
          </button>
        </div>

        <div className="relative w-64 sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee, role, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'live' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Live Workforce Employee List (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4 max-h-[820px] flex flex-col">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span>On-Field & Sales Employees</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                {filteredWorkforce.length} Active
              </span>
            </h2>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loading && liveWorkforce.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading workforce status...</div>
              ) : filteredWorkforce.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No employees found matching filter.</div>
              ) : (
                filteredWorkforce.map((item) => {
                  const u = item.user;
                  const isSelected = selectedEmployee && selectedEmployee._id === u._id;
                  const isWorking = item.session && item.status !== 'Shift Ended (Logged Out)';

                  return (
                    <div
                      key={u._id}
                      onClick={() => setSelectedEmployee(u)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 shadow-sm'
                          : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="relative">
                          <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
                            isWorking ? 'bg-indigo-600' : 'bg-slate-400'
                          }`}>
                            {u.name ? u.name.charAt(0).toUpperCase() : u.username?.charAt(0).toUpperCase()}
                          </div>
                          <span className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                            item.status.includes('Moving') ? 'bg-blue-500' :
                            item.status.includes('Stationary') ? 'bg-emerald-500' :
                            isWorking ? 'bg-indigo-500' : 'bg-slate-400'
                          }`} title={item.status} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                            <span>{u.name || u.username}</span>
                            {item.batteryLevel != null && (
                              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5">
                                <BatteryCharging className="h-3 w-3 text-emerald-500" />
                                {item.batteryLevel}%
                              </span>
                            )}
                          </h3>
                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate">{u.role}</p>
                          <p className="text-[11px] text-slate-500 truncate mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3 flex-shrink-0 text-slate-400" />
                            <span className="truncate">{item.currentAddress || 'No location reported yet'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 space-y-1">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                          item.status.includes('Moving') ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                          item.status.includes('Stationary') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                          isWorking ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {item.status}
                        </span>
                        <p className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                          {item.distanceKm || 0} km • {item.stopsCount || 0} stops
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Seen {formatTime(item.lastSeen)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Employee Workday Timeline & Shift Breakdown (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6 max-h-[820px] flex flex-col">
            {selectedEmployee ? (
              <>
                {/* Header Profile & Route Playback Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{selectedEmployee.name || selectedEmployee.username}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                        {selectedEmployee.role}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Shift Timeline & Productivity Breakdown • {selectedDate}
                    </p>
                  </div>

                  <button
                    onClick={() => setPlaybackModalOpen(true)}
                    disabled={!timelineDetail?.playback?.pathPoints?.length}
                    className={`h-10 px-4 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
                      timelineDetail?.playback?.pathPoints?.length
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Navigation className="h-4 w-4" />
                    <span>Launch Route Replay & Map</span>
                  </button>
                </div>

                {/* Shift Breakdown Progress Bar Card */}
                {timelineDetail && timelineDetail.summary ? (
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Workday Shift Classification Breakdown</span>
                      <span>Total Shift: {Math.round((timelineDetail.summary.totalWorkingMinutes || 0) / 60 * 10) / 10}h</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                      <div
                        style={{ width: `${Math.min(100, (timelineDetail.summary.breakdownMinutes?.client || 0) / Math.max(1, timelineDetail.summary.totalWorkingMinutes) * 100)}%` }}
                        className="bg-emerald-500 h-full transition-all"
                        title={`Client Time: ${timelineDetail.summary.breakdownMinutes?.client || 0}m`}
                      />
                      <div
                        style={{ width: `${Math.min(100, (timelineDetail.summary.breakdownMinutes?.office || 0) / Math.max(1, timelineDetail.summary.totalWorkingMinutes) * 100)}%` }}
                        className="bg-indigo-500 h-full transition-all"
                        title={`Office Time: ${timelineDetail.summary.breakdownMinutes?.office || 0}m`}
                      />
                      <div
                        style={{ width: `${Math.min(100, (timelineDetail.summary.breakdownMinutes?.travel || 0) / Math.max(1, timelineDetail.summary.totalWorkingMinutes) * 100)}%` }}
                        className="bg-blue-500 h-full transition-all"
                        title={`Travel Time: ${timelineDetail.summary.breakdownMinutes?.travel || 0}m`}
                      />
                      <div
                        style={{ width: `${Math.min(100, (timelineDetail.summary.breakdownMinutes?.break || 0) / Math.max(1, timelineDetail.summary.totalWorkingMinutes) * 100)}%` }}
                        className="bg-amber-500 h-full transition-all"
                        title={`Break Time: ${timelineDetail.summary.breakdownMinutes?.break || 0}m`}
                      />
                      <div
                        style={{ width: `${Math.min(100, (timelineDetail.summary.breakdownMinutes?.idle || 0) / Math.max(1, timelineDetail.summary.totalWorkingMinutes) * 100)}%` }}
                        className="bg-rose-500 h-full transition-all"
                        title={`Idle Time: ${timelineDetail.summary.breakdownMinutes?.idle || 0}m`}
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-[11px] font-bold">
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <span>Client: {timelineDetail.summary.breakdownMinutes?.client || 0}m</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                        <span>Office: {timelineDetail.summary.breakdownMinutes?.office || 0}m</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                        <span>Travel: {timelineDetail.summary.breakdownMinutes?.travel || 0}m</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                        <span>Break: {timelineDetail.summary.breakdownMinutes?.break || 0}m</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                        <span>Idle: {timelineDetail.summary.breakdownMinutes?.idle || 0}m</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                    Workday shift breakdown metrics will auto-generate as the employee emits tracking events.
                  </div>
                )}

                {/* Chronological Timeline Feed */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>Silent Background Timeline Feed ({timelineDetail?.events?.length || 0} Events)</span>
                    {loadingDetail && <span className="text-indigo-500 lowercase font-normal">refreshing...</span>}
                  </h3>

                  {loadingDetail ? (
                    <div className="p-12 text-center text-slate-400 text-sm animate-pulse">Loading employee shift timeline...</div>
                  ) : !timelineDetail?.events || timelineDetail.events.length === 0 ? (
                    <div className="p-12 text-center bg-slate-50 dark:bg-slate-950/40 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 space-y-2">
                      <Clock className="h-10 w-10 mx-auto text-slate-300" />
                      <p className="text-sm font-semibold">No timeline events recorded for this date yet.</p>
                      <p className="text-xs text-slate-400">Events are logged automatically on Login, travel start, stationary stop arrivals, and Logout.</p>
                    </div>
                  ) : (
                    <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-6">
                      {timelineDetail.events.map((ev, idx) => (
                        <div key={ev._id || idx} className="relative group">
                          {/* Timeline dot */}
                          <span className={`absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm flex items-center justify-center ${
                            ev.eventType === 'LOGIN' ? 'bg-emerald-500' :
                            ev.eventType === 'LOGOUT' ? 'bg-rose-500' :
                            ev.eventType === 'ARRIVED_STOP' ? 'bg-indigo-600' :
                            ev.eventType === 'DEPARTED_STOP' ? 'bg-purple-600' :
                            'bg-blue-500'
                          }`} />

                          <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-400 transition-all space-y-2 shadow-sm">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span>{ev.title}</span>
                                {ev.location?.category && (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    ev.location.category === 'Client Office' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                    ev.location.category === 'Office' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                                    'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  }`}>
                                    {ev.location.category}
                                  </span>
                                )}
                              </h4>
                              <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 flex-shrink-0">
                                {formatTime(ev.timestamp)}
                              </span>
                            </div>

                            {ev.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                {ev.description}
                              </p>
                            )}

                            {ev.location?.address && (
                              <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{ev.location.address}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3">
                <Users className="h-12 w-12 mx-auto text-slate-300" />
                <p className="text-base font-bold text-slate-600 dark:text-slate-300">Select an employee from the left panel</p>
                <p className="text-xs text-slate-400 max-w-sm">View their real-time shift timeline, stop duration analytics, and route replay maps.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Reports Export Hub Tab */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Enterprise Workforce Reports</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  6 Report Formats
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Filter, view, and export multi-dimensional employee tracking datasets.</p>
            </div>

            <div className="flex items-center gap-2">
              {[
                'Employee Timeline Report', 'Daily Movement Report', 'Stop History Report',
                'Location Duration Report', 'Workday Summary Report', 'Route Replay Report'
              ].map((rpt) => (
                <button
                  key={rpt}
                  onClick={() => setSelectedReportType(rpt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedReportType === rpt
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {rpt.replace(' Report', '')}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loadingReport ? (
              <div className="p-16 text-center text-slate-400 text-sm animate-pulse">Generating {selectedReportType}...</div>
            ) : reportData.length === 0 ? (
              <div className="p-16 text-center text-slate-400 text-sm">No report records found for {selectedReportType} on {selectedDate}.</div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-extrabold uppercase">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Role / Dept</th>
                    <th className="py-3 px-4">Event / Category</th>
                    <th className="py-3 px-4">Timestamp / Date</th>
                    <th className="py-3 px-4">Details / Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                  {reportData.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {row.userId?.name || row.employee?.name || row.userId?.username || row.employee || 'Employee'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {row.userId?.role || row.role || 'Operations'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">
                          {row.eventType || row.category || row.segmentType || selectedReportType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {row.timestamp ? formatTime(row.timestamp) : row.date || row.dateString || selectedDate}
                      </td>
                      <td className="py-3 px-4">
                        {row.title || row.address || `${row.totalWorkingMinutes || row.durationMinutes || 0} mins`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Interactive Route Playback Modal */}
      <RoutePlaybackModal
        isOpen={playbackModalOpen}
        onClose={() => setPlaybackModalOpen(false)}
        employee={selectedEmployee}
        playbackData={timelineDetail?.playback}
        dateString={selectedDate}
      />
    </div>
  );
};

export default WorkforceTimelineDashboard;
