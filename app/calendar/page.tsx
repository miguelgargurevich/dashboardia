"use client";
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AssistantBubble from '../components/AsisstantIA/AssistantBubble';
import { 
  FaCalendarAlt, 
  FaAngleLeft, 
  FaAngleRight, 
  FaRegCalendarAlt, 
  FaFileAlt
} from "react-icons/fa";



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
  isRecurring?: boolean;
  recurrencePattern?: string;
}



const Calendar: React.FC = () => {
  const searchParams = useSearchParams();
  
  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decodificar el token para ver su contenido (sin verificar)
        const payload = JSON.parse(atob(token.split('.')[1]));
      } catch (error) {
      }
    }
    if (!token) {
      window.location.href = '/login';
      return;
    }
  }, []);
  
  // Estados del calendario
  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();
  
  // Leer parámetros de URL para configuración inicial
  const urlDate = searchParams.get('date');
  
  const initialDate = urlDate || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const [visibleMonth, setVisibleMonth] = useState<string>(initialDate.slice(0,7));
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [events, setEvents] = useState<Event[]>([]);
  const [recurringEvents, setRecurringEvents] = useState<Event[]>([]);
  const [showRecurringEvents, setShowRecurringEvents] = useState<boolean>(true);
  // const [loading, setLoading] = useState(false); // Eliminado: ya no se usa
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [isUsingMockData] = useState(false); // Solo lectura, para mostrar banner si aplica
  
  // Estados para eventos recurrentes - ELIMINADOS
  
  // Estados del formulario para notas
  // Estados de vista
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const weekDays = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  // Token para autenticación
  const getToken = () => localStorage.getItem('token');

  // Generar días del mes
  const [yyyy, mm] = visibleMonth.split('-');
  const year = Number(yyyy);
  const mon = Number(mm) - 1;
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  let firstDayOfWeek = new Date(year, mon, 1).getDay();
  firstDayOfWeek = (firstDayOfWeek === 0) ? 6 : firstDayOfWeek - 1;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);



  // Navegación de meses
  const changeMonth = (offset: number) => {
    const [yyyy, mm] = visibleMonth.split('-');
    let year = Number(yyyy);
    let month = Number(mm) - 1 + offset;
    
    if (month < 0) {
      year -= 1;
      month = 11;
    } else if (month > 11) {
      year += 1;
      month = 0;
    }
    
    setVisibleMonth(`${year}-${String(month + 1).padStart(2, '0')}`);
  };

  const goToToday = () => {
    setVisibleMonth(today.toISOString().slice(0,7));
    setSelectedDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
  };

  // Obtener eventos del día seleccionado (incluyendo recurrentes si están habilitados)
  const selectedDayEvents = (() => {
    const regularEvents = events.filter(event => {
      const eventDate = new Date(event.startDate).toISOString().slice(0, 10);
      return eventDate === selectedDate;
    });
    
    const dayRecurringEvents = showRecurringEvents ? recurringEvents.filter(event => {
      const eventDate = new Date(event.startDate).toISOString().slice(0, 10);
      return eventDate === selectedDate;
    }) : [];
    
    return [...regularEvents, ...dayRecurringEvents];
  })();


  // Obtener eventos del día (sin notas)
  const getDayContent = (dateString: string) => {
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startDate).toISOString().slice(0, 10);
      return eventDate === dateString;
    });
    const dayRecurringEvents = showRecurringEvents ? recurringEvents.filter(event => {
      const eventDate = new Date(event.startDate).toISOString().slice(0, 10);
      return eventDate === dateString;
    }) : [];
    const allEvents = [...dayEvents, ...dayRecurringEvents];
    return {
      date: dateString,
      events: allEvents,
      hasContent: allEvents.length > 0,
      eventsCount: allEvents.length
    };
  };

  // Función para cargar eventos
  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const token = getToken();
      const response = await fetch(`/api/events/calendar?month=${visibleMonth}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const eventData = await response.json();
      if (Array.isArray(eventData)) {
        const transformedEvents = eventData.map((event: any) => ({
          ...event,
          isRecurring: isRecurringEvent(event),
          recurrencePattern: getRecurrencePattern(event)
        }));
        const regularEvents = transformedEvents.filter((event: any) => !event.isRecurring);
        const recurringEventsData = transformedEvents.filter((event: any) => event.isRecurring);
        setEvents(regularEvents);
        setRecurringEvents(recurringEventsData);
      } else {
        setEvents([]);
        setRecurringEvents([]);
      }
    } catch (error) {
      setEvents([]);
      setRecurringEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Función para detectar si un evento es recurrente
  const isRecurringEvent = (event: any): boolean => {
    // Primero verificar si el evento tiene la propiedad isRecurring del backend
    if (event.isRecurring !== undefined) {
      console.log(`[Calendar] ✅ Evento "${event.title}" marcado como recurrente por campo isRecurring: ${event.isRecurring}`);
      return event.isRecurring;
    }
    
    // Si no tiene el campo, usar detección por palabras clave
    const title = event.title?.toLowerCase() || '';
    const description = event.description?.toLowerCase() || '';
    const textToCheck = `${title} ${description}`;
    
    // Palabras clave que indican eventos recurrentes
    const recurringKeywords = [
      'semanal', 'mensual', 'diario', 'trimestral', 'anual',
      'cada', 'todos los', 'rutina', 'mantenimiento', 'respaldo',
      'backup', 'revisión', 'reporte', 'integrales', 'periódico',
      'recurrente', 'repetir', 'ciclo', 'programado', 'automático',
      'quincenal', 'bimestral', 'semestre', 'horario', 'regular',
      'continuo', 'permanente', 'fijo', 'sistemático'
    ];
    
    const hasKeyword = recurringKeywords.some(keyword => textToCheck.includes(keyword));
    
    // Log para debugging
    if (hasKeyword) {
      const foundKeywords = recurringKeywords.filter(keyword => textToCheck.includes(keyword));
      console.log(`[Calendar] ✅ Evento "${event.title}" marcado como recurrente por palabras: ${foundKeywords.join(', ')}`);
    } else {
      console.log(`[Calendar] ❌ Evento "${event.title}" NO marcado como recurrente. Texto analizado: "${textToCheck}"`);
    }
    
    return hasKeyword;
  };

  // Función para determinar el patrón de recurrencia basado en el evento
  const getRecurrencePattern = (event: any): string => {
    const title = event.title?.toLowerCase() || '';
    
    if (title.includes('diario') || title.includes('respaldo')) {
      return 'Diario';
    } else if (title.includes('semanal')) {
      return 'Semanal';
    } else if (title.includes('mensual') || title.includes('integrales')) {
      return 'Mensual';
    } else if (title.includes('trimestral')) {
      return 'Trimestral';
    } else if (title.includes('anual')) {
      return 'Anual';
    } else if (title.includes('cada lunes')) {
      return 'Cada lunes';
    } else if (title.includes('cada 15')) {
      return 'Cada 15 del mes';
    } else {
      return 'Recurrente';
    }
  };


  // Efectos
  useEffect(() => {
   
    fetchEvents(); // Cargar eventos (incluye regulares y recurrentes)
  }, [visibleMonth, viewMode]);





  return (
    <div className="min-h-screen bg-primary text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-accent mb-2 flex items-center gap-2">
              <FaCalendarAlt />
              Calendario de Actividades Diarias
            </h1>
            {isUsingMockData && (
              <div className="bg-yellow-600/20 border border-yellow-600/40 rounded-lg px-3 py-1">
                <span className="text-yellow-400 text-sm font-medium">
                  ⚠️ Modo sin conexión - Usando datos de muestra
                </span>
              </div>
            )}
          </div>
          <p className="text-gray-400">Gestión y seguimiento de actividades diarias del equipo de soporte</p>
        </div>

        {/* Controles superiores */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-secondary border border-accent/20 rounded-xl shadow-lg p-1">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                  viewMode === 'calendar' 
                    ? 'bg-accent text-white shadow-md' 
                    : 'text-accent hover:bg-accent/10'
                }`}
                onClick={() => setViewMode('calendar')}
              >
                <FaCalendarAlt />
                Calendario
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                  viewMode === 'list' 
                    ? 'bg-accent text-white shadow-md' 
                    : 'text-accent hover:bg-accent/10'
                }`}
                onClick={() => setViewMode('list')}
              >
                <FaFileAlt />
                Lista
              </button>
            </div>
            
            {/* Control de eventos recurrentes */}
            <div className="flex items-center gap-2">
              <button
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors font-medium text-sm border ${
                  showRecurringEvents 
                    ? 'bg-purple-600/20 border-purple-600/40 text-purple-400 hover:bg-purple-600/30' 
                    : 'bg-gray-600/20 border-gray-600/40 text-gray-400 hover:bg-gray-600/30'
                }`}
                onClick={() => setShowRecurringEvents(!showRecurringEvents)}
                title={showRecurringEvents ? 'Ocultar eventos recurrentes' : 'Mostrar eventos recurrentes'}
              >
                <FaCalendarAlt />
                {showRecurringEvents ? 'Ocultar' : 'Mostrar'} Recurrentes
                {loadingEvents && (
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                )}
                {!loadingEvents && recurringEvents.length > 0 && (
                  <span className="text-xs bg-purple-500/30 px-1 rounded-full">
                    {recurringEvents.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vista de Calendario o Lista */}
          {viewMode === 'calendar' ? (
            <>
              {/* Columna del Calendario */}
              <div className="lg:col-span-2 space-y-6">
                {/* Calendario */}
                <div className="bg-secondary border border-accent/20 rounded-xl shadow-lg p-6">
                  {/* Navegación del calendario */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-accent">
                      {monthNames[mon]} {year}
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 rounded text-accent hover:bg-accent/10 transition-colors"
                        onClick={() => changeMonth(-1)}
                      >
                        <FaAngleLeft />
                      </button>
                      <button
                        className="px-3 py-2 rounded text-accent font-bold flex items-center hover:bg-accent/10 transition-colors"
                        onClick={goToToday}
                      >
                        <FaRegCalendarAlt className="mr-2" />
                        Hoy
                      </button>
                      <button
                        className="p-2 rounded text-accent hover:bg-accent/10 transition-colors"
                        onClick={() => changeMonth(1)}
                      >
                        <FaAngleRight />
                      </button>
                    </div>
                  </div>

                  {/* Grid del calendario */}
                  <div className="grid grid-cols-7 gap-2">
                    {/* Cabecera días de la semana */}
                    {weekDays.map((day) => (
                      <div key={day} className="text-xs font-bold text-accent text-center pb-2">
                        {day}
                      </div>
                    ))}
                    
                    {/* Espacios vacíos */}
                    {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                      <div key={`empty-${idx}`}></div>
                    ))}
                    
                    {/* Días del mes */}
                    {days.map(day => {
                      const dayKey = `${year}-${String(mon + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const dayContent = getDayContent(dayKey);
                      const isSelected = selectedDate === dayKey;
                      const isToday = day === todayDay && mon === todayMonth && year === todayYear;
                      
                      return (
                        <div
                          key={day}
                          className={`relative rounded-lg p-1 text-center cursor-pointer border transition-all duration-200 min-h-[80px] flex flex-col justify-start
                            ${isSelected ? 'ring-2 ring-accent bg-accent/20' : 'border-accent/30 hover:border-accent/60'}
                            ${isToday ? 'border-2 border-blue-400' : ''}
                            ${dayContent.hasContent ? 'bg-accent/10' : 'bg-primary/40'}
                          `}
                          onClick={() => setSelectedDate(dayKey)}
                        >
                          <span className={`text-sm font-medium mb-1 ${dayContent.hasContent ? 'text-accent' : 'text-white'}`}>
                            {day}
                          </span>
                          
                          {/* Contenido del día - Solo eventos */}
                          <div className="flex flex-col gap-1 w-full overflow-hidden">
                            {dayContent.events.slice(0, 4).map((event, index) => (
                              <div key={`event-${event.id}-${index}-${event.isRecurring ? 'recurring' : 'regular'}`} className="w-full">
                                <div className={`text-xs px-1 py-0.5 rounded text-black truncate ${
                                  event.isRecurring ? 'bg-purple-500/80' : 'bg-yellow-500/80'
                                }`}>
                                  {event.isRecurring && '🔄 '}{event.title}
                                </div>
                              </div>
                            ))}
                            {/* Contador si hay más de 4 eventos */}
                            {dayContent.eventsCount > 4 && (
                              <div className="text-xs text-accent font-bold">
                                +{dayContent.eventsCount - 4} más
                              </div>
                            )}
                            {/* Contador compacto solo de eventos */}
                            {dayContent.hasContent && (
                              <div className="flex justify-end text-xs mt-1">
                                <span className="text-yellow-400 font-bold">{dayContent.eventsCount}E</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Panel de Eventos del Día */}
                <div className="bg-secondary border border-accent/20 rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-accent flex items-center gap-2">
                      <FaCalendarAlt />
                      Eventos del Día ({selectedDayEvents.length})
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {loadingEvents ? (
                      <div className="text-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto"></div>
                        <p className="text-gray-400 mt-2 text-sm">Cargando eventos...</p>
                      </div>
                    ) : selectedDayEvents.length > 0 ? (
                      <div className="space-y-3">
                        {selectedDayEvents.map((event, index) => (
                          <div key={`selected-event-${event.id}-${index}-${event.isRecurring ? 'recurring' : 'regular'}-${event.startDate}`} className="bg-primary/40 border border-blue-400/30 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-blue-400">
                                  {event.isRecurring ? '🔄' : <FaCalendarAlt />}
                                </span>
                                <h5 className="font-semibold text-white text-sm">{event.title}</h5>
                              </div>
                              {event.isRecurring && (
                                <span className="text-xs text-blue-400 px-2 py-1 rounded bg-blue-400/10">
                                  Recurrente
                                </span>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-gray-300 text-xs mb-2">{event.description}</p>
                            )}
                            {/* Información detallada del evento */}
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">
                                  {event.isRecurring ? 'Evento Recurrente' : 'Evento'}
                                </span>
                                <span className="text-gray-400">
                                  {new Date(event.startDate).toLocaleTimeString('es-ES', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                  {event.endDate && (
                                    <span> - {new Date(event.endDate).toLocaleTimeString('es-ES', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}</span>
                                  )}
                                </span>
                              </div>
                              {event.location && (
                                <div className="text-gray-400">
                                  📍 <span className="font-medium">Ubicación:</span> {event.location}
                                </div>
                              )}
                              {event.recurrencePattern && (
                                <div className="text-blue-400">
                                  🔄 <span className="font-medium">Patrón:</span> {event.recurrencePattern}
                                </div>
                              )}
                              {event.validador && (
                                <div className="text-gray-400">
                                  ✅ <span className="font-medium">Validador:</span> {event.validador}
                                </div>
                              )}
                              {event.modo && (
                                <div className="text-gray-400">
                                  � <span className="font-medium">Modo:</span> {event.modo}
                                </div>
                              )}
                              {event.codigoDana && (
                                <div className="text-gray-400">
                                  🏷️ <span className="font-medium">Código DANA:</span> {event.codigoDana}
                                </div>
                              )}
                              {event.nombreNotificacion && (
                                <div className="text-gray-400">
                                  � <span className="font-medium">Notificación:</span> {event.nombreNotificacion}
                                </div>
                              )}
                              {event.diaEnvio && (
                                <div className="text-gray-400">
                                  📅 <span className="font-medium">Día de Envío:</span> {event.diaEnvio}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <FaCalendarAlt className="mx-auto text-3xl text-gray-600 mb-2" />
                        <p className="text-gray-400 text-sm">No hay eventos programados para este día</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Panel lateral derecho: Fecha seleccionada */}
              <div className="space-y-6">
                <div className="bg-secondary border border-accent/20 rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-accent mb-2">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h2>
                </div>
              </div>
            </>
          ) : (
            // Vista de Lista de eventos
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-secondary border border-accent/20 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-accent mb-4 flex items-center gap-2">
                  <FaFileAlt /> Lista de Eventos ({events.length + recurringEvents.length})
                </h2>
                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                  {[...events, ...recurringEvents]
                    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                    .map((event, index) => (
                      <div key={`list-event-${event.id}-${index}-${event.isRecurring ? 'recurring' : 'regular'}-${event.startDate}`} className="bg-primary/40 border border-blue-400/30 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-400">
                              {event.isRecurring ? '🔄' : <FaCalendarAlt />}
                            </span>
                            <h5 className="font-semibold text-white text-sm">{event.title}</h5>
                          </div>
                          {event.isRecurring && (
                            <span className="text-xs text-blue-400 px-2 py-1 rounded bg-blue-400/10">
                              Recurrente
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-gray-300 text-xs mb-2">{event.description}</p>
                        )}
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">
                              {event.isRecurring ? 'Evento Recurrente' : 'Evento'}
                            </span>
                            <span className="text-gray-400">
                              {new Date(event.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                              {' '}
                              {new Date(event.startDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              {event.endDate && (
                                <span> - {new Date(event.endDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                              )}
                            </span>
                          </div>
                          {event.location && (
                            <div className="text-gray-400">
                              📍 <span className="font-medium">Ubicación:</span> {event.location}
                            </div>
                          )}
                          {event.recurrencePattern && (
                            <div className="text-blue-400">
                              🔄 <span className="font-medium">Patrón:</span> {event.recurrencePattern}
                            </div>
                          )}
                          {event.validador && (
                            <div className="text-gray-400">
                              ✅ <span className="font-medium">Validador:</span> {event.validador}
                            </div>
                          )}
                          {event.modo && (
                            <div className="text-gray-400">
                              � <span className="font-medium">Modo:</span> {event.modo}
                            </div>
                          )}
                          {event.codigoDana && (
                            <div className="text-gray-400">
                              🏷️ <span className="font-medium">Código DANA:</span> {event.codigoDana}
                            </div>
                          )}
                          {event.nombreNotificacion && (
                            <div className="text-gray-400">
                              � <span className="font-medium">Notificación:</span> {event.nombreNotificacion}
                            </div>
                          )}
                          {event.diaEnvio && (
                            <div className="text-gray-400">
                              📅 <span className="font-medium">Día de Envío:</span> {event.diaEnvio}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  {events.length + recurringEvents.length === 0 && (
                    <div className="text-center py-6">
                      <FaCalendarAlt className="mx-auto text-3xl text-gray-600 mb-2" />
                      <p className="text-gray-400 text-sm">No hay eventos programados para este mes</p>
                    </div>
                  )}
                </div>
              </div>
              {/* Panel lateral derecho: Fecha seleccionada (opcionalmente se puede ocultar en modo lista) */}
              <div className="space-y-6">
                <div className="bg-secondary border border-accent/20 rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-accent mb-2">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h2>
                </div>
              </div>
            </div>
          )}
        </div>

       
      </div>
      
      {/* Burbuja flotante del asistente de IA */}
      <AssistantBubble />
    </div>
  );
};

export default Calendar;
