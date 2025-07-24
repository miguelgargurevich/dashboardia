"use client";
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
  FaClipboardList
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

interface DayContent {
  date: string;
  notes: DailyNote[];
  events: Event[];
  hasContent: boolean;
  notesCount: number;
  eventsCount: number;
}

const Calendar: React.FC = () => {
  const searchParams = useSearchParams();
  
  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('🔑 Token en localStorage:', token ? 'Present' : 'Missing');
    if (token) {
      try {
        // Decodificar el token para ver su contenido (sin verificar)
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('📋 Token payload:', payload);
        console.log('⏰ Token expiry:', new Date(payload.exp * 1000));
        console.log('🕐 Current time:', new Date());
        console.log('✅ Token is valid:', payload.exp * 1000 > Date.now());
      } catch (error) {
        console.error('❌ Error decoding token:', error);
      }
    }
    
    if (!token) {
      console.log('🚫 No token found, redirecting to login');
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
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [recurringEvents, setRecurringEvents] = useState<Event[]>([]);
  const [showRecurringEvents, setShowRecurringEvents] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(false); // Nuevo estado
  
  // Estados para eventos recurrentes - ELIMINADOS
  
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

  // Obtener contenido combinado del día (notas + eventos + eventos recurrentes)
  const getDayContent = (dateString: string): DayContent => {
    const dayNotes = dailyNotes.filter(note => note.date === dateString);
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startDate).toISOString().slice(0, 10);
      return eventDate === dateString;
    });
    
    // Incluir eventos recurrentes si están habilitados
    const dayRecurringEvents = showRecurringEvents ? recurringEvents.filter(event => {
      const eventDate = new Date(event.startDate).toISOString().slice(0, 10);
      return eventDate === dateString;
    }) : [];
    
    const allEvents = [...dayEvents, ...dayRecurringEvents];

    return {
      date: dateString,
      notes: dayNotes,
      events: allEvents,
      hasContent: dayNotes.length > 0 || allEvents.length > 0,
      notesCount: dayNotes.length,
      eventsCount: allEvents.length
    };
  };

  // Funciones de API
  const fetchNotes = async (month?: string) => {
    setLoading(true);
    try {
      const queryParam = month ? `month=${month}` : '';
      const url = `/api/calendar/notes?${queryParam}`;
      console.log('🔍 Fetching notes from:', url);
      console.log('🔑 Token:', getToken() ? 'Present' : 'Missing');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const notes = await response.json();
        console.log('📝 Notes received:', notes);
        console.log('📊 Notes count:', notes.length);
        setDailyNotes(notes);
        setIsUsingMockData(false);
      } else {
        const errorText = await response.text();
        console.error('❌ Error fetching notes:', response.status, response.statusText, errorText);
        // Fallback a datos de muestra
        loadSampleData();
      }
    } catch (error) {
      console.error('💥 Exception fetching notes:', error);
      // Fallback a datos de muestra
      loadSampleData();
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar eventos
  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      console.log('[Calendar] Iniciando carga de eventos...');
      
      const token = getToken();
      
      const response = await fetch(`/api/events/calendar?month=${visibleMonth}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error('[Calendar] Error al cargar eventos:', response.status, response.statusText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const eventData = await response.json();
      console.log('[Calendar] Eventos recibidos del backend:', eventData);
      
      if (Array.isArray(eventData)) {
        // Primero, vamos a ver qué eventos tenemos
        console.log('[Calendar] 🔍 Analizando eventos del backend:');
        eventData.forEach((event: any, index: number) => {
          console.log(`[Calendar] Evento ${index + 1}:`, {
            id: event.id,
            title: event.title,
            description: event.description,
            titleLower: event.title?.toLowerCase(),
            hasRecurringKeywords: isRecurringEvent(event)
          });
        });
        
        // Transformar los eventos del backend para que tengan la propiedad isRecurring
        const transformedEvents = eventData.map((event: any) => ({
          ...event,
          isRecurring: isRecurringEvent(event),
          recurrencePattern: getRecurrencePattern(event)
        }));
        
        // Separar eventos regulares y recurrentes
        const regularEvents = transformedEvents.filter((event: any) => !event.isRecurring);
        const recurringEventsData = transformedEvents.filter((event: any) => event.isRecurring);
        
        console.log('[Calendar] 📊 Eventos después de la clasificación:');
        console.log('[Calendar] Eventos regulares:', regularEvents.map(e => ({ id: e.id, title: e.title })));
        console.log('[Calendar] Eventos recurrentes:', recurringEventsData.map(e => ({ id: e.id, title: e.title, pattern: e.recurrencePattern })));
        
        setEvents(regularEvents);
        setRecurringEvents(recurringEventsData);
        
        console.log('[Calendar] Eventos regulares establecidos:', regularEvents.length);
        console.log('[Calendar] Eventos recurrentes establecidos:', recurringEventsData.length);
      } else {
        console.warn('[Calendar] Formato de eventos inesperado:', eventData);
        setEvents([]);
        setRecurringEvents([]);
      }
      
    } catch (error) {
      console.error('[Calendar] Error cargando eventos:', error);
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

  const fetchAllNotes = async () => {
    setLoading(true);
    try {
      const url = '/api/calendar/notes';
      console.log('🔍 Fetching all notes from:', url);
      console.log('🔑 Token:', getToken() ? 'Present' : 'Missing');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const notes = await response.json();
        console.log('📝 All notes received:', notes);
        console.log('📊 All notes count:', notes.length);
        setDailyNotes(notes);
        setIsUsingMockData(false);
      } else if (response.status === 401) {
        // Token expirado o inválido, redirigir al login
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      } else {
        const errorText = await response.text();
        console.error('❌ Error fetching all notes:', response.status, response.statusText, errorText);
        // Fallback a datos de muestra expandidos
        loadExtendedSampleData();
      }
    } catch (error) {
      console.error('💥 Exception fetching all notes:', error);
      // Fallback a datos de muestra expandidos
      loadExtendedSampleData();
    } finally {
      setLoading(false);
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
    setIsUsingMockData(true);
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
    setIsUsingMockData(true);
  };

  // Funciones de notas
  const saveNote = async () => {
    if (!newNote.title || !newNote.content) return;
    
    // Si estamos usando datos de muestra, solo agregar localmente
    if (isUsingMockData) {
      const newId = Date.now().toString();
      const noteData: DailyNote = {
        id: newId,
        date: selectedDate,
        title: newNote.title,
        content: newNote.content,
        type: newNote.type || 'incidente',
        tags: newNote.tags || [],
        relatedResources: newNote.relatedResources || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      if (editingNote) {
        setDailyNotes(prev => prev.map(n => n.id === editingNote ? noteData : n));
      } else {
        setDailyNotes(prev => [...prev, noteData]);
      }
      
      resetForm();
      alert('Nota guardada exitosamente (modo sin conexión)');
      return;
    }
    
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
        const response = await fetch(`/api/calendar/notes/${editingNote}`, {
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
        } else if (response.status === 401) {
          // Token expirado o inválido, redirigir al login
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        } else {
          console.error('Error updating note:', response.statusText);
        }
      } else {
        // Crear nueva nota
        const response = await fetch('/api/calendar/notes', {
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
        } else if (response.status === 401) {
          // Token expirado o inválido, redirigir al login
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        } else {
          console.error('Error creating note:', response.statusText);
        }
      }

      resetForm();
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
      return;
    }
    
    // Si estamos usando datos de muestra, solo eliminar localmente
    if (isUsingMockData) {
      setDailyNotes(prev => prev.filter(n => n.id !== id));
      alert('Nota eliminada exitosamente (modo sin conexión)');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/calendar/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setDailyNotes(prev => prev.filter(n => n.id !== id));
        alert('Nota eliminada exitosamente');
      } else if (response.status === 401) {
        // Token expirado o inválido, redirigir al login
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      } else {
        const errorData = await response.json();
        console.error('Error deleting note:', response.statusText, errorData);
        alert(`Error eliminando nota: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Error de conexión al eliminar la nota');
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

  // Efectos
  useEffect(() => {
    if (viewMode === 'calendar') {
      fetchNotes(visibleMonth);
    } else {
      fetchAllNotes();
    }
    fetchEvents(); // Cargar eventos (incluye regulares y recurrentes)
  }, [visibleMonth, viewMode]);

  useEffect(() => {
    // Efecto eliminado - ya no necesitamos fetchStats
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
          {/* Vista de Calendario */}
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
                          
                          {/* Contenido del día - Notas y Eventos */}
                          <div className="flex flex-col gap-1 w-full overflow-hidden">
                            {/* Mostrar primeras 2 notas */}
                            {dayContent.notes.slice(0, 2).map((note, index) => (
                              <div key={`note-${index}`} className="w-full">
                                <div className={`text-xs px-1 py-0.5 rounded text-white truncate ${
                                  note.type === 'incidente' ? 'bg-red-500/80' :
                                  note.type === 'mantenimiento' ? 'bg-orange-500/80' :
                                  note.type === 'reunion' ? 'bg-blue-500/80' :
                                  note.type === 'capacitacion' ? 'bg-green-500/80' :
                                  'bg-gray-500/80'
                                }`}>
                                  {note.title}
                                </div>
                              </div>
                            ))}
                            
                            {/* Mostrar primeros 2 eventos */}
                            {dayContent.events.slice(0, 2).map((event, index) => (
                              <div key={`event-${event.id}-${index}-${event.isRecurring ? 'recurring' : 'regular'}`} className="w-full">
                                <div className={`text-xs px-1 py-0.5 rounded text-black truncate ${
                                  event.isRecurring ? 'bg-purple-500/80' : 'bg-yellow-500/80'
                                }`}>
                                  {event.isRecurring && '🔄 '}{event.title}
                                </div>
                              </div>
                            ))}
                            
                            {/* Contador si hay más elementos */}
                            {(dayContent.notesCount + dayContent.eventsCount > 4) && (
                              <div className="text-xs text-accent font-bold">
                                +{dayContent.notesCount + dayContent.eventsCount - 4} más
                              </div>
                            )}
                            
                            {/* Contadores compactos */}
                            {dayContent.hasContent && (
                              <div className="flex justify-between text-xs mt-1">
                                {dayContent.notesCount > 0 && (
                                  <span className="text-accent font-bold">{dayContent.notesCount}N</span>
                                )}
                                {dayContent.eventsCount > 0 && (
                                  <span className="text-yellow-400 font-bold">{dayContent.eventsCount}E</span>
                                )}
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
                  
                  <div className="space-y-3 max-h-64 overflow-y-auto">
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

              {/* Panel del día seleccionado */}
              <div className="space-y-6">
                {/* Información del día */}
                <div className="bg-secondary border border-accent/20 rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-accent mb-4">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h2>
                  
                  {/* Estadísticas de eventos recurrentes */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary/40 rounded-lg p-3 border border-purple-400/30">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-purple-400">🔄</span>
                        <span className="text-xs font-medium text-purple-300">Eventos Recurrentes</span>
                      </div>
                      <p className="text-xl font-bold text-purple-400">{recurringEvents.length}</p>
                    </div>
                    
                    <div className="bg-primary/40 rounded-lg p-3 border border-yellow-400/30">
                      <div className="flex items-center gap-2 mb-1">
                        <FaCalendarAlt className="text-yellow-400" />
                        <span className="text-xs font-medium text-yellow-300">Eventos Únicos</span>
                      </div>
                      <p className="text-xl font-bold text-yellow-400">{events.length}</p>
                    </div>
                  </div>
                </div>

                {/* Contenido del día - Solo Notas */}
                <div className="bg-secondary border border-accent/20 rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-accent flex items-center gap-2">
                      <FaClipboardList />
                      Notas del Día ({filteredNotes.length})
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                          showFilters 
                            ? 'bg-accent text-white'
                            : 'bg-accent/20 text-accent hover:bg-accent/30'
                        }`}
                        onClick={() => setShowFilters(!showFilters)}
                        title="Filtros"
                      >
                        <FaFilter />
                      </button>
                      <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center justify-center w-8 h-8 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors"
                        title="Nueva Nota"
                      >
                        <FaPlus />
                      </button>
                    </div>
                  </div>

                  {/* Filtros locales */}
                  {showFilters && (
                    <div className="mb-4 p-4 bg-primary/20 rounded-lg border border-accent/10">
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1">Buscar</label>
                          <div className="relative">
                            <FaSearch className="absolute left-2 top-2 text-gray-400 text-xs" />
                            <input
                              type="text"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-7 pr-2 py-1 bg-primary border border-accent/30 rounded text-white text-xs"
                              placeholder="Buscar notas..."
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1">Tipo</label>
                          <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full px-2 py-1 bg-primary border border-accent/30 rounded text-white text-xs"
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
                    </div>
                  )}
                  
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
                            <span className="px-2 py-1 rounded bg-gray-500/20 text-gray-300 capitalize">
                              {note.type}
                            </span>
                            <span className="text-gray-400">
                              {new Date(note.createdAt).toLocaleTimeString('es-ES', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          
                          {note.tags && note.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
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
                      <div className="text-center py-8">
                        <FaClipboardList className="mx-auto text-4xl text-gray-600 mb-4" />
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
                  <div className="flex items-center gap-3">
                    <p className="text-gray-400">
                      Total: {filteredNotes.length} notas
                    </p>
                    <button
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                        showFilters 
                          ? 'bg-accent text-white'
                          : 'bg-accent/20 text-accent hover:bg-accent/30'
                      }`}
                      onClick={() => setShowFilters(!showFilters)}
                      title="Filtros"
                    >
                      <FaFilter />
                    </button>
                    <button
                      onClick={() => setIsCreating(true)}
                      className="flex items-center justify-center w-8 h-8 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors"
                      title="Nueva Nota"
                    >
                      <FaPlus />
                    </button>
                  </div>
                </div>

                {/* Filtros para vista de lista */}
                {showFilters && (
                  <div className="mb-6 p-4 bg-primary/20 rounded-lg border border-accent/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                )}
                
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
                                {new Date(note.date + 'T12:00:00').toLocaleDateString('es-ES')}
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
                          <span className="px-3 py-1 rounded text-xs font-medium bg-gray-500/20 text-gray-300 capitalize">
                            {note.type}
                          </span>
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
      </div>
      
      {/* Burbuja flotante del asistente de IA */}
      <AssistantBubble />
    </div>
  );
};

export default Calendar;
