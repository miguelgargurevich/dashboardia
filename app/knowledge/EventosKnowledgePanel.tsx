
"use client";
import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaListUl, FaTools, FaUsers, FaChalkboardTeacher, FaRobot, FaClipboardList, FaLaptop, FaEye, FaSearch } from 'react-icons/fa';
import EventosMantenimientoCalendar from '../components/eventos/EventosMantenimientoCalendar';
import Modal from '../components/Modal';
import EventoForm from '../components/eventos/EventoForm';
import type { EventoFormValues } from '../components/eventos/EventoForm';

interface Evento {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  modo?: string;
  validador?: string;
  codigoDana?: string;
  nombreNotificacion?: string;
  diaEnvio?: string;
  query?: string;
  relatedResources?: string[];
  isRecurring?: boolean;
  recurrencePattern?: string;
  eventType?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EventosKnowledgePanelProps {
  token: string | null;
}

const EventosKnowledgePanel: React.FC<EventosKnowledgePanelProps> = ({ token }) => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  // const [cargando, setCargando] = useState(false);
  const [mostrarFormularioEvento, setmostrarFormularioEvento] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<Evento | null>(null);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [seccionActiva, setSeccionActiva] = useState<'calendario' | 'lista'>('lista');
  // Estado para el formulario reutilizable
  const [formData, setFormData] = useState<EventoFormValues>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    modo: '',
    validador: '',
    codigoDana: '',
    nombreNotificacion: '',
    isRecurring: false,
    recurrencePattern: '',
    eventType: '',
  });

  React.useEffect(() => {
    if (token) cargarEventos(token);
    // eslint-disable-next-line
  }, [token]);

  const cargarEventos = async (token: string) => {
    // setCargando(true);
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const res = await fetch(`/api/events/calendar?month=${month}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setEventos(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      // Manejo de error
    } finally {
      // setCargando(false);
    }
  };

  const handleEdit = (evento: Evento) => {
    setEventoEditando(evento);
    setFormData({
      title: evento.title || '',
      description: evento.description || '',
      startDate: evento.startDate || '',
      endDate: evento.endDate || '',
      location: evento.location || '',
      modo: evento.modo || '',
      validador: evento.validador || '',
      codigoDana: evento.codigoDana || '',
      nombreNotificacion: evento.nombreNotificacion || '',
      isRecurring: evento.isRecurring || false,
      recurrencePattern: evento.recurrencePattern || '',
      eventType: evento.eventType || '',
    });
    setmostrarFormularioEvento(true);
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm('¿Eliminar este evento?')) return;
    await fetch(`/api/events/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    cargarEventos(token);
  };


  // Handler para guardar evento (crear/editar)
  const handleGuardarEvento = async (values: EventoFormValues) => {
    if (!token) return;
    const payload = { ...values };
    if (eventoEditando) {
      await fetch(`/api/events/${eventoEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
    }
    setmostrarFormularioEvento(false);
    setEventoEditando(null);
    setFormData({
      title: '', description: '', startDate: '', endDate: '', location: '', modo: '', validador: '', codigoDana: '', nombreNotificacion: '', isRecurring: false, recurrencePattern: '', eventType: ''
    });
    cargarEventos(token);
  };






  return (
    <div className="bg-secondary/10 rounded-xl shadow-lg overflow-hidden min-h-[600px] flex flex-col">
      {/* Tabs de navegación */}
      

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            seccionActiva === 'lista'
              ? 'bg-accent/20 text-accent border border-accent/30'
              : 'bg-secondary text-gray-300 hover:bg-accent/10 hover:text-accent'
          }`}
          onClick={() => setSeccionActiva('lista')}
        >
          <FaListUl className="inline mr-2" /> Lista de eventos
        </button>
        <button
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            seccionActiva === 'calendario'
              ? 'bg-accent/20 text-accent border border-accent/30'
              : 'bg-secondary text-gray-300 hover:bg-accent/10 hover:text-accent'
          }`}
          onClick={() => setSeccionActiva('calendario')}
        >
          <FaCalendarAlt className="inline mr-2" /> Calendario
        </button>
      </div>
    <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-accent">Gestión de Eventos</h2>
        <button
        onClick={() => setmostrarFormularioEvento(true)}
        className="flex items-center gap-2 bg-accent text-secondary px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
        >
        <FaPlus />
        Agregar Evento
        </button>
    </div> 
      
      {/* Panel principal: cambia según tab */}
      <div className="flex-1 flex flex-col bg-primary/80">
        {seccionActiva === 'calendario' ? (
          <>
            {/* Calendario arriba */}
            <div className="border-b border-accent/10 bg-primary/90 p-4 sticky top-0 z-10">
              {token && (
                <EventosMantenimientoCalendar
                  token={token}
                  layout="split"
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            </div>
          </>
        ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel lateral: búsqueda y lista */}
        <div className="lg:col-span-1">
          <div className="bg-secondary rounded-lg p-4">
            <div className="space-y-4 mb-4">
              <div className="flex items-center gap-2">
                <FaSearch className="text-accent" />
                <input
                  type="text"
                  placeholder="Buscar eventos..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="flex-1 input-std"
                />
              </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {eventos.filter(ev =>
                ev.title.toLowerCase().includes(busqueda.toLowerCase()) ||
                (ev.description?.toLowerCase().includes(busqueda.toLowerCase()) ?? false)
              ).length === 0 ? (
                <div className="p-4 text-gray-400">No hay eventos este mes.</div>
              ) : (
                eventos.filter(ev =>
                  ev.title.toLowerCase().includes(busqueda.toLowerCase()) ||
                  (ev.description?.toLowerCase().includes(busqueda.toLowerCase()) ?? false)
                ).map((event) => {
                  const isSelected = eventoSeleccionado?.id === event.id;
                  return (
                    <button
                      key={event.id}
                      onClick={() => setEventoSeleccionado(event)}
                      className={`w-full text-left p-4 rounded-lg transition-all duration-200 border cursor-pointer ${
                        isSelected
                          ? 'bg-yellow-900/20 text-yellow-300 shadow-lg shadow-current/20 border-yellow-400/40'
                          : 'bg-gradient-to-r from-primary to-secondary/50 hover:from-yellow-900/10 hover:to-accent/5 border border-gray-700/50 hover:border-yellow-400/30 shadow-md hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-yellow-900/20 text-yellow-300">
                          {event.title.toLowerCase().includes('mantenimiento') && <FaTools />}
                          {event.title.toLowerCase().includes('capacitación') && <FaChalkboardTeacher />}
                          {event.title.toLowerCase().includes('reunión') && <FaUsers />}
                          {event.title.toLowerCase().includes('webinar') && <FaRobot />}
                          {event.title.toLowerCase().includes('revisión') && <FaClipboardList />}
                          {event.title.toLowerCase().includes('demo') && <FaLaptop />}
                          {!['mantenimiento','capacitación','reunión','webinar','revisión','demo'].some(t => event.title.toLowerCase().includes(t)) && <FaCalendarAlt />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-base truncate flex-1">{event.title}</h3>
                          {event.description && <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-1">{event.description}</p>}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
        {/* Panel de detalle */}
        <div className="lg:col-span-2">
          <div className="bg-secondary rounded-lg p-6 h-full min-h-96">
            {eventoSeleccionado ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-900/20 text-yellow-300">
                      {eventoSeleccionado.title.toLowerCase().includes('mantenimiento') && <FaTools />}
                      {eventoSeleccionado.title.toLowerCase().includes('capacitación') && <FaChalkboardTeacher />}
                      {eventoSeleccionado.title.toLowerCase().includes('reunión') && <FaUsers />}
                      {eventoSeleccionado.title.toLowerCase().includes('webinar') && <FaRobot />}
                      {eventoSeleccionado.title.toLowerCase().includes('revisión') && <FaClipboardList />}
                      {eventoSeleccionado.title.toLowerCase().includes('demo') && <FaLaptop />}
                      {!['mantenimiento','capacitación','reunión','webinar','revisión','demo'].some(t => eventoSeleccionado.title.toLowerCase().includes(t)) && <FaCalendarAlt />}
                    </div>
                    <h2 className="text-xl font-bold text-accent">{eventoSeleccionado.title}</h2>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(eventoSeleccionado)}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                    >
                      <FaEdit className="text-sm" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(eventoSeleccionado.id)}
                      className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                    >
                      <FaTrash className="text-sm" />
                      Eliminar
                    </button>
                    <button
                      onClick={() => setEventoSeleccionado(null)}
                      className="flex items-center gap-2 px-3 py-1 bg-gray-600/20 text-gray-300 rounded hover:bg-gray-700/30 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
                {eventoSeleccionado.description && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Descripción</h3>
                    <p className="text-gray-400">{eventoSeleccionado.description}</p>
                  </div>
                )}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                  <span><span className="font-bold">Fecha:</span> {new Date(eventoSeleccionado.startDate).toLocaleDateString('es-ES')}{eventoSeleccionado.endDate && <> - {new Date(eventoSeleccionado.endDate).toLocaleDateString('es-ES')}</>}</span>
                  {eventoSeleccionado.location && <span><span className="font-bold">Ubicación:</span> 📍 {eventoSeleccionado.location}</span>}
                </div>
                {(eventoSeleccionado.validador || eventoSeleccionado.codigoDana || eventoSeleccionado.nombreNotificacion || eventoSeleccionado.modo) && (
                  <div className="mt-2 pt-2 border-t border-yellow-400/20">
                    <div className="flex flex-wrap gap-2 text-xs mb-2">
                      {eventoSeleccionado.modo && (
                        <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">{eventoSeleccionado.modo}</span>
                      )}
                      {eventoSeleccionado.validador && (
                        <span className="px-2 py-1 rounded bg-green-500/20 text-green-300">👤 {eventoSeleccionado.validador}</span>
                      )}
                      {eventoSeleccionado.codigoDana && (
                        <span className="px-2 py-1 rounded bg-green-700/20 text-green-400">🏢 {eventoSeleccionado.codigoDana}</span>
                      )}
                      {eventoSeleccionado.nombreNotificacion && (
                        <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300">🔔 {eventoSeleccionado.nombreNotificacion}</span>
                      )}
                      {eventoSeleccionado.diaEnvio && (
                        <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">📅 {eventoSeleccionado.diaEnvio}</span>
                      )}
                      {eventoSeleccionado.query && (
                        <span className="px-2 py-1 rounded bg-gray-500/20 text-gray-300" title={eventoSeleccionado.query}>🔎 {eventoSeleccionado.query.length > 20 ? eventoSeleccionado.query.slice(0,20) + '…' : eventoSeleccionado.query}</span>
                      )}
                      {eventoSeleccionado.relatedResources && eventoSeleccionado.relatedResources.length > 0 && (
                        <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-300">📎 {eventoSeleccionado.relatedResources.length}</span>
                      )}
                    </div>
                    {/* Recursos relacionados */}
                    {eventoSeleccionado.relatedResources && eventoSeleccionado.relatedResources.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {eventoSeleccionado.relatedResources.slice(0, 3).map((resource, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-600/20 text-gray-300 text-xs rounded truncate max-w-24">
                            📄 {resource}
                          </span>
                        ))}
                        {eventoSeleccionado.relatedResources.length > 3 && (
                          <span className="px-2 py-1 bg-gray-600/20 text-gray-400 text-xs rounded">
                            +{eventoSeleccionado.relatedResources.length - 3} más
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <FaEye className="text-4xl mb-4 mx-auto" />
                  <p>Selecciona un evento para ver sus detalles</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
        )}
      </div>
      {/* Modal para crear/editar evento */}
      {mostrarFormularioEvento && (
        <Modal open={mostrarFormularioEvento} onClose={() => { setmostrarFormularioEvento(false); setEventoEditando(null); }} title={eventoEditando ? 'Editar Evento' : 'Nuevo Evento'} maxWidth="max-w-2xl">
          <EventoForm
            initialValues={eventoEditando ? formData : undefined}
            onSubmit={handleGuardarEvento}
            onCancel={() => { setmostrarFormularioEvento(false); setEventoEditando(null); }}
            submitLabel={eventoEditando ? 'Actualizar' : 'Crear'}
          />
        </Modal>
      )}
    </div>
  );
}

export default EventosKnowledgePanel;

