
"use client";
import React, { useState } from 'react';
import { FaPlus, FaSearch, FaCalendarAlt, FaListUl, FaLayerGroup } from 'react-icons/fa';
import { formatFechaDDMMYYYY } from '../lib/formatFecha';
import { useEventosConfig } from '../lib/useConfig';
import DetalleEventoPanel from '../components/eventos/DetalleEventoPanel';
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
  diaEnvio?: string;
  relatedResources?: string[];
  isRecurring?: boolean;
  recurrencePattern?: string;
  eventType?: string;
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
  const [seccionActiva, setSeccionActiva] = useState<'lista' | 'tipos'>('lista');
  const [tipoEventoSeleccionado, setTipoEventoSeleccionado] = useState<string | null>(null);
  const { getEventoConfig, loading: configLoading, items: tiposEventos } = useEventosConfig();

  // Función para obtener icono basado en configuración
  const getEventIcon = (title: string, tipoEvento?: string) => {
    if (configLoading) {
      return <FaCalendarAlt />;
    }
    
    const tipo = tipoEvento || title;
    const config = getEventoConfig(tipo);
    const IconComponent = config.IconComponent as any;
    const colorClass = config.color.split(' ').find(c => c.includes('text-')) || 'text-yellow-300';
    
    return <IconComponent className={colorClass} />;
  };
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
      isRecurring: evento.isRecurring || false,
      recurrencePattern: evento.recurrencePattern || '',
      eventType: evento.eventType || '',
      diaEnvio: evento.diaEnvio || '',
      relatedResources: evento.relatedResources || [],
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
      title: '', description: '', startDate: '', endDate: '', location: '', modo: '', validador: '', codigoDana: '', isRecurring: false, recurrencePattern: '', eventType: ''
    });
    cargarEventos(token);
  };






  return (
    <div className="bg-secondary/10 rounded-xl shadow-lg overflow-hidden min-h-[600px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-accent">Gestión de Eventos</h2>
        <button
          onClick={() => setmostrarFormularioEvento(true)}
          className="flex items-center gap-2 bg-accent text-secondary px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
        >
          <FaPlus />
          Evento
        </button>
      </div> 

      {/* Navegación entre Lista y Por Tipo */}
      <div className="flex space-x-1 mb-6 bg-secondary/50 p-1 rounded-lg">
        <button
          onClick={() => { setSeccionActiva('lista'); setTipoEventoSeleccionado(null); }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            seccionActiva === 'lista'
              ? 'bg-yellow-900/30 text-yellow-300 shadow-lg'
              : 'text-gray-400 hover:text-yellow-300 hover:bg-yellow-900/10'
          }`}
        >
          <FaListUl />
          Todos los Eventos
        </button>
        <button
          onClick={() => { setSeccionActiva('tipos'); setTipoEventoSeleccionado(null); }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            seccionActiva === 'tipos'
              ? 'bg-yellow-900/30 text-yellow-300 shadow-lg'
              : 'text-gray-400 hover:text-yellow-300 hover:bg-yellow-900/10'
          }`}
        >
          <FaLayerGroup />
          Por Tipo
        </button>
      </div> 
      
      {/* Vista de Lista (actual) */}
      {seccionActiva === 'lista' && (
        <div className="flex-1 flex flex-col bg-primary/80">
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
                              {getEventIcon(event.title, event.eventType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white text-base truncate flex-1">{event.title}</h3>
                              <div className="text-xs text-yellow-300 mb-1">
                                {formatFechaDDMMYYYY(event.startDate)}
                              </div>
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
            {/* Panel de detalle reutilizable */}
            <div className="lg:col-span-2">
              <DetalleEventoPanel
                eventoSeleccionado={eventoSeleccionado}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </div>
      )}

      {/* Vista Por Tipo - Cards de tipos */}
      {seccionActiva === 'tipos' && !tipoEventoSeleccionado && (
        <div className="flex-1 flex flex-col bg-primary/80">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tiposEventos.map((tipo) => {
              const cantidadEventos = eventos.filter(evento => evento.eventType === tipo.id).length;
              const config = getEventoConfig(tipo.id);
              const IconComponent = config.IconComponent as any;
              
              return (
                <button
                  key={tipo.id}
                  onClick={() => setTipoEventoSeleccionado(tipo.id)}
                  className={`text-left p-6 rounded-lg border transition-all duration-300 ${tipo.color} hover:bg-yellow-900/10 hover:border-yellow-400/30`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 rounded-lg bg-yellow-900/20">
                      <IconComponent className="text-xl text-yellow-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-white">{tipo.nombre}</h3>
                      <div className="text-xs opacity-60">
                        {cantidadEventos} evento{cantidadEventos !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  {tipo.descripcion && (
                    <p className="text-sm opacity-80 leading-relaxed">{tipo.descripcion}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Vista Por Tipo - Lista filtrada por tipo */}
      {seccionActiva === 'tipos' && tipoEventoSeleccionado && (
        <div className="flex-1 flex flex-col bg-primary/80">
          {/* Header del tipo con colores */}
          <div className={`rounded-lg p-4 mb-6 border ${tiposEventos.find(t => t.id === tipoEventoSeleccionado)?.color}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setTipoEventoSeleccionado(null)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-900/10 hover:bg-yellow-900/20 transition-colors"
                >
                  ← Volver a tipos
                </button>
                <div className="flex items-center gap-3">
                  {(() => {
                    const config = getEventoConfig(tipoEventoSeleccionado);
                    const IconComponent = config.IconComponent as any;
                    return <IconComponent className="text-xl text-yellow-300" />;
                  })()}
                  <h2 className="text-xl font-bold">
                    {tiposEventos.find(t => t.id === tipoEventoSeleccionado)?.nombre}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => { setEventoSeleccionado(null); setmostrarFormularioEvento(true); }}
                className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
              >
                <FaPlus />
                Evento
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel lateral: búsqueda y lista filtrada */}
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
                  {busqueda && (
                    <button
                      onClick={() => setBusqueda('')}
                      className="w-full px-3 py-2 bg-gray-600/50 text-gray-300 rounded-lg hover:bg-gray-600/70 transition-colors text-sm"
                    >
                      Limpiar búsqueda
                    </button>
                  )}
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {eventos.filter(ev => {
                    const matchTipo = ev.eventType === tipoEventoSeleccionado;
                    const matchBusqueda = ev.title.toLowerCase().includes(busqueda.toLowerCase()) ||
                      (ev.description?.toLowerCase().includes(busqueda.toLowerCase()) ?? false);
                    return matchTipo && matchBusqueda;
                  }).length === 0 ? (
                    <div className="p-4 text-gray-400">
                      {busqueda ? 'No se encontraron eventos.' : 'No hay eventos de este tipo.'}
                    </div>
                  ) : (
                    eventos.filter(ev => {
                      const matchTipo = ev.eventType === tipoEventoSeleccionado;
                      const matchBusqueda = ev.title.toLowerCase().includes(busqueda.toLowerCase()) ||
                        (ev.description?.toLowerCase().includes(busqueda.toLowerCase()) ?? false);
                      return matchTipo && matchBusqueda;
                    }).map((event) => {
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
                              {getEventIcon(event.title, event.eventType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white text-base truncate flex-1">{event.title}</h3>
                              <div className="text-xs text-yellow-300 mb-1">
                                {formatFechaDDMMYYYY(event.startDate)}
                              </div>
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
            {/* Panel de detalle reutilizable */}
            <div className="lg:col-span-2">
              <DetalleEventoPanel
                eventoSeleccionado={eventoSeleccionado}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </div>
      )}
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

