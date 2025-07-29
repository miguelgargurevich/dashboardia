"use client";
import React from "react";
import { FaSearch, FaFileAlt, FaBook, FaVideo, FaEye, FaEdit } from "react-icons/fa";

interface Nota {
  id?: string;
  nombre: string;
  contenido: string;
  tipo: string;
  etiquetas?: string[];
  descripcion?: string;
  tema: string;
  priority?: string;
  date?: string;
}

interface Tema {
  id: string;
  nombre: string;
  descripcion: string;
  icono: React.ReactNode;
  color: string;
}

interface TipoNota {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
}

interface NotasDocumentosPanelProps {
  notas: Nota[];
  temas: Tema[];
  tiposNotas: TipoNota[];
  notaSeleccionada: Nota | null;
  setNotaSeleccionada: (nota: Nota) => void;
  busqueda: string;
  setBusqueda: (v: string) => void;
  etiquetasDisponibles: string[];
  filtroEtiqueta: string;
  setFiltroEtiqueta: (v: string) => void;
  cargando: boolean;
  descargarNota: (nota: Nota) => void;
  eliminarNota: (nota: Nota) => void;
  onEditarNota?: (nota: Nota) => void;
}

const NotasDocumentosPanel: React.FC<NotasDocumentosPanelProps> = ({
  notas,
  temas,
  tiposNotas,
  notaSeleccionada,
  setNotaSeleccionada,
  busqueda,
  setBusqueda,
  etiquetasDisponibles,
  filtroEtiqueta,
  setFiltroEtiqueta,
  cargando,
  descargarNota,
  eliminarNota,
  onEditarNota
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Panel de lista de notas */}
      <div className="lg:col-span-3">
        <div className="bg-secondary rounded-lg p-6 h-full min-h-96 flex flex-col">
          {/* Filtros y búsqueda */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                placeholder="Buscar por nombre o contenido..."
                className="input input-bordered w-full bg-base-200 text-sm"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
              <FaSearch className="text-gray-400" />
            </div>
            <select
              className="select select-bordered bg-base-200 text-sm"
              value={filtroEtiqueta}
              onChange={e => setFiltroEtiqueta(e.target.value)}
            >
              <option value="">Todas las etiquetas</option>
              {etiquetasDisponibles.map((et, idx) => (
                <option key={idx} value={et}>{et}</option>
              ))}
            </select>
          </div>
          {/* Lista de notas */}
          {cargando ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">Cargando...</div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto">
              {notas.map((nota, index) => {
                const tipoNota = tiposNotas.find(t => t.id === nota.tipo) || tiposNotas[0];
                const color = tipoNota.color;
                const nombreTipo = tipoNota.nombre;
                const isSelected = notaSeleccionada?.id === nota.id;
                return (
                  <button
                    key={nota.id || index}
                    onClick={() => setNotaSeleccionada(nota)}
                    className={`w-full text-left p-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] border ${
                      isSelected
                        ? `${color} shadow-lg shadow-current/20`
                        : `bg-gradient-to-r from-primary to-secondary/50 hover:${color.split(' ')[0]?.replace('bg-', 'from-').replace('/20', '/10') || 'from-accent/10'} hover:to-accent/5 border border-gray-700/50 hover:border-current/30 shadow-md hover:shadow-lg`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected
                          ? color.split(' ')[0]?.replace('/20', '/30') || 'bg-accent/30'
                          : color.split(' ')[0] || 'bg-accent/20'
                      }`}>
                        <FaFileAlt className={color.split(' ')[1] || 'text-accent'} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-sm mb-1 leading-tight">{nota.nombre}</h3>
                        <p className={`text-xs mb-1 font-medium ${color.split(' ')[1] || 'text-accent'}`}>{nombreTipo}</p>
                        {nota.etiquetas && nota.etiquetas.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {nota.etiquetas.slice(0, 3).map((etiqueta, etIndex) => (
                              <span
                                key={etIndex}
                                className={`px-1.5 py-0.5 rounded text-xs ${color.split(' ')[0] || 'bg-accent/20'} ${color.split(' ')[1] || 'text-accent'}`}
                              >
                                {etiqueta}
                              </span>
                            ))}
                            {nota.etiquetas.length > 3 && (
                              <span className="text-xs text-gray-400">+{nota.etiquetas.length - 3}</span>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {nota.contenido.slice(0, 100)}...
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}

            </div>
          )}
        </div>
      </div>
      {/* Panel de detalles */}
      <div className="lg:col-span-2">
        <div className="bg-secondary rounded-lg p-6 h-full min-h-96">
          {notaSeleccionada ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-accent">{notaSeleccionada.nombre}</h2>
                  <p className="text-sm text-gray-400">
                    {temas.find(t => t.id === notaSeleccionada.tema)?.nombre}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditarNota && notaSeleccionada && onEditarNota(notaSeleccionada)}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                    disabled={!onEditarNota}
                  >
                    <FaEdit className="text-sm" />
                    Editar
                  </button>
                  <button
                    onClick={() => descargarNota(notaSeleccionada)}
                    className="flex items-center gap-2 px-3 py-1 bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors"
                  >
                    <FaFileAlt className="text-sm" />
                    Descargar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('¿Estás seguro de eliminar esta nota?')) {
                        eliminarNota(notaSeleccionada);
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                  >
                    <FaEye className="text-sm" />
                    Eliminar
                  </button>
                </div>
              </div>
              <div className="prose prose-invert max-w-none">
                {notaSeleccionada.contenido}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <FaEye className="text-4xl mb-4 mx-auto" />
                <p>Selecciona un documento para visualizar su contenido</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotasDocumentosPanel;
