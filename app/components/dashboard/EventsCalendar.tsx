"use client";
import React, { useEffect, useState } from 'react';
import { FaTools, FaChalkboardTeacher, FaUsers, FaRobot, FaClipboardList, FaLaptop, FaCalendarAlt, FaAngleLeft, FaAngleRight, FaRegCalendarAlt } from "react-icons/fa";

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
  // Siempre mostrar el panel del día actual
  const [selectedDate, setSelectedDate] = useState<string>(todayDay.toString());
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
    setSelectedDate('1');
  }
  function goToToday() {
    setVisibleMonth(new Date().toISOString().slice(0,7));
    setSelectedDate(todayDay.toString());
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
      {loading ? <div>Cargando...</div> : (
        <div className="grid grid-cols-7 gap-2 mb-4">
          {/* Cabecera de días de la semana */}
          {weekDays.map((wd) => (
            <div key={wd} className="text-xs font-bold text-accent text-center pb-2">{wd}</div>
          ))}
          {/* Espacios vacíos para alinear el primer día */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`}></div>
          ))}
          {/* Días del mes */}
          {days.map(day => {
            const dayEvents = eventsByDay[day] || [];
            const isSelected = selectedDate === day.toString();
            const isToday = day === todayDay && mon === todayMonth && year === todayYear;
            
            return (
              <div
                key={day}
                className={`relative rounded-lg p-2 text-center cursor-pointer border transition-all duration-200 min-h-[50px] flex flex-col justify-between
                  ${isSelected ? 'ring-2 ring-accent bg-accent/20' : 'border-accent/30 hover:border-accent/60'}
                  ${isToday ? 'border-2 border-blue-400' : ''}
                  ${dayEvents.length > 0 ? 'bg-accent/10' : 'bg-primary/40'}
                `}
                onClick={() => setSelectedDate(day.toString())}
              >
                <span className={`text-sm font-medium ${dayEvents.length > 0 ? 'text-accent' : 'text-white'}`}>
                  {day}
                </span>
                
                {/* Indicador de eventos */}
                {dayEvents.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <div className="w-full h-1 bg-yellow-400 rounded-full"></div>
                    <div className="text-xs text-accent font-bold">
                      {dayEvents.length}E
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Panel de eventos del día seleccionado */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xl font-bold text-yellow-400">
            Eventos del día {selectedDate} ({eventsByDay[parseInt(selectedDate)]?.length || 0})
          </h4>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {eventsByDay[parseInt(selectedDate)]?.length > 0 ? (
            eventsByDay[parseInt(selectedDate)].map((event, index) => (
              <div key={index} className="bg-primary/40 rounded-lg p-3 border border-yellow-400/30">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">
                      {/* Icono según el tipo/título del evento */}
                      {event.title.toLowerCase().includes('mantenimiento') && <FaTools />}
                      {event.title.toLowerCase().includes('capacitación') && <FaChalkboardTeacher />}
                      {event.title.toLowerCase().includes('reunión') && <FaUsers />}
                      {event.title.toLowerCase().includes('webinar') && <FaRobot />}
                      {event.title.toLowerCase().includes('revisión') && <FaClipboardList />}
                      {event.title.toLowerCase().includes('demo') && <FaLaptop />}
                      {/* Icono genérico si no coincide */}
                      {!['mantenimiento','capacitación','reunión','webinar','revisión','demo'].some(t => event.title.toLowerCase().includes(t)) && <FaCalendarAlt />}
                    </span>
                    <h5 className="font-semibold text-white text-sm">{event.title}</h5>
                  </div>
                  {event.modo && (
                    <span className="text-xs text-yellow-400 px-2 py-1 rounded bg-yellow-400/10">
                      {event.modo}
                    </span>
                  )}
                </div>
                
                {event.description && (
                  <p className="text-gray-300 text-xs mb-2 line-clamp-2">{event.description}</p>
                )}
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">
                      {new Date(event.startDate).toLocaleDateString('es-ES')}
                      {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString('es-ES')}`}
                    </span>
                  </div>
                  {event.location && (
                    <span className="text-gray-400">
                      📍 {event.location}
                    </span>
                  )}
                </div>
                
                {/* Información adicional del evento */}
                {(event.validador || event.codigoDana || event.nombreNotificacion) && (
                  <div className="mt-2 pt-2 border-t border-yellow-400/20">
                    <div className="flex flex-wrap gap-2 text-xs">
                      {event.validador && (
                        <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">
                          👤 {event.validador}
                        </span>
                      )}
                      {event.codigoDana && (
                        <span className="px-2 py-1 rounded bg-green-500/20 text-green-300">
                          🏢 {event.codigoDana}
                        </span>
                      )}
                      {event.nombreNotificacion && (
                        <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300">
                          🔔 {event.nombreNotificacion}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
