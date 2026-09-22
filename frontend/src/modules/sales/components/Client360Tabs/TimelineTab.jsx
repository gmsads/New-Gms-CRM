import React, { useEffect, useState } from 'react';
import { useClient360 } from '../../services/client360Service';
import { Clock } from 'lucide-react';

const TimelineTab = ({ phone, company }) => {
  const { fetchPaginated, loading } = useClient360();
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadTimeline();
  }, [phone, company, page]);

  const loadTimeline = async () => {
    try {
      const res = await fetchPaginated(clientId, 'timeline', page, 20);
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && events.length === 0) return <div className="p-6 text-slate-500">Loading timeline...</div>;

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-6 text-slate-800 flex items-center gap-2">
        <Clock className="w-5 h-5 text-slate-500" />
        Activity Timeline
      </h3>
      
      {events.length === 0 ? (
        <div className="text-slate-500 py-4 text-center bg-slate-50 rounded-lg">No activities recorded yet.</div>
      ) : (
        <div className="relative border-l-2 border-slate-200 ml-3 pl-6 space-y-8">
          {events.map((event, idx) => (
            <div key={`${event._id}-${idx}`} className="relative">
              {/* Timeline dot */}
              <div className="absolute -left-[31px] bg-white p-1 rounded-full">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
              </div>
              
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-slate-800">{event.title}</h4>
                  <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                    {new Date(event.date).toLocaleString()}
                  </span>
                </div>
                {event.description && <p className="text-sm text-slate-600 mb-3">{event.description}</p>}
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <span>By:</span> <span className="font-medium text-slate-700">{event.user}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimelineTab;
