"use client";
import React, { useEffect, useState } from 'react';
import AssistantBubble from '../components/AsisstantIA/AssistantBubble';
import { 
  FaCalendarAlt, 
  FaAngleLeft, 
  FaAngleRight, 
  FaRegCalendarAlt, 
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaUser,
  FaFileAlt,
  FaSearch,
  FaFilter,
  FaExclamationTriangle,
  FaCog,
  FaTools
} from "react-icons/fa";

// Interfaces
interface DailyNote {
  id: string;
  date: string;
  title: string;
  content: string;
  type: 'incidente' | 'mantenimiento' | 'reunion' | 'capacitacion' | 'otro';
  tags: string[];
  relatedResources: string[];
  createdAt: string;
  updatedAt: string;
}

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  location?: string;
  validador?: string;
  modo?: string;
  codigoDana?: string;
  nombreNotificacion?: string;
  diaEnvio?: string;
  query?: string;
  description?: string;
}

interface DayStats {
  totalNotes: number;
  notesTypes: { [key: string]: number };
}

const Calendar: React.FC = () => {
  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const token = localStorage.getItem('token');
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
  
  const [visibleMonth, setVisibleMonth] = useState<string>(today.toISOString().slice(0,7));
  const [selectedDate, setSelectedDate] = useState<string>(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([]);
  const [dayStats, setDayStats] = useState<{ [key: string]: DayStats }>({});
  const [loading, setLoading] = useState(false);
  
  // Estados para eventos recurrentes
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: '',
    startDate: '',
    endDate: '',
    location: '',
    validador: '',
    modo: '',
    codigoDana: '',
    nombreNotificacion: '',
    diaEnvio: '',
    query: '',
    description: ''
  });
  
  // Estados del formulario para notas
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newNote, setNewNote] = useState<Partial<DailyNote>>({
    title: '',
    content: '',
    type: 'incidente',
    tags: [],
    relatedResources: []
  });
  
  // Estados de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Estados de vista
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [activeTab, setActiveTab] = useState<'notes' | 'events'>('notes');

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

  // Obtener notas del día seleccionado o todas las notas dependiendo del modo de vista
  const selectedDayNotes = viewMode === 'calendar' 
    ? dailyNotes.filter(note => note.date === selectedDate)
    : dailyNotes; // En vista de lista, mostrar todas las notas
    
  const filteredNotes = selectedDayNotes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || note.type === filterType;
    
    return matchesSearch && matchesType;
  });

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

  // Funciones de API
  const fetchNotes = async (month?: string) => {
    setLoading(true);
    try {
      const queryParam = month ? `month=${month}` : '';
      const response = await fetch(`/api/daily-notes?${queryParam}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const notes = await response.json();
        setDailyNotes(notes);
      } else {
        console.error('Error fetching notes:', response.statusText);
        // Fallback a datos de muestra
        loadSampleData();
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      // Fallback a datos de muestra
      loadSampleData();
    } finally {
      setLoading(false);
    }
  };

  const fetchAllNotes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/daily-notes', {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const notes = await response.json();
        setDailyNotes(notes);
      } else {
        console.error('Error fetching all notes:', response.statusText);
        // Fallback a datos de muestra expandidos
        loadExtendedSampleData();
      }
    } catch (error) {
      console.error('Error fetching all notes:', error);
      // Fallback a datos de muestra expandidos
      loadExtendedSampleData();
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (month?: string) => {
    try {
      const queryParam = month ? `month=${month}` : '';
      const response = await fetch(`/api/daily-notes/stats?${queryParam}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const stats = await response.json();
        setDayStats(stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const loadSampleData = () => {
    const sampleNotes: DailyNote[] = [
      {
        id: '1',
        date: selectedDate,
        title: 'Incidente servidor principal',
        content: 'El servidor principal presentó problemas de conectividad a las 09:30. Se realizó reinicio y monitoreo.',
        type: 'incidente',
        tags: ['servidor', 'conectividad', 'urgente'],
        relatedResources: ['servidor-01', 'manual-reinicio'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    setDailyNotes(sampleNotes);
  };

  const loadExtendedSampleData = () => {
    const today = new Date();
    const sampleNotes: DailyNote[] = [
      {
        id: '1',
        date: selectedDate,
        title: 'Incidente servidor principal',
        content: 'El servidor principal presentó problemas de conectividad a las 09:30. Se realizó reinicio y monitoreo.',
        type: 'incidente',
        tags: ['servidor', 'conectividad', 'urgente'],
        relatedResources: ['servidor-01', 'manual-reinicio'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate() - 1).padStart(2, '0')}`,
        title: 'Mantenimiento programado',
        content: 'Actualización de sistemas de seguridad y parches de Windows Server.',
        type: 'mantenimiento',
        tags: ['mantenimiento', 'seguridad', 'windows'],
        relatedResources: ['manual-actualizaciones'],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '3',
        date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate() - 2).padStart(2, '0')}`,
        title: 'Capacitación equipo soporte',
        content: 'Sesión de capacitación sobre nuevos procedimientos de atención al cliente.',
        type: 'capacitacion',
        tags: ['capacitacion', 'procedimientos', 'equipo'],
        relatedResources: ['manual-procedimientos'],
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: '4',
        date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate() - 3).padStart(2, '0')}`,
        title: 'Reunión con proveedores',
        content: 'Revisión de contratos y SLA con proveedores de infraestructura.',
        type: 'reunion',
        tags: ['reunion', 'proveedores', 'sla'],
        relatedResources: ['contratos-proveedores'],
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date(Date.now() - 259200000).toISOString()
      }
    ];
    setDailyNotes(sampleNotes);
  };

  // Funciones de notas
  const saveNote = async () => {
    if (!newNote.title || !newNote.content) return;
    
    setLoading(true);
    try {
      const noteData = {
        date: selectedDate,
        title: newNote.title,
        content: newNote.content,
        type: newNote.type || 'incidente',
        tags: newNote.tags || [],
        relatedResources: newNote.relatedResources || []
      };

      if (editingNote) {
        // Actualizar nota existente
        const response = await fetch(`/api/daily-notes/${editingNote}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(noteData),
        });

        if (response.ok) {
          const updatedNote = await response.json();
          setDailyNotes(prev => prev.map(n => n.id === editingNote ? updatedNote : n));
        } else {
          console.error('Error updating note:', response.statusText);
        }
      } else {
        // Crear nueva nota
        const response = await fetch('/api/daily-notes', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(noteData),
        });

        if (response.ok) {
          const newNote = await response.json();
          setDailyNotes(prev => [...prev, newNote]);
        } else {
          console.error('Error creating note:', response.statusText);
        }
      }

      resetForm();
      await fetchStats(visibleMonth);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/daily-notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setDailyNotes(prev => prev.filter(n => n.id !== id));
        await fetchStats(visibleMonth);
      } else {
        console.error('Error deleting note:', response.statusText);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    } finally {
      setLoading(false);
    }
  };

  const editNote = (note: DailyNote) => {
    setNewNote(note);
    setEditingNote(note.id);
    setIsCreating(true);
  };

  const resetForm = () => {
    setNewNote({
      title: '',
      content: '',
      type: 'incidente',
      tags: [],
      relatedResources: []
    });
    setIsCreating(false);
    setEditingNote(null);
  };

  // Funciones para manejar eventos recurrentes
  const fetchEvents = async (month?: string) => {
    setEventsLoading(true);
    try {
      const queryParam = month ? `month=${month}` : '';
      const response = await fetch(`/api/events/calendar?${queryParam}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const eventsData = await response.json();
        setEvents(eventsData);
      } else {
        console.error('Error fetching events:', response.statusText);
        // Fallback a datos de ejemplo
        setEvents([
          {
            id: '1',
            title: 'Mantenimiento Servidor Principal',
            startDate: `${visibleMonth}-05T10:00:00`,
            endDate: `${visibleMonth}-05T12:00:00`,
            location: 'Sala de Servidores',
            validador: 'admin@empresa.com',
            modo: 'presencial',
            codigoDana: 'MAN001',
            nombreNotificacion: 'Mantenimiento Programado',
            diaEnvio: '5',
            query: 'SELECT * FROM maintenance_logs',
            description: 'Mantenimiento preventivo mensual del servidor principal'
          },
          {
            id: '2',
            title: 'Capacitación Sistema Nuevo',
            startDate: `${visibleMonth}-12T14:00:00`,
            endDate: `${visibleMonth}-12T16:00:00`,
            location: 'Sala de Reuniones A',
            validador: 'rrhh@empresa.com',
            modo: 'híbrido',
            codigoDana: 'CAP002',
            nombreNotificacion: 'Capacitación Obligatoria',
            diaEnvio: '12',
            query: 'UPDATE users SET training_status = completed',
            description: 'Capacitación del nuevo sistema de gestión'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const saveEvent = async () => {
    try {
      const eventData = {
        title: newEvent.title,
        startDate: newEvent.startDate,
        endDate: newEvent.endDate,
        location: newEvent.location,
        validador: newEvent.validador,
        modo: newEvent.modo,
        codigoDana: newEvent.codigoDana,
        nombreNotificacion: newEvent.nombreNotificacion,
        diaEnvio: newEvent.diaEnvio,
        query: newEvent.query,
        description: newEvent.description
      };

      const method = editingEvent ? 'PUT' : 'POST';
      const url = editingEvent ? `/api/events/${editingEvent}` : '/api/events';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        await fetchEvents(visibleMonth);
        resetEventForm();
      } else {
        console.error('Error saving event:', response.statusText);
        // Para demo, actualizar el estado local
        if (editingEvent) {
          setEvents(prev => prev.map(event => 
            event.id === editingEvent
              ? {
                  ...event,
                  ...eventData,
                  // Ensure required fields are not undefined
                  title: eventData.title ?? event.title,
                  startDate: eventData.startDate ?? event.startDate,
                  id: event.id
                }
              : event
          ));
        } else {
          const newEventWithId = { 
            ...eventData, 
            id: Date.now().toString() 
          } as Event;
          setEvents(prev => [...prev, newEventWithId]);
        }
        resetEventForm();
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setEvents(prev => prev.filter(event => event.id !== eventId));
      } else {
        console.error('Error deleting event:', response.statusText);
        // Para demo, eliminar del estado local
        setEvents(prev => prev.filter(event => event.id !== eventId));
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      // Para demo, eliminar del estado local
      setEvents(prev => prev.filter(event => event.id !== eventId));
    }
  };

  const editEvent = (event: Event) => {
    setNewEvent(event);
    setEditingEvent(event.id);
    setIsCreatingEvent(true);
  };

  const resetEventForm = () => {
    setNewEvent({
      title: '',
      startDate: '',
      endDate: '',
      location: '',
      validador: '',
      modo: '',
      codigoDana: '',
      nombreNotificacion: '',
      diaEnvio: '',
      query: '',
      description: ''
    });
    setIsCreatingEvent(false);
    setEditingEvent(null);
  };

  // Efectos
  useEffect(() => {
    if (viewMode === 'calendar') {
      fetchNotes(visibleMonth);
    } else {
      fetchAllNotes();
    }
    fetchStats(visibleMonth);
    fetchEvents(visibleMonth);
  }, [visibleMonth, viewMode]);

  useEffect(() => {
    fetchStats(visibleMonth);
  }, [dailyNotes, visibleMonth]);

  // Utilidades
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incidente': return <FaExclamationTriangle />;
      case 'mantenimiento': return <FaCog />;
      case 'reunion': return <FaUser />;
      case 'capacitacion': return <FaFileAlt />;
      default: return <FaCalendarAlt />;
    }
  };

  return (
    <div className="min-h-screen bg-primary text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-accent mb-2 flex items-center gap-2">
            <FaCalendarAlt />
            Calendario de Actividades y Eventos
          </h1>
          <p className="text-gray-400">Gestión y seguimiento de actividades diarias y eventos recurrentes del equipo de soporte</p>
        </div>

        {/* Controles superiores */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Pestañas para alternar entre notas y eventos */}
          <div className="flex items-center gap-2 bg-secondary border border-accent/20 rounded-xl shadow-lg p-1 w-fit">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                activeTab === 'notes' 
                  ? 'bg-accent text-white shadow-md' 
                  : 'text-accent hover:bg-accent/10'
              }`}
              onClick={() => setActiveTab('notes')}
            >
              <FaFileAlt />
              Notas Diarias
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                activeTab === 'events' 
                  ? 'bg-accent text-white shadow-md' 
                  : 'text-accent hover:bg-accent/10'
              }`}
              onClick={() => setActiveTab('events')}
            >
              <FaCalendarAlt />
              Eventos Recurrentes
            </button>
          </div>
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {activeTab === 'notes' && (
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
            )}
            
            <div className="flex items-center gap-3">
              {activeTab === 'notes' ? (
                <>
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl hover:bg-accent/80 transition-colors shadow-lg font-medium"
                    onClick={() => setIsCreating(true)}
                  >
                    <FaPlus />
                    Nueva Nota
                  </button>
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors shadow-lg font-medium ${
                      showFilters 
                        ? 'bg-accent text-white'
                        : 'bg-secondary/50 text-accent hover:bg-accent/10'
                    }`}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <FaFilter />
                    Filtros
                  </button>
                </>
              ) : (
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl hover:bg-accent/80 transition-colors shadow-lg font-medium"
                  onClick={() => setIsCreatingEvent(true)}
                >
                  <FaPlus />
                  Nuevo Evento
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && activeTab === 'notes' && (
          <div className="bg-secondary border border-accent/20 rounded-xl shadow-lg p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Buscar</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-primary border border-accent/30 rounded-lg focus:outline-none focus:border-accent text-white h-10"
                placeholder="Buscar notas..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tipo</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 bg-primary border border-accent/30 rounded-lg focus:outline-none focus:border-accent text-white h-10"
            >
              <option value="all">Todos</option>
              <option value="incidente">Incidente</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="reunion">Reunión</option>
              <option value="capacitacion">Capacitación</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>
      )}

        {/* Contenido principal */}
        {activeTab === 'notes' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Vista de Calendario */}
            {viewMode === 'calendar' ? (
            <>
              {/* Calendario */}
              <div className="lg:col-span-2">
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
                    const dayData = dayStats[dayKey];
                    const isSelected = selectedDate === dayKey;
                    const isToday = day === todayDay && mon === todayMonth && year === todayYear;
                    
                    return (
                      <div
                        key={day}
                        className={`relative rounded-lg p-2 text-center cursor-pointer border transition-all duration-200 min-h-[60px] flex flex-col justify-between
                          ${isSelected ? 'ring-2 ring-accent bg-accent/20' : 'border-accent/30 hover:border-accent/60'}
                          ${isToday ? 'border-2 border-blue-400' : ''}
                          ${dayData?.totalNotes ? 'bg-accent/10' : 'bg-primary/40'}
                        `}
                        onClick={() => setSelectedDate(dayKey)}
                      >
                        <span className={`text-sm font-medium ${dayData?.totalNotes ? 'text-accent' : 'text-white'}`}>
                          {day}
                        </span>
                        
                        {/* Indicadores de actividad */}
                        {dayData && (
                          <div className="flex flex-col gap-1">
                            {/* Mostrar indicadores por tipo de nota */}
                            {dayData.notesTypes.emergencia > 0 && (
                              <div className="w-full h-1 bg-red-400 rounded-full"></div>
                            )}
                            {dayData.notesTypes.reunion > 0 && (
                              <div className="w-full h-1 bg-blue-400 rounded-full"></div>
                            )}
                            {dayData.notesTypes.tarea > 0 && (
                              <div className="w-full h-1 bg-green-400 rounded-full"></div>
                            )}
                            <div className="text-xs text-accent font-bold">
                              {dayData.totalNotes}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

              {/* Panel del día seleccionado */}
              <div className="space-y-6">
                {/* Información del día */}
                <div className="bg-secondary border border-accent/20 rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-accent mb-4">
                    {new Date(selectedDate).toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h2>
                  
                  {dayStats[selectedDate] && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-primary/40 rounded-lg p-3">
                        <div className="text-accent font-bold">Total Notas</div>
                        <div className="text-xl font-bold text-white">{dayStats[selectedDate].totalNotes}</div>
                      </div>
                      <div className="bg-primary/40 rounded-lg p-3">
                        <div className="text-green-400 font-bold">Tareas</div>
                        <div className="text-xl font-bold text-white">{dayStats[selectedDate].notesTypes.tarea || 0}</div>
                      </div>
                      <div className="bg-primary/40 rounded-lg p-3">
                        <div className="text-blue-400 font-bold">Reuniones</div>
                        <div className="text-xl font-bold text-white">{dayStats[selectedDate].notesTypes.reunion || 0}</div>
                      </div>
                      <div className="bg-primary/40 rounded-lg p-3">
                        <div className="text-red-400 font-bold">Emergencias</div>
                        <div className="text-xl font-bold text-white">{dayStats[selectedDate].notesTypes.emergencia || 0}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notas del día */}
                <div className="bg-secondary border border-accent/20 rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-accent">
                      Notas del Día ({filteredNotes.length})
                    </h2>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
                        <p className="text-gray-400 mt-2">Cargando notas...</p>
                      </div>
                    ) : filteredNotes.length > 0 ? (
                      filteredNotes.map(note => (
                        <div key={note.id} className="bg-primary/40 rounded-lg p-3 border border-accent/30">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-accent">
                                {getTypeIcon(note.type)}
                              </span>
                              <h5 className="font-semibold text-white text-sm">{note.title}</h5>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => editNote(note)}
                                className="p-1 text-accent hover:bg-accent/10 rounded transition-colors"
                              >
                                <FaEdit className="text-xs" />
                              </button>
                              <button
                                onClick={() => deleteNote(note.id)}
                                className="p-1 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                              >
                                <FaTrash className="text-xs" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-gray-300 text-xs mb-2 line-clamp-2">{note.content}</p>
                          
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded bg-gray-500/20 text-gray-300">
                                {note.type}
                              </span>
                            </div>
                            <span className="text-gray-400">
                              {new Date(note.createdAt).toLocaleTimeString('es-ES', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FaCalendarAlt className="mx-auto text-4xl text-gray-600 mb-4" />
                        <p className="text-gray-400">No hay notas para este día</p>
                        <button
                          onClick={() => setIsCreating(true)}
                          className="mt-2 text-accent hover:underline"
                        >
                          Crear primera nota
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Vista de Lista */
            <div className="lg:col-span-3">
              <div className="bg-secondary border border-accent/20 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-accent">
                    Lista de Todas las Notas
                  </h2>
                  <p className="text-gray-400">
                    Total: {filteredNotes.length} notas
                  </p>
                </div>
                
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
                      <p className="text-gray-400 mt-2">Cargando notas...</p>
                    </div>
                  ) : filteredNotes.length > 0 ? (
                    filteredNotes.map(note => (
                      <div key={note.id} className="bg-primary/40 rounded-lg p-4 border border-accent/30 hover:border-accent/60 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-accent">
                              {getTypeIcon(note.type)}
                            </span>
                            <div>
                              <h5 className="font-semibold text-white">{note.title}</h5>
                              <p className="text-xs text-gray-400">
                                {new Date(note.date).toLocaleDateString('es-ES', { 
                                  weekday: 'short', 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => editNote(note)}
                              className="p-2 text-accent hover:bg-accent/10 rounded transition-colors"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => deleteNote(note.id)}
                              className="p-2 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-gray-300 text-sm mb-3">{note.content}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded text-xs font-medium bg-gray-500/20 text-gray-300">
                              {note.type}
                            </span>
                          </div>
                          <span className="text-gray-400 text-xs">
                            {new Date(note.createdAt).toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        
                        {note.tags && note.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {note.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <FaFileAlt className="mx-auto text-5xl text-gray-600 mb-4" />
                      <p className="text-gray-400 text-lg">No hay notas disponibles</p>
                      <button
                        onClick={() => setIsCreating(true)}
                        className="mt-4 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors"
                      >
                        Crear primera nota
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        ) : (
          /* Contenido de eventos recurrentes */
          <div className="space-y-6">
            {/* Panel de eventos */}
            <div className="bg-secondary border border-accent/20 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-accent">Eventos Recurrentes</h2>
                <div className="text-sm text-gray-400">
                  {events.length} evento{events.length !== 1 ? 's' : ''} registrado{events.length !== 1 ? 's' : ''}
                </div>
              </div>
              
              {eventsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                </div>
              ) : events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map((event) => (
                    <div key={event.id} className="bg-primary border border-accent/20 rounded-lg p-4 hover:border-accent/40 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-white text-sm leading-tight">{event.title}</h3>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => editEvent(event)}
                            className="p-1 text-gray-400 hover:text-accent transition-colors"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs text-gray-300">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-accent" />
                          <span>{new Date(event.startDate).toLocaleDateString()}</span>
                        </div>
                        {event.validador && (
                          <div className="flex items-center gap-2">
                            <FaUser className="text-accent" />
                            <span>{event.validador}</span>
                          </div>
                        )}
                        {event.modo && (
                          <div className="flex items-center gap-2">
                            <FaTools className="text-accent" />
                            <span className="capitalize">{event.modo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaCalendarAlt className="mx-auto text-4xl text-gray-400 mb-4" />
                  <p className="text-gray-400 mb-4">No hay eventos registrados</p>
                  <button
                    onClick={() => setIsCreatingEvent(true)}
                    className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors"
                  >
                    Crear primer evento
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de creación/edición de notas */}
        {isCreating && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-secondary border border-accent/20 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="bg-secondary border-b border-accent/20 p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-accent">
                      {editingNote ? 'Editar Nota' : 'Crear Nueva Nota'}
                    </h3>
                    <p className="text-sm text-gray-400 mt-2">
                      {editingNote ? 'Modifica la información de la nota' : 'Completa la información para crear una nueva nota'}
                    </p>
                  </div>
                  <button
                    onClick={resetForm}
                    className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-600/20"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-4">
                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Título *</label>
                    <input
                      type="text"
                      value={newNote.title || ''}
                      onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-primary border border-accent/30 rounded-lg focus:outline-none focus:border-accent text-white placeholder-gray-400 h-10"
                      placeholder="Título de la nota..."
                    />
                  </div>
                  
                  {/* Contenido */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Contenido *</label>
                    <textarea
                      value={newNote.content || ''}
                      onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 bg-primary border border-accent/30 rounded-lg focus:outline-none focus:border-accent text-white resize-none placeholder-gray-400"
                      placeholder="Descripción detallada..."
                    />
                  </div>
                  
                  {/* Fila de selectores */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Tipo</label>
                      <select
                        value={newNote.type || 'incidente'}
                        onChange={(e) => setNewNote(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-primary border border-accent/30 rounded-lg focus:outline-none focus:border-accent text-white h-10"
                      >
                        <option value="incidente">Incidente</option>
                        <option value="mantenimiento">Mantenimiento</option>
                        <option value="reunion">Reunión</option>
                        <option value="capacitacion">Capacitación</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Etiquetas (separadas por comas)</label>
                    <input
                      type="text"
                      value={newNote.tags?.join(', ') || ''}
                      onChange={(e) => setNewNote(prev => ({ 
                        ...prev, 
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
                      }))}
                      className="w-full px-3 py-2 bg-primary border border-accent/30 rounded-lg focus:outline-none focus:border-accent text-white placeholder-gray-400 h-10"
                      placeholder="servidor, urgente, mantenimiento..."
                    />
                  </div>
                  
                  {/* Recursos relacionados */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Recursos Relacionados (separados por comas)</label>
                    <input
                      type="text"
                      value={newNote.relatedResources?.join(', ') || ''}
                      onChange={(e) => setNewNote(prev => ({ 
                        ...prev, 
                        relatedResources: e.target.value.split(',').map(resource => resource.trim()).filter(resource => resource) 
                      }))}
                      className="w-full px-3 py-2 bg-primary border border-accent/30 rounded-lg focus:outline-none focus:border-accent text-white placeholder-gray-400 h-10"
                      placeholder="manual-servidor, ticket-123, documento-procedimiento..."
                    />
                  </div>
                </div>
              </div>
              
              {/* Footer con botones */}
              <div className="bg-secondary border-t border-accent/20 p-6 rounded-b-xl">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={resetForm}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium"
                  >
                    <FaTimes />
                    Cancelar
                  </button>
                  <button
                    onClick={saveNote}
                    disabled={!newNote.title || !newNote.content || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <FaSave />
                    {editingNote ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de creación/edición de eventos */}
        {isCreatingEvent && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-secondary border border-accent/20 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="bg-secondary border-b border-accent/20 p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-accent">
                      {editingEvent ? 'Editar Evento' : 'Crear Nuevo Evento'}
                    </h3>
                    <p className="text-sm text-gray-400 mt-2">
                      {editingEvent ? 'Modifica la información del evento' : 'Completa la información para crear un nuevo evento'}
                    </p>
                  </div>
                  <button
                    onClick={resetEventForm}
                    className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-600/20"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Título *</label>
                    <input
                      type="text"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-primary border border-accent/30 rounded-lg focus:outline-none focus:border-accent text-white placeholder-gray-400 h-10"
                      placeholder="Nombre del evento..."
                    />
                  </div>

                  {/* Fecha de inicio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Fecha de Inicio *</label>
                    <input
                      type="date"
                      value={newEvent.startDate}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-primary border border-accent/30 rounded-lg focus:outline-none focus:border-accent text-white h-10"
                    />
                  </div>

                  {/* Validador */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Validador</label>
                    <input
                      type="text"
                      value={newEvent.validador}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, validador: e.target.value }))}
                      className="w-full px-3 py-2 bg-primary border border-accent/30 rounded-lg focus:outline-none focus:border-accent text-white placeholder-gray-400 h-10"
                      placeholder="Nombre del validador..."
                    />
                  </div>

                  {/* Modo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Modo</label>
                    <select
                      value={newEvent.modo}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, modo: e.target.value }))}
                      className="w-full px-3 py-2 bg-primary border border-accent/30 rounded-lg focus:outline-none focus:border-accent text-white h-10"
                    >
                      <option value="">Seleccionar modo...</option>
                      <option value="presencial">Presencial</option>
                      <option value="virtual">Virtual</option>
                      <option value="hibrido">Híbrido</option>
                    </select>
                  </div>

                  {/* Código DANA */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Código DANA</label>
                    <input
                      type="text"
                      value={newEvent.codigoDana}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, codigoDana: e.target.value }))}
                      className="w-full px-3 py-2 bg-primary border border-accent/30 rounded-lg focus:outline-none focus:border-accent text-white placeholder-gray-400 h-10"
                      placeholder="Código DANA del evento..."
                    />
                  </div>

                  {/* Nombre de notificación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nombre de Notificación</label>
                    <input
                      type="text"
                      value={newEvent.nombreNotificacion}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, nombreNotificacion: e.target.value }))}
                      className="w-full px-3 py-2 bg-primary border border-accent/30 rounded-lg focus:outline-none focus:border-accent text-white placeholder-gray-400 h-10"
                      placeholder="Nombre para las notificaciones..."
                    />
                  </div>
                </div>
              </div>
              
              {/* Footer con botones */}
              <div className="bg-secondary border-t border-accent/20 p-6 rounded-b-xl">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={resetEventForm}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium"
                  >
                    <FaTimes />
                    Cancelar
                  </button>
                  <button
                    onClick={saveEvent}
                    disabled={!newEvent.title || !newEvent.startDate || eventsLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaSave />
                    {editingEvent ? 'Actualizar' : 'Crear'} Evento
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Burbuja flotante del asistente de IA */}
      <AssistantBubble />
    </div>
  );
};

export default Calendar;
