
"use client";
import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaListUl, FaTools, FaExclamationTriangle, FaUsers, FaChalkboardTeacher, FaRegCalendarAlt } from 'react-icons/fa';
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



  // Icono y color por tipo de evento
  const tipoEventoInfo: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    incidente: { icon: <FaExclamationTriangle className="text-red-400" />, color: 'bg-red-900/60 text-red-300', label: 'Incidente' },
    mantenimiento: { icon: <FaTools className="text-blue-400" />, color: 'bg-blue-900/60 text-blue-300', label: 'Mantenimiento' },
    reunion: { icon: <FaUsers className="text-green-400" />, color: 'bg-green-900/60 text-green-300', label: 'Reunión' },
    capacitacion: { icon: <FaChalkboardTeacher className="text-yellow-400" />, color: 'bg-yellow-900/60 text-yellow-300', label: 'Capacitación' },
    otro: { icon: <FaRegCalendarAlt className="text-gray-400" />, color: 'bg-gray-800/60 text-gray-300', label: 'Otro' },
  };

  const EventoCard: React.FC<{ evento: Evento; onEdit?: () => void; onDelete?: () => void; onSelect?: () => void; selected?: boolean }> = ({ evento, onEdit, onDelete, onSelect, selected }) => {
    return (
      <div
        className={`bg-primary rounded-xl shadow-md border border-accent/20 mb-4 p-4 flex flex-col gap-2 cursor-pointer transition-all ${selected ? 'ring-2 ring-accent' : 'hover:ring-1 hover:ring-accent/50'}`}
        onClick={onSelect}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-accent text-lg">{evento.title}</span>
        </div>
        <div className="text-sm text-gray-300 mb-1">
          <span className="font-semibold">Descripción:</span> {evento.description || <span className="italic text-gray-500">Sin descripción</span>}
        </div>
        <div className="text-sm text-gray-300 mb-1 flex flex-wrap gap-2">
          <span className="font-semibold">Fecha:</span> {evento.startDate ? `${new Date(evento.startDate).toLocaleDateString()}${evento.endDate ? ' - ' + new Date(evento.endDate).toLocaleDateString() : ''}` : <span className="italic text-gray-500">Sin fecha</span>}
        </div>
        <div className="text-sm text-gray-300 mb-1 flex flex-wrap gap-2">
          <span className="font-semibold">Validador:</span> <span className="inline-flex items-center">👤 {evento.validador || <span className="italic text-gray-500">Sin validador</span>}</span>
        </div>
        <div className="text-sm text-gray-300 mb-1 flex flex-wrap gap-2">
          <span className="font-semibold">Código Dana:</span> <span className="inline-flex items-center">🏢 {evento.codigoDana || <span className="italic text-gray-500">Sin código</span>}</span>
        </div>
        {evento.nombreNotificacion && (
          <div className="text-sm text-gray-300 mb-1 flex flex-wrap gap-2">
            <span className="font-semibold">Notificación:</span> <span className="inline-flex items-center">🔔 {evento.nombreNotificacion}</span>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-2">
          {onEdit && <button onClick={e => { e.stopPropagation(); onEdit(); }} className="px-3 py-1 rounded bg-accent/80 text-secondary font-semibold hover:bg-accent">Editar</button>}
          {onDelete && <button onClick={e => { e.stopPropagation(); onDelete(); }} className="px-3 py-1 rounded bg-red-600/80 text-white font-semibold hover:bg-red-700">Eliminar</button>}
        </div>
      </div>
    );
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
            ).map(ev => {
              // Colores y estilos igual que NotasDocumentosPanel
              const tipoInfo = tipoEventoInfo[ev.eventType || 'otro'] || tipoEventoInfo['otro'];
              const isSelected = eventoSeleccionado?.id === ev.id;
              return (
                <button
                  key={ev.id}
                  onClick={() => setEventoSeleccionado(ev)}
                  className={`w-full text-left p-4 rounded-lg transition-all duration-200 border ${
                    isSelected
                      ? 'bg-secondary border-accent ring-2 ring-accent shadow-lg'
                      : 'bg-secondary border border-accent/20 hover:border-accent/40 shadow-md hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? tipoInfo.color.replace('text-', 'bg-').replace('border-', 'bg-').split(' ')[0]?.replace('300', '300/30') : tipoInfo.color.replace('text-', 'bg-').replace('border-', 'bg-').split(' ')[0]?.replace('300', '300/20')}`}>{tipoInfo.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-sm mb-1 leading-tight">{ev.title}</h3>
                      <p className={`text-xs mb-1 font-medium ${tipoInfo.color.split(' ')[1] || 'text-accent'}`}>{tipoInfo.label}</p>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {ev.modo && <span className="px-1.5 py-0.5 rounded text-xs bg-primary/60 text-gray-300">{ev.modo}</span>}
                        {ev.validador && <span className="px-1.5 py-0.5 rounded text-xs bg-primary/60 text-gray-300">{ev.validador}</span>}
                        {ev.codigoDana && <span className="px-1.5 py-0.5 rounded text-xs bg-primary/60 text-gray-300">{ev.codigoDana}</span>}
                        {ev.nombreNotificacion && <span className="px-1.5 py-0.5 rounded text-xs bg-primary/60 text-yellow-300">{ev.nombreNotificacion}</span>}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{ev.description || <span className="italic text-gray-500">Sin descripción</span>}</p>
                      <p className="text-xs text-gray-400 mt-1">{ev.startDate ? `${new Date(ev.startDate).toLocaleDateString()}${ev.endDate ? ' - ' + new Date(ev.endDate).toLocaleDateString() : ''}` : <span className="italic text-gray-500">Sin fecha</span>}</p>
                    </div>
                  </div>
                </button>
              );
            })}
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

