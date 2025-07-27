"use client";
import React, { useState, useEffect } from 'react';
import { FaCog, FaPlus, FaEdit, FaTrash, FaSyncAlt, FaLayerGroup, FaCalendarAlt, FaChevronRight } from 'react-icons/fa';
import TemasConfigPanel from './TemasConfigPanel';

import EventsCalendar from '../components/dashboard/EventsCalendar';
import Modal from '../components/Modal';


// Modelo unificado de evento (igual que EventsCalendar y backend)
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


const temasEjemplo = [
  { id: 'notificaciones', nombre: 'Notificaciones', descripcion: 'Envío y programación de notificaciones automáticas', color: 'bg-blue-500/20 text-blue-400 border-blue-400/30' },
  { id: 'polizas', nombre: 'Pólizas y Reimpresión', descripcion: 'Gestión de pólizas, copias y reimpresiones', color: 'bg-purple-500/20 text-purple-400 border-purple-400/30' },
  { id: 'tickets', nombre: 'Gestión de Tickets', descripcion: 'Manejo de tickets de soporte y requerimientos', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30' },
];

const ConfiguracionPage: React.FC = () => {
  const [panel, setPanel] = useState<'eventos' | 'temas' | 'otros'>('eventos');

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<Evento | null>(null);
  const [temas, setTemas] = useState(temasEjemplo);
  const [token, setToken] = useState<string | null>(null);

  // Form state con todos los campos relevantes
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

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
  }, []);


  useEffect(() => {
    if (panel === 'eventos' && token) cargarEventos(token);
  }, [panel, token]);

  // Usar el endpoint calendar para obtener todos los campos
  const cargarEventos = async (token: string) => {
    setCargando(true);
    try {
      // Por defecto, traer el mes actual
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
    <div className="min-h-screen bg-primary text-white p-6">
      <div className="max-w-6xl mx-auto flex gap-8">
        {/* Panel lateral de navegación */}
        <aside className="w-56 min-w-[12rem] bg-secondary rounded-xl shadow-lg p-4 flex flex-col gap-2 h-fit sticky top-8">
          <button
            className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors text-left ${panel === 'eventos' ? 'bg-accent/20 text-accent font-bold' : 'hover:bg-accent/10 text-gray-300'}`}
            onClick={() => setPanel('eventos')}
          >
            <FaCalendarAlt /> Eventos
            {panel === 'eventos' && <FaChevronRight className="ml-auto" />}
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors text-left ${panel === 'temas' ? 'bg-accent/20 text-accent font-bold' : 'hover:bg-accent/10 text-gray-300'}`}
            onClick={() => setPanel('temas')}
          >
            <FaLayerGroup /> Temas
            {panel === 'temas' && <FaChevronRight className="ml-auto" />}
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors text-left ${panel === 'otros' ? 'bg-accent/20 text-accent font-bold' : 'hover:bg-accent/10 text-gray-300'}`}
            onClick={() => setPanel('otros')}
          >
            <FaCog /> Otras Configuraciones
            {panel === 'otros' && <FaChevronRight className="ml-auto" />}
          </button>
        </aside>
        {/* Panel de contenido */}
        <section className="flex-1">
          {panel === 'eventos' && (
            <>
              <div className="flex items-center gap-3 mb-8">
                <FaCalendarAlt className="text-2xl text-accent" />
                <h1 className="text-3xl font-bold text-accent">Mantenimiento de Eventos</h1>
              </div>
              {/* Calendario visual de eventos */}
              <div className="mb-8">
                {token && (
                  <EventsCalendar token={token} />
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
              <div className="bg-secondary rounded-lg p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-accent">Eventos</h2>
                  <button onClick={() => token && cargarEventos(token)} className="text-accent hover:text-white"><FaSyncAlt /></button>
                </div>
                {cargando ? (
                  <div className="text-gray-400">Cargando eventos...</div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-accent">
                        <th className="py-2">Título</th>
                        <th>Descripción</th>
                        <th>Fecha Inicio</th>
                        <th>Fecha Fin</th>
                        <th>Tipo</th>
                        <th>Modo</th>
                        <th>Ubicación</th>
                        <th>Validador</th>
                        <th>Código Dana</th>
                        <th>Notificación</th>
                        <th>Recurrente</th>
                        <th>Patrón Recurrencia</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventos.map(evento => (
                        <tr key={evento.id} className="border-b border-accent/10 hover:bg-accent/5">
                          <td className="py-2 font-semibold">{evento.title}</td>
                          <td>{evento.description}</td>
                          <td>{evento.startDate ? new Date(evento.startDate).toLocaleDateString() : ''}</td>
                          <td>{evento.endDate ? new Date(evento.endDate).toLocaleDateString() : ''}</td>
                          <td>{evento.eventType}</td>
                          <td>{evento.modo}</td>
                          <td>{evento.location}</td>
                          <td>{evento.validador}</td>
                          <td>{evento.codigoDana}</td>
                          <td>{evento.nombreNotificacion}</td>
                          <td>{evento.isRecurring ? 'Sí' : 'No'}</td>
                          <td>{evento.recurrencePattern}</td>
                          <td>
                            <button onClick={() => handleEdit(evento)} className="text-blue-400 hover:text-blue-200 mr-2"><FaEdit /></button>
                            <button onClick={() => handleDelete(evento.id)} className="text-red-400 hover:text-red-200"><FaTrash /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {/* Formulario modal */}
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
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Fecha Inicio</label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={e => setFormData(f => ({ ...f, startDate: e.target.value }))}
                          className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent h-12"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Fecha Fin</label>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={e => setFormData(f => ({ ...f, endDate: e.target.value }))}
                          className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent h-12"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Evento</label>
                        <input
                          type="text"
                          value={formData.eventType}
                          onChange={e => setFormData(f => ({ ...f, eventType: e.target.value }))}
                          className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent h-12"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Modo</label>
                        <input
                          type="text"
                          value={formData.modo}
                          onChange={e => setFormData(f => ({ ...f, modo: e.target.value }))}
                          className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent h-12"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Ubicación</label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={e => setFormData(f => ({ ...f, location: e.target.value }))}
                          className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent h-12"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Validador</label>
                        <input
                          type="text"
                          value={formData.validador}
                          onChange={e => setFormData(f => ({ ...f, validador: e.target.value }))}
                          className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent h-12"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Código Dana</label>
                        <input
                          type="text"
                          value={formData.codigoDana}
                          onChange={e => setFormData(f => ({ ...f, codigoDana: e.target.value }))}
                          className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent h-12"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Notificación</label>
                        <input
                          type="text"
                          value={formData.nombreNotificacion}
                          onChange={e => setFormData(f => ({ ...f, nombreNotificacion: e.target.value }))}
                          className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent h-12"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isRecurring}
                        onChange={e => setFormData(f => ({ ...f, isRecurring: e.target.checked }))}
                        id="isRecurring"
                      />
                      <label htmlFor="isRecurring" className="text-gray-300">Recurrente</label>
                      <input
                        type="text"
                        placeholder="Patrón de recurrencia"
                        value={formData.recurrencePattern}
                        onChange={e => setFormData(f => ({ ...f, recurrencePattern: e.target.value }))}
                        className="ml-2 w-48 bg-primary/80 border border-accent/30 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                      />
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
          )}
          {panel === 'temas' && (
            <TemasConfigPanel temas={temas} onChange={setTemas} />
          )}
          {panel === 'otros' && (
            <div className="mt-4">
              <h2 className="text-xl font-bold text-accent mb-2">Otras Configuraciones</h2>
              <p className="text-gray-400">Aquí podrás agregar y administrar otros parámetros y catálogos del sistema próximamente.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ConfiguracionPage;
