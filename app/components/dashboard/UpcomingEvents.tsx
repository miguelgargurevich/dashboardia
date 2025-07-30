"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaCalendarAlt, FaTools, FaChalkboardTeacher, FaUsers, FaRobot, FaClipboardList, FaLaptop, FaClock } from "react-icons/fa";

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
  relatedResources?: string[];
}

interface Props {
  token: string;
  limit?: number;
  onEventClick?: (date: string) => void;
}

const UpcomingEvents: React.FC<Props> = ({ token, limit = 5, onEventClick }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleEventClick = (event: Event) => {
    // Extraer la fecha directamente del string sin convertir a Date para evitar problemas de zona horaria
    const dateString = event.startDate.split('T')[0]; // Obtiene solo la parte de fecha (YYYY-MM-DD)
    
    // Si hay callback, usarla para comunicarse con el calendario del home
    if (onEventClick) {
      onEventClick(dateString);
    } else {
      // Fallback: navegar al calendario si no hay callback (para otros usos del componente)
      router.push(`/calendar?date=${dateString}&tab=events`);
    }
  };

  useEffect(() => {
    async function fetchUpcomingEvents() {
      setLoading(true);
      try {
        const res = await fetch(`/api/events/upcoming?limit=${limit}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setEvents(Array.isArray(data) ? data : []);
        } else if (res.status === 401) {
          // Token expirado o inválido, redirigir al login
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        } else {
          console.error('Error fetching upcoming events:', res.statusText);
          setEvents([]);
        }
      } catch (error) {
        console.error('Error fetching upcoming events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUpcomingEvents();
  }, [token, limit]);

  const getEventIcon = (title: string) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('mantenimiento')) return <FaTools className="text-yellow-400" />;
    if (titleLower.includes('capacitación')) return <FaChalkboardTeacher className="text-blue-400" />;
    if (titleLower.includes('reunión')) return <FaUsers className="text-green-400" />;
    if (titleLower.includes('webinar')) return <FaRobot className="text-purple-400" />;
    if (titleLower.includes('revisión')) return <FaClipboardList className="text-orange-400" />;
    if (titleLower.includes('demo')) return <FaLaptop className="text-pink-400" />;
    return <FaCalendarAlt className="text-accent" />;
  };

  const formatTimeUntil = (eventDate: string) => {
    const now = new Date();
    const event = new Date(eventDate);
    const diffMs = event.getTime() - now.getTime();
    
    if (diffMs < 0) return 'En curso';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `En ${days} día${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `En ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
      return 'Muy pronto';
    }
  };

  if (loading) {
    return (
      <div className="bg-primary rounded-lg p-4 shadow-md">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
          <p className="ml-2 text-gray-400">Cargando próximos eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary rounded-lg p-4 shadow-md">
      {events.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {events.map((event) => (
            <div 
              key={event.id} 
              className="bg-primary/40 rounded-lg p-3 border border-accent/20 hover:border-accent/40 transition-colors cursor-pointer hover:bg-primary/60"
              onClick={() => handleEventClick(event)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  {getEventIcon(event.title)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-sm leading-tight">
                      {event.title}
                    </h4>
                    <p className="text-xs text-gray-400">
                      {new Date(event.startDate).toLocaleDateString('es-ES', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent font-medium whitespace-nowrap flex items-center gap-1">
                    <FaClock className="text-xs" />
                    {formatTimeUntil(event.startDate)}
                  </span>
                </div>
              </div>

              {event.description && (
                <p className="text-xs text-gray-300 mb-2 line-clamp-2">
                  {event.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex flex-wrap gap-2">
                  {event.modo && (
                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">{event.modo}</span>
                  )}
                  {event.validador && (
                    <span className="px-2 py-1 rounded bg-green-500/20 text-green-300">👤 {event.validador}</span>
                  )}
                  {event.codigoDana && (
                    <span className="px-2 py-1 rounded bg-green-700/20 text-green-400">🏢 {event.codigoDana}</span>
                  )}
                  {event.nombreNotificacion && (
                    <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300">� {event.nombreNotificacion}</span>
                  )}
                  {event.diaEnvio && (
                    <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">📅 {event.diaEnvio}</span>
                  )}
                  {event.query && (
                    <span className="px-2 py-1 rounded bg-gray-500/20 text-gray-300" title={event.query}>🔎 {event.query.length > 20 ? event.query.slice(0,20) + '…' : event.query}</span>
                  )}
                  {event.relatedResources && event.relatedResources.length > 0 && (
                    <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-300">📎 {event.relatedResources.length}</span>
                  )}
                </div>
                {event.location && (
                  <span className="text-gray-400 truncate max-w-32">📍 {event.location}</span>
                )}
              </div>

              {/* Recursos relacionados */}
              {event.relatedResources && event.relatedResources.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {event.relatedResources.slice(0, 3).map((resource, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-600/20 text-gray-300 text-xs rounded truncate max-w-24">
                      📄 {resource}
                    </span>
                  ))}
                  {event.relatedResources.length > 3 && (
                    <span className="px-2 py-1 bg-gray-600/20 text-gray-400 text-xs rounded">
                      +{event.relatedResources.length - 3} más
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <FaCalendarAlt className="mx-auto text-4xl text-gray-600 mb-4" />
          <p className="text-gray-400">No hay eventos próximos programados</p>
        </div>
      )}
    </div>
  );
};

export default UpcomingEvents;
