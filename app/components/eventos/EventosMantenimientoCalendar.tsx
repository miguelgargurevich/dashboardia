
"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { FaTools, FaChalkboardTeacher, FaUsers, FaRobot, FaClipboardList, FaLaptop, FaCalendarAlt, FaAngleLeft, FaAngleRight, FaRegCalendarAlt, FaEdit, FaTrash } from "react-icons/fa";

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

import { FaPlus } from "react-icons/fa";

interface Props {
  token: string | null;
  layout?: 'split';
  onEdit?: (evento: Event) => void;
  onDelete?: (id: string) => void;
  onNuevoEvento?: (dateString?: string) => void;
}

const EventosMantenimientoCalendar: React.FC<Props> = ({ token, layout, onEdit, onDelete, onNuevoEvento }) => {
  const { todayDay, todayMonth, todayYear } = useMemo(() => {
    const today = new Date();
    return {
      todayDay: today.getDate(),
      todayMonth: today.getMonth(),
      todayYear: today.getFullYear()
    };
  }, []);
  const weekDays = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(todayDay.toString());
  const jsDate = new Date();
  const [visibleMonth, setVisibleMonth] = useState<string>(jsDate.toISOString().slice(0,7));

  useEffect(() => {
    if (!token) return;
    async function fetchEvents() {
      setLoading(true);
      try {
        const res = await fetch(`/api/events/calendar?month=${visibleMonth}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setEvents(Array.isArray(data) ? data : []);
        } else if (res.status === 401) {
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
        setLoading(false);
      }
    }
    fetchEvents();
  }, [token, visibleMonth]);

  // Generar días del mes actual
  const [yyyy, mm] = visibleMonth.split('-');
  const year = Number(yyyy);
  const mon = Number(mm) - 1;
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  let firstDayOfWeek = new Date(year, mon, 1).getDay();
  firstDayOfWeek = (firstDayOfWeek === 0) ? 6 : firstDayOfWeek - 1;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const eventsByDay: { [key: number]: Event[] } = {};
  if (events && Array.isArray(events)) {
    events.forEach(ev => {
      const eventDate = new Date(ev.startDate);
      const day = eventDate.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(ev);
    });
  }

  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const monthLabel = `${monthNames[mon]} ${year}`;

  function changeMonth(offset: number) {
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
    const nuevoMes = `${year}-${String(month + 1).padStart(2, '0')}`;
    setVisibleMonth(nuevoMes);
    setSelectedDate('1');
  }
  function goToToday() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentDay = currentDate.getDate();
    setVisibleMonth(`${currentYear}-${String(currentMonth).padStart(2, '0')}`);
    setSelectedDate(currentDay.toString());
  }

  if (layout === 'split') {
    return (
      <div className="w-full flex flex-col gap-8">
        <div className="w-full">
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
                {weekDays.map((wd) => (
                  <div key={wd} className="text-xs font-bold text-accent text-center pb-2">{wd}</div>
                ))}
                {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                  <div key={`empty-${idx}`}></div>
                ))}
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
                      onClick={() => {
                        setSelectedDate(day.toString());
                      }}
                      onDoubleClick={() => {
                        // Generar fecha YYYY-MM-DD para el día seleccionado
                        if (typeof onNuevoEvento === 'function') {
                          const monthStr = String(mon + 1).padStart(2, '0');
                          const dayStr = String(day).padStart(2, '0');
                          const dateStr = `${year}-${monthStr}-${dayStr}`;
                          onNuevoEvento(dateStr);
                        }
                      }}
                    >
                      <span className={`text-sm font-medium ${dayEvents.length > 0 ? 'text-accent' : 'text-white'}`}>
                        {day}
                      </span>
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
          </div>
        </div>
        <div className="w-full">
          {/* Botón 'Nuevo Evento' eliminado, ahora solo se muestra arriba en el panel principal */}
          <div className="bg-primary rounded-lg p-4 shadow-md">
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
                          {event.title.toLowerCase().includes('mantenimiento') && <FaTools />}
                          {event.title.toLowerCase().includes('capacitación') && <FaChalkboardTeacher />}
                          {event.title.toLowerCase().includes('reunión') && <FaUsers />}
                          {event.title.toLowerCase().includes('webinar') && <FaRobot />}
                          {event.title.toLowerCase().includes('revisión') && <FaClipboardList />}
                          {event.title.toLowerCase().includes('demo') && <FaLaptop />}
                          {!['mantenimiento','capacitación','reunión','webinar','revisión','demo'].some(t => event.title.toLowerCase().includes(t)) && <FaCalendarAlt />}
                        </span>
                        <h5 className="font-semibold text-white text-sm"><span className="font-bold text-gray-400 mr-1">Título:</span> {event.title}</h5>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (typeof onEdit === 'function') onEdit(event);
                          }}
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-200 px-2 py-1 rounded border border-blue-400/30 bg-blue-400/10 text-xs font-semibold"
                          title="Editar evento"
                          disabled={!onEdit}
                        >
                          <FaEdit /> Editar
                        </button>
                        <button
                          onClick={() => {
                            if (typeof onDelete === 'function') onDelete(event.id);
                          }}
                          className="flex items-center gap-1 text-red-400 hover:text-red-200 px-2 py-1 rounded border border-red-400/30 bg-red-400/10 text-xs font-semibold"
                          title="Eliminar evento"
                          disabled={!onDelete}
                        >
                          <FaTrash /> Eliminar
                        </button>
                      </div>
                    </div>
                    {event.description && (
                      <p className="text-gray-300 text-xs mb-2 line-clamp-2"><span className="font-bold text-gray-400 mr-1">Descripción:</span> {event.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">
                          <span className="font-bold text-gray-400 mr-1">Fecha:</span> {new Date(event.startDate).toLocaleDateString('es-ES')}
                          {event.endDate && <span> - {new Date(event.endDate).toLocaleDateString('es-ES')}</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.location && (
                          <span className="text-gray-400">
                            <span className="font-bold text-gray-400 mr-1">Ubicación:</span> 📍 {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                    {(event.validador || event.codigoDana || event.nombreNotificacion || event.modo) && (
                      <div className="mt-2 pt-2 border-t border-yellow-400/20">
                        <div className="flex items-center justify-between w-full text-xs">
                          <div className="flex flex-wrap gap-2">
                            {event.validador && (
                              <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">
                                <span className="font-bold text-blue-300 mr-1">Validador:</span> 👤 {event.validador}
                              </span>
                            )}
                            {event.codigoDana && (
                              <span className="px-2 py-1 rounded bg-green-500/20 text-green-300">
                                <span className="font-bold text-green-300 mr-1">Código Dana:</span> 🏢 {event.codigoDana}
                              </span>
                            )}
                            {event.nombreNotificacion && (
                              <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300">
                                <span className="font-bold text-purple-300 mr-1">Notificación:</span> 🔔 {event.nombreNotificacion}
                              </span>
                            )}
                          </div>
                          {event.modo && (
                            <span className="text-xs text-yellow-400 px-2 py-1 rounded bg-yellow-400/10 ml-2">
                              <span className="font-bold text-yellow-400 mr-1">Modo:</span> {event.modo}
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
      </div>
    );
  }
  // Layout por defecto (uno debajo del otro)
  return (
    <div className="bg-primary rounded-lg p-4 shadow-md">
      {/* ...código original... */}
      {/* (omitido para brevedad, igual al layout anterior) */}
    </div>
  );
};

export default EventosMantenimientoCalendar;
