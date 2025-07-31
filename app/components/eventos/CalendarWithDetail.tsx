import React, { useState } from 'react';
import { FaAngleLeft, FaAngleRight, FaRegCalendarAlt } from "react-icons/fa";

interface Event {
  id: string;
  title: string;
  recurrencePattern: string;
  startDate: string;
}

interface CalendarWithDetailProps {
  token?: string;
  weekDays: string[];
  monthNames: string[];
  mon: number;
  year: number;
  todayDay: number;
  todayMonth: number;
  todayYear: number;
  firstDayOfWeek: number;
  days: number[];
  selectedDate: string;
  visibleMonth: string;
  changeMonth: (offset: number) => void;
  goToToday: () => void;
  getDayContent: (dateString: string) => {
    date: string;
    events: Event[];
    hasContent: boolean;
    eventsCount: number;
  };
  setSelectedDate: (date: string) => void;
  showRecurringEvents: boolean;
  recurringEvents: Event[];
  loadingEvents: boolean;
  selectedDayEvents: Event[];
  hasNotesOnDay: (dateString: string) => boolean;
  DetalleEventoPanel: React.ComponentType<any>;
  handleEditEvent: (event: Event) => void;
  handleDeleteEvent: (event: Event) => void;
}

const CalendarWithDetail: React.FC<CalendarWithDetailProps> = ({
  token,
  weekDays,
  monthNames,
  mon,
  year,
  todayDay,
  todayMonth,
  todayYear,
  firstDayOfWeek,
  days,
  selectedDate,
  changeMonth,
  goToToday,
  getDayContent,
  setSelectedDate,
  showRecurringEvents,
  recurringEvents,
  loadingEvents,
  selectedDayEvents,
  hasNotesOnDay,
  DetalleEventoPanel,
  handleEditEvent,
  handleDeleteEvent
}) => {
  // El panel debe mostrar todos los eventos del día seleccionado

  return (
    <div className="space-y-6">
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
                    <div
                      key={`event-${event.id}-${index}-${event.recurrencePattern !== 'ninguno' ? 'recurring' : 'regular'}`}
                      className="w-full"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedDate(dayKey);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={`text-xs px-1 py-0.5 rounded truncate ${
                        event.recurrencePattern !== 'ninguno' 
                          ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-600/40 font-semibold' 
                          : 'bg-yellow-500/80 text-black'
                      }`}>
                        {event.title}
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
      {/* Panel de Eventos del Día: muestra todos los eventos del día seleccionado */}
      <div className="bg-secondary border border-accent/20 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
            <FaRegCalendarAlt />
            Eventos del Día ({getDayContent(selectedDate).events.length})
          </h2>
        </div>
        <div className="space-y-3">
          {loadingEvents ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto"></div>
              <p className="text-gray-400 mt-2 text-sm">Cargando eventos...</p>
            </div>
          ) : getDayContent(selectedDate).events.length > 0 ? (
            <div className="space-y-1">
              {getDayContent(selectedDate).events.map((evento, idx) => (
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
              <FaRegCalendarAlt className="mx-auto text-3xl text-gray-600 mb-2" />
              <p className="text-gray-400 text-sm">No hay eventos programados para este día</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarWithDetail;
