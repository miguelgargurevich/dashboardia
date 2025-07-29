"use client";
import React, { useState } from "react";
import { FaSearch, FaFileAlt, FaBook, FaLayerGroup, FaVideo, FaEye } from "react-icons/fa";

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

interface TodoConocimientoPanelProps {
  notas: Nota[];
  recursos: Recurso[];
}

const TodoConocimientoPanel: React.FC<TodoConocimientoPanelProps> = ({ notas, recursos }) => {
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
    }))
  ];
  const filtered = allItems.filter(item =>
    item.titulo.toLowerCase().includes(search.toLowerCase()) ||
    item.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
    item.tags.some((tag: string) => tag.toLowerCase().includes(search.toLowerCase()))
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
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filtered.length === 0 && <div className="text-gray-400">No hay resultados.</div>}
            {filtered.map(item => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] border ${
                  selected?.id === item.id
                    ? 'bg-accent/20 border-accent shadow-lg'
                    : 'bg-gradient-to-r from-primary to-secondary/50 hover:from-accent/10 hover:to-accent/5 border border-gray-700/50 hover:border-accent/30 shadow-md hover:shadow-lg'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {item.origen === "nota" ? <FaFileAlt className="text-accent" /> : <FaBook className="text-accent" />}
                  <span className="font-semibold text-white">{item.titulo}</span>
                  <span className="text-xs px-2 py-1 rounded bg-accent/20 text-accent font-bold">{item.tipo}</span>
                </div>
                {item.descripcion && <div className="text-xs text-gray-300 mb-1">{item.descripcion}</div>}
                <div className="flex flex-wrap gap-2 mt-1">
                  {item.tags.map((tag: string) => (
                    <span key={tag} className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">#{tag}</span>
                  ))}
                </div>
              </button>
            ))}
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
