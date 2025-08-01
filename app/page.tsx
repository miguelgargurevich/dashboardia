"use client";
import AssistantBubble from './components/AsisstantIA/AssistantBubble';
import CalendarWithDetail from './components/eventos/CalendarWithDetail';
import DetalleEventoPanel from './components/eventos/DetalleEventoPanel';

interface Event {
  id: string;
  title: string;
  recurrencePattern: string;
  startDate: string;
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
    async function fetchEvents() {
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
          setEvents(eventData.filter((event: Event) => event.recurrencePattern === 'ninguno'));
          setRecurringEvents(eventData.filter((event: Event) => event.recurrencePattern !== 'ninguno'));
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
    }
    fetchEvents();
  }, [visibleMonth, token]);
  // Dummy para notas
  const hasNotesOnDay = () => false;

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
                  handleEditEvent={() => {}}
                  handleDeleteEvent={() => {}}
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
      {mounted && isLoggedIn && <AssistantBubble />}
    </>
  );
}
