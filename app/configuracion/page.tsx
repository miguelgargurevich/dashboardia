"use client";
import React, { useState, useEffect } from 'react';
import { FaCog, FaPlus, FaEdit, FaTrash, FaSyncAlt, FaLayerGroup, FaCalendarAlt, FaChevronRight } from 'react-icons/fa';
import TemasConfigPanel from './TemasConfigPanel';
import EventsCalendar from '../components/dashboard/EventsCalendar';

// Placeholder for event type
interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  recurrente: boolean;
  [key: string]: any;
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

  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
    recurrente: false,
  });

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
  }, []);

  useEffect(() => {
    if (panel === 'eventos' && token) cargarEventos(token);
  }, [panel, token]);

  const cargarEventos = async (token: string) => {
    setCargando(true);
    try {
      const res = await fetch('/api/events', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setEventos(data.eventos || []);
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
      titulo: evento.titulo,
      descripcion: evento.descripcion,
      fecha: evento.fecha,
      recurrente: evento.recurrente,
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
    if (eventoEditando) {
      await fetch(`/api/events/${eventoEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
    } else {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
    }
    setMostrarFormulario(false);
    setEventoEditando(null);
    setFormData({ titulo: '', descripcion: '', fecha: '', recurrente: false });
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
                    setFormData({ titulo: '', descripcion: '', fecha: '', recurrente: false });
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
                        <th>Fecha</th>
                        <th>Recurrente</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventos.map(evento => (
                        <tr key={evento.id} className="border-b border-accent/10 hover:bg-accent/5">
                          <td className="py-2 font-semibold">{evento.titulo}</td>
                          <td>{evento.descripcion}</td>
                          <td>{evento.fecha}</td>
                          <td>{evento.recurrente ? 'Sí' : 'No'}</td>
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
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                  <div className="bg-secondary border border-accent/20 rounded-xl shadow-2xl w-full max-w-lg p-8">
                    <h3 className="text-xl font-bold text-accent mb-4">{eventoEditando ? 'Editar Evento' : 'Nuevo Evento'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Título *</label>
                        <input
                          type="text"
                          value={formData.titulo}
                          onChange={e => setFormData(f => ({ ...f, titulo: e.target.value }))}
                          className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent h-12"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
                        <textarea
                          value={formData.descripcion}
                          onChange={e => setFormData(f => ({ ...f, descripcion: e.target.value }))}
                          className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Fecha</label>
                        <input
                          type="date"
                          value={formData.fecha}
                          onChange={e => setFormData(f => ({ ...f, fecha: e.target.value }))}
                          className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent h-12"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.recurrente}
                          onChange={e => setFormData(f => ({ ...f, recurrente: e.target.checked }))}
                          id="recurrente"
                        />
                        <label htmlFor="recurrente" className="text-gray-300">Recurrente</label>
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
                  </div>
                </div>
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
