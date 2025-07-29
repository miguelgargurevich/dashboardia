"use client";
import React, { useState } from "react";
import { FaSearch, FaFileAlt, FaBook, FaLayerGroup, FaVideo, FaEye, FaCalendarAlt } from "react-icons/fa";

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
}

interface TodoConocimientoPanelProps {
  notas: Nota[];
  recursos: Recurso[];
  eventos: Evento[];
}

const TodoConocimientoPanel: React.FC<TodoConocimientoPanelProps> = ({ notas, recursos, eventos }) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
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
  const filtered = allItems.filter(item =>
    item.titulo.toLowerCase().includes(search.toLowerCase()) ||
    item.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
    (item.tags && item.tags.some((tag: string) => tag.toLowerCase().includes(search.toLowerCase())))
  );
  return (
    <div className="bg-primary rounded-lg p-6 shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <FaLayerGroup className="text-2xl text-accent" />
        <h2 className="text-2xl font-bold text-accent">Todo el conocimiento</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de items */}
        <div className="lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <FaSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, descripción o tag..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            />
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto min-h-[420px]">
            {filtered.length === 0 && <div className="text-gray-400">No hay resultados.</div>}
            {filtered.map((item, index) => {
              // Lógica de color y gradiente por tipo
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
              const isSelected = selected?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={`w-full text-left p-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] border ${
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
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-sm mb-1 leading-tight">{item.titulo}</h3>
                      <p className={`text-xs mb-1 font-medium ${temaInfo.color.split(' ')[1] || 'text-accent'}`}>{temaInfo.nombre}</p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {item.tags.slice(0, 3).map((tag: string, idx: number) => (
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
        {/* Panel de detalles */}
        <div className="lg:col-span-2">
          <div className="bg-secondary rounded-lg p-6 h-full min-h-96">
            {selected ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  {selected.origen === "nota" ? <FaFileAlt className="text-accent" /> : <FaBook className="text-accent" />}
                  <h2 className="text-xl font-bold text-accent">{selected.titulo}</h2>
                  <span className="text-xs px-2 py-1 rounded bg-accent/20 text-accent font-bold">{selected.tipo}</span>
                </div>
                {selected.descripcion && <div className="text-gray-300 mb-2">{selected.descripcion}</div>}
                {selected.origen === "nota" && selected.contenido && (
                  <div className="prose prose-invert max-w-none">
                    {selected.contenido}
                  </div>
                )}
                {selected.origen === "recurso" && (
                  <div className="text-gray-400">Recurso sin vista previa.</div>
                )}
                {selected.origen === "evento" && selected.evento && (
                  <div className="space-y-2">
                    <div className="text-lg font-bold text-accent">{selected.evento.title}</div>
                    <div className="text-sm text-gray-300 mb-1">
                      <span className="font-semibold">Descripción:</span> {selected.evento.description || <span className="italic text-gray-500">Sin descripción</span>}
                    </div>
                    <div className="text-sm text-gray-300 mb-1 flex flex-wrap gap-2">
                      <span className="font-semibold">Fecha:</span> {selected.evento.startDate ? `${new Date(selected.evento.startDate).toLocaleDateString()}${selected.evento.endDate ? ' - ' + new Date(selected.evento.endDate).toLocaleDateString() : ''}` : <span className="italic text-gray-500">Sin fecha</span>}
                    </div>
                    {selected.evento.location && (
                      <div className="text-sm text-gray-300 mb-1 flex flex-wrap gap-2">
                        <span className="font-semibold">Ubicación:</span> {selected.evento.location}
                      </div>
                    )}
                    {selected.evento.modo && (
                      <div className="text-sm text-gray-300 mb-1 flex flex-wrap gap-2">
                        <span className="font-semibold">Modo:</span> {selected.evento.modo}
                      </div>
                    )}
                    {selected.evento.validador && (
                      <div className="text-sm text-gray-300 mb-1 flex flex-wrap gap-2">
                        <span className="font-semibold">Validador:</span> {selected.evento.validador}
                      </div>
                    )}
                    {selected.evento.codigoDana && (
                      <div className="text-sm text-gray-300 mb-1 flex flex-wrap gap-2">
                        <span className="font-semibold">Código Dana:</span> {selected.evento.codigoDana}
                      </div>
                    )}
                    {selected.evento.nombreNotificacion && (
                      <div className="text-sm text-gray-300 mb-1 flex flex-wrap gap-2">
                        <span className="font-semibold">Notificación:</span> {selected.evento.nombreNotificacion}
                      </div>
                    )}
                    {selected.evento.eventType && (
                      <div className="text-xs text-accent">Tipo: {selected.evento.eventType}</div>
                    )}
                    {selected.evento.recurrencePattern && (
                      <div className="text-sm text-gray-300 mb-1 flex flex-wrap gap-2">
                        <span className="font-semibold">Recurrencia:</span> {selected.evento.recurrencePattern}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-4">
                  {selected.tags.map((tag: string) => (
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
