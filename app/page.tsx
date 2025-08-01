"use client";
import AssistantBubble from './components/AsisstantIA/AssistantBubble';
import CalendarWithDetail from './components/eventos/CalendarWithDetail';
import DetalleEventoPanel from './components/eventos/DetalleEventoPanel';
import EventoForm from './components/eventos/EventoForm';
import Modal from './components/Modal';

interface EventoData {
  id: string;
  titulo: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin: string;
  tema?: string;
  tipoEvento?: string;
  ubicacion?: string;
  esRecurrente?: boolean;
  recurrencePattern?: string;
  recurrenceInterval?: number;
  recurrenceEndDate?: string;
  daysOfWeek?: string;
  recursos?: Array<{ id: string; titulo: string; }>;
  // Campos legacy para compatibilidad
  title?: string;
  startDate?: string;
  description?: string;
  endDate?: string;
  location?: string;
  eventType?: string;
  isRecurring?: boolean;
  relatedResources?: string[];
  validador?: string;
  modo?: string;
  codigoDana?: string;
  nombreNotificacion?: string;
  diaEnvio?: string;
  query?: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  recurrencePattern: string;
  eventType?: string;
  isRecurring?: boolean;
  diaEnvio?: string;
  query?: string;
  relatedResources?: string[];
  validador?: string;
  modo?: string;
  codigoDana?: string;
  nombreNotificacion?: string;
  // Campos nuevos con nombres en español
  titulo?: string;
  descripcion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  ubicacion?: string;
  tipoEvento?: string;
  esRecurrente?: boolean;
  tema?: string;
  recursos?: Array<{ id: string; titulo: string; }>;
}

import ProximosEventosCard from './components/dashboard/ProximosEventosCard';
import { FaRegCalendarAlt } from "react-icons/fa";
// ...existing code...
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Estados para el calendario
  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [visibleMonth, setVisibleMonth] = useState<string>(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
  const [events, setEvents] = useState<Event[]>([]);
  const [recurringEvents, setRecurringEvents] = useState<Event[]>([]);
  const [showRecurringEvents, setShowRecurringEvents] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [triggerDateSelection, setTriggerDateSelection] = useState<number>(0);
  
  // Estados para el modal de edición
  const [editingEvent, setEditingEvent] = useState<EventoData | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  
  const weekDays = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
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
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    setVisibleMonth(`${year}-${month}`);
    setSelectedDate(`${year}-${month}-${String(today.getDate()).padStart(2, '0')}`);
  };
  // Obtener eventos del día seleccionado
  const selectedDayEvents = events.filter(event => {
    const eventDate = new Date(event.startDate).toISOString().slice(0, 10);
    return eventDate === selectedDate;
  });
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
  // Fetch real de eventos desde la API
  useEffect(() => {
    fetchEventsData();
  }, [visibleMonth, token]);
  // Dummy para notas
  const hasNotesOnDay = () => false;

  // Funciones para edición de eventos
  const handleEditEvent = async (event: Event) => {
    console.log('Evento recibido para editar:', event);
    
    // Si el evento ya tiene todos los datos, usarlos directamente
    if (event.titulo || event.descripcion || event.fechaInicio) {
      console.log('Usando evento con datos completos directamente');
      setEditingEvent(event as EventoData);
      setShowEventForm(true);
      return;
    }

    // Si no, obtener los datos completos del evento desde la API
    try {
      console.log('Obteniendo datos completos del evento desde API...');
      const response = await fetch(`/api/events/${event.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const eventoCompleto = await response.json();
        console.log('Evento completo obtenido de la API:', eventoCompleto);
        setEditingEvent(eventoCompleto);
        setShowEventForm(true);
      } else {
        alert('Error al cargar los datos del evento');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar los datos del evento');
    }
  };

  const handleSubmitEvent = async (eventoData: any) => {
    try {
      console.log('Enviando datos del evento:', eventoData);
      
      const response = await fetch(`/api/events/${editingEvent?.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventoData),
      });

      if (response.ok) {
        console.log('Evento actualizado exitosamente');
        setShowEventForm(false);
        setEditingEvent(null);
        // Refrescar los eventos
        await fetchEventsData();
      } else {
        console.error('Error al actualizar evento:', response.statusText);
        alert('Error al actualizar el evento');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el evento');
    }
  };  const handleDeleteEvent = async (event: Event) => {
    if (!token) return;
    
    if (confirm('¿Estás seguro de que deseas eliminar este evento?')) {
      try {
        const response = await fetch(`/api/events/${event.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Refrescar eventos después de eliminar
          await fetchEventsData();
        } else {
          alert('Error al eliminar el evento');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el evento');
      }
    }
  };

  const fetchEventsData = async () => {
    setLoadingEvents(true);
    try {
      if (!token) {
        setEvents([]);
        setRecurringEvents([]);
        setLoadingEvents(false);
        return;
      }
      const response = await fetch(`/api/events/calendar?month=${visibleMonth}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        setEvents([]);
        setRecurringEvents([]);
        setLoadingEvents(false);
        return;
      }
      const eventData = await response.json();
      if (Array.isArray(eventData)) {
        // Mantener todos los datos del evento, solo normalizar los campos necesarios
        const normalizedEvents = eventData.map((evento: any) => ({
          ...evento,
          // Asegurar que los campos básicos estén disponibles para CalendarWithDetail
          title: evento.titulo || evento.title || '',
          startDate: evento.fechaInicio || evento.startDate || '',
          recurrencePattern: evento.recurrencePattern || 'ninguno'
        }));
        
        setEvents(normalizedEvents.filter((event: Event) => (event.recurrencePattern || 'ninguno') === 'ninguno'));
        setRecurringEvents(normalizedEvents.filter((event: Event) => (event.recurrencePattern || 'ninguno') !== 'ninguno'));
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

  useEffect(() => {
    setMounted(true);
    const t = localStorage.getItem('token');
    setIsLoggedIn(!!t);
    setToken(t);
    if (!t) {
      router.push('/login');
    }
  }, [router]);

  if (!mounted || isLoggedIn === null) {
    return null; // Espera a montar y verificar
  }

  return (
    <>
      <div className="min-h-screen bg-primary text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-accent mb-2">Dashboard Soporte</h1>
            <p className="text-gray-400">Resumen de actividades y métricas del equipo de soporte</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna Izquierda: Eventos */}
            <div className="flex flex-col gap-6">

                <CalendarWithDetail
                  token={token || ''}
                  weekDays={weekDays}
                  monthNames={monthNames}
                  mon={mon}
                  year={year}
                  todayDay={todayDay}
                  todayMonth={todayMonth}
                  todayYear={todayYear}
                  firstDayOfWeek={firstDayOfWeek}
                  days={days}
                  selectedDate={selectedDate}
                  visibleMonth={visibleMonth}
                  changeMonth={changeMonth}
                  goToToday={goToToday}
                  getDayContent={getDayContent}
                  setSelectedDate={setSelectedDate}
                  showRecurringEvents={showRecurringEvents}
                  recurringEvents={recurringEvents}
                  loadingEvents={loadingEvents}
                  selectedDayEvents={selectedDayEvents}
                  hasNotesOnDay={hasNotesOnDay}
                  DetalleEventoPanel={DetalleEventoPanel}
                  handleEditEvent={handleEditEvent}
                  handleDeleteEvent={handleDeleteEvent}
                />

            </div>
            {/* Columna Derecha: Próximos eventos (panel más alto, sin gráfico) */}
            <div className="flex flex-col gap-6">
              <div>
                <ProximosEventosCard
                  token={token || ''}
                  onEventClick={(date: string) => {
                    setSelectedDate(date);
                    // Actualizar el mes visible si el evento es de otro mes
                    const [year, month] = date.split('-');
                    setVisibleMonth(`${year}-${month}`);
                    setTriggerDateSelection(prev => prev + 1);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

            {/* Modal para editar evento */}
      {showEventForm && editingEvent && (
        <Modal 
          open={showEventForm} 
          onClose={() => setShowEventForm(false)}
          title="Editar Evento"
        >
          <EventoForm 
            initialValues={(() => {
              const initialValues = {
                title: editingEvent.titulo || editingEvent.title || '',
                description: editingEvent.descripcion || editingEvent.description || '',
                startDate: editingEvent.fechaInicio || editingEvent.startDate || '',
                endDate: editingEvent.fechaFin || editingEvent.endDate || '',
                location: editingEvent.ubicacion || editingEvent.location || '',
                query: editingEvent.query || '',
                validador: editingEvent.validador || '',
                codigoDana: editingEvent.codigoDana || '',
                diaEnvio: editingEvent.diaEnvio || '',
                nombreNotificacion: editingEvent.nombreNotificacion || '',
                relatedResources: editingEvent.recursos?.map(r => r.id) || editingEvent.relatedResources || [],
                eventType: editingEvent.tipoEvento || editingEvent.eventType || '',
                modo: editingEvent.modo || '',
              };
              console.log('Initial values para el form:', initialValues);
              console.log('editingEvent completo:', editingEvent);
              return initialValues;
            })()}
            onSubmit={handleSubmitEvent}
            onCancel={() => setShowEventForm(false)}
          />
        </Modal>
      )}

      {mounted && isLoggedIn && <AssistantBubble />}
    </>
  );
}
