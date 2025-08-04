import React from 'react';
import { FaAngleLeft, FaAngleRight, FaRegCalendarAlt } from "react-icons/fa";
import { useEventosConfig } from '../../lib/useConfig';
import { Event } from '../../lib/types';

interface DetalleEventoPanelProps {
  eventoSeleccionado: Event | null;
  onEdit: () => void;
  onDelete: () => void;
}

interface CalendarWithDetailProps {
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
  changeMonth: (offset: number) => void;
  goToToday: () => void;
  getDayContent: (dateString: string) => {
    date: string;
    events: Event[];
    hasContent: boolean;
    eventsCount: number;
  };
  setSelectedDate: (date: string) => void;
  loadingEvents: boolean;
  hasNotesOnDay: (dateString: string) => boolean;
  DetalleEventoPanel: React.ComponentType<DetalleEventoPanelProps>;
  handleEditEvent: (event: Event) => void;
  handleDeleteEvent: (event: Event) => void;
}

const CalendarWithDetail: React.FC<CalendarWithDetailProps> = ({
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
  loadingEvents,
  hasNotesOnDay,
  DetalleEventoPanel,
  handleEditEvent,
  handleDeleteEvent
}) => {
  // Hook para obtener configuración de eventos
  const { getEventoConfig } = useEventosConfig();

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
            // Detectar si hay eventos de alerta en el día (solo por recurrencePattern)
            const hasAlertEvent = dayContent.events.some(ev => ev.recurrencePattern?.toLowerCase() === 'alerta');
            return (
              <div
                key={day}
                className={`relative rounded-lg p-1 text-center cursor-pointer border transition-all duration-200 min-h-[80px] flex flex-col justify-start
                  ${isSelected ? 'ring-2 ring-accent bg-accent/20' : 'border-accent/30 hover:border-accent/60'}
                  ${isToday ? 'border-2 border-blue-400' : ''}
                  ${dayContent.hasContent ? 'bg-accent/10' : 'bg-primary/40'}
                  ${hasAlertEvent ? 'animate-pulse border-red-500 shadow-lg shadow-red-400/30' : ''}
                `}
                onClick={() => setSelectedDate(dayKey)}
              >
                <span className={`text-sm font-medium mb-1 ${dayContent.hasContent ? 'text-accent' : 'text-white'}`}>
                  {day}
                  {/* Icono de alerta si hay evento de alerta */}
                  {hasAlertEvent && (
                    <span className="ml-1 inline-block align-middle" title="Evento de alerta">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-alert-triangle animate-bounce">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3l-8.47-14.14a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                    </span>
                  )}
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
                      {(() => {
                        const config = getEventoConfig(event.eventType || 'evento');
                        const isRecurring = event.recurrencePattern !== 'ninguno';
                        return (
                          <div className={`text-xs px-1 py-0.5 rounded truncate ${
                            isRecurring 
                              ? config.color + ' border font-semibold'
                              : config.color
                          }`}>
                            {/* Comentado por el usuario */}
                            {/* {event.title} */}
                          </div>
                        );
                      })()}
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
      <div className="bg-secondary border border-accent/20 rounded-xl shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
            <FaRegCalendarAlt />
            Eventos del día {selectedDate} ({getDayContent(selectedDate).events?.length || 0})
          </h2>
        </div>
        <div className="space-y-2">
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
