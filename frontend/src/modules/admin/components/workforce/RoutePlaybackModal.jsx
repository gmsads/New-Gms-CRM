import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, MapPin, Clock, Navigation, ShieldCheck, Zap } from 'lucide-react';

const RoutePlaybackModal = ({ isOpen, onClose, employee, playbackData, dateString }) => {
  if (!isOpen || !employee) return null;

  const pathPoints = playbackData?.pathPoints || [];
  const stops = playbackData?.stops || [];
  const totalDistanceKm = playbackData?.totalDistanceKm || 0;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeTab, setActiveTab] = useState('playback'); // 'playback' | 'stops' | 'heatmap'

  useEffect(() => {
    let timer;
    if (isPlaying && pathPoints.length > 0) {
      timer = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= pathPoints.length - 1) {
            setIsPlaying(false);
            return pathPoints.length - 1;
          }
          return prev + 1;
        });
      }, Math.max(100, 1000 / playbackSpeed));
    }
    return () => clearInterval(timer);
  }, [isPlaying, pathPoints.length, playbackSpeed]);

  const currentPoint = pathPoints[currentIndex] || null;

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Navigation className="h-6 w-6 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{employee.name || employee.username}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 font-medium border border-indigo-400/30">
                  {employee.role}
                </span>
              </h3>
              <p className="text-xs text-indigo-200 flex items-center gap-2 mt-0.5">
                <span>Shift Route Playback & Intelligence</span>
                <span>•</span>
                <span>{dateString || 'Today'}</span>
                <span>•</span>
                <span className="font-semibold text-emerald-300">{totalDistanceKm} km Total Travel</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <button
            onClick={() => setActiveTab('playback')}
            className={`px-4 py-2 text-sm font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'playback'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-sm'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Route Replay ({pathPoints.length} Points)
          </button>
          <button
            onClick={() => setActiveTab('stops')}
            className={`px-4 py-2 text-sm font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'stops'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-sm'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Detected Stops ({stops.length})
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-4 py-2 text-sm font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'heatmap'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-sm'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Workforce Heatmap Density
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/40">
          {activeTab === 'playback' && (
            <div className="space-y-6">
              {/* Simulated Map Visual Container */}
              <div className="relative h-80 rounded-3xl bg-slate-800 border border-slate-700 overflow-hidden shadow-inner flex flex-col items-center justify-center p-6 text-center">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]"></div>
                
                {currentPoint ? (
                  <div className="relative z-10 max-w-md bg-slate-900/90 border border-slate-700/80 backdrop-blur-md p-6 rounded-2xl shadow-2xl text-left space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Timestamp: {formatTime(currentPoint.timestamp)}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {currentPoint.speed ? `${currentPoint.speed.toFixed(1)} km/h` : '0 km/h'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-400 font-semibold">Current GPS Coordinates</p>
                      <p className="text-sm font-mono text-white tracking-tight">
                        Lat: {currentPoint.latitude?.toFixed(5)} • Lng: {currentPoint.longitude?.toFixed(5)}
                      </p>
                    </div>
                    <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
                      <span>Point {currentIndex + 1} of {pathPoints.length}</span>
                      <span>Heading: {currentPoint.heading || 0}°</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 text-slate-400 space-y-2">
                    <MapPin className="h-10 w-10 text-indigo-400 mx-auto animate-bounce" />
                    <p className="text-sm font-medium">No route tracking points recorded for this shift yet.</p>
                  </div>
                )}
              </div>

              {/* Playback Controls & Scrubber */}
              {pathPoints.length > 0 && (
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all text-white shadow-md ${
                        isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                    </button>
                    <button
                      onClick={() => { setIsPlaying(false); setCurrentIndex(0); }}
                      className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all"
                      title="Reset to Start"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>

                    <div className="flex-1 space-y-1">
                      <input
                        type="range"
                        min="0"
                        max={Math.max(0, pathPoints.length - 1)}
                        value={currentIndex}
                        onChange={(e) => {
                          setIsPlaying(false);
                          setCurrentIndex(Number(e.target.value));
                        }}
                        className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>Start ({formatTime(pathPoints[0]?.timestamp)})</span>
                        <span>End ({formatTime(pathPoints[pathPoints.length - 1]?.timestamp)})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
                      {[1, 2, 4, 8].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => setPlaybackSpeed(spd)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                            playbackSpeed === spd
                              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stops' && (
            <div className="space-y-4">
              {stops.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500">
                  <Clock className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                  <p className="text-sm font-semibold">No stationary stops (&gt; 5 mins) detected today yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stops.map((st, idx) => (
                    <div
                      key={st._id || idx}
                      className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 hover:border-indigo-400 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                            st.category === 'Client Office' ? 'bg-emerald-600' :
                            st.category === 'Office' ? 'bg-indigo-600' :
                            st.category === 'Restaurant' ? 'bg-amber-600' : 'bg-slate-600'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{st.businessName || st.address || 'Detected Stop'}</span>
                              {st.isVerifiedClientSite && (
                                <ShieldCheck className="h-4 w-4 text-emerald-500" title="Verified CRM Client Visit" />
                              )}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">{st.category}</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {st.durationMinutes}m Stay
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        <p className="flex items-center justify-between">
                          <span className="font-semibold">Arrival:</span>
                          <span className="font-mono">{formatTime(st.arrivalTime)}</span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="font-semibold">Departure:</span>
                          <span className="font-mono">{st.departureTime ? formatTime(st.departureTime) : 'Ongoing Stay'}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 truncate pt-1">{st.address}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'heatmap' && (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="h-16 w-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                <Zap className="h-8 w-8 animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Workforce Heatmap Density Ready</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                Aggregated {playbackData?.heatmapData?.length || 0} geo-intensity coordinates across employee travel corridors. Use this layer to visualize time concentration and territory density across sectors.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-all"
          >
            Close Playback
          </button>
        </div>

      </div>
    </div>
  );
};

export default RoutePlaybackModal;
