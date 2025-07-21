"use client";
import React, { useEffect, useState } from 'react';
import { FaRegCalendarAlt } from "react-icons/fa";

interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
}

interface Props {
  token: string;
  limit?: number;
}

const UpcomingEvents: React.FC<Props> = ({ token, limit = 4 }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      const res = await fetch(`/api/events/upcoming?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setEvents(data);
      setLoading(false);
    }
    fetchEvents();
  }, [token, limit]);

  return (
    <div className="bg-primary rounded-lg p-4 shadow-md">
      {/* <h3 className="text-lg font-bold mb-4 text-accent">Próximos eventos</h3> */}
      {loading ? <div>Cargando...</div> : (
        <div className="grid grid-cols-1 gap-4">
          {events.map(event => (
            <div key={event.id} className="bg-accent/10 rounded-lg p-3 flex flex-col gap-2 animate-fade-in">
              <span className="font-semibold text-accent flex items-center gap-2">
                <FaRegCalendarAlt className="text-accent" size={20} />
                {event.title}
              </span>
              <span className="text-sm text-gray-300">{event.description}</span>
              <span className="text-xs text-gray-400">{new Date(event.startDate).toLocaleString()} - {new Date(event.endDate).toLocaleString()}</span>
              {event.location && <span className="text-xs text-blue-400">{event.location}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingEvents;
