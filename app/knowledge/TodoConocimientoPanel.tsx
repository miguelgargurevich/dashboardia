"use client";
import React, { useState } from "react";
import { FaSearch, FaFileAlt, FaBook, FaLayerGroup, FaEye, FaCalendarAlt } from "react-icons/fa";

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
    ...eventos.map(e => ({
      id: e.id,
      tipo: e.eventType || "evento",
      titulo: e.title,
      descripcion: `${e.startDate ? new Date(e.startDate).toLocaleString('es-ES') : ''}${e.endDate ? ' - ' + new Date(e.endDate).toLocaleString('es-ES') : ''}${e.location ? ' | ' + e.location : ''}`,
      tags: [],
      origen: "evento",
      evento: e
    }))
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
        </div>
        {/* Panel lateral de detalle */}
        <div className="lg:col-span-2">
          <div className="bg-secondary rounded-lg p-6 h-full min-h-96">
            {itemSeleccionado ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  {itemSeleccionado.origen === "nota" ? <FaFileAlt className="text-accent" /> : itemSeleccionado.origen === "recurso" ? <FaBook className="text-accent" /> : <FaCalendarAlt className="text-yellow-300" />}
                  <h2 className="text-xl font-bold text-accent">{itemSeleccionado.titulo}</h2>
                  <span className="text-xs px-2 py-1 rounded bg-accent/20 text-accent font-bold">{itemSeleccionado.tipo}</span>
                </div>
                {itemSeleccionado.descripcion && <div className="text-gray-300 mb-2">{itemSeleccionado.descripcion}</div>}
                {itemSeleccionado.origen === "nota" && itemSeleccionado.contenido && (
                  <div className="prose prose-invert max-w-none">
                    {itemSeleccionado.contenido}
                  </div>
                )}
                {itemSeleccionado.origen === "recurso" && (
                  <div className="text-gray-400">Recurso sin vista previa.</div>
                )}
                {itemSeleccionado.origen === "evento" && itemSeleccionado.evento && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white text-lg flex-1">{itemSeleccionado.evento.title}</h3>
                      {itemSeleccionado.evento.eventType && <span className="px-1.5 py-0.5 rounded text-xs bg-yellow-900/40 text-yellow-200 font-bold">{itemSeleccionado.evento.eventType}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {itemSeleccionado.evento.startDate && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-primary/40 text-gray-200">
                          {new Date(itemSeleccionado.evento.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                          {itemSeleccionado.evento.endDate ? ` - ${new Date(itemSeleccionado.evento.endDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}` : ''}
                        </span>
                      )}
                      {itemSeleccionado.evento.location && <span className="px-1.5 py-0.5 rounded text-xs bg-primary/30 text-gray-300">{itemSeleccionado.evento.location}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {itemSeleccionado.evento.validador && <span className="px-1.5 py-0.5 rounded text-xs bg-blue-900/40 text-blue-200">Validador: {itemSeleccionado.evento.validador}</span>}
                      {itemSeleccionado.evento.modo && <span className="px-1.5 py-0.5 rounded text-xs bg-green-900/40 text-green-200">Modo: {itemSeleccionado.evento.modo}</span>}
                      {itemSeleccionado.evento.codigoDana && <span className="px-1.5 py-0.5 rounded text-xs bg-purple-900/40 text-purple-200">Dana: {itemSeleccionado.evento.codigoDana}</span>}
                      {itemSeleccionado.evento.nombreNotificacion && <span className="px-1.5 py-0.5 rounded text-xs bg-yellow-900/40 text-yellow-200">Notif: {itemSeleccionado.evento.nombreNotificacion}</span>}
                      {itemSeleccionado.evento.recurrencePattern && <span className="px-1.5 py-0.5 rounded text-xs bg-pink-900/40 text-pink-200">{itemSeleccionado.evento.recurrencePattern}</span>}
                    </div>
                    {itemSeleccionado.evento.descripcion && <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-1">{itemSeleccionado.evento.descripcion}</p>}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-4">
                  {itemSeleccionado.tags.map((tag: string) => (
                    <span key={tag} className="text-xs px-2 py-1 rounded bg-accent/20 text-accent">#{tag}</span>
                  ))}
                </div>
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
