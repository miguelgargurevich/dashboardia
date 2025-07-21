"use client";
import React, { useEffect, useState } from 'react';
import { FaRegCalendarAlt } from "react-icons/fa";

interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  validador?: string;
  modo?: string;
  codigoDana?: string;
  nombreNotificacion?: string;
  diaEnvio?: string;
  query?: string;
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
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 mt-2">
                <div><span className="font-bold text-accent">Validador:</span> {event.validador || '-'}</div>
                <div><span className="font-bold text-accent">Modo:</span> {event.modo || '-'}</div>
                <div><span className="font-bold text-accent">Código DANA:</span> {event.codigoDana || '-'}</div>
                <div><span className="font-bold text-accent">Notificación:</span> {event.nombreNotificacion || '-'}</div>
                <div><span className="font-bold text-accent">Día envío:</span> {event.diaEnvio || '-'}</div>
                <div><span className="font-bold text-accent">Query:</span> {event.query || '-'}</div>
                <div><span className="font-bold text-accent">Descripción:</span> {event.description || '-'}</div>
                <div><span className="font-bold text-accent">Ubicación:</span> {event.location || '-'}</div>
              </div>
              <span className="text-xs text-gray-400">{event.startDate ? new Date(event.startDate).toLocaleString() : '-'} - {event.endDate ? new Date(event.endDate).toLocaleString() : '-'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingEvents;
