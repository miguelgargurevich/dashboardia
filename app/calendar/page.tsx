"use client";
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AssistantBubble from '../components/AsisstantIA/AssistantBubble';

import { 
  FaCalendarAlt, 
  FaAngleLeft, 
  FaAngleRight, 
  FaRegCalendarAlt, 
  FaFileAlt, 
  FaRegStickyNote, 
  FaPlus,
  FaMapMarkerAlt,
  FaSyncAlt,
  FaCheckCircle,
  FaUserCog,
  FaTag,
  FaBell,
  FaRegClock,
  FaEye,
  FaEyeSlash
} from "react-icons/fa";


type EventType = 'incidente' | 'mantenimiento' | 'reunion' | 'capacitacion' | 'otro';
type RecurrencePattern = 'ninguno' | 'diario' | 'semanal' | 'mensual' | 'trimestral' | 'anual';

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
  eventType: EventType;
  recurrencePattern: RecurrencePattern;
}



const Calendar: React.FC = () => {
  // Estado para mostrar/ocultar el panel de filtros en la vista de lista
  const [showFilters, setShowFilters] = useState(false);
  const searchParams = useSearchParams();
  
  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decodificar el token para ver su contenido (sin verificar)
        JSON.parse(atob(token.split('.')[1]));
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

  // --- Notas diarias ---
  interface Note {
    id: string;
    title: string;
    content: string;
    date: string;
    createdAt: string;
    tags?: string[];
    tema?: string;
  }
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState(''); // tags separados por coma
  const [noteTema, setNoteTema] = useState('');
  const [creatingNote, setCreatingNote] = useState(false);
  // Cargar notas del mes visible
  const fetchNotes = async () => {
    setLoadingNotes(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/daily-notes?month=${visibleMonth}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al cargar notas');
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch {
      setNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  };
  // Crear nota
  const createNote = async () => {
    if (!noteTitle.trim() && !noteContent.trim()) return;
    setCreatingNote(true);
    try {
      const token = getToken();
      const res = await fetch('/api/daily-notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: noteTitle,
          content: noteContent,
          date: selectedDate,
          tags: noteTags.split(',').map(t => t.trim()).filter(Boolean),
          tema: noteTema,
        }),
      });
      if (!res.ok) throw new Error('Error al crear nota');
      setNoteTitle('');
      setNoteContent('');
      setNoteTags('');
      setNoteTema('');
      fetchNotes();
    } catch {}
    setCreatingNote(false);
  };
  // Notas del día seleccionado
  const selectedDayNotes = notes.filter(n => n.date === selectedDate);

  // Estado para controlar qué notas están expandidas (ver más)
  const [showMoreNotes, setShowMoreNotes] = useState<Record<string, boolean>>({});
  const toggleShowMore = (id: string) => {
    setShowMoreNotes(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  // Estados para eventos recurrentes - ELIMINADOS
  
  // Filtros para la vista de lista
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

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
        // Separar eventos recurrentes y no recurrentes según recurrencePattern
        const regularEvents = eventData.filter((event: Event) => event.recurrencePattern === 'ninguno');
        const recurringEventsData = eventData.filter((event: Event) => event.recurrencePattern !== 'ninguno');
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

  // Marcar días con notas
  const hasNotesOnDay = (dateString: string) => notes.some(n => n.date === dateString);




  // Efectos
  useEffect(() => {
   
    fetchEvents(); // Cargar eventos (incluye regulares y recurrentes)
    fetchNotes(); // Cargar notas del mes
  }, [visibleMonth, viewMode]);





  return (
    <div className="min-h-screen bg-primary text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-accent mb-2">Calendario de Eventos</h1>
          <p className="text-gray-400">Eventos en el mes y registro de notas diarias</p>
        </div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 w-full">
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
            {/* Fecha seleccionada alineada a la derecha */}
            <div className="flex-1 flex justify-end items-center min-w-[220px]">
              <span className="text-accent text-base font-semibold bg-primary/40 px-4 py-2 rounded-lg border border-accent/10 shadow">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            {/* Control de eventos recurrentes */}
            <div className="flex items-center gap-2">
              <button
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors font-medium text-sm border ${
                  showRecurringEvents 
                    ? 'bg-blue-600/20 border-blue-600/40 text-blue-400 hover:bg-blue-600/30' 
                    : 'bg-gray-600/20 border-gray-600/40 text-gray-400 hover:bg-gray-600/30'
                }`}
                onClick={() => setShowRecurringEvents(!showRecurringEvents)}
                title={showRecurringEvents ? 'Ocultar eventos recurrentes' : 'Mostrar eventos recurrentes'}
              >
                {showRecurringEvents ? <FaEyeSlash /> : <FaEye />}
                {loadingEvents && (
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                )}
                {!loadingEvents && recurringEvents.length > 0 && (
                  <span className="text-xs bg-blue-500/30 px-1 rounded-full">
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
                              <div key={`event-${event.id}-${index}-${event.recurrencePattern !== 'ninguno' ? 'recurring' : 'regular'}`} className="w-full">
                                <div className={`text-xs px-1 py-0.5 rounded truncate ${
                                  event.recurrencePattern !== 'ninguno' 
                                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/40 font-semibold' 
                                    : 'bg-yellow-500/80 text-black'
                                }`}>
                                  {event.recurrencePattern !== 'ninguno' && '🔄 '}{event.title}
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
                            {/* Marcar si hay notas */}
                            {hasNotesOnDay(dayKey) && (
                              <div className="absolute top-1 right-1">
                                <span className="inline-block w-3 h-3 bg-green-400 rounded-full border-2 border-white" title="Hay notas"></span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Cierre correcto del bloque de lista de eventos */}

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
                          <div key={`selected-event-${event.id}-${index}-${event.recurrencePattern !== 'ninguno' ? 'recurring' : 'regular'}-${event.startDate}`} className="bg-primary/40 border border-blue-400/30 rounded-lg p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400 flex items-center gap-1">
                                    {event.recurrencePattern !== 'ninguno' ? <FaSyncAlt className="inline-block" /> : <FaCalendarAlt />}
                                  </span>
                                  <h5 className="font-semibold text-white text-sm">{event.title}</h5>
                                </div>
                                {event.recurrencePattern !== 'ninguno' && (
                                  <span className="text-xs text-blue-400 px-2 py-1 rounded bg-blue-400/10 flex items-center gap-1">
                                    <FaSyncAlt className="inline-block" /> Recurrente
                                  </span>
                                )}
                              </div>
                            {event.description && (
                              <p className="text-gray-300 text-xs mb-2">{event.description}</p>
                            )}
                            {/* Información detallada del evento */}
                              <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 flex items-center gap-1">
                                    {event.recurrencePattern !== 'ninguno' ? <><FaSyncAlt className="inline-block" /> Evento Recurrente</> : <> <FaCalendarAlt className="inline-block" /> Evento</>}
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
                                  <div className="text-gray-400 flex items-center gap-1">
                                    <FaMapMarkerAlt className="inline-block text-green-400" /> <span className="font-medium">Ubicación:</span> {event.location}
                                  </div>
                                )}
                                {event.recurrencePattern && (
                                  <div className="text-blue-400 flex items-center gap-1">
                                    <FaSyncAlt className="inline-block text-blue-400" /> <span className="font-medium">Patrón:</span> {event.recurrencePattern}
                                  </div>
                                )}
                                {event.validador && (
                                  <div className="text-gray-400 flex items-center gap-1">
                                    <FaCheckCircle className="inline-block text-green-300" /> <span className="font-medium">Validador:</span> {event.validador}
                                  </div>
                                )}
                                {event.modo && (
                                  <div className="text-gray-400 flex items-center gap-1">
                                    <FaUserCog className="inline-block text-yellow-300" /> <span className="font-medium">Modo:</span> {event.modo}
                                  </div>
                                )}
                                {event.codigoDana && (
                                  <div className="text-gray-400 flex items-center gap-1">
                                    <FaTag className="inline-block text-pink-300" /> <span className="font-medium">Código DANA:</span> {event.codigoDana}
                                  </div>
                                )}
                                {event.nombreNotificacion && (
                                  <div className="text-gray-400 flex items-center gap-1">
                                    <FaBell className="inline-block text-blue-200" /> <span className="font-medium">Notificación:</span> {event.nombreNotificacion}
                                  </div>
                                )}
                                {event.diaEnvio && (
                                  <div className="text-gray-400 flex items-center gap-1">
                                    <FaRegClock className="inline-block text-orange-300" /> <span className="font-medium">Día de Envío:</span> {event.diaEnvio}
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
                {/* Panel de Notas del Día */}
                <div className="bg-secondary border border-green-400/30 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-green-400 mb-2 flex items-center gap-2">
                    <FaRegStickyNote className="text-green-400" /> Notas del Día
                  </h3>
                  {/* Crear nueva nota */}
                  <div className="mb-4 space-y-2">
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg bg-primary border border-green-400/30 text-white text-base"
                      placeholder="Título de la nota (opcional)"
                      value={noteTitle}
                      onChange={e => setNoteTitle(e.target.value)}
                      disabled={creatingNote}
                    />
                    <textarea
                      className="w-full px-4 py-3 rounded-lg bg-primary border border-green-400/30 text-white text-base"
                      placeholder="Contenido de la nota..."
                      value={noteContent}
                      onChange={e => setNoteContent(e.target.value)}
                      rows={5}
                      disabled={creatingNote}
                    />
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg bg-primary border border-green-400/30 text-white text-base"
                      placeholder="Tags (separados por coma)"
                      value={noteTags}
                      onChange={e => setNoteTags(e.target.value)}
                      disabled={creatingNote}
                    />
                    <button
                      className="w-full px-6 py-3 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-3 shadow-lg mt-2"
                      onClick={createNote}
                      disabled={creatingNote || (!noteTitle.trim() && !noteContent.trim())}
                    >
                      {creatingNote ? (
                        <>
                          <FaPlus className="animate-spin" /> Guardando...
                        </>
                      ) : (
                        <>
                          <FaPlus /> Agregar Nota
                        </>
                      )}
                    </button>
                  </div>
                  {/* Listado de notas del día */}
                  {loadingNotes ? (
                    <div className="text-center text-xs text-gray-400">Cargando notas...</div>
                  ) : selectedDayNotes.length > 0 ? (
                    <ul className="space-y-4">
                      {selectedDayNotes.map(note => (
                        <li key={note.id} className="bg-primary/40 border border-green-400/30 rounded-xl p-4 shadow flex flex-col gap-2">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-green-300 text-base">{note.title || 'Sin título'}</span>
                              <span className="text-[11px] text-gray-400 ml-auto">{new Date(note.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="text-white text-sm whitespace-pre-line mb-1">{note.content}</div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="bg-green-700/40 text-green-200 text-xs px-3 py-1 rounded-full">
                                Tags: {note.tags && note.tags.length > 0 ? note.tags.join(', ') : 'Sin tags'}
                              </span>
                              {note.tema && (
                                <span className="bg-green-700/40 text-green-200 text-xs px-3 py-1 rounded-full">Tema: {note.tema}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button
                              className="text-green-300 text-xs underline hover:text-green-200 focus:outline-none"
                              onClick={() => toggleShowMore(note.id)}
                            >
                              {showMoreNotes[note.id] ? 'Ver menos' : 'Ver más'}
                            </button>
                          </div>
                          {showMoreNotes[note.id] && (
                            <div className="mt-2 p-3 rounded-lg bg-green-900/40 border border-green-400/30 text-xs text-green-100 space-y-2 shadow-inner">
                              <div className="flex flex-wrap gap-2 mb-2">
                                <span className="bg-green-700/60 text-green-100 text-[11px] px-2 py-0.5 rounded-full">Creado: {new Date(note.createdAt).toLocaleString('es-ES')}</span>
                              </div>
                              <div><span className="font-bold">Título:</span> {note.title || 'Sin título'}</div>
                              <div><span className="font-bold">Contenido:</span> <span className="whitespace-pre-line">{note.content}</span></div>
                              <div><span className="font-bold">Tags:</span> {note.tags && note.tags.length > 0 ? note.tags.join(', ') : 'Sin tags'}</div>
                              <div><span className="font-bold">Tema:</span> {note.tema || 'Sin tema'}</div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-gray-400">No hay notas para este día.</div>
                  )}
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
                {/* Botón para mostrar/ocultar filtros */}
                <div className="mb-4">
                  <button
                    className="px-4 py-2 bg-accent text-white rounded-lg font-medium shadow hover:bg-accent/80 transition-colors"
                    onClick={() => setShowFilters(f => !f)}
                  >
                    {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                  </button>
                </div>
                {/* Panel de filtros, visible solo si showFilters es true */}
                {showFilters && (
                  <div className="mb-4 p-4 bg-primary/20 rounded-lg border border-accent/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Buscar</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-2 pr-2 py-1 bg-primary border border-accent/30 rounded text-white text-xs"
                            placeholder="Buscar por título o descripción..."
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Tipo</label>
                        <select
                          value={filterType}
                          onChange={e => setFilterType(e.target.value)}
                          className="w-full px-2 py-1 bg-primary border border-accent/30 rounded text-white text-xs"
                        >
                          <option value="all">Todos</option>
                          <option value="incidente">Incidente</option>
                          <option value="mantenimiento">Mantenimiento</option>
                          <option value="reunion">Reunión</option>
                          <option value="capacitacion">Capacitación</option>
                          <option value="otro">Otro</option>
                          <option value="recurrente">Recurrente</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                  {([...events, ...recurringEvents]
                    .filter(event => {
                      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
                      let matchesType = true;
                      if (filterType === 'recurrente') {
                        matchesType = event.recurrencePattern !== 'ninguno';
                      } else if (filterType !== 'all') {
                        // Si el filtro es un tipo de evento específico
                        matchesType = event.eventType === filterType;
                      }
                      return matchesSearch && matchesType;
                    })
                    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                    .map((event, index) => {
                      return (
                        <div key={`list-event-${event.id}-${index}-${event.recurrencePattern !== 'ninguno' ? 'recurring' : 'regular'}-${event.startDate}`} className="bg-primary/40 border border-blue-400/30 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-400">
                                {event.recurrencePattern !== 'ninguno' ? '🔄' : <FaCalendarAlt />}
                              </span>
                              <h5 className="font-semibold text-white text-sm">{event.title}</h5>
                            </div>
                            {event.recurrencePattern !== 'ninguno' && (
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
                                {event.recurrencePattern !== 'ninguno' ? 'Evento Recurrente' : 'Evento'}
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
                      );
                    }))}
                  {([...events, ...recurringEvents].filter(event => {
                    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
                    let matchesType = true;
                    if (filterType === 'recurrente') {
                      matchesType = event.recurrencePattern !== 'ninguno';
                    } else if (filterType !== 'all') {
                      matchesType = event.eventType === filterType;
                    }
                    return matchesSearch && matchesType;
                  }).length === 0) && (
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
