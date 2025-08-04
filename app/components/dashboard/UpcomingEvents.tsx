// import { formatFechaDDMMYYYY } from '../../lib/formatFecha';
"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaCalendarAlt, FaClock, FaExclamationTriangle, FaCalendarDay, FaMapMarkerAlt } from "react-icons/fa";
import { useEventosConfig } from '../../lib/useConfig';

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
  diaEnvio?: string;
  query?: string;
  relatedResources?: string[];
  // Campos adicionales para compatibilidad
  titulo?: string;
  descripcion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  ubicacion?: string;
  eventType?: string; // Usando eventType para consistencia con DetalleEventoPanel
  tipoEvento?: string; // Mantenido por compatibilidad hacia atrás
  esRecurrente?: boolean;
  recurrencePattern?: string;
  tema?: string;
  recursos?: Array<{ id: string; titulo: string; }>;
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
  const { getEventoConfig, loading: configLoading } = useEventosConfig();

  // Obtener URL del backend desde variable de entorno
  const getBackendUrl = () => {
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
  };

  const handleEventClick = (event: Event) => {
    // Extraer solo la parte de la fecha (YYYY-MM-DD) para evitar problemas de zona horaria
    let dateString = event.startDate;
    if (dateString.includes('T')) {
      dateString = dateString.split('T')[0];
    } else if (dateString.length > 10) {
      dateString = dateString.slice(0, 10);
    }
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
        const backendUrl = getBackendUrl();
        const res = await fetch(`${backendUrl}/api/events/upcoming?limit=${limit}`, {
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

  const getEventIcon = (title: string, eventType?: string) => {
    if (configLoading) {
      return <FaCalendarAlt className="text-accent w-4 h-4" />;
    }
    
    // Usar eventType si está disponible, sino inferir del título
    const tipo = eventType || title;
    const config = getEventoConfig(tipo);
    
    // Verificar que la configuración esté completa antes de usar IconComponent
    if (!config || !config.IconComponent) {
      return <FaCalendarAlt className="text-accent w-4 h-4" />;
    }
    
    const IconComponent = config.IconComponent as React.ComponentType<{ className?: string }>;
    
    // Extraer color desde la configuración tailwind
    const colorClass = config.color.split(' ').find(c => c.includes('text-')) || 'text-accent';
    
    return <IconComponent className={`${colorClass} w-4 h-4`} />;
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
        <div className="space-y-2 overflow-y-auto max-h-[750px]">
          {events.map((event) => {
            const eventDate = new Date(event.startDate);
            const now = new Date();
            const diffMs = eventDate.getTime() - now.getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);
            const isToday = eventDate.toDateString() === now.toDateString();
            const isSoon = diffDays <= 2 && diffDays >= 0;
            const isWeekend = eventDate.getDay() === 0 || eventDate.getDay() === 6;
            const highlight = isToday || isSoon || isWeekend;
            
            // Obtener configuración de color del evento
            const eventConfig = getEventoConfig(event.eventType || event.tipoEvento || event.title);
            
            // Verificar que los datos del evento y configuración estén listos
            const isEventDataReady = (event.eventType || event.tipoEvento) && 
                                     !configLoading && 
                                     eventConfig?.item;
            
            return (
              <div 
                key={event.id} 
                className="bg-secondary rounded-lg p-3 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
                onClick={() => handleEventClick(event)}
              >
                <div className={`bg-primary/40 rounded-lg p-2 border-2 ${
                  highlight 
                    ? 'border-red-500 bg-red-900/30 animate-pulse' 
                    : eventConfig?.color ? eventConfig.color.split(' ').find(c => c.includes('border-')) || 'border-yellow-400' : 'border-yellow-400'
                }`}>
                  
                  {/* Header del evento */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      {highlight && (
                        <FaExclamationTriangle className="text-red-500 animate-pulse text-lg" />
                      )}
                      <span className={highlight ? 'text-red-400' : eventConfig?.color ? eventConfig.color.split(' ').find(c => c.includes('text-')) || 'text-yellow-400' : 'text-yellow-400'}>
                        {isEventDataReady ? 
                          getEventIcon(event.title, event.eventType || event.tipoEvento) :
                          <FaCalendarAlt className="text-accent w-4 h-4" />
                        }
                      </span>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-white text-sm">
                          <span className="font-bold text-gray-400 mr-1">Título:</span> 
                          {event.title}
                        </h5>
                      </div>
                    </div>
                    
                    {/* Badge de tiempo hasta el evento */}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded font-medium whitespace-nowrap flex items-center gap-1 ${
                        highlight ? 'bg-red-900/40 text-red-400' : 'bg-accent/10 text-accent'
                      }`}>
                        <FaClock className="text-xs" />
                        {formatTimeUntil(event.startDate)}
                      </span>
                    </div>
                  </div>

                  {/* Descripción */}
                  {event.description && (
                    <p className="text-gray-300 text-xs mb-2 line-clamp-2">
                      <span className="font-bold text-gray-400 mr-1">Descripción:</span> 
                      {event.description}
                    </p>
                  )}
                  
                  {/* Información de fecha y ubicación */}
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 flex items-center gap-1">
                        <FaCalendarDay className="text-gray-400" />
                        <span className="font-bold text-gray-400 mr-1">Fecha:</span> 
                        {eventDate.toLocaleDateString('es-ES', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.location && (
                        <span className="text-gray-400 flex items-center gap-1">
                          <FaMapMarkerAlt className="text-gray-400" />
                          <span className="font-bold text-gray-400 mr-1">Ubicación:</span> {event.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Primera línea de etiquetas */}
                  <div className="flex flex-wrap gap-2 text-xs mb-2">
                    {event.diaEnvio && (
                      <span className="px-2 py-1 rounded bg-blue-400/20 text-blue-400">
                        📅 <span className="font-bold">Día de envío:</span> {event.diaEnvio}
                      </span>
                    )}
                    {event.modo && (
                      <span className="px-2 py-1 rounded bg-yellow-400/20 text-yellow-400">
                        <span className="font-bold mr-1">⚙️ Modo:</span> {event.modo}
                      </span>
                    )}
                  </div>
                  
                  {/* Segunda línea de etiquetas */}
                  <div className="flex flex-wrap gap-2 text-xs mb-2">
                    {event.validador && (
                      <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">
                        <span className="font-bold text-blue-300 mr-1">� Validador:</span> {event.validador}
                      </span>
                    )}
                    {event.codigoDana && (
                      <span className="px-2 py-1 rounded bg-green-500/20 text-green-300">
                        <span className="font-bold text-green-300 mr-1">🏢 Código Dana:</span> {event.codigoDana}
                      </span>
                    )}
                    
                    {/* Tipo de evento */}
                    {(event.eventType || event.tipoEvento) && (
                      <span className={`px-2 py-1 rounded ${eventConfig?.color || 'bg-cyan-500/20 text-cyan-300'}`}>
                        🏷️ <span className="font-bold">Tipo:</span> {eventConfig?.nombre || event.eventType || event.tipoEvento}
                      </span>
                    )}
                  </div>

                  {/* Sección de recursos */}
                  {(event.validador || event.codigoDana || event.modo || event.relatedResources) && (
                    <div className="mt-3 pt-2 border-t border-yellow-400/20">
                      <div className="flex items-center justify-between w-full text-xs">
                        <div className="flex items-center gap-2">
                          {/* Recursos relacionados */}
                          {event.relatedResources && event.relatedResources.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
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
                          ) : (
                            <span className="px-2 py-1 bg-gray-600/20 text-gray-400 text-xs rounded">
                              📄 Sin Recursos disponibles
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {event.relatedResources && event.relatedResources.length > 0 ? (
                            <span className="text-xs px-2 py-1 rounded bg-indigo-500/20 text-indigo-400">
                              <span className="font-bold mr-1">📎 Recursos:</span> {event.relatedResources.length}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded bg-gray-600/20 text-gray-400">
                              📎 Recursos: 0
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mensaje especial para eventos destacados */}
                  {highlight && (
                    <div className="mt-3 pt-2 border-t border-red-400/30">
                      <div className="flex items-center gap-2">
                        <FaExclamationTriangle className="text-red-500 animate-pulse text-sm" />
                        <span className="font-bold text-red-400 text-xs">
                          {isWeekend ? '¡Fin de semana! Se debe reprogramar.' : isToday ? '¡Es hoy!' : '¡Próximo!'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
