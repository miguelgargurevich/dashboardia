"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { FaCalendarAlt, FaAngleLeft, FaAngleRight, FaRegCalendarAlt } from "react-icons/fa";
import DetalleEventoPanel from '../eventos/DetalleEventoPanel';

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
  relatedResources?: string[];
  eventType?: string;
  recurrencePattern?: string;
}

interface Props {
  token: string;
  selectedDate?: string;
  triggerDateSelection?: number;
  onDateChange?: (date: string) => void;
  onTodayClick?: () => void;
}


const EventsCalendar: React.FC<Props> = ({ token, selectedDate: externalSelectedDate, triggerDateSelection, onDateChange, onTodayClick }) => {
  // Calcular fecha actual una vez al renderizar
  const { todayDay } = useMemo(() => {
    const today = new Date();
    return {
      todayDay: today.getDate(),
    };
  }, []);
  
  // Días de la semana (Lun a Dom)
  // const weekDays = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const [events, setEvents] = useState<Event[]>([]);
  // const [loading, setLoading] = useState(true);
  // Siempre mostrar el panel del día actual
  const [selectedDate, setSelectedDate] = useState<string>(todayDay.toString());
  // Estado para el mes visible SIEMPRE inicia en el mes actual
  const jsDate = new Date();
  const [visibleMonth, setVisibleMonth] = useState<string>(jsDate.toISOString().slice(0,7));

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch(`/api/events/calendar?month=${visibleMonth}`, {
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
          console.error('Error fetching events:', res.statusText);
          setEvents([]);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } finally {
      }
    }
    fetchEvents();
  }, [token, visibleMonth]);

  // Efecto para responder a cambios de fecha externa (desde UpcomingEvents)
  useEffect(() => {
    if (externalSelectedDate && triggerDateSelection && triggerDateSelection > 0) {
      // Extraer fecha directamente del string para evitar problemas de zona horaria
      const [year, month, day] = externalSelectedDate.split('-').map(Number);
      
      // Actualizar el mes visible si es diferente
      const newVisibleMonth = `${year}-${String(month).padStart(2, '0')}`;
      if (newVisibleMonth !== visibleMonth) {
        setVisibleMonth(newVisibleMonth);
      }
      
      // Actualizar el día seleccionado
      setSelectedDate(day.toString());
    }
  }, [externalSelectedDate, triggerDateSelection, visibleMonth]);

  // Generar días del mes actual
  const [yyyy, mm] = visibleMonth.split('-');
  const year = Number(yyyy);
  const mon = Number(mm) - 1; // 0-indexed para JS
  // const daysInMonth = new Date(year, mon + 1, 0).getDate();
  // Calcular el día de la semana del primer día del mes (0=Dom, 1=Lun...)
  let firstDayOfWeek = new Date(year, mon, 1).getDay();
  // Ajustar para que el lunes sea el primer día (0=Lun, 6=Dom)
  firstDayOfWeek = (firstDayOfWeek === 0) ? 6 : firstDayOfWeek - 1;
  // Array de días del mes
  // const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Eventos por día
  const eventsByDay: { [key: number]: Event[] } = {};
  if (events && Array.isArray(events)) {
    events.forEach(ev => {
      // Las fechas ya vienen con hora desde el backend, extraer solo la fecha
      const eventDate = new Date(ev.startDate);
      const day = eventDate.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(ev);
    });
  }

  // Nombre del mes
  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const monthLabel = `${monthNames[mon]} ${year}`;

  // Navegación de meses
  function changeMonth(offset: number) {
    // Extraer año y mes actual
    const [yyyy, mm] = visibleMonth.split('-');
    let year = Number(yyyy);
    let month = Number(mm) - 1 + offset; // 0-indexed
    // Ajustar año si el mes se sale de rango
    if (month < 0) {
      year -= 1;
      month = 11;
    } else if (month > 11) {
      year += 1;
      month = 0;
    }
    const nuevoMes = `${year}-${String(month + 1).padStart(2, '0')}`;
    setVisibleMonth(nuevoMes);
    setSelectedDate('1');
  }
  function goToToday() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // +1 porque getMonth() devuelve 0-11
    const currentDay = currentDate.getDate();
    
    // Actualizar el mes visible al mes actual
    setVisibleMonth(`${currentYear}-${String(currentMonth).padStart(2, '0')}`);
    // Actualizar el día seleccionado al día actual
    setSelectedDate(currentDay.toString());
    
    // Notificar el cambio de fecha si hay callback
    if (onDateChange) {
      const todayString = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
      onDateChange(todayString);
    }
    
    // Notificar que se hizo clic en "Hoy" para activar triggers en el componente padre
    if (onTodayClick) {
      onTodayClick();
    }
  }

  return (
    <div className="bg-primary rounded-lg p-4 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-accent">{monthLabel}</h3>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 rounded text-accent font-bold flex items-center hover:bg-accent/10 transition-colors" onClick={() => changeMonth(-1)}>
            <FaAngleLeft className="text-accent" />
          </button>
          <button className="px-2 py-1 rounded text-accent font-bold flex items-center hover:bg-accent/10 transition-colors" onClick={goToToday}>
            <FaRegCalendarAlt className="mr-1 text-accent" /> Hoy
          </button>
          <button className="px-2 py-1 rounded text-accent font-bold flex items-center hover:bg-accent/10 transition-colors" onClick={() => changeMonth(1)}>
            <FaAngleRight className="text-accent" />
          </button>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xl font-bold text-yellow-400">
            Eventos del día {selectedDate} ({eventsByDay[parseInt(selectedDate)]?.length || 0})
          </h4>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {eventsByDay[parseInt(selectedDate)]?.length > 0 ? (
            eventsByDay[parseInt(selectedDate)].map((event) => (
              <DetalleEventoPanel
                key={event.id}
                eventoSeleccionado={event}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <FaCalendarAlt className="mx-auto text-4xl text-gray-600 mb-4" />
              <p className="text-gray-400">No hay eventos para este día</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsCalendar;
