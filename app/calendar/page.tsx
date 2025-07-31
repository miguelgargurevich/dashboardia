"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
// Importar el formulario de nota de forma dinámica para evitar SSR
const NotaForm = dynamic(() => import('../components/knowledge/NotaForm'), { ssr: false });
import DetalleEventoPanel from '../components/eventos/DetalleEventoPanel';
import EventoForm from '../components/eventos/EventoForm';
import { useSearchParams } from 'next/navigation';
import AssistantBubble from '../components/AsisstantIA/AssistantBubble';
import Modal from '../components/Modal';

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
  FaEyeSlash,
  FaPaperclip,
  FaExternalLinkAlt,
  FaTools,
  FaChalkboardTeacher,
  FaUsers,
  FaRobot,
  FaClipboardList,
  FaLaptop
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
  relatedResources?: string[];
}

// Tipos para NotaForm
interface NotaFormValues {
  nombre: string;
  contenido: string;
  tipo: string;
  etiquetas?: string[];
  descripcion?: string;
  tema: string;
  priority?: string;
  date?: string;
}

const Calendar: React.FC = () => {
  // --- Estado y lógica para edición y eliminación de eventos ---
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);

  // @ts-ignore
  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  // @ts-ignore
  const handleDeleteEvent = async (event: Event) => {
    if (!window.confirm('¿Seguro que deseas eliminar este evento?')) return;
    try {
      const token = getToken();
      const res = await fetch(`/api/events/calendar/${event.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al eliminar evento');
      fetchEvents();
    } catch (e) {
      alert('No se pudo eliminar el evento.');
    }
  };
  // Estado para tipos de nota y etiquetas disponibles
  const [tiposNotas, setTiposNotas] = useState<any[]>([]);
  const [etiquetasDisponibles, setEtiquetasDisponibles] = useState<string[]>([]);

  // Cargar tipos de nota
  useEffect(() => {
    fetch('/tiposNotas.json')
      .then(res => res.json())
      .then(data => setTiposNotas(data));
  }, []);
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

  // --- Notas diarias ---
interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  createdAt: string;
  tags?: string[];
  tema?: string;
  relatedResources?: string[];
}


  // Estado global para temas
  const [temas, setTemas] = useState<any[]>([]);
  useEffect(() => {
    fetch('/temas.json')
      .then(res => res.json())
      .then((data) => setTemas(data));
  }, []);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState(''); // tags separados por coma
  const [noteTema, setNoteTema] = useState('');
  const [creatingNote, setCreatingNote] = useState(false);
  const [noteFiles, setNoteFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Drag and drop handlers para archivos
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setNoteFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };
  const [uploadingFiles, setUploadingFiles] = useState(false);
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
    setUploadingFiles(false);
    try {
      const token = getToken();
      let relatedResources: string[] = [];
      // Subir archivos si hay
      if (noteFiles.length > 0) {
        setUploadingFiles(true);
        for (const file of noteFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('titulo', file.name);
          // Usar el primer tema dinámico como fallback
          const temaFallback = temas[0]?.id || 'actividades-diarias';
          formData.append('tema', noteTema || temaFallback);
          formData.append('tags', JSON.stringify(noteTags.split(',').map(t => t.trim()).filter(Boolean)));
          const resUpload = await fetch('/api/resources/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
          if (resUpload.ok) {
            const data = await resUpload.json();
            if (data.recurso && data.recurso.id) {
              relatedResources.push(data.recurso.id);
            }
          }
        }
        setUploadingFiles(false);
      }
      // Crear la nota con los recursos asociados
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
          relatedResources
        }),
      });
      if (!res.ok) throw new Error('Error al crear nota');
      setNoteTitle('');
      setNoteContent('');
      setNoteTags('');
      setNoteTema('');
      setNoteFiles([]);
      fetchNotes();
    } catch {}
    setCreatingNote(false);
    setUploadingFiles(false);
  };


  // Notas del día seleccionado
  const selectedDayNotes = notes.filter(n => n.date === selectedDate);


  // --- Estado y lógica para edición y eliminación de notas ---
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showNoteForm, setShowNoteForm] = useState(false);

  // @ts-ignore
  const handleEditNote = (note) => {
    setEditingNote(note);
    setShowNoteForm(true);
  };



  // @ts-ignore
  const handleDeleteNote = async (note) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta nota?')) return;
    try {
      const token = getToken();
      const res = await fetch(`/api/daily-notes/${note.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al eliminar nota');
      fetchNotes();
    } catch (e) {
      alert('No se pudo eliminar la nota.');
    }
  };


  const handleCloseNoteForm = () => {
    setShowNoteForm(false);
    setEditingNote(null);
  };



  // Filtros para la vista de lista
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [searchTerm] = useState('');
  const [filterType] = useState<string>('all');

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
            <div className="flex w-full items-center justify-between gap-4">
              {/* Botones de vista */}
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
              {/* Fecha seleccionada */}
              <div className="flex flex-1 justify-center items-center">
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
                      ? 'bg-yellow-400/20 border-yellow-400/40 text-yellow-400 hover:bg-yellow-600/30' 
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
                                    ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-600/40 font-semibold' 
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

                {/* Panel de Eventos del Día (cards de detalle de eventos genéricos) */}
                <div className="bg-secondary border border-accent/20 rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
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
                      <div className="space-y-1">
                        {selectedDayEvents.map((evento, idx) => (
                          <DetalleEventoPanel
                            key={`detalle-evento-dia-${evento.id}-${idx}`}
                            eventoSeleccionado={evento}
                            onEdit={() => handleEditEvent(evento)}
                            onDelete={() => handleDeleteEvent(evento)}
                          />
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
                <div
                  className={`bg-secondary border border-green-400/30 rounded-xl shadow-lg p-6 transition-all duration-200 ${isDragging ? 'ring-4 ring-green-400/60 bg-green-900/30' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <h3 className="text-lg font-bold text-green-400 mb-2 flex items-center gap-2">
                    <FaRegStickyNote className="text-green-400" /> Notas del Día
                  </h3>
                  {/* Botón para nueva nota dentro del panel */}
                  {/* Crear nueva nota */}
                  <div className="mb-4 space-y-2">
                    {/* Campo de fecha editable para la nota diaria */}
                    <div className="flex items-center gap-2">
                      <label className="text-green-300 font-semibold text-sm" htmlFor="note-date-input">Fecha de la nota:</label>
                      <input
                        id="note-date-input"
                        type="date"
                        className="px-3 py-2 rounded-lg bg-primary border border-green-400/30 text-white text-base focus:ring-2 focus:ring-green-400/40 focus:outline-none"
                        value={selectedDate || today.toISOString().slice(0,10)}
                        onChange={e => setSelectedDate(e.target.value)}
                        disabled={creatingNote}
                        min="2000-01-01"
                        max="2100-12-31"
                      />
                    </div>
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
                    <div
                  className={`transition-all duration-200 border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer relative group
                    ${isDragging ? 'border-green-400 bg-green-900/30 ring-4 ring-green-400/40' : 'border-dashed border-green-400/40 bg-primary/40 hover:bg-green-900/10'}`}
                  onClick={() => !creatingNote && document.getElementById('note-file-input')?.click()}
                  style={{ minHeight: '110px' }}
                >
                  <input
                    id="note-file-input"
                    type="file"
                    multiple
                    onChange={e => setNoteFiles(e.target.files ? Array.from(e.target.files) : [])}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov"
                    disabled={creatingNote}
                  />
                  <div className="flex flex-col items-center justify-center w-full pointer-events-none">
                    <FaPaperclip className="text-3xl text-green-400 mb-1 animate-bounce group-hover:scale-110 transition-transform" />
                    <span className="text-green-200 font-semibold text-base mb-1">Adjuntar archivos</span>
                    <span className="text-xs text-green-100 mb-1">Arrastra y suelta aquí o haz clic para seleccionar</span>
                    <span className="text-xs text-green-300">Formatos: pdf, doc, xls, imágenes, videos...</span>
                  </div>
                  {noteFiles.length > 0 && (
                    <div className="w-full mt-3">
                      <div className="flex flex-wrap gap-2">
                        {noteFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-green-800/30 border border-green-400/30 rounded-lg px-3 py-1 text-xs text-green-100 shadow">
                            <FaPaperclip className="text-green-300" />
                            <span className="truncate max-w-[120px]">{file.name}</span>
                            <span className="text-green-300">({(file.size/1024/1024).toFixed(2)} MB)</span>
                            <button
                              type="button"
                              className="ml-1 text-red-400 hover:text-red-600 font-bold text-lg px-1"
                              title="Quitar archivo"
                              onClick={e => {
                                e.stopPropagation();
                                setNoteFiles(prev => prev.filter((_, i) => i !== idx));
                              }}
                              disabled={creatingNote}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {isDragging && (
                    <div className="absolute inset-0 bg-green-900/40 flex items-center justify-center rounded-xl pointer-events-none z-10">
                      <span className="text-green-200 text-lg font-bold animate-pulse">¡Suelta los archivos para adjuntar!</span>
                    </div>
                  )}
                </div>
                    <button
                      className="w-full px-6 py-3 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-3 shadow-lg mt-4"
                      onClick={createNote}
                      disabled={creatingNote || uploadingFiles || (!noteTitle.trim() && !noteContent.trim())}
                    >
                      {creatingNote || uploadingFiles ? (
                        <>
                          <FaPlus className="animate-spin" /> {uploadingFiles ? 'Subiendo archivos...' : 'Guardando...'}
                        </>
                      ) : (
                        <>
                          <FaPlus /> Nota
                        </>
                      )}
                    </button>
                  </div>
                  {/* Listado de notas del día */}
                  <div className="mt-6">
                  {loadingNotes ? (
                    <div className="text-center text-xs text-gray-400">Cargando notas...</div>
                  ) : selectedDayNotes.length > 0 ? (
                    <ul className="space-y-3">
                      {selectedDayNotes.map(note => {
                        const temaObj = temas.find((t: any) => t.id === note.tema);
                        const temaClass = temaObj?.color || 'bg-gray-700/40 text-gray-200';
                        const recursosCount = Array.isArray(note.relatedResources) ? note.relatedResources.length : 0;
                        return (
                          <li key={note.id} className="bg-primary/40 rounded-lg p-3 border border-green-400/30 shadow flex flex-col gap-2">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-green-400">
                                  <FaRegStickyNote />
                                </span>
                                <span className="font-semibold text-white text-sm">{note.title || 'Sin título'}</span>
                              </div>
                              <div className="flex items-center gap-2 ml-auto">
                                <span className="text-[11px] text-gray-400">{new Date(note.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                <button
                                  className="text-blue-400 hover:text-blue-600 p-1 rounded transition"
                                  title="Editar nota"
                                  onClick={() => handleEditNote(note)}
                                >
                                  <FaCheckCircle />
                                </button>
                                <button
                                  className="text-red-400 hover:text-red-600 p-1 rounded transition"
                                  title="Eliminar nota"
                                  onClick={() => handleDeleteNote(note)}
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                            {note.content && (
                              <p className="text-gray-300 text-xs mb-2 line-clamp-2">{note.content.length > 120 ? `${note.content.slice(0, 120)}...` : note.content}</p>
                            )}
                            <p className='text-xs text-gray-400 mb-2'>{new Date(note.date).toLocaleDateString('es-ES')}</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="bg-green-700/40 text-green-200 text-xs px-3 py-1 rounded-full">
                                {note.tags && note.tags.length > 0 ? note.tags.join(', ') : 'Sin tags'}
                              </span>
                              {note.tema && (
                                <span className={`text-xs px-3 py-1 rounded-full font-semibold border border-white/10 shadow-sm ${temaClass}`}>{note.tema}</span>
                              )}
                              <span className="text-xs text-gray-400 ml-auto">{recursosCount} Archivos</span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="text-xs text-gray-400">No hay notas para este día.</div>
                  )}
                  </div>
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
                  {([...events, ...recurringEvents]
                    .filter(event => {
                      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
                      let matchesType = true;
                      if (filterType === 'recurrente') {
                        matchesType = event.recurrencePattern !== 'ninguno';
                      } else if (filterType !== 'all') {
                        matchesType = event.eventType === filterType;
                      }
                      return matchesSearch && matchesType;
                    })
                    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                    .map((event, index) => (
                      <DetalleEventoPanel
                        key={`list-event-${event.id}-${index}-${event.recurrencePattern !== 'ninguno' ? 'recurring' : 'regular'}-${event.startDate}`}
                        eventoSeleccionado={event}
                        onEdit={() => handleEditEvent(event)}
                        onDelete={() => handleDeleteEvent(event)}
                      />
                    )))}
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
            </div>
          )}
        </div>

       
      </div>
      





      {/* Modal para editar nota */}
      {showNoteForm && editingNote && (
        <Modal open={showNoteForm} onClose={handleCloseNoteForm} title="Editar nota" maxWidth="max-w-2xl">
          <NotaForm
            initialValues={{
              nombre: editingNote.title || '',
              contenido: editingNote.content || '',
              tipo: tiposNotas[0]?.id || '',
              etiquetas: editingNote.tags || [],
              descripcion: '',
              tema: editingNote.tema || temas[0]?.id || '',
              date: editingNote.date
            }}
            temas={temas}
            tiposNotas={tiposNotas}
            etiquetasDisponibles={Array.from(new Set(notes.flatMap(n => n.tags || [])))}
            onSubmit={async (values) => {
              // Actualizar nota en backend
              const token = getToken();
              await fetch(`/api/daily-notes/${editingNote.id}`,
                {
                  method: 'PUT',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    title: values.nombre,
                    content: values.contenido,
                    tags: values.etiquetas,
                    tema: values.tema,
                    date: values.date || editingNote.date
                  })
                }
              );
              handleCloseNoteForm();
              fetchNotes();
            }}
            onCancel={handleCloseNoteForm}
            loading={false}
            submitLabel="Guardar nota"
          />
        </Modal>
      )}

      {/* Modal para editar evento */}
      {showEventForm && editingEvent && (
        <Modal open={showEventForm} onClose={() => setShowEventForm(false)} title="Editar evento" maxWidth="max-w-2xl">
          <EventoForm
            initialValues={editingEvent}
            onSubmit={async (values) => {
              // Actualizar evento en backend
              const token = getToken();
              await fetch(`/api/events/calendar/${editingEvent.id}`,
                {
                  method: 'PUT',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(values)
                }
              );
              setShowEventForm(false);
              setEditingEvent(null);
              fetchEvents();
            }}
            onCancel={() => setShowEventForm(false)}
            loading={false}
            submitLabel="Guardar evento"
          />
        </Modal>
      )}

      {/* Burbuja flotante del asistente de IA */}
      <AssistantBubble />
    </div>
  );
}

export default Calendar;