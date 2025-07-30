"use client";
import EventoForm from "../components/eventos/EventoForm";
import Modal from "../components/Modal";
import React, { useState } from "react";
import { FaSearch, FaFileAlt, FaBook, FaEye, FaCalendarAlt, FaEdit, FaTrash, FaTools, FaChalkboardTeacher, FaUsers, FaRobot, FaClipboardList, FaLaptop } from "react-icons/fa";
import { formatFechaDDMMYYYY } from '../lib/formatFecha';

interface Nota {
  id?: string;
  nombre: string;
  contenido: string;
  tipo: string;
  etiquetas?: string[];
  descripcion?: string;
}

interface Recurso {
  id: string;
  tipo: string;
  titulo: string;
  descripcion?: string;
  tags: string[];
}

interface Evento {
  id?: string;
  title: string;
  startDate: string;
  endDate?: string;
  location?: string;
  recurrenceType?: string;
  eventType?: string;
  validador?: string;
  modo?: string;
  codigoDana?: string;
  nombreNotificacion?: string;
  recurrencePattern?: string;
  // Otros campos relevantes pueden agregarse aquí según el modelo de backend
}

interface TodoConocimientoPanelProps {
  notas: Nota[];
  recursos: Recurso[];
  eventos: Evento[];
}

const TodoConocimientoPanel: React.FC<TodoConocimientoPanelProps> = ({ notas, recursos, eventos }) => {
  // Nuevo layout basado en el diseño proporcionado
  // Estados y lógica adaptados
  const [busqueda, setBusqueda] = useState("");
  const [filtroEtiqueta, setFiltroEtiqueta] = useState("");
  const [itemSeleccionado, setItemSeleccionado] = useState<any | null>(null);

  // Normaliza el item seleccionado para el panel lateral
  const getDetalleSeleccionado = (item: any) => {
    if (!item) return null;
    if (item.origen === 'evento' && item.evento) {
      return {
        ...item.evento,
        origen: 'evento',
      };
    } else if (item.origen === 'nota') {
      return {
        title: item.titulo,
        description: item.descripcion,
        contenido: item.contenido,
        tags: item.tags,
        origen: 'nota',
      };
    } else if (item.origen === 'recurso') {
      return {
        title: item.titulo,
        description: item.descripcion,
        tags: item.tags,
        origen: 'recurso',
      };
    }
    return item;
  };
  const detalleSeleccionado = getDetalleSeleccionado(itemSeleccionado);
  // Estados para edición de evento
  const [eventoEditando, setEventoEditando] = useState<Evento | null>(null);
  const [mostrarFormularioEvento, setmostrarFormularioEvento] = useState(false);
  const [token] = useState<string | null>(typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  // Recarga eventos (dummy, deberías pasar cargarEventos real por props si lo necesitas)
  const cargarEventos = () => { window.location.reload(); };

  // Handler para guardar cambios de evento (PUT)
  const handleGuardarEvento = async (values: any) => {
    if (!eventoEditando?.id || !token) return;
    try {
      const res = await fetch(`/api/events/${eventoEditando.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });
      if (!res.ok) throw new Error('Error al guardar el evento');
      setmostrarFormularioEvento(false);
      setEventoEditando(null);
      cargarEventos();
    } catch (err) {
      alert('Ocurrió un error al guardar el evento.');
    }
  };

  const handleCancelarEvento = () => {
    setmostrarFormularioEvento(false);
    setEventoEditando(null);
  };

  // Handlers reales solo para eventos
  const handleEdit = (item: any) => {
    if (item.origen === 'evento' && item.evento) {
      setEventoEditando(item.evento);
      setmostrarFormularioEvento(true);
    } else {
      alert('Solo se puede editar eventos desde aquí.');
    }
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
    cargarEventos();
  };


  // Unificar tipos y etiquetas disponibles
  const etiquetasDisponibles = Array.from(new Set([
    ...(notas.flatMap(n => n.etiquetas || [])),
    ...(recursos.flatMap(r => r.tags || []))
  ])).filter(Boolean);
  // Unificar items
  const allItems = [
    ...notas.map(n => ({
      id: n.id || n.nombre,
      tipo: n.tipo,
      titulo: n.nombre,
      descripcion: n.descripcion,
      contenido: n.contenido,
      tags: n.etiquetas || [],
      origen: "nota"
    })),
    ...recursos.map(r => ({
      id: r.id,
      tipo: r.tipo,
      titulo: r.titulo,
      descripcion: r.descripcion,
      tags: r.tags,
      origen: "recurso"
    })),
    ...eventos.map(e => {
      // No incluir la fecha en la descripción, solo la ubicación si existe
      let descripcion = '';
      if (e.location) {
        descripcion = e.location;
      }
      return {
        id: e.id,
        tipo: e.eventType || "evento",
        titulo: e.title,
        descripcion,
        tags: [],
        origen: "evento",
        evento: e
      };
    })
  ];
  // Filtrado
  const filtrados = allItems.filter(item => {
    if (filtroEtiqueta && !(item.tags && (item.tags as string[]).includes(filtroEtiqueta))) return false;
    return (
      item.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(busqueda.toLowerCase())))
    );
  });
  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista y filtros */}
        <div className="lg:col-span-1">
          <div className="bg-secondary rounded-lg p-4">
            <div className="space-y-4 mb-4">
              <div className="flex items-center gap-2">
                <FaSearch className="text-accent" />
                <input
                  type="text"
                  placeholder="Buscar por título, descripción o tag..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="flex-1 input-std"
                />
              </div>
              {/* Filtro por tipo removido por solicitud */}
              {etiquetasDisponibles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Filtrar por etiqueta</label>
                  <select
                    value={filtroEtiqueta}
                    onChange={e => setFiltroEtiqueta(e.target.value)}
                    className="w-full input-std"
                  >
                    <option value="">Todas las etiquetas</option>
                    {etiquetasDisponibles.map(etiqueta => (
                      <option key={etiqueta} value={etiqueta} className="bg-primary text-white">{etiqueta}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto min-h-[420px]">
              {filtrados.length === 0 && <div className="text-gray-400">No hay resultados.</div>}
              {filtrados.map((item) => {
                let temaInfo = {
                  color: 'bg-accent/20 text-accent',
                  nombre: 'Nota',
                  icon: <FaFileAlt className="text-accent" />
                };
                let fechaEvento = null;
                if (item.origen === 'nota') {
                  temaInfo = {
                    color: 'bg-accent/20 text-accent',
                    nombre: 'Nota',
                    icon: <FaFileAlt className="text-accent" />
                  };
                } else if (item.origen === 'recurso') {
                  temaInfo = {
                    color: 'bg-green-900/20 text-green-300',
                    nombre: 'Recurso',
                    icon: <FaBook className="text-green-300" />
                  };
                } else if (item.origen === 'evento') {
                  temaInfo = {
                    color: 'bg-yellow-900/20 text-yellow-300',
                    nombre: 'Evento',
                    icon: <FaCalendarAlt className="text-yellow-300" />
                  };
                  // Mostrar solo la fecha de inicio en formato dd/mm/yyyy
                  if ('evento' in item && item.evento && item.evento.startDate) {
                    const fecha = formatFechaDDMMYYYY(item.evento.startDate);
                    fechaEvento = (
                      <p className="text-xs text-yellow-200 mb-1">
                        {fecha}
                      </p>
                    );
                  }
                }
                const isSelected = itemSeleccionado?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setItemSeleccionado(item)}
                    className={`w-full text-left p-4 rounded-lg transition-all duration-200 border cursor-pointer ${
                      isSelected
                        ? `${temaInfo.color} shadow-lg shadow-current/20 border-0`
                        : `bg-gradient-to-r from-primary to-secondary/50 hover:${temaInfo.color.replace('text-', 'from-').replace('border-', 'from-').split(' ')[0]?.replace('900/20', '400/10') || 'from-accent/10'} hover:to-accent/5 border border-gray-700/50 hover:border-current/30 shadow-md hover:shadow-lg`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected
                          ? temaInfo.color.replace('text-', 'bg-').replace('border-', 'bg-').split(' ')[0]?.replace('900/20', '500/30') || 'bg-accent/30'
                          : temaInfo.color.replace('text-', 'bg-').replace('border-', 'bg-').split(' ')[0]?.replace('900/20', '500/20') || 'bg-accent/20'
                      }`}>
                        {temaInfo.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-base truncate flex-1">{item.titulo}</h3>
                        <p className={`text-xs mb-1 font-medium ${temaInfo.color.split(' ')[1] || 'text-accent'}`}>{temaInfo.nombre}</p>
                        {/* Fecha para eventos */}
                        {fechaEvento}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {item.tags.slice(0, 3).map((tag: string) => (
                              <span
                                key={tag}
                                className={`px-1.5 py-0.5 rounded text-xs ${temaInfo.color.replace('text-', 'bg-').replace('border-', 'bg-').split(' ')[0]?.replace('900/20', '500/20') || 'bg-accent/20'} ${temaInfo.color.split(' ')[1] || 'text-accent'}`}
                              >
                                #{tag}
                              </span>
                            ))}
                            {item.tags.length > 3 && (
                              <span className="text-xs text-gray-400">+{item.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                        {item.descripcion && <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{item.descripcion}</p>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Modal de edición de evento */}
          <Modal
            open={mostrarFormularioEvento}
            onClose={handleCancelarEvento}
            title="Editar evento"
            maxWidth="max-w-lg"
          >
            <EventoForm
              initialValues={eventoEditando || undefined}
              onSubmit={async (values: any) => {
                // Si estamos creando uno nuevo
                if (!eventoEditando) {
                  if (!token) return;
                  try {
                    const res = await fetch('/api/events', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify(values)
                    });
                    if (!res.ok) throw new Error('Error al crear el evento');
                    setmostrarFormularioEvento(false);
                    setEventoEditando(null);
                    cargarEventos();
                  } catch (err) {
                    alert('Ocurrió un error al crear el evento.');
                  }
                } else {
                  // Edición existente
                  await handleGuardarEvento(values);
                }
              }}
              onCancel={handleCancelarEvento}
              submitLabel={eventoEditando ? "Guardar cambios" : "Crear evento"}
            />
          </Modal>
        </div>
        {/* Panel lateral de detalle */}
        <div className="lg:col-span-2">
          <div className="bg-secondary rounded-lg p-6 h-full min-h-96">
            {detalleSeleccionado ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-900/20 text-yellow-300">
                      {detalleSeleccionado.title && detalleSeleccionado.title.toLowerCase().includes('mantenimiento') && <FaTools />}
                      {detalleSeleccionado.title && detalleSeleccionado.title.toLowerCase().includes('capacitación') && <FaChalkboardTeacher />}
                      {detalleSeleccionado.title && detalleSeleccionado.title.toLowerCase().includes('reunión') && <FaUsers />}
                      {detalleSeleccionado.title && detalleSeleccionado.title.toLowerCase().includes('webinar') && <FaRobot />}
                      {detalleSeleccionado.title && detalleSeleccionado.title.toLowerCase().includes('revisión') && <FaClipboardList />}
                      {detalleSeleccionado.title && detalleSeleccionado.title.toLowerCase().includes('demo') && <FaLaptop />}
                      {detalleSeleccionado.title && !['mantenimiento','capacitación','reunión','webinar','revisión','demo'].some(t => detalleSeleccionado.title.toLowerCase().includes(t)) && <FaCalendarAlt />}
                    </div>
                    <h2 className="text-xl font-bold text-accent">{detalleSeleccionado.title}</h2>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // Solo permite editar si es un evento real
                        if (detalleSeleccionado.origen === 'evento' && detalleSeleccionado.id) {
                          setEventoEditando(detalleSeleccionado);
                          setmostrarFormularioEvento(true);
                        } else {
                          alert('Solo se puede editar eventos desde aquí.');
                        }
                      }}
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-200 px-2 py-1 rounded border border-blue-400/30 bg-blue-400/10 text-xs font-semibold"
                      title="Editar evento"
                    >
                      <FaEdit /> Editar
                    </button>
                    <button
                      onClick={() => {
                        // Solo permite eliminar si es un evento real
                        if (detalleSeleccionado.origen === 'evento' && detalleSeleccionado.id) {
                          handleDelete(detalleSeleccionado.id);
                        } else {
                          alert('Solo se puede eliminar eventos desde aquí.');
                        }
                      }}
                      className="flex items-center gap-1 text-red-400 hover:text-red-200 px-2 py-1 rounded border border-red-400/30 bg-red-400/10 text-xs font-semibold"
                      title="Eliminar evento"
                    >
                      <FaTrash /> Eliminar
                    </button>
                    <button
                      onClick={() => setItemSeleccionado(null)}
                      className="flex items-center gap-1 text-gray-400 hover:text-gray-200 px-2 py-1 rounded border border-gray-400/30 bg-gray-600/10 text-xs font-semibold"
                      title="Cerrar panel de detalle"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
                {detalleSeleccionado.description && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Descripción</h3>
                    <p className="text-gray-400">{detalleSeleccionado.description}</p>
                  </div>
                )}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                  <span><span className="font-bold">Fecha:</span> {detalleSeleccionado.startDate && !isNaN(Date.parse(detalleSeleccionado.startDate)) ? new Date(detalleSeleccionado.startDate).toLocaleDateString('es-ES') : ''}{detalleSeleccionado.endDate && !isNaN(Date.parse(detalleSeleccionado.endDate)) && <> - {new Date(detalleSeleccionado.endDate).toLocaleDateString('es-ES')}</>}</span>
                  {detalleSeleccionado.location && <span><span className="font-bold">Ubicación:</span> 📍 {detalleSeleccionado.location}</span>}
                </div>
                {(detalleSeleccionado.validador || detalleSeleccionado.codigoDana || detalleSeleccionado.nombreNotificacion || detalleSeleccionado.modo) && (
                  <div className="mt-2 pt-2 border-t border-yellow-400/20">
                    <div className="flex flex-wrap gap-2 text-xs mb-2">
                      {detalleSeleccionado.modo && (
                        <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">{detalleSeleccionado.modo}</span>
                      )}
                      {detalleSeleccionado.validador && (
                        <span className="px-2 py-1 rounded bg-green-500/20 text-green-300">👤 {detalleSeleccionado.validador}</span>
                      )}
                      {detalleSeleccionado.codigoDana && (
                        <span className="px-2 py-1 rounded bg-green-700/20 text-green-400">🏢 {detalleSeleccionado.codigoDana}</span>
                      )}
                      {detalleSeleccionado.nombreNotificacion && (
                        <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300">🔔 {detalleSeleccionado.nombreNotificacion}</span>
                      )}
                      {detalleSeleccionado.diaEnvio && (
                        <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">📅 {detalleSeleccionado.diaEnvio}</span>
                      )}
                      {detalleSeleccionado.query && (
                        <span className="px-2 py-1 rounded bg-gray-500/20 text-gray-300" title={detalleSeleccionado.query}>🔎 {detalleSeleccionado.query.length > 20 ? detalleSeleccionado.query.slice(0,20) + '…' : detalleSeleccionado.query}</span>
                      )}
                      {detalleSeleccionado.relatedResources && detalleSeleccionado.relatedResources.length > 0 && (
                        <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-300">📎 {detalleSeleccionado.relatedResources.length}</span>
                      )}
                    </div>
                    {/* Recursos relacionados */}
                    {detalleSeleccionado.relatedResources && detalleSeleccionado.relatedResources.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {detalleSeleccionado.relatedResources.slice(0, 3).map((resource: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-gray-600/20 text-gray-300 text-xs rounded truncate max-w-24">
                            📄 {resource}
                          </span>
                        ))}
                        {detalleSeleccionado.relatedResources.length > 3 && (
                          <span className="px-2 py-1 bg-gray-600/20 text-gray-400 text-xs rounded">
                            +{detalleSeleccionado.relatedResources.length - 3} más
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
                  <p>Selecciona un elemento para ver sus detalles</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoConocimientoPanel;
