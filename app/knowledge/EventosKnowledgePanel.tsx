
"use client";
import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt } from 'react-icons/fa';
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
    <div className="flex bg-secondary/10 rounded-xl shadow-lg overflow-hidden min-h-[600px]">
      {/* Panel lateral: lista de eventos */}
      <div className="w-1/3 min-w-[280px] max-w-xs bg-secondary/80 border-r border-accent/20 p-0 flex flex-col">
        {/* Header y botón agregar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-accent/10 bg-secondary/90 sticky top-0 z-10">
          <h2 className="text-lg font-bold text-accent flex items-center gap-2"><FaCalendarAlt /> Eventos del Mes</h2>
          <button
            onClick={() => {
              setMostrarFormulario(true);
              setEventoEditando(null);
              setFormData({
                title: '', description: '', startDate: '', endDate: '', location: '', modo: '', validador: '', codigoDana: '', nombreNotificacion: '', isRecurring: false, recurrencePattern: '', eventType: ''
              });
            }}
            className="flex items-center gap-2 bg-accent text-secondary px-3 py-1 rounded-lg hover:bg-accent/80 text-sm font-semibold shadow"
          >
            <FaPlus className="text-base" /> Agregar evento
          </button>
        </div>
        {/* Buscador */}
        <div className="px-4 py-2 bg-secondary/80 border-b border-accent/10 sticky top-[56px] z-10">
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar evento..."
            className="w-full bg-primary/60 border border-accent/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm"
          />
        </div>
        {/* Lista de eventos filtrada */}
        <div className="flex-1 overflow-y-auto divide-y divide-accent/10">
          {eventos.filter(ev =>
            ev.title.toLowerCase().includes(busqueda.toLowerCase()) ||
            (ev.description?.toLowerCase().includes(busqueda.toLowerCase()) ?? false)
          ).length === 0 && (
            <div className="p-4 text-gray-400">No hay eventos este mes.</div>
          )}
          {eventos.filter(ev =>
            ev.title.toLowerCase().includes(busqueda.toLowerCase()) ||
            (ev.description?.toLowerCase().includes(busqueda.toLowerCase()) ?? false)
          ).map(ev => (
            <div
              key={ev.id}
              className={`p-4 cursor-pointer hover:bg-accent/10 ${eventoSeleccionado?.id === ev.id ? 'bg-accent/10 border-l-4 border-accent' : ''}`}
              onClick={() => setEventoSeleccionado(ev)}
            >
              <div className="font-semibold text-accent text-base">{ev.title}</div>
              <div className="text-xs text-gray-400">{new Date(ev.startDate).toLocaleDateString()} - {ev.endDate ? new Date(ev.endDate).toLocaleDateString() : ''}</div>
              <div className="text-xs mt-1 text-gray-300 line-clamp-2">{ev.description}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Panel derecho: calendario arriba y detalle abajo */}
      <div className="flex-1 flex flex-col bg-primary/80">
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
        {/* Detalle del evento seleccionado */}
        <div className="flex-1 p-6 overflow-y-auto">
          {eventoSeleccionado ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-accent flex items-center gap-2"><FaCalendarAlt /> {eventoSeleccionado.title}</h3>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(eventoSeleccionado)} className="px-3 py-1 rounded bg-accent/80 text-secondary hover:bg-accent"><FaEdit /></button>
                  <button onClick={() => handleDelete(eventoSeleccionado.id)} className="px-3 py-1 rounded bg-red-600/80 text-white hover:bg-red-700"><FaTrash /></button>
                </div>
              </div>
              <div className="mb-2 text-gray-300"><span className="font-semibold">Descripción:</span> {eventoSeleccionado.description || 'Sin descripción'}</div>
              <div className="mb-2 text-gray-300"><span className="font-semibold">Fecha:</span> {new Date(eventoSeleccionado.startDate).toLocaleString()} - {eventoSeleccionado.endDate ? new Date(eventoSeleccionado.endDate).toLocaleString() : ''}</div>
              {eventoSeleccionado.nombreNotificacion && (
                <div className="mb-2 text-gray-300"><span className="font-semibold">Notificación:</span> <span className="text-yellow-400">🔔</span> {eventoSeleccionado.nombreNotificacion}</div>
              )}
              <div className="mb-2 text-gray-300"><span className="font-semibold">Tipo:</span> {eventoSeleccionado.eventType || 'Sin tipo'}</div>
              <div className="mb-2 text-gray-300"><span className="font-semibold">Modo:</span> {eventoSeleccionado.modo || 'Sin modo'}</div>
              <div className="mb-2 text-gray-300"><span className="font-semibold">Validador:</span> {eventoSeleccionado.validador || 'Sin validador'}</div>
              <div className="mb-2 text-gray-300"><span className="font-semibold">Código Dana:</span> {eventoSeleccionado.codigoDana || 'Sin código'}</div>
              {/* Aquí puedes agregar recursos y notas relacionadas si lo deseas */}
              <div className="mt-6 text-gray-400 italic">(Aquí irán recursos y notas relacionadas...)</div>
            </>
          ) : (
            <div className="text-gray-400 text-lg flex flex-col items-center justify-center h-full">
              <FaCalendarAlt className="text-5xl mb-4 text-accent/40" />
              Selecciona un evento para ver detalles.
            </div>
          )}
        </div>
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

