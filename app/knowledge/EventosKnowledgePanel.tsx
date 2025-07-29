
"use client";
import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaListUl, FaTools, FaUsers, FaChalkboardTeacher, FaRobot, FaClipboardList, FaLaptop } from 'react-icons/fa';
import EventosMantenimientoCalendar from '../components/eventos/EventosMantenimientoCalendar';
import Modal from '../components/Modal';

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
  const [cargando, setCargando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<Evento | null>(null);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [seccionActiva, setSeccionActiva] = useState<'calendario' | 'lista'>('calendario');
  const [formData, setFormData] = useState({
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
    setCargando(true);
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
      setCargando(false);
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
    setMostrarFormulario(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const payload = { ...formData };
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
    setMostrarFormulario(false);
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
            seccionActiva === 'calendario'
              ? 'bg-accent/20 text-accent border border-accent/30'
              : 'bg-secondary text-gray-300 hover:bg-accent/10 hover:text-accent'
          }`}
          onClick={() => setSeccionActiva('calendario')}
        >
          <FaCalendarAlt className="inline mr-2" /> Calendario
        </button>
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
      </div>
    <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-accent">Gestión de Eventos</h2>
        <button
        onClick={() => setMostrarFormulario(true)}
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
          <div className="flex-1 p-6 overflow-y-auto min-h-[420px] bg-secondary rounded-lg">
            {/* Buscador */}
            <div className="mb-4">
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar evento..."
                className="w-full bg-primary/60 border border-accent/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm"
              />
            </div>
            {/* Lista de eventos como cards */}
            {eventos.filter(ev =>
              ev.title.toLowerCase().includes(busqueda.toLowerCase()) ||
              (ev.description?.toLowerCase().includes(busqueda.toLowerCase()) ?? false)
            ).length === 0 && (
              <div className="p-4 text-gray-400">No hay eventos este mes.</div>
            )}
            {eventos.filter(ev =>
              ev.title.toLowerCase().includes(busqueda.toLowerCase()) ||
              (ev.description?.toLowerCase().includes(busqueda.toLowerCase()) ?? false)
            ).length === 0 ? null : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {eventos.filter(ev =>
                  ev.title.toLowerCase().includes(busqueda.toLowerCase()) ||
                  (ev.description?.toLowerCase().includes(busqueda.toLowerCase()) ?? false)
                ).map((event) => {
                  const isSelected = eventoSeleccionado?.id === event.id;
                  return (
                    <div
                      key={event.id}
                      className={`bg-primary/40 rounded-lg p-3 border border-yellow-400/30 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-accent' : 'hover:ring-1 hover:ring-accent/50'}`}
                      onClick={() => setEventoSeleccionado(event)}
                    >
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
                            onClick={e => { e.stopPropagation(); handleEdit(event); }}
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-200 px-2 py-1 rounded border border-blue-400/30 bg-blue-400/10 text-xs font-semibold"
                            title="Editar evento"
                          >
                            <FaEdit /> Editar
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(event.id); }}
                            className="flex items-center gap-1 text-red-400 hover:text-red-200 px-2 py-1 rounded border border-red-400/30 bg-red-400/10 text-xs font-semibold"
                            title="Eliminar evento"
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
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Modal para crear/editar evento */}
      {mostrarFormulario && (
        <Modal open={mostrarFormulario} onClose={() => { setMostrarFormulario(false); setEventoEditando(null); }} title={eventoEditando ? 'Editar Evento' : 'Nuevo Evento'} maxWidth="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ...formulario igual que antes... */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Título *</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent h-12"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                rows={2}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">Fecha inicio *</label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={e => setFormData(f => ({ ...f, startDate: e.target.value }))}
                  className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent h-12"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">Fecha fin</label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={e => setFormData(f => ({ ...f, endDate: e.target.value }))}
                  className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent h-12"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Ubicación</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData(f => ({ ...f, location: e.target.value }))}
                className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent h-12"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">Modo</label>
                <input
                  type="text"
                  value={formData.modo}
                  onChange={e => setFormData(f => ({ ...f, modo: e.target.value }))}
                  className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent h-12"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">Validador</label>
                <input
                  type="text"
                  value={formData.validador}
                  onChange={e => setFormData(f => ({ ...f, validador: e.target.value }))}
                  className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent h-12"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">Código Dana</label>
                <input
                  type="text"
                  value={formData.codigoDana}
                  onChange={e => setFormData(f => ({ ...f, codigoDana: e.target.value }))}
                  className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent h-12"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">Notificación</label>
                <input
                  type="text"
                  value={formData.nombreNotificacion}
                  onChange={e => setFormData(f => ({ ...f, nombreNotificacion: e.target.value }))}
                  className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent h-12"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de evento</label>
                <select
                  value={formData.eventType}
                  onChange={e => setFormData(f => ({ ...f, eventType: e.target.value }))}
                  className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent h-12"
                >
                  <option value="">Seleccionar</option>
                  <option value="incidente">Incidente</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="reunion">Reunión</option>
                  <option value="capacitacion">Capacitación</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">Recurrencia</label>
                <select
                  value={formData.recurrencePattern}
                  onChange={e => setFormData(f => ({ ...f, recurrencePattern: e.target.value }))}
                  className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent h-12"
                >
                  <option value="">Sin recurrencia</option>
                  <option value="diario">Diario</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-accent to-accent/80 text-secondary font-semibold px-6 py-3 rounded-lg hover:from-accent/90 hover:to-accent/70 transition-all"
              >
                {eventoEditando ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => { setMostrarFormulario(false); setEventoEditando(null); }}
                className="flex-1 bg-gray-600/80 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-700/80 transition-all"
              >
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default EventosKnowledgePanel;

