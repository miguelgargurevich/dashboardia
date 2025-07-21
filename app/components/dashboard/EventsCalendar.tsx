"use client";
import React, { useEffect, useState } from 'react';
import { FaTools, FaChalkboardTeacher, FaUsers, FaRobot, FaClipboardList, FaLaptop, FaCalendarAlt, FaAngleLeft, FaAngleRight, FaRegCalendarAlt } from "react-icons/fa";

interface Event {
  id: string;
  title: string;
  startDate: string;
}

interface Props {
  token: string;
}


const EventsCalendar: React.FC<Props> = ({ token }) => {
  // Día actual (número y mes/año)
  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();
  // Días de la semana (Lun a Dom)
  const weekDays = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  // Estado para el mes visible SIEMPRE inicia en el mes actual
  const jsDate = new Date();
  const [visibleMonth, setVisibleMonth] = useState<string>(jsDate.toISOString().slice(0,7));

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      const res = await fetch(`/api/events/calendar?month=${visibleMonth}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setEvents(data);
      setLoading(false);
    }
    fetchEvents();
  }, [token, visibleMonth]);

  // Generar días del mes actual
  const [yyyy, mm] = visibleMonth.split('-');
  const year = Number(yyyy);
  const mon = Number(mm) - 1; // 0-indexed para JS
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  // Calcular el día de la semana del primer día del mes (0=Dom, 1=Lun...)
  let firstDayOfWeek = new Date(year, mon, 1).getDay();
  // Ajustar para que el lunes sea el primer día (0=Lun, 6=Dom)
  firstDayOfWeek = (firstDayOfWeek === 0) ? 6 : firstDayOfWeek - 1;
  // Array de días del mes
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Eventos por día
  const eventsByDay: { [key: number]: Event[] } = {};
  events.forEach(ev => {
    const day = new Date(ev.startDate).getDate();
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(ev);
  });

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
    setSelectedDate(null);
  }
  function goToToday() {
    setVisibleMonth(new Date().toISOString().slice(0,7));
    setSelectedDate(null);
  }

  return (
    <div className="bg-primary rounded-lg p-4 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-accent">{monthLabel}</h3>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 rounded bg-accent text-primary font-bold flex items-center" onClick={() => changeMonth(-1)}>
            <FaAngleLeft />
          </button>
          <button className="px-2 py-1 rounded bg-accent text-primary font-bold flex items-center" onClick={goToToday}>
            <FaRegCalendarAlt className="mr-1" /> Hoy
          </button>
          <button className="px-2 py-1 rounded bg-accent text-primary font-bold flex items-center" onClick={() => changeMonth(1)}>
            <FaAngleRight />
          </button>
        </div>
      </div>
      {loading ? <div>Cargando...</div> : (
        <div className="grid grid-cols-7 gap-2 mb-4">
          {/* Cabecera de días de la semana */}
          {weekDays.map((wd, idx) => (
            <div key={wd} className="text-xs font-bold text-accent text-center pb-2">{wd}</div>
          ))}
          {/* Espacios vacíos para alinear el primer día */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`}></div>
          ))}
          {/* Días del mes */}
          {days.map(day => (
            <div
              key={day}
              className={`rounded-lg p-2 text-center cursor-pointer border border-accent/30
                ${eventsByDay[day] ? 'bg-accent/20 text-accent font-bold' : 'bg-primary/40 text-white'}
                ${selectedDate === day.toString() ? 'ring-2 ring-accent' : ''}
                ${(day === todayDay && mon === todayMonth && year === todayYear) ? 'border-2 border-blue-400' : ''}`}
              onClick={() => setSelectedDate(day.toString())}
            >
              {day}
            </div>
          ))}
        </div>
      )}
      {/* Detalles de eventos del día seleccionado */}
      {selectedDate && eventsByDay[parseInt(selectedDate)] && (
        <div className="mt-2">
          <h4 className="text-accent font-bold mb-2">Eventos el día {selectedDate}</h4>
          {eventsByDay[parseInt(selectedDate)].map(ev => (
            <div key={ev.id} className="bg-accent/10 rounded-lg p-2 mb-6 flex items-center gap-2">
              {/* Icono según el tipo/título del evento */}
              {ev.title.toLowerCase().includes('mantenimiento') && <FaTools className="text-accent" />}
              {ev.title.toLowerCase().includes('capacitación') && <FaChalkboardTeacher className="text-accent" />}
              {ev.title.toLowerCase().includes('reunión') && <FaUsers className="text-accent" />}
              {ev.title.toLowerCase().includes('webinar') && <FaRobot className="text-accent" />}
              {ev.title.toLowerCase().includes('revisión') && <FaClipboardList className="text-accent" />}
              {ev.title.toLowerCase().includes('demo') && <FaLaptop className="text-accent" />}
              {/* Icono genérico si no coincide */}
              {!['mantenimiento','capacitación','reunión','webinar','revisión','demo'].some(t => ev.title.toLowerCase().includes(t)) && <FaCalendarAlt className="text-accent" />}
              <span className="font-semibold">{ev.title}</span>
              <span className="ml-2 text-xs text-gray-400">{new Date(ev.startDate).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsCalendar;
