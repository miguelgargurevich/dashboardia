"use client";
import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSyncAlt, FaCalendarAlt } from 'react-icons/fa';
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

interface EventosConfigPanelProps {
  token: string | null;
}

const EventosConfigPanel: React.FC<EventosConfigPanelProps> = ({ token }) => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<Evento | null>(null);
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
    <>
      <div className="flex items-center gap-3 mb-8">
        <FaCalendarAlt className="text-2xl text-accent" />
        <h1 className="text-3xl font-bold text-accent">Mantenimiento de Eventos</h1>
      </div>
      <div className="mb-8">
        {token && (
          <EventosMantenimientoCalendar
            token={token}
            layout="split"
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>
      <div className="mb-8">
        <button
          onClick={() => {
            setMostrarFormulario(true);
            setEventoEditando(null);
            setFormData({
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
              eventType: ''
            });
          }}
          className="flex items-center gap-2 bg-accent text-secondary px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
        >
          <FaPlus /> Nuevo Evento
        </button>
      </div>



      {mostrarFormulario && (
        <Modal open={mostrarFormulario} onClose={() => { setMostrarFormulario(false); setEventoEditando(null); }} title={eventoEditando ? 'Editar Evento' : 'Nuevo Evento'} maxWidth="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
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
    </>
  );
};

export default EventosConfigPanel;
